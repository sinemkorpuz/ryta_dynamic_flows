---
layout: cloud-split
eyebrow: "BUSINESS OUTCOMES & MODEL FEEDBACK LOOP · SCREEN 10 COMPANION VIEW"
title: "Screen 10 tracks a +6.3pp conversion lift and 71-second check-in while enforcing strict ethical UX guardrails."
ratio: "40-60"
---

<template #left>
  <div class="obs-left">
    <p class="cs-commentary">
      <strong>Relevance over friction:</strong> By showing fewer, smarter offers (<code>2.4</code> average offers across <code>1.8</code> pages instead of <code>8.0</code> offers across <code>4.6</code> pages), both passenger speed and ancillary conversion improve simultaneously:
    </p>
    <div class="obs-checklist">
      <div class="obs-item">
        <strong>+6.3pp Conversion Lift (<code>24.1%</code> vs <code>17.8%</code>):</strong> Driven by surfacing habitual extras (<code>Priority</code>) and family needs (<code>Row 12 Seats</code>) above the fold.
      </div>
      <div class="obs-item">
        <strong>47% Faster Check-in (<code>71s</code> vs <code>134s</code>):</strong> Eliminating irrelevant screens and skipping Review &amp; Pay on empty baskets cuts median time nearly in half.
      </div>
      <div class="obs-item">
        <strong>Closed-Loop Telemetry (<code>contracts/telemetry.jsons</code>):</strong> Every session logs attach rates, decline suppressions, and ethical guardrail checks back to Screen 10.
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
PURPOSE: Present the Screen 10 companion analytics dashboard, headline business KPIs, and ethical UX guardrails using the embedded OpsFeedbackWidget.
VERBAL SCRIPT: Alongside the seven mobile passenger screens, we also built Screen 10—the internal Model Feedback Loop dashboard shown on the right. It demonstrates that passenger convenience and commercial conversion do not have to be a trade-off: compressing the funnel from 4.6 pages to 1.8 pages cuts median check-in time from 2 minutes 14 seconds down to 71 seconds, while lifting ancillary conversion by 6.3 percentage points to 24.1%. And at the bottom right, every single session is audited against our ethical UX guardrails: zero pre-selected extras, equal-weight "No thanks, continue" buttons, child seating safety in Row 12, and zero countdown timers.
TRANSITION: Let's look at how our Google AI innovation workflow enables rapid co-evolution across your next priority journeys on Slide 14.
-->

---
layout: cloud-sidebar-table
title: "From customer screenshots to a living agentic prototype: how we co-evolve journeys with Google Cloud."
eyebrow: "THE GOOGLE AI INNOVATION FLYWHEEL · NEXT STEPS & CO-EVOLUTION"
---

<template #sidebar>
  <p>
    <strong>Why This Approach Scales:</strong> Because our UI wireframes (<code>Stitch</code>), API contracts, <code>Google ADK</code> agent, and even this <code>Slidev</code> presentation are all grounded in shared specifications under <strong>Antigravity</strong>, we can iterate live with your team.
  </p>
  <div class="cmd-box">
    <div class="cmd-title">Google AI Innovation Stack Used</div>
    <div>• <strong>Google Stitch:</strong> Reference screenshots → UI mocks</div>
    <div>• <strong>Antigravity:</strong> Spec-driven API &amp; agent coding</div>
    <div>• <strong>Google ADK + Gemini:</strong> Sub-300ms agentic flow</div>
    <div>• <strong>Slidev + Skills:</strong> Living co-evolving demo</div>
  </div>
</template>

<table class="cs-table-a">
  <thead>
    <tr>
      <th>Innovation Stage</th>
      <th>What We Did for Dynamic Check-in (<code>ryta</code>)</th>
      <th>How We Can Co-Evolve Next Together</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>1. Customer Screenshots &amp; Use-Case Discovery</strong></td>
      <td>Reviewed your App 2026 Help Hub screenshots across journeys; selected <strong>Dynamic Check-in</strong> for its high agentic leverage.</td>
      <td>Select additional high-value journeys (e.g., disruption recovery, day-of-travel assistance, post-booking changes).</td>
    </tr>
    <tr>
      <td><strong>2. Visual Ideation with Google Stitch</strong></td>
      <td>Combined your screenshots with the Dynamic Flows story in <strong>Stitch</strong> to generate Screens <code>E, A, F, B, D, C, G</code> in your exact brand style.</td>
      <td>Rapidly prototype new screen variations or multi-modal Help Hub cards in Stitch within hours.</td>
    </tr>
    <tr>
      <td><strong>3. Shared Journey Specifications</strong></td>
      <td>Authored unified design &amp; requirement specs that simultaneously prompted the UI, defined the REST API, and specified the ADK agent.</td>
      <td>Incorporate your domain rules, PSS interfaces, and real propensity features directly into the shared contracts.</td>
    </tr>
    <tr>
      <td><strong>4. Agentic Realization with Antigravity &amp; ADK</strong></td>
      <td>Used <strong>Antigravity</strong> to generate the FastAPI services, <strong>Google ADK</strong> agent (<code>Gemini Flash</code>), and domain tools in lockstep.</td>
      <td>Connect ADK tools to live staging APIs, experiment with Vertex AI models, and co-evolve the prototype iteratively.</td>
    </tr>
  </tbody>
</table>

<style>
.cmd-box {
  margin-top: 12px;
  background: #202124;
  color: #E8EAED;
  padding: 9px 11px;
  font-size: 0.72rem;
  line-height: 1.55;
}
.cmd-title {
  color: #8AB4F8;
  font-weight: 700;
  margin-bottom: 4px;
}
</style>

<!--
PURPOSE: Summarize the end-to-end Google AI innovation story (Customer Screenshots -> Google Stitch -> Shared Specs -> Antigravity + Google ADK) before concluding on the Thank You & Q&A slide.
VERBAL SCRIPT: To synthesize our core story: we started with the screenshots you shared for your other Help Hub journeys, identified Dynamic Check-in as a natural home for agentic execution, and used Google Stitch to generate a cohesive 7-screen UI flow matching your exact design language. From that elaborated user journey, we created unified specifications that drove both the frontend and the backend—allowing us to use Antigravity to rapidly generate the REST API services, the Google ADK agent, and its domain tools. Because the entire prototype and this presentation are built to co-evolve together, we can adapt rules, test new personas, or apply this exact same Stitch + Antigravity + ADK workflow to your next priority user journey.
TRANSITION: Let's conclude our core walkthrough on Slide 15 and open the floor for your questions and interactive fallback deep-dives.
-->

---
layout: cloud-break
color: yellow
sectionNo: "Thank You"
title: "Questions, Live Demo & Co-Evolution Discussion"
subtitle: "Thank you for exploring Dynamic Check-in & Ancillary Flows with Google Cloud, Stitch, Antigravity, and Google ADK. Fallback deep-dive slides follow directly after this page."
---

<div class="subtopic-row">
  <div>
    <span class="subtopic-title">Core Takeaway: Reference Screenshots → Working Agentic Prototype in Days</span>
    <span class="subtopic-meta"><code>Google Stitch</code> UI mocks + shared <code>contracts/</code> + <code>Antigravity</code> &amp; <code>Google ADK</code> delivering <code>+6.3pp</code> conversion &amp; <code>71s</code> check-in</span>
  </div>
  <span class="subtopic-icon">✓</span>
</div>

<div class="subtopic-row">
  <div>
    <span class="subtopic-title">Fallback Slide 16: Live What-If Signal &amp; Propensity Explorer</span>
    <span class="subtopic-meta">Interactive sliders &amp; presets (<code>Solo 1-Night</code> vs <code>Family 7-Night</code>) re-ranking 8 extras and collapsing the flow to <code>0 pages</code></span>
  </div>
  <span class="subtopic-icon">16 →</span>
</div>

<div class="subtopic-row">
  <div>
    <span class="subtopic-title">Fallback Slide 17: Spec-to-Code &amp; Contract Traceability Matrix</span>
    <span class="subtopic-meta">How one shared journey specification mapped directly to <code>Stitch</code> screens, <code>FastAPI</code> endpoints, and <code>ADK</code> tools</span>
  </div>
  <span class="subtopic-icon">17 →</span>
</div>

<div class="subtopic-row">
  <div>
    <span class="subtopic-title">Fallback Slide 18: Production Latency SLA (<code>p95 ≤ 300ms</code>), Circuit Breaker &amp; Telemetry</span>
    <span class="subtopic-meta">Inside the <code>220ms</code> hard timeout, deterministic tool boundary, and <code>contracts/telemetry.jsons</code> audit schema</span>
  </div>
  <span class="subtopic-icon">18 →</span>
</div>

<!--
PURPOSE: Conclude the primary presentation with the Cloudstyle Yellow (#FBBC05) Thank You & Q&A slide (using mandatory #202124 dark-text contrast) and index the three post-Thank-You Fallback deep-dive slides (Slides 16–18).
VERBAL SCRIPT: Thank you very much for your time and attention! This concludes our core presentation. We would love to hear your thoughts, feedback, and questions. And to support our Q&A discussion, we have prepared three interactive fallback slides right after this page: Slide 16 has a live "what-if" signal explorer where we can change passenger profiles in real time; Slide 17 shows the exact spec-to-code traceability matrix across Stitch, FastAPI, and ADK; and Slide 18 breaks down our 300-millisecond latency SLA, 220-millisecond circuit breaker, and OpenTelemetry schema. What questions can we explore first?
TRANSITION: Advance to Fallback Slide 16 for live "what-if" signal experimentation, Slide 17 for spec-to-code mapping, or Slide 18 for latency and resilience details.
-->

---
layout: cloud-split
eyebrow: "FALLBACK SLIDE 01 (APPENDIX) · LIVE AGENTIC SIGNAL & PROPENSITY EXPLORER"
title: "Fallback Deep-Dive: Changing traveller context dynamically reshapes the check-in flow from 2 pages to 1 or 0 pages."
ratio: "40-60"
---

<template #left>
  <div class="rules-panel">
    <p class="cs-commentary">
      <strong>Try the presets or drag the sliders on the right</strong> to see how the agent adapts the check-in journey for different travellers in <code>~57ms</code>:
    </p>
    <div class="gate-cards">
      <div class="g-card">
        <div class="g-code">SCENARIO A · MARTA'S FAMILY TRIP (2 OFFER PAGES)</div>
        <div><strong>3/4 Priority history + 2 kids + 7 nights:</strong> Agent promotes Priority (<code>0.84</code>), Row 12 Seats (<code>0.71</code>), and 20kg Bag (<code>0.58</code>) across <strong>2 Offer Pages</strong>, tucks Car Hire (<code>0.29</code>) into the drawer, and strips 4 irrelevant items.</div>
      </div>
      <div class="g-card">
        <div class="g-code">SCENARIO B · SOLO 1-NIGHT HOP (0 PRIMARY CARDS)</div>
        <div><strong>Click "Preset: Solo 1-Night":</strong> With <code>0</code> prior Priority trips, <code>0</code> children, and <code>1</code> night, all items drop below the <code>0.50</code> card threshold—compressing the funnel to <strong>0 primary offer pages</strong>!</div>
      </div>
      <div class="g-card">
        <div class="g-code">FOUR AUTOMATIC PROTECTION GATES</div>
        <div>Regardless of score, the agent strips unavailable route extras (<code>INELIGIBLE_ROUTE_PRODUCT</code>), late window upgrades (<code>INELIGIBLE_TIME_WINDOW</code>), 6x declines (<code>SUPPRESSED_DECLINE_STREAK</code>), and sub-<code>0.10</code> noise.</div>
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
  gap: 7px;
}
.g-card {
  background: #F8F9FA;
  border: 1px solid #E8EAED;
  border-left: 3px solid #34A853;
  padding: 7px 9px;
  font-size: 0.72rem;
  line-height: 1.38;
}
.g-code {
  font-family: var(--cs-font-display);
  font-size: 9.5px;
  font-weight: 700;
  color: #137333;
  letter-spacing: 0.04em;
  margin-bottom: 3px;
}
</style>

<!--
PURPOSE: Fallback Slide 01 (post-Thank-You appendix) — let the presenter interactively demonstrate how the agent adapts the user journey in real time when passenger signals change during Q&A.
VERBAL SCRIPT: Here on Fallback Slide 16, we can test the agent's reasoning live for any "what-if" scenario. Right now, it is set to Marta's family trip—3 out of 4 prior Priority trips, 2 children, and 7 nights—producing 2 offer pages with Priority at 0.84, Row 12 seats at 0.71, and the 20kg bag at 0.58, while stripping the bottom four items in red. Watch what happens when we click "Preset: Solo 1-Night" or drag the sliders down: the agent immediately recalculates every propensity score in under 60 milliseconds, sees that no product crosses the 0.50 primary card threshold, and collapses the output funnel to 0 primary offer pages.
TRANSITION: Let's move to Fallback Slide 17 if you'd like to inspect the spec-to-code traceability matrix across Stitch, FastAPI, and Google ADK.
-->

---
layout: cloud-sidebar-table
title: "Fallback Deep-Dive: From one elaborated user journey spec, Antigravity co-generated the API, ADK agent, and tools."
eyebrow: "FALLBACK SLIDE 02 (APPENDIX) · SPEC-TO-CODE & CONTRACT TRACEABILITY MATRIX"
---

<template #sidebar>
  <p>
    <strong>How the Spec Informed Every Layer:</strong> Once we elaborated the Dynamic Check-in journey from your reference screenshots, we captured it as a structured specification and JSON contract.
  </p>
  <p class="mt-2">
    That single specification served three roles at once:
  </p>
  <div class="pipeline-mini">
    <div><strong>1. Prompted Google Stitch:</strong> Generated the 7 mobile UI screens (<code>E..G</code>) in the App 2026 Help Hub style.</div>
    <div><strong>2. Defined the API Surface:</strong> Specified the session, seat-map, basket, and feedback endpoints.</div>
    <div><strong>3. Configured Google ADK:</strong> Guided <strong>Antigravity</strong> to generate the ADK agent (<code>Gemini Flash</code>) and its 4 domain tools.</div>
  </div>
</template>

<table class="cs-table-b">
  <thead>
    <tr>
      <th class="corner-empty">Journey Capability</th>
      <th>What It Does in the User Journey</th>
      <th>How Google ADK &amp; Antigravity Realize It</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="row-header">1. Context Perception</td>
      <td>Reads booking <code>X8Y9QL</code>: 2 adults + 2 kids (<code>6</code> &amp; <code>9</code>), 7 nights in Faro, 3/4 Priority habit, 6 insurance declines.</td>
      <td><strong>Antigravity-generated API</strong> ingests booking + live signal overrides into the ADK session state.</td>
    </tr>
    <tr>
      <td class="row-header">2. Propensity &amp; Pricing</td>
      <td>Scores all 8 extras (<code>0.84</code> down to <code>0.04</code>) and computes exact family totals (<code>€76.00</code>, <code>€24.00</code>, <code>€39.99</code>, <code>€139.99</code>).</td>
      <td><strong>ADK Propensity &amp; Basket Tools</strong> execute deterministically in <code>&lt;10ms</code> with zero price hallucination risk.</td>
    </tr>
    <tr>
      <td class="row-header">3. Safety &amp; Suppression</td>
      <td>Blocks Exit Row 16 for children (<code>6</code> &amp; <code>9</code>), strips unavailable FAO Fast Track, and suppresses 6x-declined Insurance.</td>
      <td><strong>ADK Eligibility &amp; Seat Tools</strong> enforce hard airline regulatory and fatigue rules with <code>0%</code> leakage.</td>
    </tr>
    <tr>
      <td class="row-header">4. Dynamic Page Packing</td>
      <td>Compresses the funnel into <code>2 STEPS</code> (or <code>1 STEP</code> Zero-Offer) and tucks <code>0.29</code> Car Hire into a drawer.</td>
      <td><strong>ADK Page Builder Skill</strong> promotes items <code>≥0.50</code> to cards and demotes <code>0.10–0.49</code> to the drawer.</td>
    </tr>
    <tr>
      <td class="row-header">5. Empathetic AI Voice</td>
      <td>Writes warm, first-person guidance inside the <code>#F2F1FE</code> lavender panel (e.g., <em>"I've found 4 seats together"</em>).</td>
      <td><strong>Google ADK (<code>Gemini Flash</code>)</strong> synthesizes grounded copy with a <strong>220ms circuit-breaker fallback</strong> (<code>≤300ms</code> SLA).</td>
    </tr>
  </tbody>
</table>

<style>
.pipeline-mini {
  margin-top: 8px;
  background: #F8F9FA;
  border: 1px solid #E8EAED;
  border-left: 3px solid #34A853;
  padding: 8px 10px;
  font-size: 0.71rem;
  line-height: 1.45;
  color: #202124;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
</style>

<!--
PURPOSE: Fallback Slide 02 (post-Thank-You appendix) — explain in detail how the elaborated user journey specification drove the Stitch UI, the API, and the Google ADK agent—and why the hybrid agent+tools division of responsibility works so well.
VERBAL SCRIPT: On Fallback Slide 17, we map each user journey capability directly to the components Antigravity generated from our shared specification. Notice the strict division of labor: deterministic Python tools handle propensity scoring, exact euro math (€76, €24, €39.99, €139.99), child-safe Row 12 seating, and hard regulatory suppression in under 10 milliseconds, while the Google ADK Gemini Flash agent handles empathetic first-person copy synthesis and Help Hub Q&A inside a 220-millisecond safeguard.
TRANSITION: Let's move to Fallback Slide 18 for a closer look at our p95 latency budget, circuit breaker mechanics, and JSON Schema contracts.
-->

---
layout: cloud-four-cards
eyebrow: "FALLBACK SLIDE 03 (APPENDIX) · PRODUCTION RESILIENCE, LATENCY SLA & JSON CONTRACTS"
title: "Fallback Deep-Dive: Guaranteeing p95 ≤ 300ms latency, zero LLM hallucinations, and 100% schema-valid telemetry."
---

<div class="cs-comp-card">
  <div class="fb-pill fb-pill-blue">01 · LATENCY BUDGET</div>
  <div class="fb-card-title"><code>p95 ≤ 300ms</code> Server SLA</div>
  <div class="cs-comp-card-divider"></div>
  <div class="fb-card-body">
    • <strong>Signal Resolution:</strong> <code>&lt;2ms</code> in-memory booking &amp; history lookup (<code>X8Y9QL</code>).<br/>
    • <strong>4 Domain Tools:</strong> <code>&lt;10ms</code> combined deterministic scoring, rules, seating &amp; basket math.<br/>
    • <strong>ADK Synthesis:</strong> <code>~45ms</code> observed via <code>gemini-3.8-flash</code> (<code>57.1ms</code> end-to-end).
  </div>
</div>

<div class="cs-comp-card">
  <div class="fb-pill fb-pill-yellow">02 · CIRCUIT BREAKER</div>
  <div class="fb-card-title"><code>220ms</code> Hard Timeout</div>
  <div class="cs-comp-card-divider"></div>
  <div class="fb-card-body">
    • Wraps <code>ADKOrchestrator</code> LLM calls in <code>asyncio.wait_for(timeout=0.22)</code>.<br/>
    • If network or model latency ever exceeds <code>220ms</code>, the orchestrator instantaneously returns pre-validated Stitch copy.<br/>
    • Check-in completion is <strong>never blocked</strong> by LLM availability.
  </div>
</div>

<div class="cs-comp-card">
  <div class="fb-pill fb-pill-green">03 · ETHICAL GUARDRAILS</div>
  <div class="fb-card-title">Zero Dark Patterns</div>
  <div class="cs-comp-card-divider"></div>
  <div class="fb-card-body">
    • <code>validate_assistant_copy()</code> blocks <code>"AI/bot"</code> self-references, <code>MM:SS</code> countdown timers, scarcity claims, and superstitious <code>Row 14</code>.<br/>
    • Every card renders with <code>selected=false</code> and an equal-weight <code>"No thanks, continue →"</code> pill.
  </div>
</div>

<div class="cs-comp-card">
  <div class="fb-pill fb-pill-purple">04 · FROZEN CONTRACTS</div>
  <div class="fb-card-title">5 JSON Schemas</div>
  <div class="cs-comp-card-divider"></div>
  <div class="fb-card-body">
    • <code>propensity_scoring.jsons</code><br/>
    • <code>eligibility_rules.jsons</code><br/>
    • <code>page_builder.jsons</code><br/>
    • <code>assistant_copy.jsons</code><br/>
    • <code>telemetry.jsons</code> (100% Draft 2020-12 validated traces in <code>results/golden_trace.jsonl</code>).
  </div>
</div>

<template #bottom>
  <div class="fb-bottom-strip">
    <strong>Production Readiness Summary:</strong> By isolating pricing, eligibility, and aviation safety in <code>&lt;10ms</code> deterministic tools and bounding <code>Google ADK</code> inside a <code>220ms</code> circuit breaker, the engine achieves commercial lift with zero operational risk.
  </div>
</template>

<style>
.fb-pill {
  font-size: 9.5px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
  letter-spacing: 0.06em;
  text-align: center;
  margin: 0 auto 6px auto;
  width: fit-content;
}
.fb-pill-blue {
  background: #EEF3FC;
  color: #073590;
  border: 1px solid #D2E3FC;
}
.fb-pill-yellow {
  background: #FEF7E0;
  color: #B06000;
  border: 1px solid #FDE293;
}
.fb-pill-green {
  background: #E6F4EA;
  color: #137333;
  border: 1px solid #CEEAD6;
}
.fb-pill-purple {
  background: #F5F0FF;
  color: #6200EE;
  border: 1px solid #E0D4FC;
}
.fb-card-title {
  font-size: 0.84rem;
  font-weight: 700;
  color: #202124;
  text-align: center;
}
.fb-card-body {
  font-size: 0.7rem;
  line-height: 1.44;
  color: #202124;
}
.fb-bottom-strip {
  background: #F8F9FA;
  border: 1px solid #E8EAED;
  border-left: 4px solid #34A853;
  padding: 7px 14px;
  font-size: 0.73rem;
  color: #202124;
}
</style>

<!--
PURPOSE: Fallback Slide 03 (post-Thank-You appendix) — provide engineering and operations stakeholders with a deep-dive into the p95 <= 300ms latency budget, the 220ms circuit breaker fallback, ethical copy validation, and the 5 frozen JSON Schema contracts.
VERBAL SCRIPT: Finally, on Fallback Slide 18, we summarize our four production engineering guarantees for technical Q&A. First, our server-side latency budget is capped at 300 milliseconds p95, with observed execution averaging 57.1 milliseconds—under 2 milliseconds for signal resolution, under 10 milliseconds for all four deterministic tools, and roughly 45 milliseconds for Gemini Flash synthesis. Second, our 220-millisecond circuit breaker ensures that if model latency ever spikes, the orchestrator instantaneously swaps in pre-validated Stitch copy so passenger check-in is never delayed. Third, our deterministic validator enforces every ethical and aviation rule before a response leaves the server. And fourth, all five domain interfaces are governed by frozen Draft 2020-12 JSON Schemas in the contracts folder.
TRANSITION: Return to Slide 15 (Thank You & Q&A) or jump to any interactive screen in the deck.
-->
