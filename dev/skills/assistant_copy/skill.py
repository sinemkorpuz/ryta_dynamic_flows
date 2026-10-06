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


def get_canonical_trip_answer(query: str, session_state: dict[str, Any]) -> dict[str, str]:
    """Synthesize a grounded Help Hub answer from live session state (booking, passengers, basket)."""
    q = query.strip().lower()
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
        return {
            "heading": "Family seating in Row 12",
            "supporting_text": (
                f"I've pre-selected contiguous seats 12A–12D (€24 total) for all {pax_count} passengers "
                f"({child_desc or 'including children'}). Exit Row 16 is restricted for under-16s."
            ),
        }

    if any(k in q for k in ("bag", "luggage", "cabin", "priority", "hold", "20kg", "suitcase")):
        has_prio = selected_qty.get("priority_boarding", 0) > 0
        bag_cnt = selected_qty.get("checked_bag_20kg", 0)
        return {
            "heading": "Cabin & 20kg hold bag options",
            "supporting_text": (
                f"Priority & 2 Cabin Bags is €76 for all {pax_count} travellers "
                f"({'added' if has_prio else 'available on Step 1'}), and a 20kg checked bag is €39.99 "
                f"({f'{bag_cnt} selected' if bag_cnt else 'available on Step 2'})."
            ),
        }

    if any(k in q for k in ("gate", "terminal", "board", "time", "depart", "flight", "where", "when")):
        return {
            "heading": f"Flight {flight_no} · {origin_code} {terminal}, Gate {gate}",
            "supporting_text": (
                f"{origin} to {dest} ({dest_code}) departs on schedule from {terminal}, Gate {gate}. "
                f"All {pax_count} travel documents on booking {pnr} are verified."
            ),
        }

    if any(k in q for k in ("car", "hire", "transfer", "insurance", "fast track", "extra")):
        return {
            "heading": f"Tailored extras for {origin_code} → {dest_code}",
            "supporting_text": (
                "Car hire in Faro (from €28/day) is available inside the 'More extras (1)' drawer on Step 2. "
                "Low-relevance extras are filtered out automatically."
            ),
        }

    if any(k in q for k in ("passport", "document", "id", "verified", "who", "passenger")):
        names = ", ".join(p.get("full_name", p.get("display_name", "")) for p in passengers)
        return {
            "heading": f"All {pax_count} travel documents verified",
            "supporting_text": f"Passports are verified on file for {names} under booking {pnr}.",
        }

    return {
        "heading": f"Ready for {origin} → {dest} ({flight_no})",
        "supporting_text": (
            f"Booking {pnr} has {pax_count} verified passengers departing from {terminal}, Gate {gate}. "
            f"Tap 'Start check-in' to finish in {total_steps} {'step' if total_steps == 1 else 'steps'}."
        ),
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
) -> dict[str, Any]:
    """Answer a passenger question from the Screen E Help Hub search bar grounded in session state."""
    active_orchestrator = orchestrator or ADKOrchestrator(
        agent_name="help_hub_trip_assistant",
        instruction=(
            "You are a helpful first-person airline check-in assistant. "
            "Respond strictly in the format 'heading | supporting_text' where heading <= 56 chars "
            "and supporting_text <= 150 chars. Ground facts in the provided booking and passengers. "
            "Never mention AI, bots, algorithms, Row 14, or countdown timers (MM:SS)."
        ),
        tools=[score_ancillaries, apply_eligibility_rules, build_seat_map, build_basket_state],
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
        f"Selected extras: {selected_qty}\n"
        f"Return 'heading | supporting_text' without any HH:MM or MM:SS timestamps."
    )

    copy_dict, source, guardrail_status, events = active_orchestrator.run_with_fallback(
        prompt=prompt,
        fallback_fn=lambda: get_canonical_trip_answer(query, session_state),
        validator_fn=validate_assistant_copy,
    )

    payload: dict[str, Any] = {
        "schema_version": "1.0.0",
        "session_id": context.session_id,
        "query": query,
        "surface_token": "surface/ai",
        "heading": copy_dict["heading"],
        "supporting_text": copy_dict["supporting_text"],
        "source": source,
        "guardrail_status": guardrail_status,
    }

    telemetry.emit(
        context=context,
        operation_name="help_hub_assist",
        message=f"Answered Help Hub trip query ({source}).",
        severity="INFO" if guardrail_status == "PASS" else "WARNING",
        skill_id=SKILL_ID,
        skill_version=SKILL_VERSION,
        model_name=active_orchestrator.model_name,
        agent_id=active_orchestrator.agent_name,
        guardrail_status=guardrail_status,
        security_events=events,
        inputs={"query": query},
        outputs=payload,
    )
    return payload
