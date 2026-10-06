"""ADK assistant copy skill with anti-dark-pattern guardrails and canonical Stitch templates."""

from __future__ import annotations

import re
from typing import Any

from dev.core.models import ExecutionContext
from dev.core.orchestrator import ADKOrchestrator
from dev.core.telemetry import TelemetryEmitter, default_telemetry

SKILL_ID = "assistant_copy"
SKILL_VERSION = "1.0.0"

FORBIDDEN_PATTERNS: tuple[tuple[str, re.Pattern[str]], ...] = (
    ("forbidden_ai_label", re.compile(r"\b(ai|artificial intelligence|algorithm|llm|bot)\b", re.IGNORECASE)),
    ("forbidden_countdown_timer", re.compile(r"\b\d{1,2}:\d{2}\b")),
    ("forbidden_urgency_scarcity", re.compile(r"\b(hurry|only \d+ left|running out|held for)\b", re.IGNORECASE)),
    ("forbidden_row_14", re.compile(r"\b14[A-F]\b|\brow 14\b", re.IGNORECASE)),
)


def validate_assistant_copy(panel: dict[str, Any]) -> tuple[bool, list[str]]:
    """Verify that assistant copy obeys DESIGN.md and Stitch Consistency Contract rules."""
    heading = str(panel.get("heading", "")).strip()
    supporting = str(panel.get("supporting_text", "")).strip()
    combined = f"{heading} {supporting}"
    violations: list[str] = []

    if not heading or not supporting:
        violations.append("empty_heading_or_supporting_text")
    if len(heading) > 64:
        violations.append("heading_exceeds_64_chars")
    if len(supporting) > 120:
        violations.append("supporting_text_exceeds_120_chars")

    for rule_name, pattern in FORBIDDEN_PATTERNS:
        if pattern.search(combined):
            violations.append(rule_name)

    return len(violations) == 0, violations


def get_canonical_copy(screen_key: str, signals: dict[str, Any]) -> dict[str, str]:
    """Return canonical Stitch first-person assistant copy for each screen."""
    prior_trips = int(signals.get("prior_priority_trips", 3))
    trip_nights = int(signals.get("trip_nights", 7))
    pax_count = int(signals.get("passenger_count", 4))

    if screen_key == "offer_page_1":
        if prior_trips > 0:
            return {
                "heading": "You usually travel with Priority",
                "supporting_text": f"You added it on your last {prior_trips} trips.",
            }
        return {
            "heading": "Keep your group together",
            "supporting_text": f"Top picks for {pax_count} travellers on this flight.",
        }

    if screen_key == "offer_page_2":
        return {
            "heading": "Most families on this route add a bag",
            "supporting_text": f"{trip_nights} nights, {pax_count} travellers.",
        }

    if screen_key == "seat_map":
        return {
            "heading": "I've found 4 seats together",
            "supporting_text": "Row 12, near the front.",
        }

    return {
        "heading": "You're all set",
        "supporting_text": "Nothing else to add for this trip.",
    }


def synthesize_assistant_panel(
    *,
    screen_key: str,
    signals: dict[str, Any],
    context: ExecutionContext,
    orchestrator: ADKOrchestrator | None = None,
    telemetry: TelemetryEmitter = default_telemetry,
) -> dict[str, Any]:
    """Generate and validate a lavender AssistantPanel dict with <= 220ms fallback."""
    active_orchestrator = orchestrator or ADKOrchestrator(agent_name="assistant_copy_agent")
    prompt = (
        f"Generate heading | supporting_text for screen={screen_key} "
        f"with signals={signals}. Never mention AI or timers."
    )

    copy_dict, source, guardrail_status, events = active_orchestrator.run_with_fallback(
        prompt=prompt,
        fallback_fn=lambda: get_canonical_copy(screen_key, signals),
        validator_fn=validate_assistant_copy,
    )

    panel: dict[str, Any] = {
        "surface_token": "surface/ai",
        "heading": copy_dict["heading"],
        "supporting_text": copy_dict["supporting_text"],
        "source": source,
    }

    telemetry.emit(
        context=context,
        operation_name="generate_assistant_copy",
        message=f"Synthesized assistant copy for {screen_key} ({source}).",
        severity="INFO" if guardrail_status == "PASS" else "WARNING",
        skill_id=SKILL_ID,
        skill_version=SKILL_VERSION,
        model_name=active_orchestrator.model_name,
        agent_id=active_orchestrator.agent_name,
        guardrail_status=guardrail_status,
        security_events=events,
        inputs={"screen_key": screen_key, "persona_id": signals.get("persona_id")},
        outputs=panel,
    )
    return panel
