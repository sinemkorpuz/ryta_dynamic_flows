---
name: slidev-deck
description: >-
  Maintains, updates, audits, and co-evolves the Ryanair Dynamic Ancillary Flows
  (ryta) Slidev presentation in dev/slides/ using the Google Cloudstyle 2.0
  layout system and dual-mode interactive Vue 3 components. Use when adding or
  updating slides for customer demos, syncing deck metrics/fixtures with
  contracts/ or results/, or exporting the Slidev deck to SPA/PDF.
---

# Skill: Slidev Presentation Maintenance & Co-Evolution (`dev/slides/`)

## 1. Purpose & Scope

This project-scoped skill governs the generation, maintenance, and continuous co-evolution of the Slidev presentation in [`../../dev/slides/`](../../dev/slides/), specified in [`../specs/slides-architecture.md`](../specs/slides-architecture.md).

Whenever features, propensity rules, API schemas in [`../../contracts/`](../../contracts/), or UI flows in [`../../dev/ui/`](../../dev/ui/) evolve, use this skill to keep the customer demo presentation synchronized without layout drift or merge conflicts.

---

## 2. Architecture & File Map

* **Master Deck Entrypoint:** [`../../dev/slides/slides.md`](../../dev/slides/slides.md) (Slidev frontmatter configuration, cover slide, and `src:` imports).
* **Modular Act Partials (`dev/slides/pages/`):**
  * `01-executive-context.md` — Act I: TOC (`01..04`), 7-page funnel problem (50/50 Dark/Light contrast), and 4-card target KPI matrix.
  * `02-customer-journey-demo.md` — Act II: Blue `#4285F4` Break Slide, `Marta Byrne` (`X8Y9QL`) `Table A` persona fixture, interactive `<HelpHubSimulator />`, and 6 UX invariants.
  * `03-hybrid-adk-architecture.md` — Act III: Green `#34A853` Break Slide, Hybrid ADK + Deterministic Tools `Table B` trade-off matrix, and `<LiveScoringExplorer />`.
  * `04-observability-coevolution.md` — Act IV: Yellow `#FBBC05` Break Slide (`#202124` dark text), `<OpsFeedbackWidget />` (`Screen 10`), and 4-Pillar co-evolution roadmap.
* **Cloudstyle 2.0 Layouts (`dev/slides/layouts/`):**
  * `cloud-cover.vue`, `cloud-toc.vue`, `cloud-break.vue`, `cloud-sidebar-table.vue`, `cloud-four-cards.vue`, `cloud-twotone.vue`, `cloud-split.vue`.
* **Interactive Dual-Mode Components (`dev/slides/components/`):**
  * `HelpHubSimulator.vue` — Interactive 390×844 mobile viewport stepping through Marta's 2-step flow (`E → A → F → B → D → G`) and the 1-step Zero-Offer flow (`E → C → G`), plus toggleable live iframe preview when FastAPI (`http://localhost:8000`) is running.
  * `LiveScoringExplorer.vue` — Interactive passenger/trip signal sliders calling `POST http://localhost:8000/api/v1/checkin/sessions` with deterministic offline calculation fallback.
  * `OpsFeedbackWidget.vue` — Real-time `Screen 10` KPI dashboard calling `GET http://localhost:8000/api/v1/analytics/summary` with fallback to golden benchmark metrics.

---

## 3. Non-Negotiable Design & Content Invariants

1. **Cloudstyle 2.0 Fidelity:**
   * Keep the outer slide canvas `#FFFFFF` (`--cs-white`) with `#202124` (`--cs-dark1`) typography and `Google Cloud` / `Proprietary & Confidential` footers (`CloudFooter.vue`).
   * **Yellow Break Slide Contrast Rule:** On `#FBBC05` yellow backgrounds (`color="yellow"`), all text, divider lines, and icons MUST be `#202124` (`DARK1`), never white.
   * **Help Hub Isolation:** Ryanair Navy (`#073590`), Yellow (`#F1C933`), and Assistant Lavender (`#F2F1FE` with `#4B2EDB` sparkle) are scoped strictly inside framed product containers (`#BDC1C6` border).
2. **Stitch Consistency Contract:**
   * Always preserve canonical fixture values: `Ryanair`, `FR1234`, `DUB → FAO`, `X8Y9QL`, `Marta Byrne`, `Declan B`, `Fia B (6)`, `Oisín B (9)`, Priority `€76.00` (`0.84`), Seats `12A–12D` `€24.00` (`0.71`), 20kg Bag `€39.99` (`0.58`), Car Hire (`0.29`, drawer), Total `€139.99`.
   * Never introduce dark patterns (`Seat 14A`, `09:42` countdown timers, scarcity counters, or pre-selected toggles).
3. **Assertive BBP Headlines & Tripartite Speaker Notes:**
   * Every content slide must have a 10–15 word subject+verb headline.
   * Every slide must end with a Slidev speaker note HTML comment containing `PURPOSE:`, `VERBAL SCRIPT:`, and `TRANSITION:`.
4. **PII & Link Hygiene:**
   * Never include developer names or LDAPs (`.blocked_terms`). Use relative markdown links in committed files.

---

## 4. Co-Evolution & Verification Commands

1. **Run Automated Deck Verification (Pytest):**
   ```bash
   uv run pytest dev/tests/test_slides_deck.py
   ```
2. **Start Interactive Slidev Dev Server (with FastAPI Backend):**
   ```bash
   # Terminal 1: FastAPI + ADK Backend (:8000)
   uv run uvicorn dev.core.app:app --host 0.0.0.0 --port 8000

   # Terminal 2: Slidev Presentation (:3030)
   npm --prefix dev/slides run dev
   ```
3. **Build Static SPA Bundle:**
   ```bash
   npm --prefix dev/slides run build
   ```
