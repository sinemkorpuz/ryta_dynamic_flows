# ADK & Backend API Specification: Dynamic Check-in Engine (`adk` Track)

**Author:** Lead Engineer, Agentic Co-Engineer (`adk` Track)
**Reviewers:** Engineering Architecture, Frontend Track Lead
**Status:** Approved (Gate 1: Specify)
**Last Updated:** 2026-10-06

---

## 1. Overview

This specification defines the backend architecture for the **`adk` track** of **Ryanair Dynamic Ancillary Flows (`ryta`)**. It governs the FastAPI service layer (`dev/core/`), deterministic domain tools (`dev/tools/`), declarative skills (`dev/skills/`), Google Agent Development Kit (**ADK**) orchestration, and telemetry emission (`contracts/telemetry.jsons`).

At check-in initiation, the backend scores 8 candidate ancillaries against passenger and itinerary signals, strips ineligible or suppressed offers via deterministic rules, packs surviving offers into 0 to 2 pages, and invokes an ADK agent (`gemini-3.8-flash`) with a 220ms circuit-breaker fallback to generate first-person assistant insight copy. The API exposes REST endpoints to drive all 7 mobile screens (`Screens E, A, F, B, D, C, G`) plus the internal analytics dashboard (`Screen 10`).

---

## 2. Context & Track Boundaries

Per Operating Rule 3 in [`AGENTS.md`](../../AGENTS.md), `dev/core/` must remain strictly domain-agnostic. All airline scoring formulas, route eligibility rules, child seat allocation logic, euro pricing constants, and assistant copy templates reside inside `dev/tools/` and `dev/skills/`.

### 2.1 Backend Directory Structure

The `adk` track owns the following implementation modules under `dev/` and schema definitions under `contracts/`:

```
project-root/
├── contracts/
│   ├── telemetry.jsons               # Frozen execution telemetry schema (v1.0.0)
│   ├── checkin_flow.jsons            # Session init, signal overrides, and dynamic offer pages
│   ├── seat_map.jsons                # Boeing 737 cabin layout, child rules, and row 12 block
│   ├── basket_checkout.jsons         # Basket mutations, payment, and boarding pass issuance
│   ├── assist_query.jsons            # Screen E Help Hub ADK query, guardrails, and tool trace
│   └── analytics_summary.jsons       # Screen 10 model feedback loop KPIs and offer table
│
└── dev/
    ├── core/                         # DOMAIN-AGNOSTIC RUNTIME ENGINE
    │   ├── app.py                    # FastAPI app factory, CORS, exception handlers, routing
    │   ├── orchestrator.py           # ADK Runner wrapper, 220ms LLM circuit breaker, session store
    │   ├── telemetry.py              # OpenTelemetry & JSONL trace emitter (validates telemetry.jsons)
    │   └── models.py                 # Shared base Pydantic v2 envelope and trace context models
    │
    ├── tools/                        # DETERMINISTIC DOMAIN TOOLS (Stateless, < 10ms)
    │   ├── propensity_scorer.py      # Scores 8 ancillaries [0.00, 1.00] from pax/trip signals
    │   ├── eligibility_rules.py      # Applies 48h cutoff, route availability, decline suppression, floor
    │   ├── seat_allocator.py         # Generates B737 seat map, allocates 12A-12D, enforces child rules
    │   └── basket_pricing.py         # Calculates exact euro line items, totals, and pass badges
    │
    ├── skills/                       # DECLARATIVE ADK SKILLS
    │   ├── ancillary_ranking/        # Orchestrates scoring + eligibility filtering pipeline
    │   │   ├── SKILL.md
    │   │   └── skill.py
    │   ├── page_builder/             # Packs ranked offers into 0-2 pages + drawer demotion
    │   │   ├── SKILL.md
    │   │   └── skill.py
    │   └── assistant_copy/           # ADK Gemini Flash first-person copy + guardrails + templates
    │       ├── SKILL.md
    │       └── skill.py
    │
    └── tests/                        # AUTOMATED VERIFICATION SUITE
        ├── test_contracts.py         # Validates all payloads against contracts/*.jsons
        ├── test_scoring_and_rules.py # Verifies Marta Byrne & Zero-Offer invariants
        ├── test_seat_allocator.py    # Verifies Row 12 allocation, child rules, and no Row 14
        └── test_api_e2e.py           # End-to-end FastAPI + telemetry trace verification
```

---

## 3. Goals & Non-Goals

### 3.1 Goals

* **Deterministic Scoring & Rule Safety:** Guarantee 100% reproducible propensity scores, euro prices (`€76.00`, `€24.00`, `€39.99`, `€139.99`), and eligibility filtering for the canonical Marta Byrne persona while supporting dynamic recalculation when input signals are overridden.
* **Sub-300ms API SLA:** Complete session initialization (`POST /api/v1/checkin/sessions`) in p95 ≤ 300ms using a 220ms timeout around ADK `gemini-3.8-flash` copy synthesis.
* **Full State-Machine Enforcement:** Enforce all navigation and session invariants on the server, including session-scoped decline suppression, empty-basket checkout bypass, and Seat Map → Offer Page 2 forward routing.
* **100% Telemetry Compliance:** Emit a valid [`contracts/telemetry.jsons`](../../contracts/telemetry.jsons) event for every skill and tool execution and persist traces to `results/`.

### 3.2 Non-Goals

* **External Payment Gateway Integration:** Payment confirmation simulates authorization against the saved fixture card (`Visa ending 4412`) without calling external PCI networks.
* **Persistent Database Storage:** Session state is maintained in an in-memory concurrency-safe store backed by JSONL trace dumps in `results/`, avoiding external database setup overhead during prototyping.

---

## 4. Detailed Design: Scoring, Rules, Page Builder, and ADK Copy

### 4.1 Candidate Ancillary Catalog & Propensity Scorer (`dev/tools/propensity_scorer.py`)

The propensity scorer evaluates all 8 ancillaries in the airline catalog. For the canonical `marta_byrne` persona (`DUB → FAO`, 7 nights, 2 adults + 2 children ages 6 and 9, Value fare, Priority purchased on 3 of last 4 trips, 6 prior insurance declines), the tool produces the exact scores and drivers defined in [`../scratchpad/stitch/ryanair-dynamic-flows-stitch-brief.md`](../scratchpad/stitch/ryanair-dynamic-flows-stitch-brief.md):

| Rank | Product ID | Display Title | Base Score (Marta) | Pricing Model & Canonical Price | Top Driver Explanation |
|---|---|---|---|---|---|
| **1** | `priority_boarding` | `Priority & 2 Cabin Bags` | `0.84` | `€19.00` × 4 pax = **`€76.00`** (all-pax toggle + `"Choose who"` link) | `Repeat purchase, 3 of last 4 trips` |
| **2** | `reserved_seats` | `Sit together` | `0.71` | `€6.00` × 4 seats = **`€24.00`** (`12A`, `12B`, `12C`, `12D`) | `Pax mix: 2 children, no seats held` |
| **3** | `checked_bag_20kg` | `20kg Checked Bag` | `0.58` | **`€39.99`** per bag (outbound only, stepper starting at `0`) | `Trip length 7 nights, family of 4` |
| **4** | `car_hire` | `Car hire in Faro` | `0.29` | From **`€28.00/day`** (collapsed into `"More extras (1)"` drawer) | `Route FAO, leisure — but never purchased` |
| **5** | `fast_track` | `Fast Track security` | `0.14` | `€7.00` × 4 pax = `€28.00` | `Low historical affinity` |
| **6** | `travel_insurance` | `Travel insurance` | `0.11` | `€16.00` × 4 pax = `€64.00` | `Never purchased, 6 prior declines` |
| **7** | `airport_transfer` | `Airport transfer` | `0.08` | `€20.00` total | `Below display floor` |
| **8** | `flexi_upgrade` | `Flexi fare upgrade` | `0.04` | `€90.00` total | `Inside 48h check-in window` |

#### Live Signal Override Adjustments

When a client passes `signal_overrides` in `POST /api/v1/checkin/sessions`, `propensity_scorer.py` computes dynamic scores using deterministic clamped feature weights (`[0.00, 0.99]`):

* **`priority_boarding`:** Base `0.24 + 0.20 × min(prior_priority_trips, 3)` (yields `0.84` when `prior_priority_trips == 3`; drops to `0.24` when `0`). If `already_has_priority == True`, product is marked ineligible.
* **`reserved_seats`:** Base `0.35 + 0.18 × min(children_count, 2)` when `seats_already_allocated == False` (yields `0.71` for 2 children; `0.35` for adults without children). If `seats_already_allocated == True`, product is marked ineligible.
* **`checked_bag_20kg`:** Base `0.16 + 0.04 × min(trip_nights, 7) + 0.035 × passenger_count` (yields `0.16 + 0.28 + 0.14 = 0.58` for 7 nights and 4 passengers). If `bags_already_booked >= 2`, product is marked ineligible.
* **`car_hire`:** Base `0.29` on leisure routes (`route_type == "leisure"`), `0.12` on city/business routes.

### 4.2 Hard Business & Suppression Rules (`dev/tools/eligibility_rules.py`)

After propensity scoring, `eligibility_rules.py` evaluates four sequential removal gates. Any offer matching a gate is stripped from the active flow and recorded in the session audit log with its exact removal reason:

| Rule Code | Condition | Canonical Effect on Marta Byrne Journey |
|---|---|---|
| `INELIGIBLE_ROUTE_PRODUCT` | Product is not available at origin/destination station (`fast_track` not sold at `FAO` on return leg) or already purchased on booking. | Removes **Fast Track security** (`0.14`). |
| `INELIGIBLE_TIME_WINDOW` | `hours_to_departure <= 48` and product requires pre-check-in modification window (`flexi_upgrade`). | Removes **Flexi fare upgrade** (`0.04`). |
| `SUPPRESSED_DECLINE_STREAK` | `prior_consecutive_declines >= 6` or product was declined in the current check-in session. | Removes **Travel insurance** (`0.11`, 6 consecutive declines). |
| `BELOW_DISPLAY_FLOOR` | `score < 0.10` (`DISPLAY_FLOOR = 0.10`). | Removes **Airport transfer** (`0.08`). |

### 4.3 Dynamic Page Builder (`dev/skills/page_builder/skill.py`)

The Page Builder skill transforms the ordered list of eligible ancillaries into a server-driven page sequence governed by two thresholds:

* **Primary Card Threshold (`CARD_PROMOTE_THRESHOLD = 0.50`):** Eligible items with `score >= 0.50` render as full white Task Cards inside the lavender assistant insight panel (maximum 2 primary cards per page, maximum 2 offer pages total).
* **Drawer Demotion Band (`0.10 <= score < 0.50`):** Eligible items with scores between `0.10` and `0.49` collapse into the `"More extras (N)"` drawer below the assistant panel on the final offer page.

The resulting page assembly covers three deterministic branches:

1. **Standard 2-Page Flow (`marta_byrne` default):**
   - **Check-in Start (`Screen E`):** `total_steps = 2`, `entry_step_pill = "2 STEPS TO YOUR BOARDING PASSES"`.
   - **Offer Page 1 (`Screen A`):** `step_label = "Step 1 of 2"`, `header_title = "Check in"`, `assistant_heading = "You usually travel with Priority"`, `assistant_subtext = "You added it on your last 3 trips."` Contains Card A (`Priority & 2 Cabin Bags`, pill `"Your usual"`, `€76 for 4 passengers`) and Card B (`Sit together`, pill `"Recommended"`, `€24 for 4 seats`).
   - **Offer Page 2 (`Screen B`):** `step_label = "Step 2 of 2"`, `header_title = "Check in"`, `section_heading = "Anything in the hold?"`, `assistant_heading = "Most families on this route add a bag"`, `assistant_subtext = "7 nights, 4 travellers."` Contains Card C (`20kg Checked Bag`, `€39.99`, stepper `0`) and collapsed drawer `"More extras (1)"` containing `Car hire in Faro`.
2. **1-Page Compressed Flow (when 1–2 primary cards qualify and fit on a single page):**
   - `total_steps = 1`, `entry_step_pill = "1 STEP TO YOUR BOARDING PASSES"`, single Offer Page (`"Step 1 of 1"`).
3. **Zero-Offer State (`zero_offer` persona or all items filtered):**
   - `total_steps = 1`, `entry_step_pill = "1 STEP"`, `flow_branch = "zero_offer"`.
   - Bypasses Offer Pages 1 and 2 completely; renders **Screen C (Zero-Offer State)** with full greeting header, flight card (without any reserved seat label), lavender assistant panel (`"You're all set"` / `"Nothing else to add for this trip."`), and solid navy button `"Get boarding passes"`.

### 4.4 Seat Allocator & Child Safety Rules (`dev/tools/seat_allocator.py`)

When the user taps `"Choose seats"` on Offer Page 1, the backend serves the Boeing 737 cabin layout (`Screen F`):

* **Recommended Block:** Always allocates **`12A`, `12B`, `12C`, `12D`** in Row 12 at `€6.00` per seat (`€24.00` total for 4 seats), tagged `"Best row for your group"` with lavender assistant copy `"I've found 4 seats together"` and supporting line `"Row 12, near the front."`
* **Never Row 14:** Row 14 (`Seat 14A`) is explicitly excluded from default recommendations and zero-offer flight cards per the Stitch Consistency Contract.
* **Child Seating Restrictions:** Because `Fia B` (age 6) and `Oisín B` (age 9) are on the booking, emergency exit rows (Rows 1, 16, and 17) and isolated single seats without an adjacent adult seat return `status = "unavailable_child_rule"` and `restriction_reason = "Unavailable for children under 16 (exit row / family adjacency rule)"`.
* **No Countdown Timers:** Seat map responses never include hold timers (`"Seats held for 09:42"` is prohibited).

### 4.5 ADK Assistant Copy & Interactive Trip Assistant (`dev/skills/assistant_copy/skill.py`)

The `assistant_copy` skill executes via Google ADK `InMemoryRunner` backed by Vertex AI (`GOOGLE_GENAI_USE_VERTEXAI=TRUE`) using a two-tier Gemini 3 model architecture (`GEMINI_FLASH_LITE_MODEL = "gemini-3.5-flash-lite"` for input safety and travel-assistance scope classification, and `GEMINI_FLASH_MODEL = "gemini-3.8-flash"` for primary reasoning and tool orchestration, with zero fallback to deprecated 2.x models and zero double execution):

1. **Page Assembly Insight Copy (`assistant_copy_synthesizer`):**
   - **Input Context:** Receives structured passenger signals, active page index, and selected primary cards.
   - **Guardrail Validator (`validate_assistant_copy`):** Inspects generated `heading` and `supporting_text` before returning:
     - Rejects any text containing `"AI"`, `"artificial intelligence"`, `"model"`, `"algorithm"`, `"llm"`, or `"bot"` (case-insensitive), or internal symbol leakage.
     - Rejects any text containing countdown or scarcity dark patterns (such as `"Seats held for 09:42"`, `"hurry"`, `"only \d+ left"`, `"running out"`), while permitting valid 24h flight schedule times (`05:55`, `06:05`, `06:35`).
     - Enforces length bounds (`heading <= 64 chars`, `supporting_text <= 160 chars`).
   - **220ms Circuit Breaker & Canonical Fallback:** If the ADK call exceeds 220ms, raises an exception, or fails guardrail validation, or for canonical preset sessions where verbatim Stitch copy is required, the skill returns the canonical Stitch copy and records the guardrail status in [`contracts/telemetry.jsons`](../../contracts/telemetry.jsons).
2. **Interactive Help Hub Trip Assistant & Safeguard Pipeline (`help_hub_trip_assistant`):**
   - **Stage 1 — Safety & Travel-Assistance Guardrail (`gemini-3.5-flash-lite` / `before_model_callback`):**
     - Sanitizes input (`1..280` chars, strips HTML/control chars) and screens for prompt injection, system-instruction overrides, and cross-booking PNR probing (`screen_user_query`).
     - Classifies via `gemini-3.5-flash-lite` whether the query is safe and related to travel or check-in assistance for the active trip (`FR1234`, `DUB → FAO`, `X8Y9QL`). Off-topic or adversarial queries short-circuit in `before_model_callback` (`guardrail_status = "BLOCK"`, zero downstream `gemini-3.8-flash` or tool invocations).
   - **Stage 2 — Single-Pass `gemini-3.8-flash` Agent & Session-Scoped Tools:**
     - Configured with immutable `static_instruction` (defining untrusted `<passenger_query>` boundaries, canonical euro prices, Row 12 / child safety rules, and output format) and `GenerateContentConfig` (`temperature=0.1`, `max_output_tokens=180`, `SafetySettings`).
     - Binds four session-scoped tools guarded by `before_tool_callback` (which enforces explicit user mutation/simulation intent and deduplicates tool calls within a turn so no tool ever executes twice):
       - `get_trip_and_ancillary_scores()`: Returns live booking metadata (`FR1234`, `DUB → FAO`), signal parameters, and propensity scores (`0.84, 0.71, 0.58, 0.29, ...`).
       - `inspect_family_seat_map()`: Returns Boeing 737 Row 12 (`12A–12D`, `€24.00`) availability and Overwing Exit Row 16 child restrictions.
       - `update_simulation_signals(prior_priority_trips, children_count, trip_nights, force_zero_offer)`: Mutates live session simulation signals when the query expresses simulation intent, re-runs `ancillary_ranking` and `page_builder`, and returns the updated funnel step count (`2 STEPS` vs `1 STEP`).
       - `modify_basket_item(product_id, quantity)`: Adds or removes eligible ancillaries (`priority_boarding`, `reserved_seats`, `checked_bag_20kg`, `car_hire`) only when the passenger query contains an explicit mutation verb.
   - **Zero Double Execution & Telemetry:** Executes with a `4.5s` interactive deadline. If `gemini-3.8-flash` already invoked tools during the turn and post-model output formatting requires fallback copy, `answer_trip_question` synthesizes copy from the updated session state without re-invoking `tool_callbacks`. Validates responses against [`contracts/assist_query.jsons`](../../contracts/assist_query.jsons) and emits trace records to [`contracts/telemetry.jsons`](../../contracts/telemetry.jsons).

---

## 5. FastAPI REST API Specification (`dev/core/app.py`)

All endpoints accept and return `application/json` and emit a trace span to the telemetry sink.

### 5.1 Endpoint Summary Table

| HTTP Method & Path | Request Schema | Response Schema | Purpose & Navigation Invariants |
|---|---|---|---|
| `GET /api/v1/health` | None | `HealthResponse` | Returns service status, active Gemini model config, and telemetry sink status. |
| `GET /api/v1/checkin/personas` | None | `PersonaListResponse` | Lists preset personas (`marta_byrne`, `zero_offer`, `solo_weekend`) for UI switching. |
| `POST /api/v1/checkin/sessions` | `CreateSessionRequest` | `CheckinSessionResponse` | Initializes check-in session, runs scoring/rules/page-builder/ADK copy, returns pages and step counts. |
| `GET /api/v1/checkin/sessions/{id}` | Path `id` | `CheckinSessionResponse` | Returns current session state, basket items, suppressed items, and active screen pointer. |
| `GET /api/v1/checkin/sessions/{id}/seat-map` | Path `id` | `SeatMapResponse` | Returns B737 seat map for **Screen F**, highlighting `12A–12D` (`€24.00`) and child-restricted rows. |
| `POST /api/v1/checkin/sessions/{id}/seats` | `ConfirmSeatsRequest` | `BasketMutationResponse` | Confirms seats `12A–12D` (`€24.00`) and sets `next_screen = "offer_page_2"` (never returns to Offer Page 1). |
| `POST /api/v1/checkin/sessions/{id}/actions` | `OfferActionRequest` | `BasketMutationResponse` | Processes `add`, `update_quantity`, `decline_page`, or `remove_item` and computes `next_screen`. |
| `POST /api/v1/checkin/sessions/{id}/assist` | `AssistQueryRequest` | `AssistQueryResponse` | Executes `help_hub_trip_assistant` ADK agent + tools for **Screen E** Help Hub queries and live natural-language simulation/basket updates. |
| `POST /api/v1/checkin/sessions/{id}/checkout` | `CheckoutRequest` | `BoardingPassesResponse` | Confirms payment (`Visa ending 4412`) and issues 4 boarding passes (`Screen G`) with badges (`PRIORITY`, `12A`). |
| `GET /api/v1/analytics/summary` | None | `AnalyticsSummaryResponse` | Returns **Screen 10** KPIs (conversion `24.1%`, pages/check-in `1.8`, median time `71s`, offers shown `2.4`) + live session stats. |

### 5.2 Navigation & State Transition Rules Enforced by API

The `POST /api/v1/checkin/sessions/{id}/seats` and `POST /api/v1/checkin/sessions/{id}/actions` endpoints return an explicit `next_screen` enum (`"checkin_start"`, `"offer_page_1"`, `"seat_map"`, `"offer_page_2"`, `"review_and_pay"`, `"boarding_passes"`, `"zero_offer"`) enforcing the wiring rules from [`../scratchpad/stitch/stitch-flow-map.md`](../scratchpad/stitch/stitch-flow-map.md):

* **Seat Map Forward Join:** Confirming seats on `seat_map` (`Screen F`) sets `next_screen = "offer_page_2"` (`Screen B`), never `"offer_page_1"`.
* **Offer Page 2 Back Navigation:** Navigating back from `offer_page_2` (`Screen B`) targets `"offer_page_1"` (`Screen A`), never `"seat_map"`.
* **Empty Basket Checkout Skip:** When completing `offer_page_2` (`Screen B`), if `basket.items` is empty (`total_eur == 0.00`), `next_screen` is set directly to `"boarding_passes"` (`Screen G`), skipping `"review_and_pay"` (`Screen D`).
* **Session Decline Suppression:** When a client sends `action = "decline_page"` on `offer_page_1` or `offer_page_2`, unselected products on that page are appended to `session.declined_product_ids` and cannot re-appear in the same session.

---

## 6. Observability & Testing Plan

### 6.1 Telemetry Contract Compliance (`dev/core/telemetry.py`)

Every tool call (`propensity_scorer`, `eligibility_rules`, `seat_allocator`, `basket_pricing`) and every skill execution (`ancillary_ranking`, `page_builder`, `assistant_copy`) emits a structured JSON record to `results/telemetry_traces.jsonl` and the configured OTLP collector (`OTEL_EXPORTER_OTLP_ENDPOINT`). Each record is validated at runtime against [`contracts/telemetry.jsons`](../../contracts/telemetry.jsons):

* `schema_version`: `"1.0.0"`
* `severity`: `"INFO"` (or `"WARNING"` on LLM fallback / guardrail block)
* `logging.googleapis.com/trace`: `"projects/example-project-id/traces/<32-hex>"`
* `logging.googleapis.com/spanId`: `"<16-hex>"`
* `context`: `{"tenant_id": "ryanair-checkin", "session_id": "<uuid>", "user_id": "pax-marta-byrne"}`
* `gen_ai.operation.name`: `"execute_skill"` | `"invoke_tool"` | `"generate_assistant_copy"`
* `skill` / `tool`: `{"id": "<component_name>", "version": "1.0.0"}`
* `security`: `{"guardrail_status": "PASS" | "FLAG" | "BLOCK", "events": [...]}`
* `payload`: `{"status": "SUCCESS" | "FAILURE" | "ESCALATED", "inputs": {...}, "outputs": {...}}`

### 6.2 Automated Verification Suite (`dev/tests/`)

Gate 3 and Gate 4 verification require 100% pass rates across four automated test modules executed via `uv run pytest`:

1. **`test_contracts.py`:** Validates all JSON Schema files in `contracts/*.jsons` against Draft 2020-12 and validates sample payloads for every endpoint.
2. **`test_scoring_and_rules.py`:** Asserts exact scores (`0.84, 0.71, 0.58, 0.29, 0.14, 0.11, 0.08, 0.04`) and removal reasons for `marta_byrne`, verifies `zero_offer` produces `0` offer pages and `"1 STEP"`, and verifies custom `signal_overrides` dynamically alter rankings.
3. **`test_seat_allocator.py`:** Asserts `12A–12D` recommendation (`€24.00`), verifies `Seat 14A` never appears, and verifies child seating restrictions on exit rows for ages 6 and 9.
4. **`test_api_e2e.py`:** Walks the full check-in state machine (Check-in Start → Offer Page 1 → Seat Map → Offer Page 2 → Review & Pay → Boarding Passes, plus Decline/Skip path and Zero-Offer path), asserts p95 latency ≤ 300ms under deterministic/mocked LLM execution, and validates every emitted line in `results/telemetry_traces.jsonl` against [`contracts/telemetry.jsons`](../../contracts/telemetry.jsons).

---

## 7. References

* System Architecture Overview: [`./system-architecture.md`](./system-architecture.md)
* Frontend Technical Specification: [`./frontend-architecture.md`](./frontend-architecture.md)
* ADK Track Backlog: [`./adk-user_stories.yaml`](./adk-user_stories.yaml)
* ADK Track State: [`../states/adk.md`](../states/adk.md)
* Shared Contract Registry: [`../states/shared.md`](../states/shared.md)
