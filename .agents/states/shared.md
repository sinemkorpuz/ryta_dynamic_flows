# Shared Integration State & Contract Registry

This document tracks cross-track contracts, shared dependencies, and integration handshakes across all active tracks.

---

## 1. Frozen & Active Contracts (`contracts/`)

| Contract File | Version | Producer Track | Consumer Track(s) | Status |
|---|---|---|---|---|
| [`contracts/telemetry.jsons`](../../contracts/telemetry.jsons) | `1.0.0` | All (`adk`, `frontend`) | Observability / Verify | Frozen |

---

## 2. Cross-Track Integration Status

| Integration Point | Owner(s) | Current Gate | Notes |
|---|---|---|---|
| `<Example: ADK ↔ Frontend API>` | `adk`, `frontend` | `Gate 1: Specify` | Define payload schema in `contracts/` before implementation. |

---

## 3. Shared Dependency Decisions

* **Python Runtime (`pyproject.toml`):** Managed via `uv`. Any changes to shared core packages (`google-adk`, `fastapi`, `pydantic`) must pass tests across all tracks before merging.
