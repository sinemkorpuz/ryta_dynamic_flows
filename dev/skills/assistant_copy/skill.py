"""ADK assistant copy and Help Hub Q&A skill with anti-dark-pattern guardrails."""

from __future__ import annotations

import re
from typing import Any

from dev.core.models import ExecutionContext
from dev.core.orchestrator import ADKOrchestrator
from dev.core.telemetry import TelemetryEmitter, default_telemetry
from dev.tools.basket_pricing import build_basket_state
from dev.tools.eligibility_rules import apply_eligibility_rules
from dev.tools.propensity_scorer import score_ancillaries
from dev.tools.seat_allocator import build_seat_map

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
    if len(supporting) > 160:
        violations.append("supporting_text_exceeds_160_chars")

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


def get_canonical_trip_answer(
    query: str,
    session_state: dict[str, Any],
    *,
    tool_callbacks: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Synthesize a grounded Help Hub answer and invoke domain tools from live session state."""
    q = query.strip().lower()
    callbacks = tool_callbacks or {}
    invoked_tools: list[str] = []

    def _call_tool(name: str, *args: Any, **kwargs: Any) -> Any:
        fn = callbacks.get(name)
        if callable(fn):
            return fn(*args, **kwargs)
        if name not in invoked_tools:
            invoked_tools.append(name)
        return None

    # 1. Check for natural-language ADK Live Simulation scenario / signal overrides
    if any(
        phrase in q
        for phrase in (
            "solo",
            "1 night",
            "1-night",
            "one night",
            "no child",
            "no kids",
            "without kids",
            "without children",
            "zero offer",
            "zero-offer",
            "0 offer",
            "what if",
            "simulate",
            "reset to marta",
            "family trip",
        )
    ):
        if "zero offer" in q or "zero-offer" in q or "0 offer" in q:
            _call_tool(
                "update_simulation_signals",
                prior_priority_trips=0,
                children_count=0,
                trip_nights=1,
                force_zero_offer=True,
            )
            return {
                "heading": "Simulated Zero-Offer trip (1 Step)",
                "supporting_text": (
                    "I've updated the simulation to Zero-Offer mode. All 8 extras fall below the display floor, "
                    "compressing your check-in to 1 step with 0 offer pages."
                ),
                "_invoked_tools": invoked_tools,
            }
        if "reset" in q or "marta" in q or "family trip" in q:
            _call_tool(
                "update_simulation_signals",
                prior_priority_trips=3,
                children_count=2,
                trip_nights=7,
                force_zero_offer=False,
            )
            return {
                "heading": "Restored Marta's 7-night family trip",
                "supporting_text": (
                    "I've re-scored all 8 extras for 2 adults, 2 children (6y & 9y), and 7 nights—"
                    "restoring the 2-step flow (Priority 0.84, Row 12 Seats 0.71, 20kg Bag 0.58)."
                ),
                "_invoked_tools": invoked_tools,
            }
        # Default solo / short-trip simulation
        nights = 1
        nights_match = re.search(r"(\d+)\s*[- ]?night", q)
        if nights_match:
            nights = max(1, min(14, int(nights_match.group(1))))
        kids = 0 if any(w in q for w in ("solo", "no child", "no kids", "without", "0 kid")) else int(
            session_state.get("signals", {}).get("children_count", 2)
        )
        prio = 0 if "solo" in q or "0 prio" in q else int(
            session_state.get("signals", {}).get("prior_priority_trips", 3)
        )
        _call_tool(
            "update_simulation_signals",
            prior_priority_trips=prio,
            children_count=kids,
            trip_nights=nights,
            force_zero_offer=False,
        )
        updated_res = session_state.get("response", {})
        step_pill = updated_res.get("entry_step_pill", "1 STEP")
        page_cnt = len(updated_res.get("pages", []))
        return {
            "heading": f"Re-scored simulation · {step_pill}",
            "supporting_text": (
                f"I've updated your signals ({prio}/4 prior Priority, {kids} kids, {nights}n) and re-ran "
                f"the propensity scorer, producing {page_cnt} offer {'page' if page_cnt == 1 else 'pages'}."
            ),
            "_invoked_tools": invoked_tools,
        }

    # 2. Check for natural-language basket actions from the main screen
    if any(verb in q for verb in ("add ", "include ", "reserve ", "book ", "remove ")):
        is_remove = "remove " in q
        if "priority" in q or "cabin" in q:
            _call_tool("modify_basket_item", product_id="priority_boarding", quantity=0 if is_remove else 1)
            basket = build_basket_state(session_state.get("selected_quantities", {}))
            return {
                "heading": (
                    "Removed Priority Boarding"
                    if is_remove
                    else "Added Priority & 2 Cabin Bags (€76)"
                ),
                "supporting_text": (
                    f"I've updated your basket for all 4 passengers. "
                    f"Your current extras total is {basket['formatted_total']}."
                ),
                "_invoked_tools": invoked_tools,
            }
        if "seat" in q or "row 12" in q or "12a" in q:
            _call_tool("modify_basket_item", product_id="reserved_seats", quantity=0 if is_remove else 1)
            basket = build_basket_state(session_state.get("selected_quantities", {}))
            return {
                "heading": (
                    "Removed Row 12 family seats"
                    if is_remove
                    else "Reserved Row 12 seats 12A–12D (€24)"
                ),
                "supporting_text": (
                    f"I've {'removed' if is_remove else 'confirmed'} contiguous family seats 12A–12D. "
                    f"Your current extras total is {basket['formatted_total']}."
                ),
                "_invoked_tools": invoked_tools,
            }
        if "bag" in q or "20kg" in q or "hold" in q or "luggage" in q:
            _call_tool("modify_basket_item", product_id="checked_bag_20kg", quantity=0 if is_remove else 1)
            basket = build_basket_state(session_state.get("selected_quantities", {}))
            return {
                "heading": (
                    "Removed 20kg Checked Bag"
                    if is_remove
                    else "Added 20kg Checked Bag (€39.99)"
                ),
                "supporting_text": (
                    f"I've updated your hold luggage for this flight. "
                    f"Your current extras total is {basket['formatted_total']}."
                ),
                "_invoked_tools": invoked_tools,
            }

    response = session_state.get("response", {})
    booking = response.get("booking", {})
    passengers = response.get("passengers", [])
    selected_qty = session_state.get("selected_quantities", {})

    flight_no = booking.get("flight_number", "FR1234")
    origin = booking.get("origin_name", "Dublin")
    origin_code = booking.get("origin_code", "DUB")
    dest = booking.get("destination_name", "Faro")
    dest_code = booking.get("destination_code", "FAO")
    terminal = booking.get("origin_terminal", "Terminal 1")
    gate = booking.get("gate", "104")
    pnr = booking.get("booking_reference", "X8Y9QL")
    pax_count = len(passengers) or 4
    children = [p for p in passengers if p.get("passenger_type") == "child"]
    child_desc = ", ".join(f"{c.get('full_name', 'Child')} ({c.get('age')}y)" for c in children)
    total_steps = response.get("total_steps", 2)

    if any(k in q for k in ("seat", "sit", "row", "child", "children", "fia", "ois", "exit")):
        _call_tool("inspect_family_seat_map")
        return {
            "heading": "Family seating in Row 12",
            "supporting_text": (
                f"I've pre-selected contiguous seats 12A–12D (€24 total) for all {pax_count} passengers "
                f"({child_desc or 'including children'}). Exit Row 16 is restricted for under-16s."
            ),
            "_invoked_tools": invoked_tools,
        }

    if any(k in q for k in ("bag", "luggage", "cabin", "priority", "hold", "20kg", "suitcase")):
        _call_tool("get_trip_and_ancillary_scores")
        has_prio = selected_qty.get("priority_boarding", 0) > 0
        bag_cnt = selected_qty.get("checked_bag_20kg", 0)
        return {
            "heading": "Cabin & 20kg hold bag options",
            "supporting_text": (
                f"Priority & 2 Cabin Bags is €76 for all {pax_count} travellers "
                f"({'added' if has_prio else 'available on Step 1'}), and a 20kg checked bag is €39.99 "
                f"({f'{bag_cnt} selected' if bag_cnt else 'available on Step 2'})."
            ),
            "_invoked_tools": invoked_tools,
        }

    if any(k in q for k in ("gate", "terminal", "board", "time", "depart", "flight", "where", "when")):
        _call_tool("get_trip_and_ancillary_scores")
        return {
            "heading": f"Flight {flight_no} · {origin_code} {terminal}, Gate {gate}",
            "supporting_text": (
                f"{origin} to {dest} ({dest_code}) departs on schedule from {terminal}, Gate {gate}. "
                f"All {pax_count} travel documents on booking {pnr} are verified."
            ),
            "_invoked_tools": invoked_tools,
        }

    if any(k in q for k in ("car", "hire", "transfer", "insurance", "fast track", "extra", "score", "rank", "why")):
        _call_tool("get_trip_and_ancillary_scores")
        return {
            "heading": f"Tailored extras for {origin_code} → {dest_code}",
            "supporting_text": (
                "Priority (0.84) and Row 12 Seats (0.71) are on Step 1; 20kg Bag (0.58) and Car hire "
                "(0.29 drawer) are on Step 2. Four low-relevance items were stripped."
            ),
            "_invoked_tools": invoked_tools,
        }

    if any(k in q for k in ("passport", "document", "id", "verified", "who", "passenger")):
        _call_tool("get_trip_and_ancillary_scores")
        names = ", ".join(p.get("full_name", p.get("display_name", "")) for p in passengers)
        return {
            "heading": f"All {pax_count} travel documents verified",
            "supporting_text": f"Passports are verified on file for {names} under booking {pnr}.",
            "_invoked_tools": invoked_tools,
        }

    _call_tool("get_trip_and_ancillary_scores")
    return {
        "heading": f"Ready for {origin} → {dest} ({flight_no})",
        "supporting_text": (
            f"Booking {pnr} has {pax_count} verified passengers departing from {terminal}, Gate {gate}. "
            f"Tap 'Start check-in' to finish in {total_steps} {'step' if total_steps == 1 else 'steps'}."
        ),
        "_invoked_tools": invoked_tools,
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
    active_orchestrator = orchestrator or ADKOrchestrator(
        agent_name="assistant_copy_agent",
        tools=[score_ancillaries, apply_eligibility_rules, build_seat_map, build_basket_state],
    )
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


def answer_trip_question(
    *,
    query: str,
    session_state: dict[str, Any],
    context: ExecutionContext,
    orchestrator: ADKOrchestrator | None = None,
    telemetry: TelemetryEmitter = default_telemetry,
    signal_mutator: Any | None = None,
    basket_mutator: Any | None = None,
) -> dict[str, Any]:
    """Answer a passenger question or simulation command from the Screen E Help Hub search bar via Google ADK."""
    recorded_tools: list[str] = []
    mutation_tracker = {"state_mutated": False}

    def _record(name: str) -> None:
        if name not in recorded_tools:
            recorded_tools.append(name)

    def get_trip_and_ancillary_scores() -> dict[str, Any]:
        """Score all 8 candidate ancillaries and apply eligibility rules for the current session."""
        _record("get_trip_and_ancillary_scores")
        _record("score_ancillaries")
        _record("apply_eligibility_rules")
        scored = score_ancillaries(
            signals=session_state.get("signals", {}),
            context=context,
            telemetry=telemetry,
        )
        filtered = apply_eligibility_rules(
            scored_items=scored,
            signals=session_state.get("signals", {}),
            declined_product_ids=session_state.get("declined_product_ids", []),
            context=context,
            telemetry=telemetry,
        )
        return {
            "total_steps": session_state.get("response", {}).get("total_steps", 2),
            "ranked_ancillaries": filtered,
        }

    def inspect_family_seat_map() -> dict[str, Any]:
        """Inspect Boeing 737 Row 12 family seat allocation (12A-12D) and child exit-row restrictions."""
        _record("inspect_family_seat_map")
        _record("build_seat_map")
        seat_map = build_seat_map(
            session_id=context.session_id,
            passengers=session_state.get("response", {}).get("passengers", []),
            context=context,
            telemetry=telemetry,
        )
        return {
            "recommended_row": seat_map.get("recommended_row", 12),
            "recommended_seats": seat_map.get("recommended_seats", ["12A", "12B", "12C", "12D"]),
            "total_price_eur": seat_map.get("total_price_eur", 24.0),
        }

    def update_simulation_signals(
        prior_priority_trips: int = 3,
        children_count: int = 2,
        trip_nights: int = 7,
        force_zero_offer: bool = False,
    ) -> dict[str, Any]:
        """Update ADK Live Simulation passenger signals, re-score all 8 ancillaries, and rebuild offer pages."""
        _record("update_simulation_signals")
        _record("score_ancillaries")
        _record("apply_eligibility_rules")
        mutation_tracker["state_mutated"] = True
        overrides = {
            "prior_priority_trips": int(prior_priority_trips),
            "children_count": int(children_count),
            "trip_nights": int(trip_nights),
            "force_zero_offer": bool(force_zero_offer),
        }
        if callable(signal_mutator):
            return signal_mutator(overrides)
        session_state.setdefault("signals", {}).update(overrides)
        return {"signals": session_state["signals"]}

    def modify_basket_item(product_id: str, quantity: int = 1) -> dict[str, Any]:
        """Add, update, or remove an ancillary product in the passenger's check-in basket."""
        _record("modify_basket_item")
        _record("build_basket_state")
        mutation_tracker["state_mutated"] = True
        if callable(basket_mutator):
            return basket_mutator(product_id, int(quantity))
        selected = session_state.setdefault("selected_quantities", {})
        if int(quantity) <= 0:
            selected.pop(product_id, None)
        else:
            selected[product_id] = int(quantity)
        return build_basket_state(selected, context=context, telemetry=telemetry)

    tool_callbacks = {
        "get_trip_and_ancillary_scores": get_trip_and_ancillary_scores,
        "inspect_family_seat_map": inspect_family_seat_map,
        "update_simulation_signals": update_simulation_signals,
        "modify_basket_item": modify_basket_item,
    }

    active_orchestrator = orchestrator or ADKOrchestrator(
        agent_name="help_hub_trip_assistant",
        timeout_seconds=4.5,
        instruction=(
            "You are a helpful first-person airline check-in assistant connected to the ADK Live Simulation. "
            "Use your tools (get_trip_and_ancillary_scores, inspect_family_seat_map, update_simulation_signals, "
            "modify_basket_item) to inspect trip details, seat maps, propensity scores, or update simulation "
            "signals/basket when requested. Respond strictly in the format 'heading | supporting_text' where "
            "heading <= 56 chars and supporting_text <= 150 chars. Never mention AI, bots, algorithms, "
            "Row 14, or countdown timers (MM:SS)."
        ),
        tools=[
            get_trip_and_ancillary_scores,
            inspect_family_seat_map,
            update_simulation_signals,
            modify_basket_item,
        ],
    )
    response = session_state.get("response", {})
    booking = response.get("booking", {})
    passengers = response.get("passengers", [])
    selected_qty = session_state.get("selected_quantities", {})

    prompt = (
        f"Passenger question: {query!r}\n"
        f"Booking: flight={booking.get('flight_number')}, "
        f"route={booking.get('origin_code')}->{booking.get('destination_code')}, "
        f"terminal={booking.get('origin_terminal')}, gate={booking.get('gate')}, "
        f"pnr={booking.get('booking_reference')}, total_steps={response.get('total_steps')}\n"
        f"Passengers: {[p.get('full_name') for p in passengers]}\n"
        f"Signals: {session_state.get('signals', {})}\n"
        f"Selected extras: {selected_qty}\n"
        f"Invoke the appropriate tool(s) and return 'heading | supporting_text' without any HH:MM or MM:SS timestamps."
    )

    copy_dict, source, guardrail_status, events = active_orchestrator.run_with_fallback(
        prompt=prompt,
        fallback_fn=lambda: get_canonical_trip_answer(
            query,
            session_state,
            tool_callbacks=tool_callbacks,
        ),
        validator_fn=validate_assistant_copy,
        timeout_seconds=4.5,
    )

    for tool_name in recorded_tools:
        active_orchestrator.record_tool_invocation(tool_name)

    signals_now = session_state.get("signals", {})
    basket_now = build_basket_state(session_state.get("selected_quantities", {}))
    updated_response = dict(session_state.get("response", {}))
    pages_now = updated_response.get("pages", [])
    updated_response["funnel_summary"] = {
        "total_offer_pages": len(pages_now),
        "total_steps": updated_response.get("total_steps", 1 if len(pages_now) == 0 else len(pages_now)),
    }

    telemetry_outputs: dict[str, Any] = {
        "schema_version": "1.0.0",
        "session_id": context.session_id,
        "query": query,
        "surface_token": "surface/ai",
        "heading": copy_dict["heading"],
        "supporting_text": copy_dict["supporting_text"],
        "headline": copy_dict["heading"],
        "subtext": copy_dict["supporting_text"],
        "source": source,
        "guardrail_status": guardrail_status,
        "agent_id": active_orchestrator.agent_name,
        "model": active_orchestrator.last_model_used,
        "invoked_tools": list(active_orchestrator.last_invoked_tools),
        "latency_ms": active_orchestrator.last_latency_ms,
        "state_mutated": bool(mutation_tracker["state_mutated"]),
    }

    telemetry.emit(
        context=context,
        operation_name="help_hub_assist",
        message=f"Answered Help Hub trip query ({source}) with tools={active_orchestrator.last_invoked_tools}.",
        severity="INFO" if guardrail_status == "PASS" else "WARNING",
        skill_id=SKILL_ID,
        skill_version=SKILL_VERSION,
        model_name=active_orchestrator.last_model_used,
        agent_id=active_orchestrator.agent_name,
        guardrail_status=guardrail_status,
        security_events=events,
        inputs={"query": query},
        outputs=telemetry_outputs,
    )

    return {
        **telemetry_outputs,
        "signals": {
            "persona_id": str(signals_now.get("persona_id", "marta_byrne")),
            "prior_priority_trips": int(signals_now.get("prior_priority_trips", 3)),
            "children_count": int(signals_now.get("children_count", 2)),
            "child_count": int(signals_now.get("children_count", 2)),
            "trip_nights": int(signals_now.get("trip_nights", 7)),
            "trip_length_days": int(signals_now.get("trip_nights", 7)),
            "force_zero_offer": bool(signals_now.get("force_zero_offer", False)),
        },
        "basket": basket_now,
        "session": updated_response,
    }

