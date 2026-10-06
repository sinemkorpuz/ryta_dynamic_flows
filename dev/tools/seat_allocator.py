"""Boeing 737-800 seat map generator with Row 12 family block and child seating rules."""

from __future__ import annotations

from typing import Any

from dev.core.models import ExecutionContext, validate_against_contract
from dev.core.telemetry import TelemetryEmitter, default_telemetry

TOOL_ID = "seat_allocator"
TOOL_VERSION = "1.0.0"

CABIN_COLUMNS: tuple[str, ...] = ("A", "B", "C", "D", "E", "F")
RECOMMENDED_SEATS: tuple[str, ...] = ("12A", "12B", "12C", "12D")
EXIT_ROWS: frozenset[int] = frozenset({16, 17})
OCCUPIED_SEATS: frozenset[str] = frozenset({"11A", "11B", "12E", "12F", "13C", "15A", "15F"})


def build_seat_map(
    session_id: str,
    passengers: list[dict[str, Any]],
    context: ExecutionContext,
    telemetry: TelemetryEmitter = default_telemetry,
) -> dict[str, Any]:
    """Build the Boeing 737 seat map for Screen F, enforcing Row 12 and child safety rules."""
    has_young_children = any(
        pax.get("passenger_type") == "child" or int(pax.get("age", 30)) < 16
        for pax in passengers
    )

    # Generate rows 11..18 while strictly excluding Row 14 per the Stitch Consistency Contract
    row_numbers = [r for r in range(11, 19) if r != 14]
    rows: list[dict[str, Any]] = []

    for row_num in row_numbers:
        is_exit = row_num in EXIT_ROWS
        child_restricted = is_exit and has_young_children
        row_reason = (
            "Unavailable for children under 16 (emergency exit row regulation)."
            if child_restricted
            else None
        )

        seats: list[dict[str, Any]] = []
        for col in CABIN_COLUMNS:
            seat_id = f"{row_num}{col}"
            if seat_id in RECOMMENDED_SEATS:
                status = "recommended"
                reason = None
            elif child_restricted:
                status = "unavailable_child_rule"
                reason = row_reason
            elif seat_id in OCCUPIED_SEATS:
                status = "occupied"
                reason = "Seat already occupied."
            else:
                status = "available"
                reason = None

            seats.append(
                {
                    "seat_id": seat_id,
                    "column": col,
                    "status": status,
                    "price_eur": 6.00,
                    "restriction_reason": reason,
                }
            )

        rows.append(
            {
                "row_number": row_num,
                "is_exit_row": is_exit,
                "child_restricted": child_restricted,
                "restriction_reason": row_reason,
                "seats": seats,
            }
        )

    payload: dict[str, Any] = {
        "schema_version": "1.0.0",
        "session_id": session_id,
        "screen_id": "seat_map",
        "header_title": "Choose your seats",
        "step_indicator": None,
        "aircraft_type": "Boeing 737-800",
        "recommended_block": {
            "row_number": 12,
            "seat_Designators": list(RECOMMENDED_SEATS),
            "badge_label": "Best row for your group",
            "price_per_seat_eur": 6.00,
            "total_price_eur": 24.00,
        },
        "assistant_panel": {
            "surface_token": "surface/ai",
            "heading": "I've found 4 seats together",
            "supporting_text": "Row 12, near the front.",
        },
        "rows": rows,
        "sticky_footer": {
            "summary_label": "4 seats \u00b7 \u20ac24.00",
            "total_eur": 24.00,
            "confirm_cta_label": "Confirm seats",
            "next_screen_on_confirm": "offer_page_2",
            "back_screen": "offer_page_1",
        },
    }

    validate_against_contract(payload, "seat_map.jsons")
    telemetry.emit(
        context=context,
        operation_name="invoke_tool",
        message="Generated Boeing 737 seat map with Row 12 block and child row rules.",
        tool_id=TOOL_ID,
        tool_version=TOOL_VERSION,
        inputs={"session_id": session_id, "has_young_children": has_young_children},
        outputs={
            "recommended_seats": list(RECOMMENDED_SEATS),
            "total_price_eur": 24.00,
            "row_count": len(rows),
        },
    )
    return payload
