# Codebase Lines of Code (LOC) Metrics

This document tracks lines of code (LOC) metrics for the **Ryanair Dynamic Ancillary Flows (`ryta`)** repository, including physical lines, blank lines, comment lines, and Source Lines of Code (SLOC).

---

## 1. Executive Summary

| Category | Files | Total Lines | Blank Lines | Comment Lines | Code (SLOC) |
|---|:---:|:---:|:---:|:---:|:---:|
| **Application Source Code** (Backend, Tests, UI, Interactive Components) | **44** | **11,906** | **890** | **139** | **10,877** |
| *↳ Core Product Only (Backend + Tests + Web App, excl. Slidev Deck)* | *25* | *7,229* | *594* | *87* | *6,548* |
| **Contracts & Schemas** (`contracts/*.jsons`, `openapi.json`) | **7** | **2,199** | **0** | **0** | **2,199** |
| **Specifications, Architecture & Handover Logs** (`.agents/`, docs) | **35** | **3,800** | **691** | **0** | **3,109** |
| **HTML Mocks & Fixtures** (Stitch screen fixtures, trace logs) | **15** | **3,617** | **133** | **0** | **3,484** |
| **Configuration & CI** (`pyproject.toml`, pre-commit, npmrc) | **6** | **162** | **17** | **0** | **145** |
| **Dependency Lockfiles** (`package-lock.json`, `uv.lock`) | **3** | **11,050** | **63** | **0** | **10,987** |
| **Grand Total (All Tracked Files)** | **102** | **32,735** | **1,794** | **139** | **30,802** |

---

## 2. Language Breakdown (Executable Code)

| Language | Files | Total Lines | Blank Lines | Comment Lines | Code (SLOC) | Primary Responsibility |
|---|:---:|:---:|:---:|:---:|:---:|---|
| **Python** | 25 | 4,883 | 514 | 83 | **4,286** | Core engine, domain skills, deterministic tools, test suites, maintenance |
| **Vue.js 3** | 15 | 3,783 | 185 | 14 | **3,584** | Help Hub interactive simulator, scoring explorer, architecture diagrams |
| **JavaScript** | 1 | 2,599 | 135 | 35 | **2,429** | Standalone mobile web prototype client ([`dev/ui/app.js`](../dev/ui/app.js)) |
| **HTML** | 2 | 357 | 12 | 0 | **345** | UI shell ([`dev/ui/index.html`](../dev/ui/index.html)) & Slidev presentation shell |
| **CSS** | 1 | 284 | 34 | 17 | **233** | Cloudstyle 2.0 design token stylesheet ([`dev/slides/styles/cloudstyle.css`](../dev/slides/styles/cloudstyle.css)) |
| **TypeScript** | 1 | 1 | 0 | 0 | **1** | Slidev style loader ([`dev/slides/styles/index.ts`](../dev/slides/styles/index.ts)) |

---

## 3. Breakdown by Architectural Component (`dev/`)

### 3.1 Backend: Core Engine & API (`dev/core/`) — 614 SLOC
The core runtime orchestrator, FastAPI service layer, models, and telemetry wrappers.

| File | Code (SLOC) | Total Lines | Blank Lines | Comment Lines | Role |
|---|:---:|:---:|:---:|:---:|---|
| [`dev/core/app.py`](../dev/core/app.py) | **149** | 188 | 39 | 0 | FastAPI check-in, assist query, and session endpoints |
| [`dev/core/orchestrator.py`](../dev/core/orchestrator.py) | **336** | 378 | 39 | 3 | Flow orchestrator, parallel tool executor, and fallback engine |
| [`dev/core/telemetry.py`](../dev/core/telemetry.py) | **94** | 105 | 11 | 0 | OpenTelemetry span management and JSONL trace logger |
| [`dev/core/models.py`](../dev/core/models.py) | **34** | 46 | 12 | 0 | Domain DTOs and Pydantic schemas |
| [`dev/core/__init__.py`](../dev/core/__init__.py) | **1** | 1 | 0 | 0 | Module package init |
| **Subtotal** | **614** | **718** | **101** | **3** | |

### 3.2 Backend: Domain Skills (`dev/skills/`) — 1,960 SLOC
Declarative domain capabilities decoupled from the core runtime engine.

| File | Code (SLOC) | Total Lines | Blank Lines | Comment Lines | Role |
|---|:---:|:---:|:---:|:---:|---|
| [`dev/skills/assistant_copy/skill.py`](../dev/skills/assistant_copy/skill.py) | **1,120** | 1,218 | 95 | 3 | LLM copy generation, tone guardrails, and deterministic fallback copy |
| [`dev/skills/page_builder/skill.py`](../dev/skills/page_builder/skill.py) | **801** | 866 | 58 | 7 | Dynamic 0-to-2 page assembly, layout synthesis, and card layout |
| [`dev/skills/ancillary_ranking/skill.py`](../dev/skills/ancillary_ranking/skill.py) | **35** | 42 | 7 | 0 | Candidate ancillary ranking coordinator |
| Init files (`__init__.py`) | **4** | 4 | 0 | 0 | Skill package markers |
| **Subtotal** | **1,960** | **2,130** | **160** | **10** | |

### 3.3 Backend: Deterministic Domain Tools (`dev/tools/`) — 534 SLOC
Deterministic domain algorithms, business eligibility rules, and seat allocation.

| File | Code (SLOC) | Total Lines | Blank Lines | Comment Lines | Role |
|---|:---:|:---:|:---:|:---:|---|
| [`dev/tools/propensity_scorer.py`](../dev/tools/propensity_scorer.py) | **224** | 239 | 15 | 0 | ML propensity scoring and feature weighting |
| [`dev/tools/seat_allocator.py`](../dev/tools/seat_allocator.py) | **120** | 136 | 15 | 1 | Boeing 737 seat layout and auto-allocation algorithm |
| [`dev/tools/basket_pricing.py`](../dev/tools/basket_pricing.py) | **107** | 122 | 15 | 0 | Basket checkout calculations and multi-currency pricing |
| [`dev/tools/eligibility_rules.py`](../dev/tools/eligibility_rules.py) | **82** | 95 | 13 | 0 | Passenger, route, and time-based eligibility rules |
| [`dev/tools/__init__.py`](../dev/tools/__init__.py) | **1** | 1 | 0 | 0 | Tool package marker |
| **Subtotal** | **534** | **593** | **58** | **1** | |

### 3.4 Automated Test Suites (`dev/tests/`) — 672 SLOC
Automated integration, unit, contract, and presentation verification suites.

| File | Code (SLOC) | Total Lines | Blank Lines | Comment Lines | Scope |
|---|:---:|:---:|:---:|:---:|---|
| [`dev/tests/test_api_e2e.py`](../dev/tests/test_api_e2e.py) | **378** | 475 | 61 | 36 | End-to-end API, check-in flow, and latency tests |
| [`dev/tests/test_slides_deck.py`](../dev/tests/test_slides_deck.py) | **168** | 207 | 29 | 10 | Slidev deck structure, layout, and component tests |
| [`dev/tests/test_scoring_and_rules.py`](../dev/tests/test_scoring_and_rules.py) | **64** | 76 | 11 | 1 | Scoring engine and eligibility rule unit tests |
| [`dev/tests/test_seat_allocator.py`](../dev/tests/test_seat_allocator.py) | **41** | 53 | 11 | 1 | Seat allocation algorithm tests |
| [`dev/tests/test_contracts.py`](../dev/tests/test_contracts.py) | **20** | 26 | 6 | 0 | JSON Schema schema-conformance tests |
| [`dev/tests/__init__.py`](../dev/tests/__init__.py) | **1** | 1 | 0 | 0 | Test package marker |
| **Subtotal** | **672** | **838** | **118** | **48** | |

### 3.5 Frontend Mobile Web Application (`dev/ui/`) — 2,768 SLOC
The standalone interactive passenger check-in client in the App 2026 design language.

| File | Code (SLOC) | Total Lines | Blank Lines | Comment Lines | Role |
|---|:---:|:---:|:---:|:---:|---|
| [`dev/ui/app.js`](../dev/ui/app.js) | **2,429** | 2,599 | 135 | 35 | Dynamic check-in client, assist modal, seat selector, card renderer |
| [`dev/ui/index.html`](../dev/ui/index.html) | **339** | 351 | 12 | 0 | Mobile viewport container and App 2026 Help Hub UI shell |
| **Subtotal** | **2,768** | **2,950** | **147** | **35** | |

### 3.6 Slidev Presentation Deck & Vue Components (`dev/slides/`) — 3,824 SLOC
Interactive Vue 3 components, layouts, and styles embedded within the executive Slidev presentation.

| File | Code (SLOC) | Total Lines | Blank Lines | Comment Lines | Role |
|---|:---:|:---:|:---:|:---:|---|
| [`dev/slides/components/HelpHubSimulator.vue`](../dev/slides/components/HelpHubSimulator.vue) | **1,346** | 1,401 | 54 | 1 | Embedded live passenger simulator component |
| [`dev/slides/components/SystemOverviewDiagram.vue`](../dev/slides/components/SystemOverviewDiagram.vue) | **570** | 607 | 32 | 5 | Interactive architecture SVG flow diagram |
| [`dev/slides/components/AdkWorkflowDiagram.vue`](../dev/slides/components/AdkWorkflowDiagram.vue) | **466** | 502 | 31 | 5 | 4-stage assembly line visualizer component |
| [`dev/slides/components/LiveScoringExplorer.vue`](../dev/slides/components/LiveScoringExplorer.vue) | **312** | 325 | 12 | 1 | Real-time scoring parameter tweak explorer |
| [`dev/slides/components/OpsFeedbackWidget.vue`](../dev/slides/components/OpsFeedbackWidget.vue) | **212** | 221 | 8 | 1 | Observability feedback and trace inspector |
| [`dev/slides/components/CloudFooter.vue`](../dev/slides/components/CloudFooter.vue) | **56** | 60 | 4 | 0 | Presentation slide footer component |
| [`dev/slides/components/RainbowBar.vue`](../dev/slides/components/RainbowBar.vue) | **25** | 27 | 2 | 0 | Google Cloudstyle accent bar |
| Layout Components (`dev/slides/layouts/*.vue`, 8 files) | **607** | 670 | 43 | 2 | Slidev slide layouts (cover, split, break, TOC, etc.) |
| Styles (`cloudstyle.css`, `index.ts`) | **234** | 285 | 34 | 17 | Cloudstyle 2.0 design tokens and theme export |
| Presentation Shell (`dev/slides/index.html`) | **6** | 6 | 0 | 0 | Slidev web entry point |
| **Subtotal (Components & Styles)** | **3,824** | **4,074** | **219** | **31** | |

### 3.7 Dev Tooling & Governance Scripts — 505 SLOC
* [`run_maintenance.py`](../.agents/skills/maintenance/scripts/run_maintenance.py): **505 SLOC** (603 total lines, 77 blank, 21 comment) — PII scanning, schema validation, drift detection engine.

---

## 4. Contracts & Schemas (`contracts/`) — 2,199 Lines

Strict, machine-readable JSON Schema and OpenAPI contracts governing backend and frontend integration:

| Contract | Format | Lines | Role |
|---|:---:|:---:|---|
| [`contracts/openapi.json`](../contracts/openapi.json) | OpenAPI 3.1 | **575** | Full REST API specification |
| [`contracts/checkin_flow.jsons`](../contracts/checkin_flow.jsons) | JSON Schema | **517** | Dynamic check-in request/response schema |
| [`contracts/seat_map.jsons`](../contracts/seat_map.jsons) | JSON Schema | **276** | Seat map layout and allocation schema |
| [`contracts/assist_query.jsons`](../contracts/assist_query.jsons) | JSON Schema | **242** | Help Hub conversational assistant query schema |
| [`contracts/basket_checkout.jsons`](../contracts/basket_checkout.jsons) | JSON Schema | **240** | Basket pricing and ancillary checkout schema |
| [`contracts/analytics_summary.jsons`](../contracts/analytics_summary.jsons) | JSON Schema | **181** | Operational funnel metrics and conversion analytics schema |
| [`contracts/telemetry.jsons`](../contracts/telemetry.jsons) | JSON Schema | **168** | OpenTelemetry trace schema |

---

## 5. Methodology & Counting Rules

1. **Source Lines of Code (SLOC):** Non-empty lines containing executable statements or markup. Excludes blank lines and whole-line comments (`#`, `//`, `/* ... */`).
2. **Physical LOC:** Total line count (`wc -l`) including blank lines and comments.
3. **Lockfile Exclusion:** Dependency lockfiles (`package-lock.json`, `uv.lock`) are autogenerated by package managers and are tracked separately from handwritten source code.
4. **Fixture & Mock Exclusion:** Screen mock HTML files (`results/mocks/` and `dev/slides/public/stitch/`) represent static design snapshots and test fixtures rather than application runtime logic.
