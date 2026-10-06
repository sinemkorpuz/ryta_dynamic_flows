---
layout: cloud-break
color: blue
sectionNo: "01"
title: "Live Customer Journey: App 2026 Help Hub"
subtitle: "Walking through the Stitch Consistency Contract, Marta Byrne's 2-step family check-in, the 1-step Zero-Offer path, and the 6 ethical UX invariants."
---

<div class="subtopic-row">
  <div>
    <span class="subtopic-title">Canonical Persona Fixture: Marta Byrne (`Booking X8Y9QL`)</span>
    <span class="subtopic-meta">Dublin (`DUB` T1) → Faro (`FAO`) · `FR1234` · 7 nights · 2 adults + 2 children (ages 6 &amp; 9)</span>
  </div>
  <span class="subtopic-icon">→</span>
</div>

<div class="subtopic-row">
  <div>
    <span class="subtopic-title">Interactive Help Hub Walkthrough (`Screens E → A → F → B → D → G`)</span>
    <span class="subtopic-meta">Priority (`€76.00`), Row 12 Family Seating (`12A–12D`, `€24.00`), 20kg Bag (`€39.99`), and `1 STEP` Zero-Offer (`Screen C`)</span>
  </div>
  <span class="subtopic-icon">→</span>
</div>

<div class="subtopic-row">
  <div>
    <span class="subtopic-title">Six Ethical UX Invariants &amp; Four Stitch Sanitization Repairs</span>
    <span class="subtopic-meta">Zero pre-selection, equal-weight decline pills, strict step-numbering, and zero countdown timers</span>
  </div>
  <span class="subtopic-icon">→</span>
</div>

<!--
PURPOSE: Introduce Act II using the official Cloudstyle Blue (#4285F4) full-bleed Break Slide with subtopics (Slide 09 archetype).
VERBAL SCRIPT: In Act II, we step into the passenger's shoes inside the App 2026 Help Hub interface. We will inspect our canonical family booking fixture for Marta Byrne, interact directly with the mobile check-in flow right inside the slide deck, and review the six ethical UX invariants that govern every screen.
TRANSITION: Let's start by meeting Marta Byrne and examining why her trip to Faro exercises every rule in our engine.
-->

---
layout: cloud-sidebar-table
title: "Marta Byrne's family trip to Faro surfaces every personalization, seating, and suppression rule in one journey."
eyebrow: "STITCH CONSISTENCY CONTRACT · TABLE A"
---

<template #sidebar>
  <p>
    <strong>Why this persona matters:</strong> Marta Byrne (`34`) is a repeat ancillary buyer with a strong habit (<strong>Priority</strong> on 3 of her last 4 trips), an unbought family need (<strong>4 contiguous seats</strong> with children aged `6` and `9`), and a clear suppression signal (<strong>6 consecutive insurance declines</strong>).
  </p>
  <p class="mt-2">
    Every backend fixture (`dev/tools/`), API contract (`contracts/`), and UI view (`dev/ui/`) enforces these exact canonical values so end-to-end demos never drift.
  </p>
  <div class="sidebar-callout">
    <strong>Canonical Basket Total:</strong><br/>
    `€76.00 + €24.00 + €39.99 = €139.99`<br/>
    <span>Paid via saved `Visa ending 4412`</span>
  </div>
</template>

<table class="cs-table-a">
  <thead>
    <tr>
      <th>Domain Attribute</th>
      <th>Canonical Fixture Value</th>
      <th>Engine &amp; UX Governance Rule</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Flight &amp; Route</strong></td>
      <td><code>Ryanair FR1234</code> · <code>DUB</code> (T1) → <code>FAO</code></td>
      <td>Outbound leg only; departs Tue 14 Oct <code>06:35</code>, Gate <code>104</code> (<code>7 nights</code>, Value fare).</td>
    </tr>
    <tr>
      <td><strong>Booking &amp; Pax (4)</strong></td>
      <td>Ref <code>X8Y9QL</code> · Marta Byrne, Declan B, <code>Fia B (6)</code>, <code>Oisín B (9)</code></td>
      <td>Child ages (<code>6</code> &amp; <code>9</code>) trigger Row 12 allocation and block Overwing Exit Row 16.</td>
    </tr>
    <tr>
      <td><strong>Card A (Rank #1)</strong></td>
      <td><strong>Priority &amp; 2 Cabin Bags</strong> · <code>€76.00</code> (<code>€19 × 4</code>)</td>
      <td>Score <code>0.84</code> (repeat 3/4 trips); renders on Offer Page 1 with toggle starting <code>false</code>.</td>
    </tr>
    <tr>
      <td><strong>Card B (Rank #2)</strong></td>
      <td><strong>Sit together (Row 12)</strong> · <code>12A, 12B, 12C, 12D</code> (<code>€24.00</code>)</td>
      <td>Score <code>0.71</code> (<code>€6 × 4</code>); never uses forbidden <code>Seat 14A</code> or countdown timers.</td>
    </tr>
    <tr>
      <td><strong>Card C (Rank #3)</strong></td>
      <td><strong>20kg Checked Bag</strong> · <code>€39.99</code> (outbound)</td>
      <td>Score <code>0.58</code> (7 nights, family of 4); renders on Offer Page 2 with stepper at <code>0</code>.</td>
    </tr>
    <tr>
      <td><strong>Collapsed Drawer (#4)</strong></td>
      <td><strong>Car hire in Faro</strong> · From <code>€28.00/day</code></td>
      <td>Score <code>0.29</code> (below <code>0.50</code> primary card threshold; collapsed into <code>"More extras (1)"</code>).</td>
    </tr>
    <tr>
      <td><strong>Stripped Items (#5–#8)</strong></td>
      <td>Fast Track (<code>0.14</code>), Insurance (<code>0.11</code>), Transfer (<code>0.08</code>), Flexi (<code>0.04</code>)</td>
      <td>Removed server-side via route eligibility, 6x decline streak, <code>&lt;0.10</code> floor, and <code>≤48h</code> cutoff.</td>
    </tr>
  </tbody>
</table>

<style>
.sidebar-callout {
  margin-top: 12px;
  padding: 9px 11px;
  background: #F8F9FA;
  border-left: 3px solid #4285F4;
  font-size: 0.76rem;
}
.sidebar-callout span {
  color: #5F6368;
  font-size: 0.72rem;
}
</style>

<!--
PURPOSE: Detail the canonical Marta Byrne persona and Stitch Consistency Contract using the Cloudstyle Sidebar Commentary + Table A layout (Slide 26 archetype).
VERBAL SCRIPT: Here is the Stitch Consistency Contract that unifies our backend and frontend tracks. Marta is flying Dublin to Faro on flight FR1234 with her partner Declan and two children, Fia aged 6 and Oisín aged 9, under booking reference X8Y9QL. Because she bought Priority on 3 of her last 4 trips, it scores 0.84 at €76 for all four passengers. Traveling with two young children without pre-allocated seats gives Row 12 family seating a 0.71 score at €24. A 20kg hold bag for a 7-night family trip scores 0.58 at €39.99 on Page 2, while Car Hire at 0.29 is tucked neatly into a collapsed drawer. The remaining four products are stripped completely before the UI ever loads.
TRANSITION: Let's test this live right now on the next slide using our embedded App 2026 Help Hub simulator.
-->

---
layout: cloud-split
eyebrow: "LIVE INTERACTIVE WALKTHROUGH · APP 2026 HELP HUB"
title: "Interactive Demo: Dynamic check-in adapts seamlessly between Marta's 2-step family flow and the 1-step Zero-Offer path."
ratio: "40-60"
---

<template #left>
  <div class="demo-guide">
    <p class="cs-commentary">
      <strong>Try the live simulator on the right:</strong> Step through every screen or toggle between <strong>Marta (2 Steps)</strong>, <strong>Zero-Offer (1 Step)</strong>, and the <strong>€139.99 Checkout</strong> state.
    </p>
    <div class="flow-steps-list">
      <div class="f-item">
        <span class="f-badge">E</span>
        <div><strong>Check-in Start:</strong> Full `#073590` Navy greeting header, `"2 STEPS TO YOUR BOARDING PASSES"`, and child ages `Fia B (6)` &amp; `Oisín B (9)`.</div>
      </div>
      <div class="f-item">
        <span class="f-badge">A → F</span>
        <div><strong>Step 1 &amp; Seat Map:</strong> `#F2F1FE` lavender insight panel, Priority (`€76.00`), and Row 12 (`12A–12D`, `€24.00`). Confirming seats jumps forward to **Screen B**.</div>
      </div>
      <div class="f-item">
        <span class="f-badge">B → D</span>
        <div><strong>Step 2 &amp; Review:</strong> `20kg Bag` (`€39.99`) stepper at `0` + `"More extras (1)"` drawer. Empty baskets skip **Screen D** (`€139.99`) directly to **Screen G**.</div>
      </div>
      <div class="f-item">
        <span class="f-badge">C → G</span>
        <div><strong>Zero-Offer (`1 STEP`):</strong> When zero offers pass eligibility, **Screen C** goes straight to 4 swipeable boarding passes (**Screen G**).</div>
      </div>
    </div>
  </div>
</template>

<template #right>
  <HelpHubSimulator />
</template>

<style>
.demo-guide {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.flow-steps-list {
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.f-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 0.73rem;
  line-height: 1.38;
  background: #F8F9FA;
  border: 1px solid #E8EAED;
  padding: 6px 8px;
}
.f-badge {
  background: #073590;
  color: #FFFFFF;
  font-size: 9.5px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  white-space: nowrap;
}
</style>

<!--
PURPOSE: Provide an embedded, clickable App 2026 Help Hub mobile simulator right inside the Slidev deck so the presenter can demonstrate both Marta's 2-step journey and the 1-step Zero-Offer journey live.
VERBAL SCRIPT: Right here inside the slide, we have our live Help Hub simulator—and with one click on the top right, you can also toggle the live FastAPI :8000 application iframe. Notice how Screen E opens with the full navy greeting header and the dynamic pill reading "2 STEPS TO YOUR BOARDING PASSES". When we tap Start Check-in, Screen A presents Priority at €76 and Row 12 seating at €24 inside the pale lavender assistant surface, with nothing pre-selected. Tapping Choose Seats opens Screen F with 12A through 12D highlighted in yellow and Exit Row 16 restricted for under-16s. Confirming seats routes directly to Step 2 on Screen B, where adding one 20kg bag brings our Review & Pay total on Screen D to €139.99 before issuing all four boarding passes on Screen G. And if we click "Zero-Offer (1 Step)", the passenger goes from Screen E to Screen C ("You're all set") and straight to their boarding passes with zero upsell friction.
TRANSITION: Let's examine the six UX invariants and four prototype sanitization checks that make this experience trustworthy.
-->

---
layout: cloud-four-cards
eyebrow: "ETHICAL UX & PROTOTYPE SANITIZATION · CLOUDSTYLE SLIDE 28"
title: "Six non-negotiable UX invariants guarantee conversion lift comes from relevance rather than dark patterns."
---

<div class="cs-comp-card">
  <div class="inv-icon">01 · OPT-IN ONLY</div>
  <div class="card-header-title">Zero Pre-Selection</div>
  <div class="cs-comp-card-divider"></div>
  <div class="card-body-copy">
    Every ancillary toggle initializes to <code>false</code> and every bag stepper starts at <code>0</code>. Conversion lift is earned purely via propensity ranking and funnel compression.
  </div>
</div>

<div class="cs-comp-card">
  <div class="inv-icon">02 · EQUAL WEIGHT</div>
  <div class="card-header-title">First-Class Decline Pill</div>
  <div class="cs-comp-card-divider"></div>
  <div class="card-body-copy">
    <code>"No thanks, continue →"</code> renders as a full-width outlined `#073590` pill with identical height and typography to primary CTAs, suppressing declined items for the session.
  </div>
</div>

<div class="cs-comp-card">
  <div class="inv-icon">03 · STEP PROMISE</div>
  <div class="card-header-title">Header &amp; Step Ladder</div>
  <div class="cs-comp-card-divider"></div>
  <div class="card-body-copy">
    Full greeting headers appear only on entry (`E`, `C`). Only Offer Pages `A` and `B` carry step numbers (`Step 1 of 2`, `Step 2 of 2`) so the `"2 STEPS"` promise is never broken.
  </div>
</div>

<div class="cs-comp-card">
  <div class="inv-icon">04 · ZERO URGENCY</div>
  <div class="card-header-title">4 Stitch Sanitizations</div>
  <div class="cs-comp-card-divider"></div>
  <div class="card-body-copy">
    Stripped the <code>09:42</code> seat hold countdown timer (`Screen F`), removed the <code>Seat 14A</code> badge (`Screen C`), fixed outbound bag copy (`Screen B`), and enforced child ages `6` &amp; `9` (`Screen E`).
  </div>
</div>

<template #bottom>
  <div class="takeaway-strip">
    <strong>Assistant Surface Isolation (#5):</strong> Pale lavender (<code>#F2F1FE</code>) and indigo sparkle headers (<code>#4B2EDB</code>) are reserved exclusively for first-person assistant insights (never labelled <code>"AI"</code>).
  </div>
</template>

<style>
.inv-icon {
  font-size: 10px;
  font-weight: 700;
  color: #4285F4;
  letter-spacing: 0.08em;
  text-align: center;
  margin-bottom: 6px;
}
</style>

<!--
PURPOSE: Highlight the six product/UX invariants and the four automated Stitch sanitization repairs verified by our test suite.
VERBAL SCRIPT: Conversion lift in ryta never relies on dark patterns. We enforce six invariants across both backend payloads and frontend components: zero pre-selection, equal-weight decline pills, strict step-numbering on Offer Pages A and B only, full greeting headers restricted to entry screens, dedicated lavender assistant surfaces written in the first person, and zero urgency timers. When importing the Stitch HTML screens into dev/ui/, we also sanitized four prototype artifacts—removing the 09:42 seat countdown timer, eliminating the forbidden Row 14 seat badge on Zero-Offer, scoping luggage copy to outbound, and displaying explicit child ages 6 and 9.
TRANSITION: Now let's move to Act III and inspect the backend ADK and deterministic rule engine that powers this flow in under 300 milliseconds.
-->
