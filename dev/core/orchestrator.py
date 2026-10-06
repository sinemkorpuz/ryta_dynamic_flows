"""Domain-agnostic ADK agent orchestrator with a 220ms latency circuit breaker."""

from __future__ import annotations

import asyncio
from collections.abc import Callable
import os
from typing import Any

from dotenv import load_dotenv
from google.adk.agents import Agent

load_dotenv()

DEFAULT_FLASH_MODEL = os.getenv("GEMINI_FLASH_MODEL", "gemini-3.8-flash")
DEFAULT_PRO_MODEL = os.getenv("GEMINI_PRO_MODEL", "gemini-3.1-pro")


class ADKOrchestrator:
    """Wraps Google ADK Agent definition, tool registration, and bounded-latency execution."""

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
        self.adk_agent = Agent(
            name=self.agent_name,
            model=self.model_name,
            instruction=self.instruction,
            tools=self.tools,
        )

    @property
    def is_live_api_configured(self) -> bool:
        """Return True when a non-placeholder GEMINI_API_KEY / GOOGLE_API_KEY or callable is present."""
        if self._llm_callable is not None:
            return True
        api_key = (os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY") or "").strip()
        return bool(
            api_key
            and api_key != "your_api_key_here"
            and not api_key.startswith("example")
        )

    def _default_genai_callable(self, prompt: str) -> str:
        """Invoke Gemini via google.genai using the ADK Agent's configured model and instruction."""
        from google import genai
        from google.genai import types

        api_key = (os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY") or "").strip()
        client = genai.Client(api_key=api_key) if api_key else genai.Client()
        response = client.models.generate_content(
            model=self.model_name,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=self.instruction,
                temperature=0.2,
                max_output_tokens=160,
            ),
        )
        return (response.text or "").strip()

    def run_with_fallback(
        self,
        *,
        prompt: str,
        fallback_fn: Callable[[], dict[str, Any]],
        validator_fn: Callable[[dict[str, Any]], tuple[bool, list[str]]],
    ) -> tuple[dict[str, Any], str, str, list[str]]:
        """Execute LLM synthesis within timeout_seconds or invoke deterministic fallback_fn.

        Returns:
            tuple of (result_dict, source_label, guardrail_status, security_events)
        """
        if not self.is_live_api_configured:
            fallback_payload = fallback_fn()
            is_valid, events = validator_fn(fallback_payload)
            return (
                fallback_payload,
                "deterministic_fallback",
                "PASS" if is_valid else "BLOCK",
                events,
            )

        try:
            raw_text = self._invoke_bounded(prompt)
            candidate = self._parse_candidate(raw_text, fallback_fn)
            is_valid, events = validator_fn(candidate)
            if not is_valid:
                return (
                    fallback_fn(),
                    "deterministic_fallback",
                    "BLOCK",
                    events,
                )
            return candidate, "adk_gemini_flash", "PASS", []
        except Exception as exc:
            return (
                fallback_fn(),
                "deterministic_fallback",
                "FLAG",
                [f"llm_circuit_breaker_fallback:{type(exc).__name__}"],
            )

    def _invoke_bounded(self, prompt: str) -> str:
        """Invoke the configured LLM callable (or default Gemini client) inside an asyncio timeout window."""
        active_callable = self._llm_callable or self._default_genai_callable

        async def _call() -> str:
            loop = asyncio.get_running_loop()
            return await asyncio.wait_for(
                loop.run_in_executor(None, active_callable, prompt),
                timeout=self.timeout_seconds,
            )

        return asyncio.run(_call())

    @staticmethod
    def _parse_candidate(
        raw_text: str,
        fallback_fn: Callable[[], dict[str, Any]],
    ) -> dict[str, Any]:
        """Parse 'heading | supporting_text' from raw LLM output or fall back."""
        if "|" in raw_text:
            heading, supporting = [part.strip() for part in raw_text.split("|", 1)]
            if heading and supporting:
                return {"heading": heading, "supporting_text": supporting}
        return fallback_fn()
