"""Deterministic basket pricing, checkout state transitions, and boarding pass issuance."""

from __future__ import annotations

from typing import Any

from dev.core.models import ExecutionContext
from dev.core.telemetry import TelemetryEmitter, default_telemetry

TOOL_ID = "basket_pricing"
TOOL_VERSION = "1.0.0"

CATALOG_LINE_SPECS: dict[str, dict[str, Any]] = {
    "priority_boarding": {
        "icon": "bag_priority",
        "label": "Priority & 2 Cabin Bags \u00d74",
        "unit_price_eur": 76.00,
    },
    "reserved_seats": {
        "icon": "seat",
        "label": "Seats 12A\u201312D",
        "unit_price_eur": 24.00,
    },
    "checked_bag_20kg": {
        "icon": "suitcase",
        "label": "Checked bag 20kg",
        "unit_price_eur": 39.99,
    },
    "car_hire": {
        "icon": "car",
        "label": "Car hire in Faro",
        "unit_price_eur": 28.00,
    },
}

DEFAULT_SEAT_ASSIGNMENTS: tuple[str, ...] = ("12A", "12B", "12C", "12D")


def build_basket_state(selected_quantities: dict[str, int]) -> dict[str, Any]:
    """Construct the BasketState object with exact euro formatting."""
    ordered_keys = ("priority_boarding", "reserved_seats", "checked_bag_20kg", "car_hire")
    items: list[dict[str, Any]] = []
    total_eur = 0.0

    for pid in ordered_keys:
        qty = int(selected_quantities.get(pid, 0))
        if qty <= 0 or pid not in CATALOG_LINE_SPECS:
            continue
        spec = CATALOG_LINE_SPECS[pid]
        line_price = round(float(spec["unit_price_eur"]) * qty, 2)
        total_eur = round(total_eur + line_price, 2)
        label = spec["label"] if qty == 1 or pid != "checked_bag_20kg" else f"{spec['label']} \u00d7{qty}"
        items.append(
            {
                "product_id": pid,
                "icon": spec["icon"],
                "label": label,
                "quantity": qty,
                "price_eur": line_price,
                "formatted_price": f"\u20ac{line_price:.2f}",
                "removable": True,
            }
        )

    return {
        "header_title": "Review your extras",
        "items": items,
        "total_eur": total_eur,
        "formatted_total": f"\u20ac{total_eur:.2f}",
        "saved_payment_method": "Visa ending 4412",
        "pay_cta_label": "Pay and get boarding passes",
    }


def issue_boarding_passes(
    passengers: list[dict[str, Any]],
    selected_quantities: dict[str, int],
    context: ExecutionContext,
    telemetry: TelemetryEmitter = default_telemetry,
) -> list[dict[str, Any]]:
    """Generate the swipeable stack of 4 boarding passes (Screen G) with earned badges."""
    has_priority = int(selected_quantities.get("priority_boarding", 0)) > 0
    has_seats = int(selected_quantities.get("reserved_seats", 0)) > 0
    passes: list[dict[str, Any]] = []

    for idx, pax in enumerate(passengers):
        seat_code = DEFAULT_SEAT_ASSIGNMENTS[idx] if has_seats and idx < len(DEFAULT_SEAT_ASSIGNMENTS) else None
        badges: list[str] = []
        if has_priority:
            badges.append("PRIORITY")
        if seat_code is not None:
            badges.append(seat_code)

        passes.append(
            {
                "pass_index": idx + 1,
                "total_passes": 4,
                "passenger_name": pax["full_name"],
                "passenger_type": pax["passenger_type"],
                "booking_reference": "X8Y9QL",
                "flight_number": "FR1234",
                "route_label": "DUB \u2192 FAO",
                "departure_date_label": "Tue 14 Oct",
                "departure_time": "06:35",
                "boarding_time": "05:55",
                "gate": "104",
                "seat": seat_code,
                "badges": badges,
                "qr_payload": f"RYANAIR|X8Y9QL|FR1234|DUB-FAO|{pax['passenger_id']}|{seat_code or 'UNASSIGNED'}",
            }
        )

    telemetry.emit(
        context=context,
        operation_name="invoke_tool",
        message="Issued 4 boarding passes with ancillary badges.",
        tool_id=TOOL_ID,
        tool_version=TOOL_VERSION,
        inputs={"has_priority": has_priority, "has_seats": has_seats},
        outputs={"pass_count": len(passes), "lead_badges": passes[0]["badges"]},
    )
    return passes
