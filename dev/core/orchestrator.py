"""Domain-agnostic ADK agent orchestrator with a 220ms latency circuit breaker."""

from __future__ import annotations

import asyncio
from collections.abc import Callable
import os
from typing import Any

from dotenv import load_dotenv
from google.adk.agents import Agent
from google.adk.runners import InMemoryRunner
import time

load_dotenv()

DEFAULT_FLASH_MODEL = os.getenv("GEMINI_FLASH_MODEL", "gemini-3.8-flash")
DEFAULT_PRO_MODEL = os.getenv("GEMINI_PRO_MODEL", "gemini-3.1-pro")
LIVE_FALLBACK_FLASH_MODEL = os.getenv("GEMINI_LIVE_FALLBACK_MODEL", "gemini-2.5-flash")


class ADKOrchestrator:
    """Wraps Google ADK Agent definition, InMemoryRunner execution, tool registration, and bounded-latency fallback."""

    def __init__(
        self,
        *,
        agent_name: str = "assistant_copy_orchestrator",
        model_name: str | None = None,
        instruction: str = "Write concise first-person travel assistant insights.",
        tools: list[Callable[..., Any]] | None = None,
        timeout_seconds: float = 0.22,
        llm_callable: Callable[[str], str] | None = None,
    ) -> None:
        self.agent_name = agent_name
        self.model_name = model_name or DEFAULT_FLASH_MODEL
        self.instruction = instruction
        self.tools = list(tools or [])
        self.timeout_seconds = timeout_seconds
        self._llm_callable = llm_callable
        self.last_invoked_tools: list[str] = []
        self.last_latency_ms: float = 0.0
        self.last_model_used: str = self.model_name
        self.adk_agent = Agent(
            name=self.agent_name,
            model=self.model_name,
            instruction=self.instruction,
            tools=self.tools,
        )

    @property
    def is_live_api_configured(self) -> bool:
        """Return True when a non-placeholder API key, Vertex AI flag, or custom callable is present."""
        if self._llm_callable is not None:
            return True
        api_key = (os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY") or "").strip()
        if api_key and api_key != "your_api_key_here" and not api_key.startswith("example"):
            return True
        vertex_flag = (os.getenv("GOOGLE_GENAI_USE_VERTEXAI") or "").strip().lower()
        return vertex_flag in {"1", "true", "yes"}

    def record_tool_invocation(self, tool_name: str) -> None:
        """Record a tool invocation into the orchestrator's active turn trace."""
        if tool_name and tool_name not in self.last_invoked_tools:
            self.last_invoked_tools.append(tool_name)

    async def _run_adk_agent_once(self, prompt: str, model_id: str) -> tuple[str, list[str]]:
        """Execute the Google ADK Agent via InMemoryRunner and collect tool calls and final text."""
        agent = (
            self.adk_agent
            if model_id == self.model_name
            else Agent(
                name=self.agent_name,
                model=model_id,
                instruction=self.instruction,
                tools=self.tools,
            )
        )
        runner = InMemoryRunner(agent=agent, app_name=self.agent_name)
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
        self.last_model_used = model_id
        return (final_chunks[-1] if final_chunks else ""), invoked

    async def _run_adk_with_model_fallback(self, prompt: str) -> str:
        """Run ADK InMemoryRunner with primary model, falling back to LIVE_FALLBACK_FLASH_MODEL if needed."""
        try:
            text, tools_used = await self._run_adk_agent_once(prompt, self.model_name)
            for t in tools_used:
                self.record_tool_invocation(t)
            if text:
                return text
        except Exception:
            if self.model_name == LIVE_FALLBACK_FLASH_MODEL:
                raise
        text, tools_used = await self._run_adk_agent_once(prompt, LIVE_FALLBACK_FLASH_MODEL)
        for t in tools_used:
            self.record_tool_invocation(t)
        return text

    def run_with_fallback(
        self,
        *,
        prompt: str,
        fallback_fn: Callable[[], dict[str, Any]],
        validator_fn: Callable[[dict[str, Any]], tuple[bool, list[str]]],
        timeout_seconds: float | None = None,
    ) -> tuple[dict[str, Any], str, str, list[str]]:
        """Execute ADK synthesis within timeout_seconds or invoke deterministic fallback_fn.

        Returns:
            tuple of (result_dict, source_label, guardrail_status, security_events)
        """
        start_ns = time.perf_counter_ns()
        self.last_invoked_tools = []
        self.last_model_used = self.model_name
        effective_timeout = timeout_seconds if timeout_seconds is not None else self.timeout_seconds

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

        try:
            raw_text = self._invoke_bounded(prompt, timeout_seconds=effective_timeout)
            candidate = self._parse_candidate(raw_text, fallback_fn)
            for t in candidate.pop("_invoked_tools", []):
                self.record_tool_invocation(str(t))
            is_valid, events = validator_fn(candidate)
            self.last_latency_ms = round((time.perf_counter_ns() - start_ns) / 1_000_000, 2)
            if not is_valid:
                fallback_payload = fallback_fn()
                for t in fallback_payload.pop("_invoked_tools", []):
                    self.record_tool_invocation(str(t))
                return (
                    fallback_payload,
                    "deterministic_fallback",
                    "BLOCK",
                    events,
                )
            return candidate, "adk_gemini_flash", "PASS", []
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
        """Invoke the configured LLM callable or ADK InMemoryRunner inside an asyncio timeout window."""
        effective_timeout = timeout_seconds if timeout_seconds is not None else self.timeout_seconds

        async def _call() -> str:
            if self._llm_callable is not None:
                loop = asyncio.get_running_loop()
                return await asyncio.wait_for(
                    loop.run_in_executor(None, self._llm_callable, prompt),
                    timeout=effective_timeout,
                )
            return await asyncio.wait_for(
                self._run_adk_with_model_fallback(prompt),
                timeout=effective_timeout,
            )

        return asyncio.run(_call())

    @staticmethod
    def _parse_candidate(
        raw_text: str,
        fallback_fn: Callable[[], dict[str, Any]],
    ) -> dict[str, Any]:
        """Parse 'heading | supporting_text' from raw LLM output or fall back."""
        cleaned = raw_text.strip()
        if "|" in cleaned:
            first_line = next((line for line in cleaned.splitlines() if "|" in line), cleaned)
            heading, supporting = [part.strip() for part in first_line.split("|", 1)]
            if heading and supporting:
                return {"heading": heading, "supporting_text": supporting}
        return fallback_fn()

