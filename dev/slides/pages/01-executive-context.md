---
layout: cloud-toc
title: "Contents"
subtitle: "A 4-Act executive and technical walkthrough of the Dynamic Check-in & Ancillary Flow Engine, live App 2026 Help Hub prototype, and 4-Pillar repository architecture."
---

<div class="toc-row">
  <div>
    <span class="toc-label">Executive Context &amp; Check-in Funnel Compression</span>
    <span class="toc-desc">Why static 7-page carousels cause banner blindness and how dynamic 0–2 page packing drives +6.3pp conversion</span>
  </div>
  <span class="toc-num">01</span>
</div>

<div class="toc-row">
  <div>
    <span class="toc-label">Live Customer Journey: App 2026 Help Hub</span>
    <span class="toc-desc">Interactive walkthrough of Marta Byrne's 2-step family trip (DUB → FAO, FR1234) and the 1-step Zero-Offer path</span>
  </div>
  <span class="toc-num">02</span>
</div>

<div class="toc-row">
  <div>
    <span class="toc-label">Hybrid ADK &amp; Deterministic Scoring Architecture</span>
    <span class="toc-desc">Sub-300ms pipeline (~57ms tools + 220ms Gemini Flash circuit breaker), 4 rule gates, and live signal overrides</span>
  </div>
  <span class="toc-num">03</span>
</div>

<div class="toc-row">
  <div>
    <span class="toc-label">Closed-Loop Observability &amp; 4-Pillar Co-Evolution</span>
    <span class="toc-desc">Screen 10 real-time model feedback dashboard, 100% schema-validated OpenTelemetry traces, and living Slidev sync</span>
  </div>
  <span class="toc-num">04</span>
</div>

<!--
PURPOSE: Orient the audience across the four acts of the presentation using the official Cloudstyle Slide 03 Table of Contents layout.
VERBAL SCRIPT: We have structured today's session into four acts. First, we quantify the business problem and our four measurable KPI targets. Second, we step directly into the live App 2026 Help Hub mobile experience for our canonical family booking and the zero-offer branch. Third, we open the hood on our hybrid Google ADK and deterministic rule engine. Finally, we examine the Screen 10 feedback loop and how this repository and presentation co-evolve together.
TRANSITION: Let's begin with the core passenger problem in traditional airline check-in flows.
-->

---
layout: cloud-twotone
eyebrow: "THE CHECK-IN FUNNEL DILEMMA · SLIDE 41 CONTRAST"
firstClause: "Static 7-page upsell carousels trigger banner blindness,"
accentClause: "forcing 4.6 average skipped screens and 134-second check-ins."
---

<div class="contrast-5050">
  <!-- Left Dark Block (#202124 — Point A: Legacy Static Carousel) -->
  <div class="contrast-dark">
    <div class="c-tag-red">LEGACY STATIC FUNNEL (7 FIXED SCREENS)</div>
    <h3>Every passenger traverses the same rigid upsell gauntlet</h3>
    <ul>
      <li><strong>8 catalog items forced sequentially:</strong> Priority, Seats, Bags, Fast Track, Insurance, Car Hire, Transfers, and Flexi upgrades render regardless of route eligibility.</li>
      <li><strong>Severe skip fatigue:</strong> Passengers tap skip Across <strong>4.6 pages on average</strong>, taking <strong>2m 14s (134s)</strong> to reach their boarding passes.</li>
      <li><strong>Zero contextual memory:</strong> Passengers who declined Travel Insurance 6 times in a row are asked a 7th time; return Fast Track is pitched even when unavailable at Faro.</li>
    </ul>
  </div>

  <!-- Right Light Block (#FFFFFF — Point B: Dynamic ryta Engine) -->
  <div class="contrast-light">
    <div class="c-tag-blue">DYNAMIC HELP HUB ENGINE (0 TO 2 OFFER PAGES)</div>
    <h3>Relevance ranking + hard eligibility rules compress the flow</h3>
    <ul>
      <li><strong>Single-pass server scoring (&lt; 300ms):</strong> Evaluates all 8 ancillaries at check-in entry and strips ineligible or repeatedly declined extras before a single pixel renders.</li>
      <li><strong>0, 1, or 2 dynamic offer pages:</strong> High-propensity items (`≥ 0.50`) surface above the fold; mid-tier items (`0.10–0.49`) collapse into a single drawer; `0` qualifying offers go straight to `"1 STEP"`.</li>
      <li><strong>Ethical UX by contract:</strong> Zero pre-selection, equal-weight `"No thanks, continue →"` pills, and zero artificial countdown timers.</li>
    </ul>
  </div>
</div>

<style>
.contrast-5050 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border: 1px solid #D9D9D9;
  height: 300px;
}
.contrast-dark {
  background: #202124;
  color: #FFFFFF;
  padding: 18px 22px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.contrast-light {
  background: #FFFFFF;
  color: #202124;
  padding: 18px 22px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.contrast-dark h3, .contrast-light h3 {
  font-size: 1.02rem;
  font-weight: 500;
  margin: 0;
}
.contrast-dark ul, .contrast-light ul {
  margin: 0;
  padding-left: 16px;
  font-size: 0.78rem;
  line-height: 1.48;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.c-tag-red {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #F28B82;
}
.c-tag-blue {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #4285F4;
}
</style>

<!--
PURPOSE: Contrast the legacy 7-page static check-in funnel against the dynamic 0-to-2 page Help Hub engine using the Cloudstyle Two-Tone headline and 50/50 Dark-Light split contrast.
VERBAL SCRIPT: Traditional airline check-in flows treat every trip identically, forcing passengers through up to seven sequential upsell pages. Passengers develop muscle-memory banner blindness, averaging 4.6 pages and 134 seconds just to reach their boarding pass. On the right, our Dynamic Ancillary Flow engine evaluates all eight products server-side, removes ineligible or repeatedly declined offers, and packs only high-relevance items into at most two clean pages—or zero offer pages when nothing qualifies.
TRANSITION: Let's look at the four concrete, falsifiable KPI targets this compression unlocks.
-->

---
layout: cloud-four-cards
eyebrow: "MEASURABLE PROJECT OBJECTIVES · CLOUDSTYLE SLIDE 28 COMPARATIVE MATRIX"
title: "Dynamic page assembly targets a +6.3pp conversion lift while cutting check-in time nearly in half."
---

<div class="cs-comp-card">
  <div class="card-kpi-top">≤ 2.0</div>
  <div class="card-header-title">Offer Pages / Check-in</div>
  <div class="cs-comp-card-divider"></div>
  <div class="card-body-copy">
    Compresses the funnel from <strong>4.6 average pages</strong> down to <strong>1.8 achieved</strong> in benchmark runs—and <strong>0 offer pages</strong> (`1 STEP`) when no ancillaries pass the `0.10` floor.
  </div>
</div>

<div class="cs-comp-card">
  <div class="card-kpi-top">≤ 75s</div>
  <div class="card-header-title">Median Time to Pass</div>
  <div class="cs-comp-card-divider"></div>
  <div class="card-body-copy">
    Reduces median check-in completion time from <strong>134s (2m 14s)</strong> to <strong>71s achieved</strong> (`-47%`), with empty baskets bypassing Review &amp; Pay entirely.
  </div>
</div>

<div class="cs-comp-card">
  <div class="card-kpi-top">24.1%</div>
  <div class="card-header-title">Ancillary Attach Rate</div>
  <div class="cs-comp-card-divider"></div>
  <div class="card-body-copy">
    Delivers a <strong>+6.3 percentage point lift</strong> over the <strong>17.8%</strong> static baseline strictly through relevance ranking and zero dark patterns.
  </div>
</div>

<div class="cs-comp-card">
  <div class="card-kpi-top">≤ 300ms</div>
  <div class="card-header-title">Server p95 Latency SLA</div>
  <div class="cs-comp-card-divider"></div>
  <div class="card-body-copy">
    Deterministic scoring + rules execute in <strong>~57ms</strong>, guarded by a hard <strong>220ms circuit breaker</strong> around ADK `gemini-3.8-flash` copy synthesis.
  </div>
</div>

<template #bottom>
  <div class="takeaway-strip">
    <strong>Gate 4 Empirical Verification:</strong> All 4 targets are continuously verified via automated pytest suites (`dev/tests/`) and schema-validated execution logs in <code>results/telemetry_traces.jsonl</code>.
  </div>
</template>

<style>
.card-kpi-top {
  font-size: 2.1rem;
  font-weight: 400;
  color: #4285F4;
  text-align: center;
  line-height: 1.1;
  margin-bottom: 6px;
}
.card-header-title {
  font-size: 0.86rem;
  font-weight: 700;
  color: #202124;
  text-align: center;
}
.card-body-copy {
  font-size: 0.74rem;
  line-height: 1.45;
  color: #202124;
}
.takeaway-strip {
  background: #F8F9FA;
  border: 1px solid #E8EAED;
  border-left: 4px solid #4285F4;
  padding: 8px 14px;
  font-size: 0.76rem;
  color: #202124;
}
</style>

<!--
PURPOSE: Present the four core project objectives and empirical Gate 4 metrics using the Cloudstyle 4-Card Comparative Matrix (Slide 28 archetype).
VERBAL SCRIPT: Every architectural decision in this repository maps to four measurable targets: first, compressing offer pages from 4.6 down to at most 2.0—achieving 1.8 in our evaluation suite. Second, cutting median time-to-boarding-pass from 134 seconds to 71 seconds. Third, lifting ancillary attach rate by 6.3 percentage points to 24.1% without pre-selected checkboxes. And fourth, executing the entire scoring, rule-filtering, and ADK copy pipeline inside a 300-millisecond p95 budget.
TRANSITION: Let's transition to Act II and see how these numbers translate into Marta Byrne's live mobile check-in journey.
-->
