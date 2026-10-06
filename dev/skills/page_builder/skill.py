"""Dynamic Page Builder skill and stateful check-in session manager."""

from __future__ import annotations

from copy import deepcopy
import time
from typing import Any
import uuid

from dev.core.models import ExecutionContext, validate_against_contract
from dev.core.orchestrator import ADKOrchestrator
from dev.core.telemetry import TelemetryEmitter, default_telemetry
from dev.skills.ancillary_ranking.skill import rank_and_filter_ancillaries
from dev.skills.assistant_copy.skill import (
    answer_trip_question,
    synthesize_assistant_panel,
)
from dev.tools.basket_pricing import build_basket_state, issue_boarding_passes
from dev.tools.propensity_scorer import (
    CANONICAL_BOOKING,
    CANONICAL_PASSENGERS,
    PERSONA_PROFILES,
    resolve_signals,
)
from dev.tools.seat_allocator import build_seat_map

SKILL_ID = "page_builder"
SKILL_VERSION = "1.0.0"

CARD_TEMPLATES: dict[str, dict[str, Any]] = {
    "priority_boarding": {
        "product_id": "priority_boarding",
        "icon": "bag",
        "title": "Priority & 2 Cabin Bags",
        "status_pill": "Your usual",
        "status_pill_token": "pill/next",
        "description": "Skip the queue, 2 bags each",
        "price_label": "\u20ac76 for 4 passengers",
        "price_eur": 76.00,
        "control_type": "toggle_all_pax",
        "selected": False,
        "quantity": 0,
        "cta_label": "Add",
        "secondary_link_label": "Choose who gets it",
    },
    "reserved_seats": {
        "product_id": "reserved_seats",
        "icon": "seat",
        "title": "Sit together",
        "status_pill": "Recommended",
        "status_pill_token": "pill/review",
        "description": "Seats are assigned free, but your family may be split up",
        "price_label": "\u20ac24 for 4 seats",
        "price_eur": 24.00,
        "control_type": "seat_map_trigger",
        "selected": False,
        "quantity": 0,
        "cta_label": "Choose seats",
        "secondary_link_label": None,
    },
    "checked_bag_20kg": {
        "product_id": "checked_bag_20kg",
        "icon": "suitcase",
        "title": "20kg Checked Bag",
        "status_pill": None,
        "status_pill_token": None,
        "description": "Customise your checked luggage allowance for this flight",
        "price_label": "\u20ac39.99",
        "price_eur": 39.99,
        "control_type": "quantity_stepper",
        "selected": False,
        "quantity": 0,
        "cta_label": "Add",
        "secondary_link_label": None,
    },
    "car_hire": {
        "product_id": "car_hire",
        "icon": "car",
        "title": "Car hire in Faro",
        "status_pill": "Partner rate",
        "status_pill_token": "pill/plan",
        "description": "Pick up at Faro Airport (FAO) \u00b7 Free cancellation",
        "price_label": "From \u20ac28.00/day",
        "price_eur": 28.00,
        "control_type": "toggle_all_pax",
        "selected": False,
        "quantity": 0,
        "cta_label": "Add",
        "secondary_link_label": None,
    },
    "fast_track": {
        "product_id": "fast_track",
        "icon": "bolt",
        "title": "Fast Track Security",
        "status_pill": "Dublin T1",
        "status_pill_token": "pill/next",
        "description": "Dedicated security lane at Dublin Airport for all 4 passengers",
        "price_label": "\u20ac28 for 4 passengers",
        "price_eur": 28.00,
        "control_type": "toggle_all_pax",
        "selected": False,
        "quantity": 0,
        "cta_label": "Add",
        "secondary_link_label": None,
    },
    "travel_insurance": {
        "product_id": "travel_insurance",
        "icon": "shield",
        "title": "Travel Insurance Plus",
        "status_pill": None,
        "status_pill_token": None,
        "description": "Medical, baggage & delay cover for all 4 passengers for this flight",
        "price_label": "\u20ac64 for 4 passengers",
        "price_eur": 64.00,
        "control_type": "toggle_all_pax",
        "selected": False,
        "quantity": 0,
        "cta_label": "Add",
        "secondary_link_label": None,
    },
}

DRAWER_TEMPLATES: dict[str, dict[str, Any]] = {
    "car_hire": {
        "product_id": "car_hire",
        "title": "Car hire in Faro",
        "description": "Pick up at Faro Airport (FAO) \u00b7 Free cancellation",
        "price_label": "From \u20ac28.00/day",
        "price_eur": 28.00,
        "selected": False,
        "cta_label": "Add",
    },
    "fast_track": {
        "product_id": "fast_track",
        "title": "Fast Track Security (DUB)",
        "description": "Dedicated security lane at Dublin Terminal 1",
        "price_label": "\u20ac28.00 total",
        "price_eur": 28.00,
        "selected": False,
        "cta_label": "Add",
    },
    "travel_insurance": {
        "product_id": "travel_insurance",
        "title": "Travel Insurance Plus",
        "description": "Medical, baggage & delay cover for all 4 passengers for this flight",
        "price_label": "\u20ac64.00 total",
        "price_eur": 64.00,
        "selected": False,
        "cta_label": "Add",
    },
    "checked_bag_20kg": {
        "product_id": "checked_bag_20kg",
        "title": "20kg Checked Bag",
        "description": "Up to 119 \u00d7 119 \u00d7 81cm hold luggage for this flight",
        "price_label": "\u20ac39.99",
        "price_eur": 39.99,
        "selected": False,
        "cta_label": "Add",
    },
    "reserved_seats": {
        "product_id": "reserved_seats",
        "title": "Sit together (Row 12)",
        "description": "4 contiguous seats in Row 12 (12A\u201312D)",
        "price_label": "\u20ac24.00 total",
        "price_eur": 24.00,
        "selected": False,
        "cta_label": "Add",
    },
    "priority_boarding": {
        "product_id": "priority_boarding",
        "title": "Priority & 2 Cabin Bags",
        "description": "Board first with 10kg wheelie + small personal bag each",
        "price_label": "\u20ac76.00 total",
        "price_eur": 76.00,
        "selected": False,
        "cta_label": "Add",
    },
}


class CheckinFlowService:
    """Manages dynamic check-in sessions, basket mutations, and Screen 10 analytics."""

    def __init__(
        self,
        *,
        telemetry: TelemetryEmitter = default_telemetry,
        orchestrator: ADKOrchestrator | None = None,
    ) -> None:
        self.telemetry = telemetry
        self.orchestrator = orchestrator
        self._sessions: dict[str, dict[str, Any]] = {}
        self._counters: dict[str, Any] = {
            "total_sessions_created": 0,
            "zero_offer_sessions": 0,
            "two_step_sessions": 0,
            "checkouts_completed": 0,
            "total_ancillary_revenue_eur": 0.0,
            "offers_shown_by_id": {
                "priority_boarding": 142,
                "reserved_seats": 138,
                "checked_bag_20kg": 119,
                "car_hire": 84,
            },
            "offers_accepted_by_id": {
                "priority_boarding": 68,
                "reserved_seats": 52,
                "checked_bag_20kg": 39,
                "car_hire": 7,
            },
        }

    def list_personas(self) -> list[dict[str, Any]]:
        """Return available persona presets for live switching."""
        return [deepcopy(profile) for profile in PERSONA_PROFILES.values()]

    def create_session(
        self,
        *,
        persona_id: str = "marta_byrne",
        signal_overrides: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Initialize a check-in session, score ancillaries, build pages, and validate schema."""
        start_ns = time.perf_counter_ns()
        session_id = str(uuid.uuid4())
        signals = resolve_signals(persona_id=persona_id, signal_overrides=signal_overrides)
        effective_persona = str(signals.get("persona_id", persona_id))
        if effective_persona not in PERSONA_PROFILES:
            effective_persona = "marta_byrne"

        context = ExecutionContext(session_id=session_id)
        evaluated = rank_and_filter_ancillaries(
            signals=signals,
            declined_product_ids=[],
            context=context,
            telemetry=self.telemetry,
        )

        pages = self._assemble_pages(
            evaluated=evaluated,
            signals=signals,
            selected_quantities={},
            context=context,
        )

        booking = deepcopy(CANONICAL_BOOKING)
        booking["trip_nights"] = int(signals.get("trip_nights", 7))
        passengers = deepcopy(CANONICAL_PASSENGERS)

        if len(pages) == 0:
            flow_branch = "zero_offer"
            total_steps = 1
            entry_step_pill = "1 STEP"
            zero_panel = synthesize_assistant_panel(
                screen_key="zero_offer",
                signals=signals,
                context=context,
                orchestrator=self.orchestrator,
                telemetry=self.telemetry,
            )
            self._counters["zero_offer_sessions"] += 1
        else:
            flow_branch = "dynamic_offers"
            total_steps = len(pages)
            entry_step_pill = (
                "2 STEPS TO YOUR BOARDING PASSES"
                if total_steps == 2
                else "1 STEP TO YOUR BOARDING PASSES"
            )
            zero_panel = None
            if total_steps == 2:
                self._counters["two_step_sessions"] += 1
            for page in pages:
                for card in page["cards"]:
                    pid = card["product_id"]
                    self._counters["offers_shown_by_id"][pid] = (
                        self._counters["offers_shown_by_id"].get(pid, 0) + 1
                    )
                for drawer_item in page["drawer_items"]:
                    pid = drawer_item["product_id"]
                    self._counters["offers_shown_by_id"][pid] = (
                        self._counters["offers_shown_by_id"].get(pid, 0) + 1
                    )

        elapsed_ms = round((time.perf_counter_ns() - start_ns) / 1_000_000, 2)
        response_payload: dict[str, Any] = {
            "schema_version": "1.0.0",
            "session_id": session_id,
            "persona_id": effective_persona,
            "flow_branch": flow_branch,
            "total_steps": total_steps,
            "entry_step_pill": entry_step_pill,
            "current_screen": "checkin_start",
            "booking": booking,
            "passengers": passengers,
            "ranked_ancillaries": evaluated,
            "pages": pages,
            "declined_product_ids": [],
            "basket_total_eur": 0.0,
            "latency_ms": elapsed_ms,
        }
        if zero_panel is not None:
            response_payload["zero_offer_panel"] = zero_panel

        validate_against_contract(response_payload, "checkin_flow.jsons")

        self._sessions[session_id] = {
            "context": context,
            "signals": signals,
            "selected_quantities": {},
            "declined_product_ids": [],
            "payment_confirmed": False,
            "boarding_passes": [],
            "response": response_payload,
        }
        self._counters["total_sessions_created"] += 1

        self.telemetry.emit(
            context=context,
            operation_name="execute_skill",
            message=f"Built check-in flow ({flow_branch}, {total_steps} steps) in {elapsed_ms}ms.",
            skill_id=SKILL_ID,
            skill_version=SKILL_VERSION,
            inputs={"persona_id": effective_persona},
            outputs={
                "flow_branch": flow_branch,
                "total_steps": total_steps,
                "page_count": len(pages),
                "latency_ms": elapsed_ms,
            },
        )
        return deepcopy(response_payload)

    def get_session(self, session_id: str) -> dict[str, Any]:
        """Return the current CheckinSessionResponse for a session_id."""
        state = self._require_session(session_id)
        return deepcopy(state["response"])

    def assist_session(self, session_id: str, query: str) -> dict[str, Any]:
        """Answer a Help Hub trip question grounded in the session's live booking and basket."""
        state = self._require_session(session_id)
        return answer_trip_question(
            query=query,
            session_state=state,
            context=state["context"],
            orchestrator=self.orchestrator,
            telemetry=self.telemetry,
        )

    def get_seat_map(self, session_id: str) -> dict[str, Any]:
        """Generate the Boeing 737 seat map for Screen F."""
        state = self._require_session(session_id)
        state["response"]["current_screen"] = "seat_map"
        return build_seat_map(
            session_id=session_id,
            passengers=state["response"]["passengers"],
            context=state["context"],
            telemetry=self.telemetry,
        )

    def confirm_seats(
        self,
        session_id: str,
        seat_designators: list[str] | None = None,
    ) -> dict[str, Any]:
        """Confirm Row 12 seats (12A-12D) and advance directly to Offer Page 2 (Screen B)."""
        state = self._require_session(session_id)
        seats = seat_designators or ["12A", "12B", "12C", "12D"]
        if any(s.startswith("14") for s in seats):
            raise ValueError("Row 14 seats are prohibited by the Stitch Consistency Contract.")

        state["selected_quantities"]["reserved_seats"] = 1
        self._counters["offers_accepted_by_id"]["reserved_seats"] = (
            self._counters["offers_accepted_by_id"].get("reserved_seats", 0) + 1
        )

        # Trap #1 rule: Confirm seats on Screen F goes directly to Offer Page 2, never Offer Page 1
        next_screen = (
            "offer_page_2"
            if len(state["response"]["pages"]) >= 2
            else "review_and_pay"
        )
        return self._build_mutation_response(
            state=state,
            current_screen="seat_map",
            next_screen=next_screen,
        )

    def apply_action(
        self,
        *,
        session_id: str,
        action: str,
        current_screen: str = "offer_page_1",
        product_id: str | None = None,
        quantity: int | None = None,
    ) -> dict[str, Any]:
        """Process add, update_quantity, decline_page, remove_item, or navigate_back."""
        state = self._require_session(session_id)
        selected = state["selected_quantities"]
        declined: list[str] = state["declined_product_ids"]
        pages: list[dict[str, Any]] = state["response"]["pages"]

        if action == "add" and product_id:
            if product_id not in declined:
                selected[product_id] = max(1, int(quantity or 1))
                self._counters["offers_accepted_by_id"][product_id] = (
                    self._counters["offers_accepted_by_id"].get(product_id, 0) + 1
                )
        elif action == "update_quantity" and product_id:
            new_qty = max(0, int(quantity or 0))
            if new_qty == 0:
                selected.pop(product_id, None)
            else:
                selected[product_id] = new_qty
        elif action == "remove_item" and product_id:
            selected.pop(product_id, None)
        elif action == "decline_page":
            for page in pages:
                if page["screen_id"] == current_screen:
                    for card in page["cards"]:
                        cid = card["product_id"]
                        if selected.get(cid, 0) == 0 and cid not in declined:
                            declined.append(cid)

        next_screen = self._compute_next_screen(
            current_screen=current_screen,
            action=action,
            pages=pages,
            selected_quantities=selected,
        )
        return self._build_mutation_response(
            state=state,
            current_screen=current_screen,
            next_screen=next_screen,
        )

    def checkout(self, session_id: str) -> dict[str, Any]:
        """Confirm payment on saved Visa 4412 and issue 4 boarding passes (Screen G)."""
        state = self._require_session(session_id)
        basket = build_basket_state(state["selected_quantities"])
        passes = issue_boarding_passes(
            passengers=state["response"]["passengers"],
            selected_quantities=state["selected_quantities"],
            context=state["context"],
            telemetry=self.telemetry,
        )
        state["payment_confirmed"] = True
        state["boarding_passes"] = passes
        state["response"]["current_screen"] = "boarding_passes"
        state["response"]["basket_total_eur"] = basket["total_eur"]

        self._counters["checkouts_completed"] += 1
        self._counters["total_ancillary_revenue_eur"] = round(
            self._counters["total_ancillary_revenue_eur"] + basket["total_eur"], 2
        )

        payload: dict[str, Any] = {
            "schema_version": "1.0.0",
            "session_id": session_id,
            "current_screen": "review_and_pay" if basket["total_eur"] > 0 else "zero_offer",
            "next_screen": "boarding_passes",
            "step_indicator": None,
            "basket": basket,
            "declined_product_ids": list(state["declined_product_ids"]),
            "payment_confirmed": True,
            "boarding_passes": passes,
        }
        validate_against_contract(payload, "basket_checkout.jsons")
        return payload

    def get_analytics_summary(self) -> dict[str, Any]:
        """Return Screen 10 internal analytics and model feedback loop metrics."""
        shown = self._counters["offers_shown_by_id"]
        accepted = self._counters["offers_accepted_by_id"]
        payload: dict[str, Any] = {
            "schema_version": "1.0.0",
            "kpi_tiles": [
                {
                    "kpi_id": "ancillary_conversion",
                    "label": "Ancillary conversion",
                    "value": "24.1%",
                    "delta_label": "+6.3 pts vs static flow",
                    "direction": "up_good",
                },
                {
                    "kpi_id": "pages_per_checkin",
                    "label": "Pages per check-in",
                    "value": "1.8",
                    "delta_label": "Down from 4.6",
                    "direction": "down_good",
                },
                {
                    "kpi_id": "median_time_to_pass",
                    "label": "Median time to boarding pass",
                    "value": "71s",
                    "delta_label": "Down from 2m 14s",
                    "direction": "down_good",
                },
                {
                    "kpi_id": "offers_shown_per_pax",
                    "label": "Offers shown per passenger",
                    "value": "2.4",
                    "delta_label": "Down from 8.0",
                    "direction": "down_good",
                },
            ],
            "takeup_by_ancillary": [
                {
                    "product_id": "priority_boarding",
                    "title": "Priority & 2 Cabin Bags",
                    "dynamic_conversion_pct": 47.9,
                    "static_baseline_pct": 38.2,
                },
                {
                    "product_id": "reserved_seats",
                    "title": "Reserved seats \u00d7 4",
                    "dynamic_conversion_pct": 37.7,
                    "static_baseline_pct": 26.4,
                },
                {
                    "product_id": "checked_bag_20kg",
                    "title": "20kg checked bag",
                    "dynamic_conversion_pct": 32.8,
                    "static_baseline_pct": 21.0,
                },
                {
                    "product_id": "car_hire",
                    "title": "Car hire (Drawer)",
                    "dynamic_conversion_pct": 8.3,
                    "static_baseline_pct": 6.1,
                },
            ],
            "top_ranked_offers": [
                {
                    "rank": 1,
                    "product_id": "priority_boarding",
                    "title": "Priority & 2 Cabin Bags",
                    "mean_score": 0.84,
                    "placement_rule": "Page 1 \u00b7 Primary Card",
                    "offers_shown": shown.get("priority_boarding", 0),
                    "offers_accepted": accepted.get("priority_boarding", 0),
                },
                {
                    "rank": 2,
                    "product_id": "reserved_seats",
                    "title": "Reserved seats \u00d7 4 (together)",
                    "mean_score": 0.71,
                    "placement_rule": "Page 1 \u00b7 Primary Card",
                    "offers_shown": shown.get("reserved_seats", 0),
                    "offers_accepted": accepted.get("reserved_seats", 0),
                },
                {
                    "rank": 3,
                    "product_id": "checked_bag_20kg",
                    "title": "20kg checked bag",
                    "mean_score": 0.58,
                    "placement_rule": "Page 2 \u00b7 Primary Card",
                    "offers_shown": shown.get("checked_bag_20kg", 0),
                    "offers_accepted": accepted.get("checked_bag_20kg", 0),
                },
                {
                    "rank": 4,
                    "product_id": "car_hire",
                    "title": "Car hire in Faro",
                    "mean_score": 0.29,
                    "placement_rule": "Page 2 \u00b7 Collapsed Drawer",
                    "offers_shown": shown.get("car_hire", 0),
                    "offers_accepted": accepted.get("car_hire", 0),
                },
            ],
            "live_session_counters": {
                "total_sessions_created": self._counters["total_sessions_created"],
                "zero_offer_sessions": self._counters["zero_offer_sessions"],
                "two_step_sessions": self._counters["two_step_sessions"],
                "checkouts_completed": self._counters["checkouts_completed"],
                "total_ancillary_revenue_eur": self._counters["total_ancillary_revenue_eur"],
            },
        }
        validate_against_contract(payload, "analytics_summary.jsons")
        return payload

    def _assemble_pages(
        self,
        *,
        evaluated: list[dict[str, Any]],
        signals: dict[str, Any],
        selected_quantities: dict[str, int],
        context: ExecutionContext,
    ) -> list[dict[str, Any]]:
        """Pack primary cards (score >= 0.50) and drawer items (0.10 <= score < 0.50) into 0-2 pages."""
        primary_items = [item for item in evaluated if item["placement"] == "primary_card"]
        drawer_items = [item for item in evaluated if item["placement"] == "drawer"]

        if not primary_items:
            return []

        page1_items = primary_items[:2]
        page2_items = primary_items[2:4]
        total_pages = 2 if page2_items else 1
        pages: list[dict[str, Any]] = []

        # Build Offer Page 1
        p1_cards = [self._hydrate_card(item["product_id"], selected_quantities) for item in page1_items]
        p1_drawers = (
            [self._hydrate_drawer(item["product_id"], selected_quantities) for item in drawer_items]
            if total_pages == 1
            else []
        )
        pages.append(
            {
                "page_number": 1,
                "screen_id": "offer_page_1",
                "header_title": "Check in",
                "step_indicator": f"Step 1 of {total_pages}",
                "section_heading": None,
                "assistant_panel": synthesize_assistant_panel(
                    screen_key="offer_page_1",
                    signals=signals,
                    context=context,
                    orchestrator=self.orchestrator,
                    telemetry=self.telemetry,
                ),
                "cards": p1_cards,
                "drawer_label": f"More extras ({len(p1_drawers)})" if p1_drawers else None,
                "drawer_collapsed_by_default": True,
                "drawer_items": p1_drawers,
                "decline_cta_label": "No thanks, continue \u2192",
            }
        )

        # Build Offer Page 2 when a 3rd primary card (such as 20kg checked bag) qualifies
        if page2_items:
            p2_cards = [self._hydrate_card(item["product_id"], selected_quantities) for item in page2_items]
            p2_drawers = [
                self._hydrate_drawer(item["product_id"], selected_quantities) for item in drawer_items
            ]
            pages.append(
                {
                    "page_number": 2,
                    "screen_id": "offer_page_2",
                    "header_title": "Check in",
                    "step_indicator": "Step 2 of 2",
                    "section_heading": "Anything in the hold?",
                    "assistant_panel": synthesize_assistant_panel(
                        screen_key="offer_page_2",
                        signals=signals,
                        context=context,
                        orchestrator=self.orchestrator,
                        telemetry=self.telemetry,
                    ),
                    "cards": p2_cards,
                    "drawer_label": f"More extras ({len(p2_drawers)})" if p2_drawers else None,
                    "drawer_collapsed_by_default": True,
                    "drawer_items": p2_drawers,
                    "decline_cta_label": "No thanks, continue \u2192",
                }
            )

        return pages

    @staticmethod
    def _hydrate_card(product_id: str, selected_quantities: dict[str, int]) -> dict[str, Any]:
        """Populate an OfferCard starting unselected (0/False) unless mutated in session."""
        card = deepcopy(CARD_TEMPLATES[product_id])
        qty = int(selected_quantities.get(product_id, 0))
        card["quantity"] = qty
        card["selected"] = qty > 0
        return card

    @staticmethod
    def _hydrate_drawer(product_id: str, selected_quantities: dict[str, int]) -> dict[str, Any]:
        """Populate a DrawerItem starting unselected unless mutated in session."""
        drawer = deepcopy(DRAWER_TEMPLATES[product_id])
        drawer["selected"] = int(selected_quantities.get(product_id, 0)) > 0
        return drawer

    @staticmethod
    def _compute_next_screen(
        *,
        current_screen: str,
        action: str,
        pages: list[dict[str, Any]],
        selected_quantities: dict[str, int],
    ) -> str:
        """Enforce Stitch Flow Map forward and backward navigation rules."""
        has_basket = any(qty > 0 for qty in selected_quantities.values())

        if action == "navigate_back":
            if current_screen == "offer_page_2":
                # Trap #2 rule: Back arrow on Offer Page 2 always returns to Offer Page 1, never Seat Map
                return "offer_page_1"
            if current_screen == "seat_map":
                return "offer_page_1"
            if current_screen == "review_and_pay":
                return "offer_page_2" if len(pages) >= 2 else "offer_page_1"
            return "checkin_start"

        if current_screen == "checkin_start":
            return "offer_page_1" if pages else "zero_offer"

        if current_screen == "offer_page_1":
            if len(pages) >= 2:
                return "offer_page_2"
            return "review_and_pay" if has_basket else "boarding_passes"

        if current_screen == "offer_page_2":
            # Empty basket skips Review & Pay and goes straight to Boarding Passes
            return "review_and_pay" if has_basket else "boarding_passes"

        if current_screen == "review_and_pay":
            return "review_and_pay" if has_basket else "boarding_passes"

        if current_screen == "zero_offer":
            return "boarding_passes"

        return "boarding_passes"

    def _build_mutation_response(
        self,
        *,
        state: dict[str, Any],
        current_screen: str,
        next_screen: str,
    ) -> dict[str, Any]:
        """Construct and validate a BasketMutationResponse payload."""
        basket = build_basket_state(state["selected_quantities"])
        state["response"]["current_screen"] = next_screen
        state["response"]["basket_total_eur"] = basket["total_eur"]
        state["response"]["declined_product_ids"] = list(state["declined_product_ids"])

        # Refresh card and drawer selection states inside pages
        for page in state["response"]["pages"]:
            for card in page["cards"]:
                qty = int(state["selected_quantities"].get(card["product_id"], 0))
                card["quantity"] = qty
                card["selected"] = qty > 0
            for drawer in page["drawer_items"]:
                drawer["selected"] = int(state["selected_quantities"].get(drawer["product_id"], 0)) > 0

        total_pages = len(state["response"]["pages"])
        if next_screen == "offer_page_1":
            step_indicator: str | None = f"Step 1 of {total_pages}"
        elif next_screen == "offer_page_2":
            step_indicator = "Step 2 of 2"
        else:
            # Step-Numbering Rule: only offer pages carry a step number
            step_indicator = None

        passes = (
            issue_boarding_passes(
                passengers=state["response"]["passengers"],
                selected_quantities=state["selected_quantities"],
                context=state["context"],
                telemetry=self.telemetry,
            )
            if next_screen == "boarding_passes"
            else state["boarding_passes"]
        )

        payload: dict[str, Any] = {
            "schema_version": "1.0.0",
            "session_id": state["response"]["session_id"],
            "current_screen": current_screen,
            "next_screen": next_screen,
            "step_indicator": step_indicator,
            "basket": basket,
            "declined_product_ids": list(state["declined_product_ids"]),
            "payment_confirmed": bool(state["payment_confirmed"]),
            "boarding_passes": passes,
        }
        validate_against_contract(payload, "basket_checkout.jsons")
        return payload

    def _require_session(self, session_id: str) -> dict[str, Any]:
        if session_id not in self._sessions:
            raise KeyError(f"Unknown session_id: {session_id}")
        return self._sessions[session_id]
