# Session Handover: Gate 1 Specification for Ryanair Dynamic Ancillary Flows

* **Date:** 2026-10-06
* **Track:** `adk` (and cross-track `shared` / `frontend` alignment)
* **Milestone / Gate:** Gate 1 (`Specify`) → Completed; advancing to Gate 2 (`Contract`)

---

## 1. Summary of Work Completed

1. **Ingested Stitch Design Briefs & Operating Rules:**
   - Synthesized [`AGENTS.md`](../../../AGENTS.md) and all four Stitch artifacts under [`../../scratchpad/stitch/`](../../scratchpad/stitch/) (`DESIGN.md`, `ryanair-dynamic-flows-stitch-brief.md`, `stitch-build-runbook.md`, and `stitch-flow-map.md`).
2. **Populated Project Mission & Guardrails (`AGENTS.md`):**
   - Replaced `# TEMPLATE` placeholders in [`AGENTS.md`](../../../AGENTS.md) with measurable objectives (funnel compression from 4.6 to ≤ 2.0 pages, p95 ≤ 300ms hybrid scoring/page assembly, ≥ 24.1% conversion, 100% telemetry compliance) and aligned Rule 6 to permit canonical Stitch Consistency Contract fixtures while blocking developer LDAPs via `.blocked_terms`.
3. **Authored Gate 1 Architecture Specifications (`.agents/specs/*.md`):**
   - [`../../specs/system-architecture.md`](../../specs/system-architecture.md): End-to-end 4-pillar architecture, Stitch Consistency Contract table, 6 UX/product invariants, falsifiable QA scenarios (`QA-01` through `QA-04`), Module/Runtime/Allocation viewtypes, ADRs, and failure-mode resilience plan.
   - [`../../specs/adk-architecture.md`](../../specs/adk-architecture.md): Hybrid ADK (`gemini-3.8-flash` with 220ms circuit-breaker fallback) + deterministic Python tools (`propensity_scorer.py`, `eligibility_rules.py`, `seat_allocator.py`, `basket_pricing.py`), declarative skills (`ancillary_ranking`, `page_builder`, `assistant_copy`), FastAPI REST API endpoints, and automated test plan.
   - [`../../specs/frontend-architecture.md`](../../specs/frontend-architecture.md): App 2026 Help Hub design tokens, 7-screen journey matrix, header ladder, step-numbering rule, link wiring invariants, and the 4 Stitch prototype import repairs.
4. **Synchronized Track Backlogs & State Files:**
   - Created [`../../specs/adk-user_stories.yaml`](../../specs/adk-user_stories.yaml) (`ADK-001` to `ADK-005`) and [`../../specs/frontend-user_stories.yaml`](../../specs/frontend-user_stories.yaml) (`FE-001` to `FE-003`).
   - Updated [`../../states/adk.md`](../../states/adk.md), [`../../states/frontend.md`](../../states/frontend.md), and [`../../states/shared.md`](../../states/shared.md).

---

## 2. Next Steps (Gate 2: Contract → Gate 3: Implement)

1. **Execute `ADK-001` (Gate 2 — Contract):**
   - Author and validate the 4 JSON Schema contracts in `contracts/`:
     - `contracts/checkin_flow.jsons`
     - `contracts/seat_map.jsons`
     - `contracts/basket_checkout.jsons`
     - `contracts/analytics_summary.jsons`
2. **Execute `ADK-002` through `ADK-005` (Gate 3 — Implement):**
   - Build deterministic tools in `dev/tools/`, declarative skills in `dev/skills/`, and FastAPI + ADK runtime in `dev/core/` with full `contracts/telemetry.jsons` emission and pytest verification in `dev/tests/`.
