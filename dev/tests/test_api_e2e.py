"""End-to-end FastAPI, state machine, latency SLA, and telemetry verification tests."""

from __future__ import annotations

import json
from pathlib import Path

from fastapi.testclient import TestClient

from dev.core.app import create_app
from dev.core.models import RESULTS_DIR, validate_against_contract
from dev.core.telemetry import TelemetryEmitter
from dev.skills.page_builder.skill import CheckinFlowService


def test_full_marta_byrne_two_step_journey_and_golden_telemetry(tmp_path: Path) -> None:
    """Walk the complete Marta Byrne 2-step journey and write golden traces to results/."""
    trace_log = RESULTS_DIR / "telemetry_traces.jsonl"
    try:
        trace_log.parent.mkdir(parents=True, exist_ok=True)
        with trace_log.open("a", encoding="utf-8"):
            pass
    except OSError:
        trace_log = tmp_path / "telemetry_traces.jsonl"
    telemetry = TelemetryEmitter(log_path=trace_log)
    service = CheckinFlowService(telemetry=telemetry)
    client = TestClient(create_app(service=service))

    # 1. Health & Personas
    health = client.get("/api/v1/health")
    assert health.status_code == 200
    assert health.json()["status"] == "ok"

    personas = client.get("/api/v1/checkin/personas")
    assert personas.status_code == 200
    assert len(personas.json()["personas"]) >= 3

    # 2. Screen E -> Initialize Marta Byrne session (must complete in <= 300ms)
    create_res = client.post("/api/v1/checkin/sessions", json={"persona_id": "marta_byrne"})
    assert create_res.status_code == 200
    session = create_res.json()
    validate_against_contract(session, "checkin_flow.jsons")

    session_id = session["session_id"]
    assert session["flow_branch"] == "dynamic_offers"
    assert session["total_steps"] == 2
    assert session["entry_step_pill"] == "2 STEPS TO YOUR BOARDING PASSES"
    assert session["latency_ms"] <= 300.0
    assert len(session["pages"]) == 2
    assert session["pages"][0]["step_indicator"] == "Step 1 of 2"
    assert session["pages"][1]["step_indicator"] == "Step 2 of 2"
    assert session["pages"][1]["drawer_label"] == "More extras (1)"

    # Verify Zero-Preselection Rule: all cards start unselected and quantity 0
    for page in session["pages"]:
        for card in page["cards"]:
            assert card["selected"] is False
            assert card["quantity"] == 0

    # 3. Screen A -> Add Priority Boarding (EUR 76.00)
    add_priority = client.post(
        f"/api/v1/checkin/sessions/{session_id}/actions",
        json={
            "action": "add",
            "current_screen": "offer_page_1",
            "product_id": "priority_boarding",
            "quantity": 1,
        },
    )
    assert add_priority.status_code == 200
    assert add_priority.json()["basket"]["total_eur"] == 76.00

    # 4. Screen F -> Open Seat Map and Confirm Row 12 (12A-12D, EUR 24.00)
    seat_map_res = client.get(f"/api/v1/checkin/sessions/{session_id}/seat-map")
    assert seat_map_res.status_code == 200
    validate_against_contract(seat_map_res.json(), "seat_map.jsons")

    confirm_seats = client.post(
        f"/api/v1/checkin/sessions/{session_id}/seats",
        json={"seat_designators": ["12A", "12B", "12C", "12D"]},
    )
    assert confirm_seats.status_code == 200
    seats_payload = confirm_seats.json()
    # Trap #1 check: Confirm seats goes directly to Offer Page 2, never Offer Page 1
    assert seats_payload["next_screen"] == "offer_page_2"
    assert seats_payload["step_indicator"] == "Step 2 of 2"
    assert seats_payload["basket"]["total_eur"] == 100.00

    # Trap #2 check: Back arrow on Offer Page 2 goes to Offer Page 1, never Seat Map
    back_res = client.post(
        f"/api/v1/checkin/sessions/{session_id}/actions",
        json={"action": "navigate_back", "current_screen": "offer_page_2"},
    )
    assert back_res.status_code == 200
    assert back_res.json()["next_screen"] == "offer_page_1"

    # 5. Screen B -> Add 20kg Checked Bag (EUR 39.99) -> Total EUR 139.99 -> Review & Pay
    add_bag = client.post(
        f"/api/v1/checkin/sessions/{session_id}/actions",
        json={
            "action": "add",
            "current_screen": "offer_page_2",
            "product_id": "checked_bag_20kg",
            "quantity": 1,
        },
    )
    assert add_bag.status_code == 200
    bag_payload = add_bag.json()
    assert bag_payload["next_screen"] == "review_and_pay"
    assert bag_payload["step_indicator"] is None
    assert bag_payload["basket"]["total_eur"] == 139.99
    assert bag_payload["basket"]["formatted_total"] == "\u20ac139.99"
    assert bag_payload["basket"]["saved_payment_method"] == "Visa ending 4412"

    # 6. Screen D -> Checkout -> Screen G Boarding Passes
    checkout_res = client.post(
        f"/api/v1/checkin/sessions/{session_id}/checkout",
        json={"payment_method_token": "visa_4412"},
    )
    assert checkout_res.status_code == 200
    checkout_payload = checkout_res.json()
    validate_against_contract(checkout_payload, "basket_checkout.jsons")
    assert checkout_payload["payment_confirmed"] is True
    assert checkout_payload["next_screen"] == "boarding_passes"
    assert len(checkout_payload["boarding_passes"]) == 4
    marta_pass = checkout_payload["boarding_passes"][0]
    assert marta_pass["passenger_name"] == "Marta Byrne"
    assert marta_pass["seat"] == "12A"
    assert marta_pass["badges"] == ["PRIORITY", "12A"]

    # 7. Screen 10 -> Analytics Summary
    analytics_res = client.get("/api/v1/analytics/summary")
    assert analytics_res.status_code == 200
    validate_against_contract(analytics_res.json(), "analytics_summary.jsons")

    # 8. Verify every telemetry record in results/telemetry_traces.jsonl validates against contract
    assert trace_log.exists()
    lines = [line for line in trace_log.read_text(encoding="utf-8").splitlines() if line.strip()]
    assert len(lines) >= 6
    for line in lines:
        record = json.loads(line)
        validate_against_contract(record, "telemetry.jsons")


def test_zero_offer_and_decline_skip_paths(tmp_path: Path) -> None:
    """Verify Zero-Offer 1-step branch and empty-basket Review & Pay skip."""
    telemetry = TelemetryEmitter(log_path=tmp_path / "traces.jsonl")
    service = CheckinFlowService(telemetry=telemetry)
    client = TestClient(create_app(service=service))

    # Zero-offer branch
    zero_res = client.post("/api/v1/checkin/sessions", json={"persona_id": "zero_offer"})
    assert zero_res.status_code == 200
    zero_session = zero_res.json()
    assert zero_session["flow_branch"] == "zero_offer"
    assert zero_session["total_steps"] == 1
    assert zero_session["entry_step_pill"] == "1 STEP"
    assert zero_session["pages"] == []
    assert zero_session["zero_offer_panel"]["heading"] == "You're all set"

    # Decline both offer pages -> skips Review & Pay and goes straight to Boarding Passes
    marta_res = client.post("/api/v1/checkin/sessions", json={"persona_id": "marta_byrne"})
    sid = marta_res.json()["session_id"]

    decline_p1 = client.post(
        f"/api/v1/checkin/sessions/{sid}/actions",
        json={"action": "decline_page", "current_screen": "offer_page_1"},
    )
    assert decline_p1.status_code == 200
    assert decline_p1.json()["next_screen"] == "offer_page_2"
    assert "priority_boarding" in decline_p1.json()["declined_product_ids"]

    decline_p2 = client.post(
        f"/api/v1/checkin/sessions/{sid}/actions",
        json={"action": "decline_page", "current_screen": "offer_page_2"},
    )
    assert decline_p2.status_code == 200
    assert decline_p2.json()["next_screen"] == "boarding_passes"
    assert len(decline_p2.json()["boarding_passes"]) == 4


def test_frontend_ui_serving_and_stitch_sanitization(tmp_path: Path) -> None:
    """Verify the Single-Page App shell and sanitized Stitch screens are served cleanly."""
    telemetry = TelemetryEmitter(log_path=tmp_path / "ui_traces.jsonl")
    service = CheckinFlowService(telemetry=telemetry)
    client = TestClient(create_app(service=service))

    root_res = client.get("/")
    assert root_res.status_code == 200
    assert "Dynamic Ancillary Flows" in root_res.text
    assert "/ui/app.js" in root_res.text

    app_js_res = client.get("/ui/app.js")
    assert app_js_res.status_code == 200
    js_body = app_js_res.text

    # Sanitization invariants from Stitch HTML review:
    # 1. No dark-pattern countdown timer from Screen F
    assert "09:42" not in js_body
    # 2. No Seat 14A contradiction on Screen C
    assert "Seat 14A" not in js_body
    # 3. Screen E children have explicit 6y and 9y age badges
    assert "Child (6y)" in js_body
    assert "Child (9y)" in js_body
    # 4. Screen B travel insurance clarifies per-flight coverage and omits free-cancellation line
    assert "for this flight" in js_body
    assert "Full refund if you need to cancel" not in js_body

