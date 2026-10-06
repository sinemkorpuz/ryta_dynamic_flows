# Track State: `adk`

Active working context for the **ADK Track** (Agent Development Kit orchestration, modular tools, declarative skills, and FastAPI services).

---

## 1. Active Milestone & Gate Status

| Capability / Story ID | Spec (`../specs/`) | Contract (`../../contracts/`) | Current Gate | Status |
|---|---|---|---|---|
| `ADK-001` | [`adk-architecture.md`](../specs/adk-architecture.md) | `checkin_flow.jsons`, `seat_map.jsons`, `basket_checkout.jsons`, `analytics_summary.jsons` | `Gate 2: Contract` | Ready to Start |
| `ADK-002` | [`adk-architecture.md`](../specs/adk-architecture.md) | `checkin_flow.jsons`, [`telemetry.jsons`](../../contracts/telemetry.jsons) | `Gate 2: Contract` | Pending Contracts |
| `ADK-003` | [`adk-architecture.md`](../specs/adk-architecture.md) | `seat_map.jsons`, [`telemetry.jsons`](../../contracts/telemetry.jsons) | `Gate 2: Contract` | Pending Contracts |
| `ADK-004` | [`adk-architecture.md`](../specs/adk-architecture.md) | `checkin_flow.jsons`, [`telemetry.jsons`](../../contracts/telemetry.jsons) | `Gate 2: Contract` | Pending Contracts |
| `ADK-005` | [`adk-architecture.md`](../specs/adk-architecture.md) | `basket_checkout.jsons`, `analytics_summary.jsons` | `Gate 2: Contract` | Pending Contracts |

---

## 2. Current Blockers & Open Decisions

* **Gate 1 Approved:** Specifications [`system-architecture.md`](../specs/system-architecture.md) and [`adk-architecture.md`](../specs/adk-architecture.md) are complete. Next immediate step is authoring and freezing the 4 domain JSON Schemas in `contracts/` (`ADK-001`) to clear Gate 2.

---

## 3. Recent Session Handovers

* [`2026-10-06_specify-dynamic-flows.md`](../sessions/adk/2026-10-06_specify-dynamic-flows.md) — Completed Gate 1 specifications (`system-architecture.md`, `adk-architecture.md`, `frontend-architecture.md`) and track backlogs.
