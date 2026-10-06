"""Deterministic business rule filter stripping ineligible and suppressed ancillaries."""

from __future__ import annotations

from copy import deepcopy
from typing import Any

from dev.core.models import ExecutionContext
from dev.core.telemetry import TelemetryEmitter, default_telemetry

TOOL_ID = "eligibility_rules"
TOOL_VERSION = "1.0.0"

DISPLAY_FLOOR: float = 0.10
CARD_PROMOTE_THRESHOLD: float = 0.50
MAX_CONSECUTIVE_DECLINES: int = 6
FLEXI_CUTOFF_HOURS: int = 48


def apply_eligibility_rules(
    scored_items: list[dict[str, Any]],
    signals: dict[str, Any],
    declined_product_ids: list[str],
    context: ExecutionContext,
    telemetry: TelemetryEmitter = default_telemetry,
) -> list[dict[str, Any]]:
    """Evaluate hard eligibility, suppression, and display-floor rules for each ancillary."""
    force_zero = bool(signals.get("force_zero_offer", False))
    return_fast_track = bool(signals.get("return_fast_track_available", False))
    hours_to_departure = int(signals.get("hours_to_departure", 48))
    prior_ins_declines = int(signals.get("prior_insurance_declines", 6))
    already_has_priority = bool(signals.get("already_has_priority", False))
    seats_already_allocated = bool(signals.get("seats_already_allocated", False))
    bags_already_booked = int(signals.get("bags_already_booked", 0))
    declined_set = set(declined_product_ids)

    evaluated: list[dict[str, Any]] = []
    removed_count = 0

    for raw in scored_items:
        item = deepcopy(raw)
        pid = item["product_id"]
        score = float(item["score"])
        removal_rule: str | None = None

        if force_zero:
            removal_rule = "INELIGIBLE_ROUTE_PRODUCT:zero_offer_branch"
        elif pid in declined_set:
            removal_rule = "SUPPRESSED_DECLINE_STREAK:declined_in_session"
        elif pid == "fast_track" and not return_fast_track:
            removal_rule = "INELIGIBLE_ROUTE_PRODUCT:not_sold_at_fao_return"
        elif pid == "flexi_upgrade" and hours_to_departure <= FLEXI_CUTOFF_HOURS:
            removal_rule = "INELIGIBLE_TIME_WINDOW:inside_48h_departure_window"
        elif pid == "travel_insurance" and prior_ins_declines >= MAX_CONSECUTIVE_DECLINES:
            removal_rule = "SUPPRESSED_DECLINE_STREAK:6_consecutive_declines"
        elif pid == "priority_boarding" and already_has_priority:
            removal_rule = "INELIGIBLE_ROUTE_PRODUCT:already_purchased"
        elif pid == "reserved_seats" and seats_already_allocated:
            removal_rule = "INELIGIBLE_ROUTE_PRODUCT:seats_already_allocated"
        elif pid == "checked_bag_20kg" and bags_already_booked >= 2:
            removal_rule = "INELIGIBLE_ROUTE_PRODUCT:bag_allowance_full"
        elif score < DISPLAY_FLOOR:
            removal_rule = "BELOW_DISPLAY_FLOOR:score_below_0.10"

        if removal_rule is not None:
            item["eligible"] = False
            item["removal_rule"] = removal_rule
            item["placement"] = "removed"
            removed_count += 1
        else:
            item["eligible"] = True
            item["removal_rule"] = None
            item["placement"] = (
                "primary_card" if score >= CARD_PROMOTE_THRESHOLD else "drawer"
            )

        evaluated.append(item)

    telemetry.emit(
        context=context,
        operation_name="invoke_tool",
        message="Applied business eligibility and suppression rules to scored ancillaries.",
        tool_id=TOOL_ID,
        tool_version=TOOL_VERSION,
        inputs={
            "candidate_count": len(scored_items),
            "declined_in_session": list(declined_set),
            "force_zero_offer": force_zero,
        },
        outputs={
            "eligible_count": len(evaluated) - removed_count,
            "removed_count": removed_count,
        },
    )
    return evaluated
