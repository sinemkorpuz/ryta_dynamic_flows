---
layout: cloud-break
color: green
sectionNo: "02"
title: "Hybrid ADK & Deterministic Scoring Architecture"
subtitle: "Decoupling stateless Python domain tools (<10ms) from ADK Gemini 3.8 Flash copy synthesis with a hard 220ms circuit breaker."
---

<div class="subtopic-row">
  <div>
    <span class="subtopic-title">ADR-01: Hybrid ADK + Deterministic Tools vs. Pure End-to-End LLM</span>
    <span class="subtopic-meta">100% euro pricing accuracy (`€76.00`, `€24.00`, `€39.99`), zero regulatory leakage, and ~57ms deterministic execution</span>
  </div>
  <span class="subtopic-icon">→</span>
</div>

<div class="subtopic-row">
  <div>
    <span class="subtopic-title">Four Sequential Eligibility &amp; Suppression Gates (`dev/tools/eligibility_rules.py`)</span>
    <span class="subtopic-meta">`INELIGIBLE_ROUTE_PRODUCT`, `INELIGIBLE_TIME_WINDOW`, `SUPPRESSED_DECLINE_STREAK`, and `BELOW_DISPLAY_FLOOR`</span>
  </div>
  <span class="subtopic-icon">→</span>
</div>

<div class="subtopic-row">
  <div>
    <span class="subtopic-title">Live Propensity &amp; Signal Override Explorer (`POST /api/v1/checkin/sessions`)</span>
    <span class="subtopic-meta">Interactive recalculation of propensity scores, rule removals, and 0-to-2 page packing</span>
  </div>
  <span class="subtopic-icon">→</span>
</div>

<!--
PURPOSE: Introduce Act III using the official Cloudstyle Green (#34A853) full-bleed Break Slide (Slide 08 archetype).
VERBAL SCRIPT: In Act III, we examine the engineering architecture behind the scenes. We will look at why we chose a hybrid architecture that pairs deterministic Python tools for scoring, pricing, and child seating safety with a Google ADK Gemini 3.8 Flash agent for first-person assistant copy—and then we will experiment with live signal overrides right on the slide.
TRANSITION: Let's compare our hybrid ADK pipeline against a pure LLM approach and trace the runtime sequence.
-->

---
layout: cloud-sidebar-table
title: "Decoupling deterministic propensity tools from ADK copy synthesis guarantees zero price hallucinations and sub-300ms latency."
eyebrow: "ARCHITECTURAL TRADE-OFF MATRIX · TABLE B"
---

<template #sidebar>
  <p>
    <strong>Strict Separation of Concerns (Rule 3):</strong> <code>dev/core/</code> is 100% domain-agnostic (FastAPI, ADK Runner, <code>220ms</code> circuit breaker, and OpenTelemetry middleware).
  </p>
  <p class="mt-2">
    All airline scoring formulas, euro prices, Boeing 737 child seating rules, and fallback templates live in <code>dev/tools/</code> and <code>dev/skills/</code>.
  </p>
  <div class="pipeline-mini">
    <div>1. <code>propensity_scorer.py</code> (&lt;5ms)</div>
    <div>2. <code>eligibility_rules.py</code> (&lt;3ms)</div>
    <div>3. <code>seat_allocator.py</code> (Row 12, &lt;4ms)</div>
    <div>4. <code>page_builder</code> Skill (0–2 pages)</div>
    <div>5. <code>assistant_copy</code> ADK (≤220ms cap)</div>
  </div>
</template>

<table class="cs-table-b">
  <thead>
    <tr>
      <th class="corner-empty">Quality Dimension</th>
      <th>Hybrid ADK + Deterministic Tools (Chosen)</th>
      <th>Pure End-to-End LLM Scoring (Rejected)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="row-header">Server Latency (p95)</td>
      <td><strong>~57ms</strong> deterministic core + <strong>220ms</strong> circuit breaker (<strong>≤ 300ms SLA guaranteed</strong>)</td>
      <td>850ms – 2,400ms multi-step token generation; violates 300ms mobile check-in budget.</td>
    </tr>
    <tr>
      <td class="row-header">Euro Pricing &amp; Totals</td>
      <td><strong>100% exact</strong> (<code>€76.00</code>, <code>€24.00</code>, <code>€39.99</code>, <code>€139.99</code> via <code>basket_pricing.py</code>)</td>
      <td>Risk of arithmetic drift or hallucinated per-passenger multipliers.</td>
    </tr>
    <tr>
      <td class="row-header">Child &amp; Route Safety</td>
      <td><strong>0% leakage</strong>: hard code gates block Exit Row 16 for ages 6 &amp; 9 and strip FAO Fast Track.</td>
      <td>Prompt injection or model non-determinism could surface ineligible products.</td>
    </tr>
    <tr>
      <td class="row-header">Resilience / Fallback</td>
      <td>Automatic <strong>220ms circuit breaker</strong> falls back to deterministic first-person templates (`100% HTTP 200`).</td>
      <td>Upstream HTTP 429/503 or tail latency stalls check-in initialization.</td>
    </tr>
    <tr>
      <td class="row-header">Personalization Copy</td>
      <td><strong>ADK <code>gemini-3.8-flash</code></strong> synthesizes warm first-person copy grounded in top propensity drivers.</td>
      <td>Unconstrained prose risks violating the 18-word card limit or using forbidden urgency terms.</td>
    </tr>
  </tbody>
</table>

<style>
.pipeline-mini {
  margin-top: 10px;
  background: #F8F9FA;
  border: 1px solid #E8EAED;
  padding: 8px 10px;
  font-family: var(--cs-font-mono);
  font-size: 0.7rem;
  line-height: 1.55;
  color: #185ABC;
}
</style>

<!--
PURPOSE: Explain Architectural Decision Record ADR-01 (Hybrid ADK + Deterministic Tools vs. Pure LLM) using the Cloudstyle Sidebar Commentary + Table B matrix (Slide 27 archetype).
VERBAL SCRIPT: A critical architectural question in agentic systems is what belongs in deterministic code versus what belongs in the LLM. In ryta, propensity scoring, euro pricing, Boeing 737 child seating adjacency, and the four removal gates run as pure, stateless Python tools in under 15 milliseconds—giving us 100% pricing accuracy and zero regulatory leakage. We then invoke our Google ADK Gemini 3.8 Flash skill strictly to synthesize the warm, first-person insight copy inside a hard 220-millisecond circuit breaker. If the upstream LLM ever exceeds 220 milliseconds, the circuit breaker immediately populates verified first-person template copy so p95 latency never exceeds 300 milliseconds.
TRANSITION: Let's interact with the propensity scorer and rule gates live on the next slide.
-->

---
layout: cloud-split
eyebrow: "LIVE PROPENSITY & RULE ENGINE · POST /api/v1/checkin/sessions"
title: "Live Propensity & Rule Explorer: Real-time signal overrides recalculate scores, rule gates, and page packing in <60ms."
ratio: "40-60"
---

<template #left>
  <div class="rules-panel">
    <p class="cs-commentary">
      <strong>Drag the signal sliders on the right</strong> to override passenger context and watch the 8 candidate ancillaries re-rank dynamically:
    </p>
    <div class="gate-cards">
      <div class="g-card">
        <div class="g-code">1 · INELIGIBLE_ROUTE_PRODUCT</div>
        <div>Strips <strong>Fast Track (`0.14`)</strong> because return-leg Fast Track is not sold at Faro (`FAO`).</div>
      </div>
      <div class="g-card">
        <div class="g-code">2 · INELIGIBLE_TIME_WINDOW</div>
        <div>Strips <strong>Flexi Upgrade (`0.04`)</strong> when <code>hours_to_departure ≤ 48</code>.</div>
      </div>
      <div class="g-card">
        <div class="g-code">3 · SUPPRESSED_DECLINE_STREAK</div>
        <div>Strips <strong>Travel Insurance (`0.11`)</strong> after <code>6 consecutive declines</code> (or current-session decline).</div>
      </div>
      <div class="g-card">
        <div class="g-code">4 · BELOW_DISPLAY_FLOOR</div>
        <div>Strips <strong>Airport Transfer (`0.08`)</strong> below <code>0.10</code>; items in <code>0.10–0.49</code> (`Car Hire 0.29`) demote to the Page 2 drawer.</div>
      </div>
    </div>
  </div>
</template>

<template #right>
  <LiveScoringExplorer />
</template>

<style>
.rules-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.gate-cards {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.g-card {
  background: #F8F9FA;
  border: 1px solid #E8EAED;
  border-left: 3px solid #34A853;
  padding: 6px 9px;
  font-size: 0.72rem;
  line-height: 1.36;
}
.g-code {
  font-family: var(--cs-font-mono);
  font-size: 9.5px;
  font-weight: 700;
  color: #137333;
  margin-bottom: 2px;
}
</style>

<!--
PURPOSE: Demonstrate live propensity score recalculation and the four deterministic eligibility/suppression gates using the embedded LiveScoringExplorer component.
VERBAL SCRIPT: On this slide, you can drag the sliders for Priority purchase history, number of children, and trip length, or click the preset buttons. In Marta's baseline, Priority scores 0.84, Row 12 seats score 0.71, the 20kg bag scores 0.58, and Car Hire scores 0.29—packing cleanly into two offer pages with Car Hire demoted into the drawer. Meanwhile, the four red pills at the bottom show the exact deterministic rule codes that stripped Fast Track, Travel Insurance, Airport Transfer, and Flexi Upgrade. If you click the "Solo 1-Night" preset, watch all primary cards drop below the 0.50 promotion threshold—automatically compressing the funnel.
TRANSITION: Let's move to Act IV to see how every execution emits schema-validated telemetry into the Screen 10 feedback loop and how we co-evolve this deck.
-->
