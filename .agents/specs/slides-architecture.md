# Slidev Presentation & Co-Evolution Specification: Customer Demo Deck (`dev/slides/`)

**Author:** Lead Engineer, Agentic Co-Engineer (`frontend` Track)
**Reviewers:** Product Design & Delivery, Engineering Architecture
**Status:** Approved (Gate 1: Specify)
**Last Updated:** 2026-10-06

---

## 1. Overview

This specification defines the architecture, visual design system, interactive Vue 3 components, and co-evolution protocol for the **Ryanair Dynamic Ancillary Flows (`ryta`)** customer demonstration deck in [`dev/slides/`](../../dev/slides/).

The presentation is built on **Slidev** (`@slidev/cli`, Vite + Vue 3) and implements the **Google Cloudstyle 2.0** corporate layout geometry (`16:9` widescreen canvas, `#FFFFFF` background, `#202124` typography, 4-color rainbow bars, full-bleed colored Break Slides, Table A/B matrices, and corporate footers) while rendering mobile check-in screens (`Screens E, A, F, B, D, C, G`) and the `Screen 10` model feedback dashboard inside framed **App 2026 Help Hub** (`#073590` Navy, `#F1C933` Yellow, `#F2F1FE` AI Lavender) containers.

---

## 2. Goals & Non-Goals

### 2.1 Goals

* **Executive + Technical Narrative Alignment (14 Slides, 4 Acts):** Deliver a 20–30 minute customer demo covering the 7-page funnel problem, the live `Marta Byrne` (`X8Y9QL`) 2-step vs. `Zero-Offer` 1-step journey, the sub-300ms Hybrid ADK + deterministic rules architecture, and the closed-loop telemetry and 4-Pillar co-evolution workflow.
* **Dual-Mode Interactive Components (Live API + Offline Fallback):** Embed interactive Vue 3 components inside the slides (`HelpHubSimulator.vue`, `LiveScoringExplorer.vue`, `OpsFeedbackWidget.vue`) that query the live FastAPI backend (`http://localhost:8000/api/v1/*`) when active and automatically fall back to deterministic local scoring and golden telemetry traces ([`results/telemetry_traces.jsonl`](../../results/telemetry_traces.jsonl)) when offline or exported as a static SPA/PDF.
* **Conflict-Free Modular Co-Evolution:** Split the slide deck into modular partials under `dev/slides/pages/*.md` orchestrated by [`dev/slides/slides.md`](../../dev/slides/slides.md) and governed by the project skill in [`../skills/slidev-deck/SKILL.md`](../skills/slidev-deck/SKILL.md).

### 2.2 Non-Goals

* **Replacing the Standalone Mobile SPA (`dev/ui/`):** The Slidev deck embeds interactive simulators and connects to the same FastAPI endpoints, while [`dev/ui/index.html`](../../dev/ui/index.html) remains the standalone full-screen prototype served at `GET /`.

---

## 3. Cloudstyle 2.0 Layout & Token Mapping

All layouts in `dev/slides/layouts/` and stylesheet rules in `dev/slides/styles/cloudstyle.css` enforce the **Google Cloudstyle 2.0** design tokens:

| Token / Archetype | Specification | Implementation in `dev/slides/` |
|---|---|---|
| **Canvas & Grid** | `16:9` widescreen (`960×540px` scaled from `720×405pt`), `5%` left margin | `slides.md` frontmatter (`aspectRatio: '16/9'`, `canvasWidth: 960`) and CSS layout grid. |
| **Color Palette** | Canvas `#FFFFFF`, Primary Ink `#202124`, Secondary `#5F6368`, Blue `#4285F4`, Red `#EA4335`, Yellow `#FBBC05`, Green `#34A853`, Card Border `#D9D9D9`, Frame Border `#BDC1C6` | CSS variables (`--cs-white`, `--cs-dark1`, `--cs-dark2`, `--cs-blue`, `--cs-red`, `--cs-yellow`, `--cs-green`). |
| **Yellow Break Contrast Rule** | On `#FBBC05` Yellow Break Slides, all text, horizontal divider lines, and icons MUST use dark `#202124` (`DARK1`), never `#FFFFFF` | Enforced automatically by `layouts/cloud-break.vue` when `color="yellow"`. |
| **Corporate Footers** | Left: `Google Cloud`, Right: `Proprietary & Confidential` + right-aligned Slide Number | Rendered via `components/CloudFooter.vue` on all standard and break layouts. |
| **Help Hub Viewport Frame** | Framed by a `1px solid #BDC1C6` border; internal tokens strictly use Ryanair Navy (`#073590`), Yellow (`#F1C933`), and Assistant Lavender (`#F2F1FE` with `#4B2EDB` sparkle) | Scoped to `HelpHubSimulator.vue` and `OpsFeedbackWidget.vue`. |

---

## 4. Modular Slide Structure & BBP Speaker Notes

Every slide in `dev/slides/` must satisfy two structural invariants verified by [`dev/tests/test_slides_deck.py`](../../dev/tests/test_slides_deck.py):

1. **Assertive Headlines (Beyond Bullet Points):** Every content slide title states a complete 10–15 word subject+verb conclusion rather than a generic topic label.
2. **Tripartite Speaker Notes:** Every slide includes a Slidev speaker note comment block containing `PURPOSE:`, `VERBAL SCRIPT:`, and `TRANSITION:`.

| Act | Partial File | Slides | Primary Focus |
|---|---|---|---|
| **Act I** | `slides.md` + `pages/01-executive-context.md` | Slides `01–04` | Official Cloudstyle Cover, Contents (`01–04`), 7-page funnel problem (50/50 Dark/Light contrast), and 4-card target KPI matrix (`≤2.0` pages, `≤75s` time, `24.1%` conversion, `≤300ms` SLA). |
| **Act II** | `pages/02-customer-journey-demo.md` | Slides `05–08` | Blue `#4285F4` Break Slide, `Marta Byrne` (`X8Y9QL`) `Table A` persona fixture, interactive `<HelpHubSimulator />` (`2-Step` & `1-Step Zero-Offer`), and the 6 ethical UX invariants + 4 Stitch sanitization checks. |
| **Act III** | `pages/03-hybrid-adk-architecture.md` | Slides `09–11` | Green `#34A853` Break Slide, Hybrid ADK + Deterministic Tools `Table B` trade-off matrix (`~57ms` scoring + `220ms` circuit breaker), and live `<LiveScoringExplorer />` signal override simulator. |
| **Act IV** | `pages/04-observability-coevolution.md` | Slides `12–14` | Yellow `#FBBC05` Break Slide (`#202124` dark text), live `<OpsFeedbackWidget />` (`Screen 10` KPIs & [`contracts/telemetry.jsons`](../../contracts/telemetry.jsons) compliance), and the 4-Pillar co-evolution roadmap. |

---

## 5. Co-Evolution Protocol

Whenever a schema in [`contracts/`](../../contracts/), a tool/skill in [`dev/`](../../dev/), or a UI flow in [`dev/ui/`](../../dev/ui/) changes:

1. Run the project skill instructions in [`../skills/slidev-deck/SKILL.md`](../skills/slidev-deck/SKILL.md).
2. Update the corresponding modular partial in `dev/slides/pages/*.md` or data fixture in `dev/slides/components/`.
3. Execute `uv run pytest dev/tests/test_slides_deck.py` to verify Stitch consistency invariants, speaker notes, and PII guardrails.

---

## 6. References

* System Architecture: [`./system-architecture.md`](./system-architecture.md)
* ADK Backend Specification: [`./adk-architecture.md`](./adk-architecture.md)
* Frontend UI Specification: [`./frontend-architecture.md`](./frontend-architecture.md)
* Slidev Co-Evolution Skill: [`../skills/slidev-deck/SKILL.md`](../skills/slidev-deck/SKILL.md)
