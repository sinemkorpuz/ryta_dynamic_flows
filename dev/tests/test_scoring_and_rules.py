"""Unit tests for propensity scoring, business eligibility rules, and ADK copy guardrails."""

from __future__ import annotations

from pathlib import Path

from dev.core.models import ExecutionContext
from dev.core.orchestrator import ADKOrchestrator
from dev.core.telemetry import TelemetryEmitter
from dev.skills.ancillary_ranking.skill import rank_and_filter_ancillaries
from dev.skills.assistant_copy.skill import synthesize_assistant_panel, validate_assistant_copy
from dev.tools.propensity_scorer import resolve_signals


def test_marta_byrne_canonical_scores_and_removals(tmp_path: Path) -> None:
    """Verify exact scores (0.84..0.04) and removal rules for Marta Byrne."""
    telemetry = TelemetryEmitter(log_path=tmp_path / "traces.jsonl")
    context = ExecutionContext(session_id="test-marta-scores")
    signals = resolve_signals("marta_byrne")

    evaluated = rank_and_filter_ancillaries(
        signals=signals,
        declined_product_ids=[],
        context=context,
        telemetry=telemetry,
    )

    scores_by_id = {item["product_id"]: item["score"] for item in evaluated}
    assert scores_by_id == {
        "priority_boarding": 0.84,
        "reserved_seats": 0.71,
        "checked_bag_20kg": 0.58,
        "car_hire": 0.29,
        "fast_track": 0.14,
        "travel_insurance": 0.11,
        "airport_transfer": 0.08,
        "flexi_upgrade": 0.04,
    }

    placements = {item["product_id"]: item["placement"] for item in evaluated}
    assert placements["priority_boarding"] == "primary_card"
    assert placements["reserved_seats"] == "primary_card"
    assert placements["checked_bag_20kg"] == "primary_card"
    assert placements["car_hire"] == "drawer"
    assert placements["fast_track"] == "removed"
    assert placements["travel_insurance"] == "removed"
    assert placements["airport_transfer"] == "removed"
    assert placements["flexi_upgrade"] == "removed"


def test_assistant_copy_guardrail_blocks_ai_timers_and_row14(tmp_path: Path) -> None:
    """Verify guardrail rejects 'AI', countdown timers, and Row 14 references."""
    valid, reasons = validate_assistant_copy(
        {"heading": "AI picked Row 14", "supporting_text": "Seats held for 09:42 — hurry!"}
    )
    assert not valid
    assert "forbidden_ai_label" in reasons
    assert "forbidden_countdown_timer" in reasons
    assert "forbidden_urgency_scarcity" in reasons
    assert "forbidden_row_14" in reasons

    # Verify orchestrator falls back to canonical copy when LLM returns a guardrail violation
    telemetry = TelemetryEmitter(log_path=tmp_path / "traces.jsonl")
    bad_orchestrator = ADKOrchestrator(
        llm_callable=lambda _: "AI selected this | Seats held for 09:42",
    )
    panel = synthesize_assistant_panel(
        screen_key="offer_page_1",
        signals=resolve_signals("marta_byrne"),
        context=ExecutionContext(session_id="test-guardrail"),
        orchestrator=bad_orchestrator,
        telemetry=telemetry,
    )
    assert panel["source"] == "deterministic_fallback"
    assert panel["heading"] == "You usually travel with Priority"
    assert panel["supporting_text"] == "You added it on your last 3 trips."
