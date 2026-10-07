---
layout: cloud-toc
title: "Contents (1 / 2)"
subtitle: "Core Flow Part I — Use-Case Motivation, Stitch + Antigravity Prototyping, System & ADK Architectures, and Journey Setup (Slides 04–10)."
---

<div class="toc-row">
  <div>
    <span class="toc-label">Motivating the Use Case: Why Agent-Driven Check-in?</span>
    <span class="toc-desc">Why static 7-page upsell carousels cause skip fatigue—and why check-in fits agentic execution</span>
  </div>
  <span class="toc-num">04</span>
</div>

<div class="toc-row">
  <div>
    <span class="toc-label">The Agentic Prototyping Story: Stitch → Antigravity → ADK</span>
    <span class="toc-desc">Turning customer reference screenshots into UI mocks, shared specs, REST APIs, and a <code>Google ADK</code> agent</span>
  </div>
  <span class="toc-num">05</span>
</div>

<div class="toc-row">
  <div>
    <span class="toc-label">Section 01 Break: System &amp; Google ADK Architecture</span>
    <span class="toc-desc">Establishing the end-to-end system topology and ADK agent/tools mental model before the UI walkthrough</span>
  </div>
  <span class="toc-num">06</span>
</div>

<div class="toc-row">
  <div>
    <span class="toc-label">System Architecture Overview (<code>Client → LB → Server → ADK</code>)</span>
    <span class="toc-desc">4-tier topology connecting App 2026 UI, <code>Cloud Load Balancer</code>, <code>FastAPI</code>, and <code>Google ADK</code></span>
  </div>
  <span class="toc-num">07</span>
</div>

<div class="toc-row">
  <div>
    <span class="toc-label">Google ADK Agent Internals &amp; Tool Execution Workflow</span>
    <span class="toc-desc"><code>ADKOrchestrator</code>, 3 declarative skills, 4 deterministic tools (<code>&lt;10ms</code>), <code>gemini-3.8-flash</code> &amp; <code>220ms</code> circuit breaker</span>
  </div>
  <span class="toc-num">08</span>
</div>

<div class="toc-row">
  <div>
    <span class="toc-label">Section 02 Break: End-to-End User Journey &amp; Wireframe Walkthrough</span>
    <span class="toc-desc">Tracing the ADK architecture in action across Marta Byrne's family trip and all 7 Stitch screens</span>
  </div>
  <span class="toc-num">09</span>
</div>

<div class="toc-row">
  <div>
    <span class="toc-label">Pre-Render Agentic Reasoning: Marta Byrne's Family Trip</span>
    <span class="toc-desc">Scoring 8 ancillaries in <code>~57ms</code> for flight <code>FR1234</code> (<code>DUB → FAO</code>) and compressing 7 pages into 2 steps</span>
  </div>
  <span class="toc-num">10</span>
</div>

<!--
PURPOSE: Orient the audience across Part 1 of the prioritized presentation agenda (Slides 04 to 10), covering use-case motivation, the Stitch + Antigravity prototyping workflow, the upfront System & ADK Architecture diagrams, and Marta Byrne's pre-render reasoning.
VERBAL SCRIPT: Here is Part 1 of our prioritized flow. On Slide 04, we motivate why we selected the Dynamic Check-in journey from your reference screenshots. On Slide 05, we show how we used Google Stitch, Antigravity, and Google ADK to turn those screenshots into a full-stack prototype. Then—right up front on Slides 06 through 08—we present the System Architecture topology and the Google ADK Agent & Tool Internals so everyone has a clear mental model of the components. On Slides 09 and 10, we launch the user journey walkthrough with Marta Byrne's pre-render reasoning.
TRANSITION: Let's look at Part 2 of the contents covering the interactive wireframe walkthrough, Screen 10 impact, our Thank You page, and the post-presentation fallback slides.
-->

---
layout: cloud-toc
title: "Contents (2 / 2)"
subtitle: "Core Flow Part II (Slides 11–15: Wireframes, Screen 10 Impact, Flywheel & Thank You) + Post-Q&A Fallback Slides (Slides 16–18)."
---

<div class="toc-row">
  <div>
    <span class="toc-label">Wireframe Walkthrough (Part 1): Screens <code>E</code>, <code>A</code> &amp; <code>F</code></span>
    <span class="toc-desc">Check-in Start (<code>2 STEPS</code>), Offer Page 1 (habitual Priority <code>€76.00</code>), and child-safe Row 12 Seat Map (<code>12A–12D</code>)</span>
  </div>
  <span class="toc-num">11</span>
</div>

<div class="toc-row">
  <div>
    <span class="toc-label">Wireframe Walkthrough (Part 2): Screens <code>B</code>, <code>D</code>, <code>C</code> &amp; <code>G</code></span>
    <span class="toc-desc">Offer Page 2 (Hold Bag + collapsed Car Hire drawer), Review &amp; Pay (<code>€139.99</code>), <code>1 STEP</code> Zero-Offer, and Boarding Passes</span>
  </div>
  <span class="toc-num">12</span>
</div>

<div class="toc-row">
  <div>
    <span class="toc-label">Screen 10 Model Feedback Loop &amp; Ethical UX Guardrails</span>
    <span class="toc-desc"><code>24.1%</code> conversion (<code>+6.3pp</code>), <code>71s</code> check-in (<code>-47%</code>), <code>1.8</code> avg pages, and 6 non-negotiable ethical rules</span>
  </div>
  <span class="toc-num">13</span>
</div>

<div class="toc-row">
  <div>
    <span class="toc-label">The Google AI Innovation Flywheel: Co-Evolving Next Journeys</span>
    <span class="toc-desc">How our shared-spec <code>Stitch</code> + <code>Antigravity</code> + <code>Google ADK</code> workflow scales to your next use cases</span>
  </div>
  <span class="toc-num">14</span>
</div>

<div class="toc-row">
  <div>
    <span class="toc-label"><span class="toc-badge-end">CORE END</span>Thank You, Live Q&amp;A &amp; Discussion</span>
    <span class="toc-desc">Executive takeaways, open discussion, and quick-jump index to our three deep-dive fallback slides</span>
  </div>
  <span class="toc-num">15</span>
</div>

<div class="toc-row">
  <div>
    <span class="toc-label"><span class="toc-badge-fallback">FALLBACK 01</span>Live Interactive Signal &amp; Propensity Explorer</span>
    <span class="toc-desc">Real-time signal sliders &amp; presets (<code>Solo 1-Night</code> vs <code>Family 7-Night</code>) re-ranking offers from 2 pages to 0</span>
  </div>
  <span class="toc-num">16</span>
</div>

<div class="toc-row">
  <div>
    <span class="toc-label"><span class="toc-badge-fallback">FALLBACK 02</span>Spec-to-Code &amp; Contract Traceability Matrix</span>
    <span class="toc-desc">How one elaborated journey specification drove <code>Stitch</code> UI, <code>FastAPI</code> endpoints, and <code>ADK</code> tools</span>
  </div>
  <span class="toc-num">17</span>
</div>

<div class="toc-row">
  <div>
    <span class="toc-label"><span class="toc-badge-fallback">FALLBACK 03</span>Latency Budget (<code>p95 ≤ 300ms</code>), Circuit Breaker &amp; Telemetry</span>
    <span class="toc-desc">Production SLA breakdown, <code>220ms</code> deterministic fallback, and <code>contracts/telemetry.jsons</code> audit schema</span>
  </div>
  <span class="toc-num">18</span>
</div>

<!--
PURPOSE: Orient the audience across Part 2 of the presentation agenda (Slides 11 to 18), clearly distinguishing the end of the core presentation at Slide 15 (Thank You & Q&A) from the three post-Thank-You Fallback deep-dive slides (Slides 16 to 18).
VERBAL SCRIPT: In Part 2 of our agenda, Slides 11 and 12 complete the interactive wireframe walkthrough across all seven generated screens. Slides 13 and 14 cover the Screen 10 model feedback loop dashboard, our six ethical UX guardrails, and the Google AI Innovation Flywheel, concluding our core presentation on Slide 15 with Thank You and Q&A. Right after the Thank You page, we have prepared three dedicated Fallback slides—Slides 16, 17, and 18—for live "what-if" signal experimentation, spec-to-code traceability, and production latency and telemetry deep dives during Q&A.
TRANSITION: Let's begin on Slide 04 with why check-in ancillary flows are such a compelling match for agentic AI.
-->

---
layout: cloud-twotone
eyebrow: "MOTIVATING THE USE CASE · WHY AGENT-DRIVEN CHECK-IN?"
firstClause: "Static 7-page upsell carousels cause banner blindness,"
accentClause: "making check-in an ideal match for context-aware agentic execution."
---

<div class="contrast-5050">
  <!-- Left Dark Block (#202124 — Point A: The Static Funnel Problem) -->
  <div class="contrast-dark">
    <div class="c-tag-red">THE TODAY EXPERIENCE: FIXED 7-PAGE CAROUSEL</div>
    <h3>Every traveller is forced through the same rigid upsell sequence</h3>
    <ul>
      <li><strong>No adaptation to trip context:</strong> Priority, Seats, Bags, Fast Track, Insurance, Car Hire, Transfers, and Flexi upgrades appear in a fixed linear order for every passenger.</li>
      <li><strong>Skip fatigue &amp; slow completion:</strong> Travellers tap "Skip" across <strong>4.6 pages on average</strong>, taking <strong>2m 14s (134s)</strong> just to reach their boarding passes.</li>
      <li><strong>Repeated friction:</strong> A passenger who declined Travel Insurance on their last 6 flights is asked a 7th time; return Fast Track is shown even when unavailable at the destination airport.</li>
    </ul>
  </div>

  <!-- Right Light Block (#FFFFFF — Point B: Why Agentic Execution Fits) -->
  <div class="contrast-light">
    <div class="c-tag-blue">WHY WE SELECTED THIS JOURNEY FOR AGENTIC AI</div>
    <h3>An agent perceives context, enforces rules, and plans the flow</h3>
    <ul>
      <li><strong>Multi-signal reasoning:</strong> The agent evaluates party mix (2 adults + 2 kids), trip length (7 nights), and purchase history in under <code>300ms</code> before the first offer page loads.</li>
      <li><strong>Tool-assisted guardrails:</strong> Invokes specialized tools to allocate contiguous family seating (<code>Row 12</code>), enforce child exit-row safety, and strip ineligible or repeatedly declined offers.</li>
      <li><strong>Dynamic UI assembly &amp; voice:</strong> Compresses the journey into <strong>0, 1, or 2 pages</strong> and writes warm, first-person explanations inside the lavender assistant panel.</li>
    </ul>
  </div>
</div>

<style>
.contrast-5050 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border: 1px solid #D9D9D9;
  height: 296px;
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
  font-size: 1.0rem;
  font-weight: 600;
  line-height: 1.3;
  margin: 0;
}
.contrast-dark ul, .contrast-light ul {
  margin: 0;
  padding-left: 16px;
  font-size: 0.78rem;
  line-height: 1.5;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.c-tag-red {
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #F28B82;
}
.c-tag-blue {
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #4285F4;
}
</style>

<!--
PURPOSE: Motivate why we chose the Dynamic Check-in & Ancillary Flows journey from the customer's broader set of screenshots and why it is a natural fit for agentic execution.
VERBAL SCRIPT: When we reviewed the different user journeys and screenshots you shared with us, the check-in ancillary flow immediately stood out as a high-impact candidate for agentic AI. In a traditional flow, every passenger clicks through seven static screens, skipping an average of 4.6 pages over more than two minutes. By contrast, an agentic flow doesn't just render static screens—it perceives who is travelling, invokes scoring and safety tools, strips out products the passenger doesn't need or isn't eligible for, and dynamically plans a 0, 1, or 2-step journey with helpful first-person guidance.
TRANSITION: Before we walk through those screens, let's share how we used Google Stitch, Antigravity, and Google ADK to build this prototype so efficiently.
-->

---
layout: cloud-four-cards
eyebrow: "THE AGENTIC PROTOTYPING STORY · CUSTOMER SCREENSHOTS → STITCH → ANTIGRAVITY → ADK"
title: "Google Stitch, Antigravity, and Google ADK turned customer reference screenshots into a full prototype in days."
---

<div class="cs-comp-card">
  <div class="card-logo-box">
    <!-- Customer Reference Screenshots Vector Badge -->
    <svg viewBox="0 0 44 44" class="brand-logo-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="40" height="40" rx="10" fill="#EEF3FC" stroke="#D2E3FC" />
      <rect x="11" y="8" width="16" height="26" rx="3" fill="#FFFFFF" stroke="#073590" stroke-width="1.8" />
      <rect x="14" y="12" width="10" height="4" rx="1" fill="#073590" />
      <rect x="14" y="18" width="10" height="5" rx="1" fill="#F1C933" />
      <rect x="17" y="10" width="16" height="26" rx="3" fill="#FFFFFF" stroke="#4285F4" stroke-width="1.8" />
      <rect x="20" y="14" width="10" height="4" rx="1" fill="#073590" />
      <rect x="20" y="20" width="10" height="6" rx="1" fill="#F2F1FE" stroke="#4B2EDB" stroke-width="1" />
      <circle cx="25" cy="31" r="1.5" fill="#4285F4" />
    </svg>
    <span class="logo-chip logo-chip-navy">App 2026 UI</span>
  </div>
  <div class="step-pill-top">01 · CUSTOMER INPUT</div>
  <div class="card-header-title">Reference Screenshots</div>
  <div class="cs-comp-card-divider"></div>
  <div class="card-body-copy">
    We started with the <strong>reference screenshots you sent us</strong> across different App 2026 Help Hub journeys and selected <strong>Dynamic Check-in Flows</strong> for its strong match with agentic reasoning and task execution.
  </div>
</div>

<div class="cs-comp-card">
  <div class="card-logo-box">
    <!-- Google Stitch Official-Style Vector Logo Mark -->
    <svg viewBox="0 0 44 44" class="brand-logo-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="40" height="40" rx="10" fill="#F5F0FF" stroke="#E0D4FC" />
      <!-- Interwoven Stitch Threads (Google 4-Color + AI Violet) -->
      <rect x="9" y="10" width="11" height="11" rx="3" fill="#4285F4" />
      <rect x="22" y="10" width="11" height="11" rx="3" fill="#EA4335" opacity="0.9" />
      <rect x="9" y="23" width="11" height="11" rx="3" fill="#FBBC05" />
      <rect x="22" y="23" width="11" height="11" rx="3" fill="#34A853" />
      <!-- Stitch Thread Nodes & Generative Sparkle -->
      <path d="M16 15.5 H26 M14.5 17 V27 M27.5 17 V27 M16 28.5 H26" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" />
      <path d="M33 7 L34.6 10.9 L38.5 12.5 L34.6 14.1 L33 18 L31.4 14.1 L27.5 12.5 L31.4 10.9 Z" fill="#6200EE" />
    </svg>
    <span class="logo-chip logo-chip-stitch">Google Stitch</span>
  </div>
  <div class="step-pill-top">02 · GOOGLE STITCH</div>
  <div class="card-header-title">Contextual UI Generation</div>
  <div class="cs-comp-card-divider"></div>
  <div class="card-body-copy">
    We fed those reference screenshots—together with the elaborated Dynamic Flows journey—into <strong>Google Stitch</strong> to generate Screens <code>E, A, F, B, D, C, G</code> in the exact same brand style (<code>#073590</code> Navy, <code>#F2F1FE</code> Lavender).
  </div>
</div>

<div class="cs-comp-card">
  <div class="card-logo-box">
    <!-- Shared Journey Specs & JSON Contracts Vector Badge -->
    <svg viewBox="0 0 44 44" class="brand-logo-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="40" height="40" rx="10" fill="#E6F4EA" stroke="#CEEAD6" />
      <rect x="11" y="9" width="22" height="26" rx="3" fill="#FFFFFF" stroke="#34A853" stroke-width="1.8" />
      <path d="M15 15 H29 M15 20 H29 M15 25 H23" stroke="#137333" stroke-width="1.8" stroke-linecap="round" />
      <circle cx="27" cy="27" r="5" fill="#4285F4" />
      <path d="M25 27 L26.5 28.5 L29.5 25.5" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
    <span class="logo-chip logo-chip-green">Specs &amp; Contracts</span>
  </div>
  <div class="step-pill-top">03 · SHARED SPECS</div>
  <div class="card-header-title">Unified Journey Blueprint</div>
  <div class="cs-comp-card-divider"></div>
  <div class="card-body-copy">
    At the same time, we turned the elaborated user journey into <strong>design &amp; requirement specifications</strong> that simultaneously informed the frontend screens, the REST API contracts, and the ADK agent design.
  </div>
</div>

<div class="cs-comp-card">
  <div class="card-logo-box">
    <!-- Antigravity + Google ADK Vector Logo Lockup -->
    <svg viewBox="0 0 44 44" class="brand-logo-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="40" height="40" rx="10" fill="#202124" stroke="#3C4043" />
      <!-- Orbital Agentic Ring -->
      <ellipse cx="22" cy="25" rx="14" ry="5.5" transform="rotate(-16 22 25)" stroke="#8AB4F8" stroke-width="1.5" stroke-dasharray="3 2" />
      <!-- Antigravity Levitating Delta / A-Wing Mark -->
      <path d="M22 8 L33 31 L27.5 31 L22 19.5 L16.5 31 L11 31 Z" fill="url(#agGrad)" />
      <polygon points="22,22 26,28 18,28" fill="#FBBC05" />
      <circle cx="32" cy="11" r="2.5" fill="#34A853" />
      <defs>
        <linearGradient id="agGrad" x1="11" y1="8" x2="33" y2="31" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#4285F4" />
          <stop offset="55%" stop-color="#8AB4F8" />
          <stop offset="100%" stop-color="#EA4335" />
        </linearGradient>
      </defs>
    </svg>
    <span class="logo-chip logo-chip-ag">Antigravity + ADK</span>
  </div>
  <div class="step-pill-top">04 · ANTIGRAVITY + ADK</div>
  <div class="card-header-title">Agentic Code Realization</div>
  <div class="cs-comp-card-divider"></div>
  <div class="card-body-copy">
    Using <strong>Antigravity</strong> (Google's agentic coding platform), we generated the FastAPI services, the <strong>Google ADK</strong> agent (<code>Gemini Flash</code>), and the domain tools (<code>scoring</code>, <code>seating</code>, <code>rules</code>) in lockstep.
  </div>
</div>

<template #bottom>
  <div class="takeaway-strip">
    <strong>Why This Matters for AI Innovation:</strong> Instead of weeks of manual handoffs between UX, API, and ML teams, <strong>Stitch + Antigravity + Google ADK</strong> compressed UI ideation, API contract design, and agentic implementation into one continuous loop.
  </div>
</template>

<style>
.card-logo-box {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 8px;
}
.brand-logo-svg {
  width: 38px;
  height: 38px;
  flex-shrink: 0;
}
.logo-chip {
  font-size: 9.5px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 999px;
  letter-spacing: 0.02em;
  white-space: nowrap;
}
.logo-chip-navy {
  background: #EEF3FC;
  color: #073590;
  border: 1px solid #D2E3FC;
}
.logo-chip-stitch {
  background: #F5F0FF;
  color: #6200EE;
  border: 1px solid #E0D4FC;
}
.logo-chip-green {
  background: #E6F4EA;
  color: #137333;
  border: 1px solid #CEEAD6;
}
.logo-chip-ag {
  background: #202124;
  color: #8AB4F8;
  border: 1px solid #3C4043;
}
.step-pill-top {
  font-size: 9.5px;
  font-weight: 700;
  color: #4285F4;
  letter-spacing: 0.08em;
  text-align: center;
  margin-bottom: 4px;
}
.card-header-title {
  font-size: 0.84rem;
  font-weight: 700;
  color: #202124;
  text-align: center;
}
.card-body-copy {
  font-size: 0.71rem;
  line-height: 1.42;
  color: #202124;
}
.takeaway-strip {
  background: #F8F9FA;
  border: 1px solid #E8EAED;
  border-left: 4px solid #4285F4;
  padding: 7px 14px;
  font-size: 0.74rem;
  color: #202124;
}
</style>

<!--
PURPOSE: Explain the end-to-end agentic development workflow used to create this prototype: Customer Screenshots -> Google Stitch -> Shared Specifications -> Antigravity + Google ADK.
VERBAL SCRIPT: We also want to share how we built this prototype, because the development process itself showcases Google's AI innovation stack in action. First, we started with the screenshots you shared for your other Help Hub journeys and chose the Dynamic Flows journey because it plays directly to agentic strengths. Second, we passed your reference screenshots and the elaborated user journey into Google Stitch, which generated all seven mobile screens while preserving your exact App 2026 look and feel. Third, we captured the elaborated journey as structured design and requirement specifications—and those specs didn't just guide the frontend; they directly defined the API contracts and the ADK agent's responsibilities. Fourth, using Antigravity, our agentic development environment, we rapidly generated the API services, the Google ADK agent, and the domain tools to realize the entire working prototype.
TRANSITION: Before we step through the generated mobile wireframes, let's look at the System Architecture and Google ADK Agent Internals that Antigravity generated from those specifications.
-->
