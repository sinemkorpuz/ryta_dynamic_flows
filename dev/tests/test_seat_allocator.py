"""Unit tests for the Boeing 737 seat map allocator and child seating rules."""

from __future__ import annotations

from pathlib import Path

from dev.core.models import ExecutionContext
from dev.core.telemetry import TelemetryEmitter
from dev.tools.propensity_scorer import CANONICAL_PASSENGERS
from dev.tools.seat_allocator import build_seat_map


def test_seat_map_enforces_row_12_child_rules_and_no_row_14(tmp_path: Path) -> None:
    """Verify Row 12 (12A-12D) recommendation, child exit-row restrictions, and no Row 14."""
    telemetry = TelemetryEmitter(log_path=tmp_path / "traces.jsonl")
    context = ExecutionContext(session_id="test-seat-map")

    seat_map = build_seat_map(
        session_id="test-seat-map",
        passengers=CANONICAL_PASSENGERS,
        context=context,
        telemetry=telemetry,
    )

    assert seat_map["step_indicator"] is None
    assert seat_map["recommended_block"]["row_number"] == 12
    assert seat_map["recommended_block"]["seat_Designators"] == ["12A", "12B", "12C", "12D"]
    assert seat_map["recommended_block"]["total_price_eur"] == 24.00
    assert seat_map["sticky_footer"]["next_screen_on_confirm"] == "offer_page_2"

    row_numbers = [row["row_number"] for row in seat_map["rows"]]
    assert 14 not in row_numbers
    assert 12 in row_numbers

    exit_rows = [row for row in seat_map["rows"] if row["is_exit_row"]]
    assert len(exit_rows) == 2
    for row in exit_rows:
        assert row["child_restricted"] is True
        assert row["restriction_reason"] is not None
        assert all(seat["status"] == "unavailable_child_rule" for seat in row["seats"])
