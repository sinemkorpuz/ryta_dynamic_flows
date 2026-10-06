"""Declarative skill combining propensity scoring and business rule filtering."""

from __future__ import annotations

from typing import Any

from dev.core.models import ExecutionContext
from dev.core.telemetry import TelemetryEmitter, default_telemetry
from dev.tools.eligibility_rules import apply_eligibility_rules
from dev.tools.propensity_scorer import score_ancillaries

SKILL_ID = "ancillary_ranking"
SKILL_VERSION = "1.0.0"


def rank_and_filter_ancillaries(
    signals: dict[str, Any],
    declined_product_ids: list[str],
    context: ExecutionContext,
    telemetry: TelemetryEmitter = default_telemetry,
) -> list[dict[str, Any]]:
    """Score all 8 ancillaries and strip ineligible or suppressed products."""
    scored = score_ancillaries(signals=signals, context=context, telemetry=telemetry)
    evaluated = apply_eligibility_rules(
        scored_items=scored,
        signals=signals,
        declined_product_ids=declined_product_ids,
        context=context,
        telemetry=telemetry,
    )

    eligible_ids = [item["product_id"] for item in evaluated if item["eligible"]]
    telemetry.emit(
        context=context,
        operation_name="execute_skill",
        message="Executed ancillary_ranking skill.",
        skill_id=SKILL_ID,
        skill_version=SKILL_VERSION,
        inputs={"persona_id": signals.get("persona_id")},
        outputs={"eligible_product_ids": eligible_ids, "total_evaluated": len(evaluated)},
    )
    return evaluated
