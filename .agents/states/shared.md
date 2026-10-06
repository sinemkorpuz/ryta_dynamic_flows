# Shared Integration State & Contract Registry

This document tracks cross-track contracts, shared dependencies, and integration handshakes across all active tracks.

---

## 1. Frozen & Active Contracts (`contracts/`)

| Contract File | Version | Producer Track | Consumer Track(s) | Status |
|---|---|---|---|---|
| [`contracts/telemetry.jsons`](../../contracts/telemetry.jsons) | `1.0.0` | All (`adk`, `frontend`) | Observability / Verify | Frozen |
| `contracts/checkin_flow.jsons` | `1.0.0` | `adk` | `frontend` | Planned (Gate 2) |
| `contracts/seat_map.jsons` | `1.0.0` | `adk` | `frontend` | Planned (Gate 2) |
| `contracts/basket_checkout.jsons` | `1.0.0` | `adk` | `frontend` | Planned (Gate 2) |
| `contracts/analytics_summary.jsons` | `1.0.0` | `adk` | `frontend` | Planned (Gate 2) |

---

## 2. Cross-Track Integration Status

| Integration Point | Owner(s) | Current Gate | Notes |
|---|---|---|---|
| Check-in Session & Dynamic Page Builder (`POST /api/v1/checkin/sessions`) | `adk`, `frontend` | `Gate 2: Contract` | Spec approved in [`adk-architecture.md`](../specs/adk-architecture.md); schema `contracts/checkin_flow.jsons` next. |
| Boeing 737 Family Seat Map (`GET /seat-map`, `POST /seats`) | `adk`, `frontend` | `Gate 2: Contract` | Enforces Row 12 (`12A–12D`), child rules (ages 6 & 9), and forward jump to Offer Page 2. |
| Basket Checkout & Boarding Passes (`POST /actions`, `POST /checkout`) | `adk`, `frontend` | `Gate 2: Contract` | Enforces decline suppression, empty-basket Review & Pay skip, and pass badges (`PRIORITY`, `12A`). |
| Model Feedback Loop (`GET /api/v1/analytics/summary`) | `adk`, `frontend` | `Gate 2: Contract` | Powers Screen 10 KPI tiles and live persona/signal switching metrics. |

---

## 3. Shared Dependency Decisions

* **Python Runtime (`pyproject.toml`):** Managed via `uv`. Any changes to shared core packages (`google-adk`, `fastapi`, `pydantic`) must pass tests across all tracks before merging.
* **Stitch Consistency Contract:** Both tracks enforce the canonical Marta Byrne (`FR1234`, `DUB → FAO`, `X8Y9QL`, `€76.00` Priority, `€24.00` Seats `12A–12D`, `€39.99` 20kg Bag, `€139.99` Total) and Zero-Offer (`1 STEP`) fixtures defined in [`system-architecture.md`](../specs/system-architecture.md).
