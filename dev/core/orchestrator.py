"""Domain-agnostic ADK agent orchestrator with two-stage Flash-Lite -> Flash 3.8 execution and circuit breaker."""

from __future__ import annotations

import asyncio
from collections.abc import Callable
from concurrent.futures import ThreadPoolExecutor
import json
import os
import re
import time
from typing import Any

from dotenv import load_dotenv
import google.auth
from google.adk.agents import Agent
from google.adk.runners import InMemoryRunner
from google.genai import Client, types

load_dotenv()

DEFAULT_FLASH_LITE_MODEL = os.getenv("GEMINI_FLASH_LITE_MODEL", "gemini-3.5-flash-lite")
DEFAULT_FLASH_MODEL = os.getenv("GEMINI_FLASH_MODEL", "gemini-3.8-flash")
DEFAULT_PRO_MODEL = os.getenv("GEMINI_PRO_MODEL", "gemini-3.1-pro")


def _ensure_vertex_env() -> bool:
    """Ensure GOOGLE_CLOUD_PROJECT and GOOGLE_CLOUD_LOCATION are populated when Vertex AI is enabled."""
    vertex_flag = (os.getenv("GOOGLE_GENAI_USE_VERTEXAI") or "").strip().lower()
    if vertex_flag not in {"1", "true", "yes"}:
        return False

    project = (os.getenv("GOOGLE_CLOUD_PROJECT") or "").strip()
    if not project or project.startswith("example"):
        env_project = (os.getenv("PROJECT_ID") or "").strip()
        if env_project and not env_project.startswith("example"):
            os.environ["GOOGLE_CLOUD_PROJECT"] = env_project
            project = env_project
        else:
            try:
                _, adc_project = google.auth.default()
                if adc_project:
                    os.environ["GOOGLE_CLOUD_PROJECT"] = str(adc_project)
                    project = str(adc_project)
            except Exception:
                project = ""

    location = (os.getenv("GOOGLE_CLOUD_LOCATION") or "").strip()
    if not location:
        region = (os.getenv("REGION") or "").strip()
        os.environ["GOOGLE_CLOUD_LOCATION"] = region or "global"

    return bool(project)


def _default_safety_settings() -> list[types.SafetySetting]:
    """Return strict Gemini SafetySettings for public-facing travel assistance."""
    return [
        types.SafetySetting(
            category=types.HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold=types.HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
        ),
        types.SafetySetting(
            category=types.HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold=types.HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
        ),
        types.SafetySetting(
            category=types.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold=types.HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
        ),
        types.SafetySetting(
            category=types.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold=types.HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
        ),
    ]


class ADKOrchestrator:
    """Wraps Google ADK Agent definition, Flash-Lite safety guardrail, Flash 3.8 runner, and single-pass fallback."""

    def __init__(
        self,
        *,
        agent_name: str = "assistant_copy_orchestrator",
        model_name: str | None = None,
        guardrail_model_name: str | None = None,
        instruction: str = "Write concise first-person travel assistant insights.",
        static_instruction: str | None = None,
        tools: list[Callable[..., Any]] | None = None,
        timeout_seconds: float = 0.22,
        temperature: float = 0.1,
        max_output_tokens: int = 180,
        before_model_callback: Any | None = None,
        after_model_callback: Any | None = None,
        before_tool_callback: Any | None = None,
        after_tool_callback: Any | None = None,
        llm_callable: Callable[[str], str] | None = None,
        guardrail_callable: Callable[[str], tuple[bool, str]] | None = None,
    ) -> None:
        self.agent_name = agent_name
        self.model_name = model_name or DEFAULT_FLASH_MODEL
        self.guardrail_model_name = guardrail_model_name or DEFAULT_FLASH_LITE_MODEL
        self.instruction = instruction
        self.static_instruction = static_instruction
        self.tools = list(tools or [])
        self.timeout_seconds = timeout_seconds
        self.temperature = temperature
        self.max_output_tokens = max_output_tokens
        self._llm_callable = llm_callable
        self._guardrail_callable = guardrail_callable
        self.last_invoked_tools: list[str] = []
        self.last_latency_ms: float = 0.0
        self.last_model_used: str = self.model_name
        self.last_guardrail_model: str = self.guardrail_model_name

        gen_config = types.GenerateContentConfig(
            temperature=self.temperature,
            max_output_tokens=self.max_output_tokens,
            safety_settings=_default_safety_settings(),
        )
        agent_kwargs: dict[str, Any] = {
            "name": self.agent_name,
            "model": self.model_name,
            "instruction": self.instruction,
            "tools": self.tools,
            "generate_content_config": gen_config,
        }
        if self.static_instruction:
            agent_kwargs["static_instruction"] = self.static_instruction
        if before_model_callback is not None:
            agent_kwargs["before_model_callback"] = before_model_callback
        if after_model_callback is not None:
            agent_kwargs["after_model_callback"] = after_model_callback
        if before_tool_callback is not None:
            agent_kwargs["before_tool_callback"] = before_tool_callback
        if after_tool_callback is not None:
            agent_kwargs["after_tool_callback"] = after_tool_callback

        self.adk_agent = Agent(**agent_kwargs)

    @property
    def is_live_api_configured(self) -> bool:
        """Return True when a live API key, Vertex AI ADC project, or custom callable is active."""
        if self._llm_callable is not None:
            return True
        if os.getenv("PYTEST_CURRENT_TEST") and os.getenv("ADK_FORCE_LIVE_IN_TESTS") != "1":
            return False
        api_key = (os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY") or "").strip()
        if api_key and api_key != "your_api_key_here" and not api_key.startswith("example"):
            return True
        return _ensure_vertex_env()

    def record_tool_invocation(self, tool_name: str) -> None:
        """Record a tool invocation into the orchestrator's active turn trace."""
        if tool_name and tool_name not in self.last_invoked_tools:
            self.last_invoked_tools.append(tool_name)

    def classify_with_flash_lite(
        self,
        query: str,
        *,
        system_instruction: str,
        timeout_seconds: float = 1.5,
    ) -> tuple[bool, str]:
        """Execute Stage 1 safety & domain-scope classification using gemini-3.5-flash-lite."""
        self.last_guardrail_model = self.guardrail_model_name
        if self._guardrail_callable is not None:
            return self._guardrail_callable(query)
        if not self.is_live_api_configured:
            return True, "offline_deterministic_pass"

        def _call_classifier() -> tuple[bool, str]:
            client = Client()
            response = client.models.generate_content(
                model=self.guardrail_model_name,
                contents=f"<passenger_query>{query}</passenger_query>",
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    temperature=0.0,
                    max_output_tokens=32,
                    safety_settings=_default_safety_settings(),
                ),
            )
            raw = (response.text or "").strip()
            if not raw:
                return False, "empty_classifier_response"
            upper = raw.upper()
            reason = raw.split("|", 1)[1].strip() if "|" in raw else raw
            if upper.startswith("BLOCK") or upper.startswith("DENY") or upper.startswith("REJECT"):
                return False, reason or "out_of_scope_query"
            return True, reason or "travel_assistance_allowed"

        try:
            with ThreadPoolExecutor(max_workers=1) as pool:
                future = pool.submit(_call_classifier)
                return future.result(timeout=timeout_seconds)
        except Exception as exc:
            return True, f"classifier_fallback_open:{type(exc).__name__}"

    async def _run_adk_agent_once(self, prompt: str) -> tuple[str, list[str]]:
        """Execute the Google ADK Agent (gemini-3.8-flash) once via InMemoryRunner with zero model retry loops."""
        runner = InMemoryRunner(agent=self.adk_agent, app_name=self.agent_name)
        events = await runner.run_debug(
            prompt,
            user_id="adk_live_user",
            session_id="adk_live_session",
            quiet=True,
        )
        invoked: list[str] = []
        final_chunks: list[str] = []
        for event in events:
            get_fcs = getattr(event, "get_function_calls", None)
            if callable(get_fcs):
                for fc in get_fcs() or []:
                    fc_name = getattr(fc, "name", None)
                    if fc_name and fc_name not in invoked:
                        invoked.append(str(fc_name))
            content = getattr(event, "content", None)
            parts = getattr(content, "parts", None) if content else None
            if parts:
                for part in parts:
                    text_val = getattr(part, "text", None)
                    if text_val and text_val.strip():
                        final_chunks.append(text_val.strip())
        self.last_model_used = self.model_name
        return (final_chunks[-1] if final_chunks else ""), invoked

    def run_with_fallback(
        self,
        *,
        prompt: str,
        fallback_fn: Callable[[], dict[str, Any]],
        validator_fn: Callable[[dict[str, Any]], tuple[bool, list[str]]],
        input_guardrail_fn: Callable[[], tuple[bool, list[str], dict[str, Any] | None]] | None = None,
        require_guardrail_check: bool = True,
        timeout_seconds: float | None = None,
    ) -> tuple[dict[str, Any], str, str, list[str]]:
        """Execute orchestrator routing: check searchbar queries with Flash-Lite first before routing to Flash 3.8 or rejecting.

        Curated quick-ask chips below the searchbar pass require_guardrail_check=False and route directly without Stage 1 vetting.

        Returns:
            tuple of (result_dict, source_label, guardrail_status, security_events)
        """
        start_ns = time.perf_counter_ns()
        self.last_invoked_tools = []
        self.last_model_used = self.model_name
        self.last_guardrail_model = (
            self.guardrail_model_name if require_guardrail_check else "bypassed_quick_chip"
        )
        effective_timeout = timeout_seconds if timeout_seconds is not None else self.timeout_seconds

        # Stage 1: Orchestrator checks searchbar questions with gemini-3.5-flash-lite before routing or rejecting
        if require_guardrail_check and input_guardrail_fn is not None:
            allowed, guardrail_events, refusal_payload = input_guardrail_fn()
            if not allowed and refusal_payload is not None:
                self.last_model_used = self.guardrail_model_name
                self.last_latency_ms = round((time.perf_counter_ns() - start_ns) / 1_000_000, 2)
                return (
                    refusal_payload,
                    "adk_flash_lite_guardrail",
                    "BLOCK",
                    guardrail_events,
                )

        # Offline / Hermetic Mode: Execute fallback_fn exactly once
        if not self.is_live_api_configured:
            fallback_payload = fallback_fn()
            for t in fallback_payload.pop("_invoked_tools", []):
                self.record_tool_invocation(str(t))
            is_valid, events = validator_fn(fallback_payload)
            self.last_latency_ms = round((time.perf_counter_ns() - start_ns) / 1_000_000, 2)
            return (
                fallback_payload,
                "deterministic_fallback",
                "PASS" if is_valid else "BLOCK",
                events,
            )

        # Stage 2: Single-pass execution on gemini-3.8-flash (no model fallback loop, no double tool execution)
        try:
            raw_text = self._invoke_bounded(prompt, timeout_seconds=effective_timeout)
            candidate = self._parse_candidate(raw_text)
            if candidate is not None:
                for t in candidate.pop("_invoked_tools", []):
                    self.record_tool_invocation(str(t))
                is_valid, events = validator_fn(candidate)
                if is_valid:
                    self.last_latency_ms = round((time.perf_counter_ns() - start_ns) / 1_000_000, 2)
                    return candidate, "adk_gemini_flash", "PASS", []
                fallback_payload = fallback_fn()
                for t in fallback_payload.pop("_invoked_tools", []):
                    self.record_tool_invocation(str(t))
                self.last_latency_ms = round((time.perf_counter_ns() - start_ns) / 1_000_000, 2)
                return (
                    fallback_payload,
                    "deterministic_fallback",
                    "BLOCK",
                    events,
                )

            fallback_payload = fallback_fn()
            for t in fallback_payload.pop("_invoked_tools", []):
                self.record_tool_invocation(str(t))
            self.last_latency_ms = round((time.perf_counter_ns() - start_ns) / 1_000_000, 2)
            return (
                fallback_payload,
                "deterministic_fallback",
                "FLAG",
                ["llm_unstructured_output_fallback"],
            )
        except Exception as exc:
            fallback_payload = fallback_fn()
            for t in fallback_payload.pop("_invoked_tools", []):
                self.record_tool_invocation(str(t))
            self.last_latency_ms = round((time.perf_counter_ns() - start_ns) / 1_000_000, 2)
            return (
                fallback_payload,
                "deterministic_fallback",
                "FLAG",
                [f"llm_circuit_breaker_fallback:{type(exc).__name__}"],
            )

    def _invoke_bounded(self, prompt: str, *, timeout_seconds: float | None = None) -> str:
        """Invoke the configured LLM callable or ADK InMemoryRunner inside a bounded timeout window."""
        effective_timeout = timeout_seconds if timeout_seconds is not None else self.timeout_seconds

        async def _call() -> str:
            if self._llm_callable is not None:
                loop = asyncio.get_running_loop()
                return await asyncio.wait_for(
                    loop.run_in_executor(None, self._llm_callable, prompt),
                    timeout=effective_timeout,
                )
            text, tools_used = await asyncio.wait_for(
                self._run_adk_agent_once(prompt),
                timeout=effective_timeout,
            )
            for t in tools_used:
                self.record_tool_invocation(t)
            return text

        try:
            asyncio.get_running_loop()
        except RuntimeError:
            return asyncio.run(_call())

        with ThreadPoolExecutor(max_workers=1) as pool:
            return pool.submit(lambda: asyncio.run(_call())).result(timeout=effective_timeout + 0.5)

    @staticmethod
    def _parse_candidate(raw_text: str) -> dict[str, Any] | None:
        """Parse 'heading | supporting_text' or JSON from raw LLM output without invoking fallback_fn."""
        cleaned = re.sub(r"[*`]+", "", (raw_text or "").strip()).strip()
        if not cleaned:
            return None

        if cleaned.startswith("{") and cleaned.endswith("}"):
            try:
                parsed = json.loads(cleaned)
                heading = str(parsed.get("heading") or parsed.get("headline") or "").strip()
                supporting = str(parsed.get("supporting_text") or parsed.get("subtext") or "").strip()
                if heading and supporting:
                    return {"heading": heading, "supporting_text": supporting}
            except Exception:
                pass

        if "|" in cleaned:
            first_line = next((line for line in cleaned.splitlines() if "|" in line), cleaned)
            heading, supporting = [part.strip().strip('"') for part in first_line.split("|", 1)]
            if heading and supporting:
                return {"heading": heading, "supporting_text": supporting}

        lines = [line.strip().strip('"') for line in cleaned.splitlines() if line.strip()]
        if len(lines) >= 2 and len(lines[0]) <= 64:
            return {"heading": lines[0], "supporting_text": " ".join(lines[1:])[:160]}

        return None
