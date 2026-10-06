"""Deterministic propensity scoring tool for the 8 candidate ancillaries."""

from __future__ import annotations

from copy import deepcopy
from typing import Any

from dev.core.models import ExecutionContext
from dev.core.telemetry import TelemetryEmitter, default_telemetry

TOOL_ID = "propensity_scorer"
TOOL_VERSION = "1.0.0"

CANONICAL_BOOKING: dict[str, Any] = {
    "airline": "Ryanair",
    "booking_reference": "X8Y9QL",
    "flight_number": "FR1234",
    "origin_code": "DUB",
    "origin_name": "Dublin",
    "origin_terminal": "Terminal 1",
    "destination_code": "FAO",
    "destination_name": "Faro",
    "departure_date_label": "Tue 14 Oct",
    "departure_time": "06:35",
    "boarding_time": "05:55",
    "gate_closes_time": "06:05",
    "gate": "104",
    "status_badge": "Check-in open",
    "fare_type": "Value",
    "trip_nights": 7,
}

CANONICAL_PASSENGERS: list[dict[str, Any]] = [
    {
        "passenger_id": "pax-1",
        "display_name": "Marta B",
        "full_name": "Marta Byrne",
        "initials": "MB",
        "passenger_type": "adult",
        "age": 34,
        "is_lead_booker": True,
    },
    {
        "passenger_id": "pax-2",
        "display_name": "Declan B",
        "full_name": "Declan Byrne",
        "initials": "DB",
        "passenger_type": "adult",
        "age": 36,
        "is_lead_booker": False,
    },
    {
        "passenger_id": "pax-3",
        "display_name": "Fia B \u00b7 Child",
        "full_name": "Fia Byrne",
        "initials": "FB",
        "passenger_type": "child",
        "age": 6,
        "is_lead_booker": False,
    },
    {
        "passenger_id": "pax-4",
        "display_name": "Ois\u00edn B \u00b7 Child",
        "full_name": "Ois\u00edn Byrne",
        "initials": "OB",
        "passenger_type": "child",
        "age": 9,
        "is_lead_booker": False,
    },
]

PERSONA_PROFILES: dict[str, dict[str, Any]] = {
    "marta_byrne": {
        "persona_id": "marta_byrne",
        "label": "Marta Byrne \u2014 Family of 4, DUB\u2192FAO (2 Steps)",
        "prior_priority_trips": 3,
        "prior_total_trips": 4,
        "children_count": 2,
        "passenger_count": 4,
        "trip_nights": 7,
        "seats_already_allocated": False,
        "already_has_priority": False,
        "bags_already_booked": 0,
        "prior_insurance_declines": 6,
        "hours_to_departure": 48,
        "return_fast_track_available": False,
        "route_type": "leisure",
        "force_zero_offer": False,
    },
    "zero_offer": {
        "persona_id": "zero_offer",
        "label": "Marta Byrne \u2014 Zero Eligible Offers (1 Step)",
        "prior_priority_trips": 0,
        "prior_total_trips": 4,
        "children_count": 2,
        "passenger_count": 4,
        "trip_nights": 7,
        "seats_already_allocated": True,
        "already_has_priority": True,
        "bags_already_booked": 2,
        "prior_insurance_declines": 6,
        "hours_to_departure": 48,
        "return_fast_track_available": False,
        "route_type": "city",
        "force_zero_offer": True,
    },
    "solo_weekend": {
        "persona_id": "solo_weekend",
        "label": "Frequent Flyer \u2014 Priority Habit Only (1 Step)",
        "prior_priority_trips": 3,
        "prior_total_trips": 4,
        "children_count": 0,
        "passenger_count": 4,
        "trip_nights": 2,
        "seats_already_allocated": True,
        "already_has_priority": False,
        "bags_already_booked": 2,
        "prior_insurance_declines": 6,
        "hours_to_departure": 48,
        "return_fast_track_available": False,
        "route_type": "city",
        "force_zero_offer": False,
    },
}


def resolve_signals(
    persona_id: str = "marta_byrne",
    signal_overrides: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Merge a base persona signal dictionary with caller-provided overrides."""
    base = deepcopy(PERSONA_PROFILES.get(persona_id, PERSONA_PROFILES["marta_byrne"]))
    if signal_overrides:
        for key, value in signal_overrides.items():
            if value is not None and key in base:
                base[key] = value
    return base


def score_ancillaries(
    signals: dict[str, Any],
    context: ExecutionContext,
    telemetry: TelemetryEmitter = default_telemetry,
) -> list[dict[str, Any]]:
    """Compute propensity scores [0.00, 1.00] and sort descending across all 8 ancillaries."""
    prior_priority = int(signals.get("prior_priority_trips", 3))
    prior_total = int(signals.get("prior_total_trips", 4))
    children_count = int(signals.get("children_count", 2))
    pax_count = int(signals.get("passenger_count", 4))
    trip_nights = int(signals.get("trip_nights", 7))
    prior_ins_declines = int(signals.get("prior_insurance_declines", 6))
    route_type = str(signals.get("route_type", "leisure"))

    priority_score = round(min(0.99, 0.24 + 0.20 * min(prior_priority, 3)), 2)
    seats_score = round(min(0.99, 0.35 + 0.18 * min(children_count, 2)), 2)
    bag_score = round(min(0.99, 0.16 + 0.04 * min(trip_nights, 7) + 0.035 * pax_count), 2)
    car_score = 0.29 if route_type == "leisure" else 0.09

    raw_catalog: list[dict[str, Any]] = [
        {
            "product_id": "priority_boarding",
            "title": "Priority & 2 Cabin Bags",
            "score": priority_score,
            "top_driver": f"Repeat purchase, {prior_priority} of last {prior_total} trips",
            "price_eur": 76.00,
        },
        {
            "product_id": "reserved_seats",
            "title": "Reserved seats \u00d7 4 (together)",
            "score": seats_score,
            "top_driver": (
                f"Pax mix: {children_count} children, no seats held"
                if children_count > 0
                else "Group seating preference"
            ),
            "price_eur": 24.00,
        },
        {
            "product_id": "checked_bag_20kg",
            "title": "20kg checked bag",
            "score": bag_score,
            "top_driver": f"Trip length {trip_nights} nights, family of {pax_count}",
            "price_eur": 39.99,
        },
        {
            "product_id": "car_hire",
            "title": "Car hire",
            "score": car_score,
            "top_driver": "Route FAO, leisure \u2014 but never purchased",
            "price_eur": 28.00,
        },
        {
            "product_id": "fast_track",
            "title": "Fast Track security",
            "score": 0.14,
            "top_driver": "\u2014",
            "price_eur": 28.00,
        },
        {
            "product_id": "travel_insurance",
            "title": "Travel insurance",
            "score": 0.11,
            "top_driver": f"Never purchased, {prior_ins_declines} prior declines",
            "price_eur": 64.00,
        },
        {
            "product_id": "airport_transfer",
            "title": "Airport transfer",
            "score": 0.08,
            "top_driver": "\u2014",
            "price_eur": 20.00,
        },
        {
            "product_id": "flexi_upgrade",
            "title": "Flexi fare upgrade",
            "score": 0.04,
            "top_driver": "\u2014",
            "price_eur": 90.00,
        },
    ]

    sorted_items = sorted(raw_catalog, key=lambda item: item["score"], reverse=True)
    for idx, item in enumerate(sorted_items, start=1):
        item["rank"] = idx

    telemetry.emit(
        context=context,
        operation_name="invoke_tool",
        message="Scored 8 candidate ancillaries by purchase likelihood.",
        tool_id=TOOL_ID,
        tool_version=TOOL_VERSION,
        inputs={"persona_id": signals.get("persona_id"), "trip_nights": trip_nights},
        outputs={
            "top_ranked_product": sorted_items[0]["product_id"],
            "top_score": sorted_items[0]["score"],
            "count": len(sorted_items),
        },
    )
    return sorted_items
