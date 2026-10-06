---
layout: cloud-break
color: yellow
sectionNo: "03"
title: "Closed-Loop Observability & 4-Pillar Co-Evolution"
subtitle: "Enforcing 100% schema-validated OpenTelemetry traces, real-time Screen 10 analytics, and continuous Slidev synchronization."
---

<div class="subtopic-row">
  <div>
    <span class="subtopic-title">Screen 10 Internal Model Feedback Loop (`GET /api/v1/analytics/summary`)</span>
    <span class="subtopic-meta">Real-time conversion (`24.1%`), pages/check-in (`1.8`), median completion time (`71s`), and per-offer attach rates</span>
  </div>
  <span class="subtopic-icon">→</span>
</div>

<div class="subtopic-row">
  <div>
    <span class="subtopic-title">100% Schema-Validated Telemetry (`contracts/telemetry.jsons`)</span>
    <span class="subtopic-meta">Every agent, skill, and tool span emits guardrail compliance flags to `results/telemetry_traces.jsonl`</span>
  </div>
  <span class="subtopic-icon">→</span>
</div>

<div class="subtopic-row">
  <div>
    <span class="subtopic-title">4-Pillar Assembly Line &amp; Living Slidev Co-Evolution (`dev/slides/`)</span>
    <span class="subtopic-meta">`Specify` → `Contract` → `Implement` → `Verify` with automated pytest governance</span>
  </div>
  <span class="subtopic-icon">→</span>
</div>

<!--
PURPOSE: Introduce Act IV using the official Cloudstyle Yellow (#FBBC05) full-bleed Break Slide (Slide 11 archetype), strictly enforcing the #202124 dark text contrast rule.
VERBAL SCRIPT: In our final act, notice how our Yellow Cloudstyle break slide automatically enforces the dark #202124 contrast rule across all typography, dividers, and footers. Here we cover two pillars of long-term operational excellence: first, our closed-loop telemetry and Screen 10 model feedback dashboard; and second, how our 4-Pillar repository architecture keeps specifications, contracts, code, and this Slidev presentation synchronized as the product evolves.
TRANSITION: Let's inspect the live Screen 10 analytics dashboard and golden telemetry trace on Slide 13.
-->

---
layout: cloud-split
eyebrow: "OBSERVABILITY & FEEDBACK LOOP · SCREEN 10 + CONTRACTS/TELEMETRY.JSONS"
title: "Every check-in session emits schema-valid telemetry that powers the Screen 10 model feedback dashboard."
ratio: "40-60"
---

<template #left>
  <div class="obs-left">
    <p class="cs-commentary">
      <strong>Zero-Blind-Spot Observability (Objective 4):</strong> Every API call (`POST /sessions`, `POST /seats`, `POST /actions`, `POST /checkout`) writes structured JSONL events validated against <code>contracts/telemetry.jsons</code>.
    </p>
    <div class="obs-checklist">
      <div class="obs-item">
        <strong>Trace &amp; Span Correlation:</strong> Propagates W3C <code>trace_id</code> and <code>span_id</code> across FastAPI, ADK skills, and domain tools.
      </div>
      <div class="obs-item">
        <strong>Guardrail Audit Flags:</strong> Every trace records <code>zero_preselection: true</code>, <code>zero_urgency_timers: true</code>, and <code>child_seating_enforced: true</code>.
      </div>
      <div class="obs-item">
        <strong>Circuit Breaker Telemetry:</strong> Logs <code>fallback_triggered</code> and exact <code>latency_ms</code> (`~56.8ms`) for continuous SLA monitoring.
      </div>
    </div>
  </div>
</template>

<template #right>
  <OpsFeedbackWidget />
</template>

<style>
.obs-left {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.obs-checklist {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.obs-item {
  background: #F8F9FA;
  border: 1px solid #E8EAED;
  border-left: 3px solid #4285F4;
  padding: 7px 10px;
  font-size: 0.74rem;
  line-height: 1.42;
}
</style>

<!--
PURPOSE: Showcase the Screen 10 internal analytics feedback dashboard and golden OpenTelemetry trace verification using the embedded OpsFeedbackWidget component.
VERBAL SCRIPT: Observability is built into the contract layer from day one. On the right, our embedded Screen 10 dashboard displays the four headline KPIs alongside the monochromatic Cloudstyle blue attach-rate bar chart: 42% take-up on Priority, 35% on Row 12 seating, 24% on the 20kg checked bag, and 6% on the collapsed Car Hire drawer. Beneath the chart is an actual golden execution trace from results/telemetry_traces.jsonl, showing a 56.8-millisecond execution and explicit boolean verification of our ethical UX guardrails.
TRANSITION: Finally, let's look at how we maintain and co-evolve this entire system and Slidev deck going forward.
-->

---
layout: cloud-sidebar-table
title: "Our 4-Pillar assembly line co-evolves specifications, frozen contracts, implementation, and this Slidev deck in lockstep."
eyebrow: "4-PILLAR CO-EVOLUTION & ROADMAP · GATE 4 VERIFIED"
---

<template #sidebar>
  <p>
    <strong>Living Presentation Architecture:</strong> Because this deck lives in <code>dev/slides/</code> as modular Markdown partials + Vue 3 components governed by <code>.agents/skills/slidev-deck/SKILL.md</code>, any future feature or contract update automatically co-evolves the slides.
  </p>
  <div class="cmd-box">
    <div class="cmd-title">One-Command Demo &amp; Verify</div>
    <code>uv run uvicorn dev.core.app:app --port 8000</code><br/>
    <code>npm --prefix dev/slides run dev</code><br/>
    <code>uv run pytest</code>
  </div>
</template>

<table class="cs-table-a">
  <thead>
    <tr>
      <th>Pillar / Track</th>
      <th>Repository Path</th>
      <th>Stories &amp; Artifacts</th>
      <th>Current Gate &amp; Status</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>1. Specify</strong></td>
      <td><code>.agents/specs/</code></td>
      <td><code>system-architecture.md</code>, <code>adk-architecture.md</code>, <code>frontend-architecture.md</code>, <code>slides-architecture.md</code></td>
      <td><span class="status-done">Gate 1 Approved</span></td>
    </tr>
    <tr>
      <td><strong>2. Contract</strong></td>
      <td><code>contracts/*.jsons</code></td>
      <td><code>checkin_flow</code>, <code>seat_map</code>, <code>basket_checkout</code>, <code>analytics_summary</code>, <code>telemetry</code> (v1.0.0)</td>
      <td><span class="status-done">Gate 2 Frozen</span></td>
    </tr>
    <tr>
      <td><strong>3. Implement (ADK)</strong></td>
      <td><code>dev/core/</code>, <code>dev/tools/</code>, <code>dev/skills/</code></td>
      <td><code>ADK-001</code> .. <code>ADK-005</code>: FastAPI server, propensity scorer, 4 rule gates, Row 12 allocator, 220ms ADK breaker</td>
      <td><span class="status-done">Gate 4 Verified (~57ms)</span></td>
    </tr>
    <tr>
      <td><strong>3. Implement (UI)</strong></td>
      <td><code>dev/ui/</code></td>
      <td><code>FE-001</code> .. <code>FE-003</code>: Imported &amp; sanitized Stitch screens (<code>E, A, F, B, D, C, G</code>) + Screen 10 Studio at <code>GET /</code></td>
      <td><span class="status-done">Gate 4 Verified</span></td>
    </tr>
    <tr>
      <td><strong>3. Implement (Slides)</strong></td>
      <td><code>dev/slides/</code> + <code>.agents/skills/slidev-deck/</code></td>
      <td><code>FE-004</code>: 14-slide Cloudstyle 2.0 Slidev deck, dual-mode Vue simulators, tripartite speaker notes</td>
      <td><span class="status-done">Gate 4 Verified</span></td>
    </tr>
    <tr>
      <td><strong>4. Verify</strong></td>
      <td><code>results/</code> &amp; <code>dev/tests/</code></td>
      <td><code>telemetry_traces.jsonl</code>, contract schema tests, UX invariant checks, and Slidev deck test suite</td>
      <td><span class="status-done">100% Passing</span></td>
    </tr>
  </tbody>
</table>

<style>
.cmd-box {
  margin-top: 12px;
  background: #202124;
  color: #E8EAED;
  padding: 9px 11px;
  font-family: var(--cs-font-mono);
  font-size: 0.68rem;
  line-height: 1.55;
}
.cmd-title {
  color: #8AB4F8;
  font-weight: 700;
  margin-bottom: 4px;
  font-family: var(--cs-font-display);
}
.status-done {
  background: #E6F4EA;
  color: #137333;
  font-weight: 700;
  font-size: 0.68rem;
  padding: 2px 7px;
  border-radius: 999px;
  white-space: nowrap;
}
</style>

<!--
PURPOSE: Conclude the presentation with the 4-Pillar status matrix, co-evolution workflow, and Q&A discussion prompts using the Cloudstyle Sidebar Commentary + Table A layout.
VERBAL SCRIPT: To wrap up, every single pillar of the Ryanair Dynamic Ancillary Flows repository—from our architecture specs in .agents/specs/ and frozen JSON schemas in contracts/ to our FastAPI ADK backend, sanitized Stitch UI, and this Cloudstyle 2.0 Slidev deck—has reached Gate 4 Verification. Because our deck is modularized under dev/slides/ and paired with a dedicated agent skill and automated pytest suite, we can co-evolve the presentation alongside new personas, routes, and model iterations with zero drift. Thank you—we would love to open the floor for questions and live scenario testing!
TRANSITION: Open the floor for customer Q&A and interactive signal testing on Slide 07 or Slide 11.
-->
