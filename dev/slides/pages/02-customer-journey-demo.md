---
layout: cloud-break
color: blue
sectionNo: "02"
title: "End-to-End User Journey & Wireframe Walkthrough"
subtitle: "Tracing our Google ADK architecture in action from Check-in Start to Boarding Passes across all 7 generated Stitch screens."
---

<div class="subtopic-row">
  <div>
    <span class="subtopic-title">The Running Example: Marta Byrne's Family Trip (<code>DUB → FAO</code>, <code>FR1234</code>)</span>
    <span class="subtopic-meta">How the ADK tools &amp; skills we just saw evaluate 8 candidate ancillaries in <code>~57ms</code> before Screen 1 renders</span>
  </div>
  <span class="subtopic-icon">→</span>
</div>

<div class="subtopic-row">
  <div>
    <span class="subtopic-title">Wireframe Walkthrough Part 1: Entry, Offer Page 1 &amp; Family Seat Map (<code>Screens E, A, F</code>)</span>
    <span class="subtopic-meta">Dynamic <code>"2 STEPS"</code> promise, repeat Priority (<code>€76.00</code>), and child-safe Row 12 seating (<code>12A–12D</code>, <code>€24.00</code>)</span>
  </div>
  <span class="subtopic-icon">→</span>
</div>

<div class="subtopic-row">
  <div>
    <span class="subtopic-title">Wireframe Walkthrough Part 2: Hold Bag, Checkout, Zero-Offer &amp; Boarding Passes (<code>Screens B, D, C, G</code>)</span>
    <span class="subtopic-meta">Collapsed Car Hire drawer, <code>€139.99</code> Review &amp; Pay, <code>1 STEP</code> Zero-Offer compression, and 4 swipeable passes</span>
  </div>
  <span class="subtopic-icon">→</span>
</div>

<!--
PURPOSE: Introduce Section 02 — tracing the System & Google ADK Architecture we just reviewed across the complete end-to-end Stitch wireframe walkthrough.
VERBAL SCRIPT: Now that we have seen the 4-tier system architecture and the internal Google ADK agent and tool workflow, let's watch that exact pipeline in action. In Section 02, we walk through the user journey end-to-end following the wireframes generated in Google Stitch and wired by Antigravity. At every screen, you will see how the propensity scorer, eligibility rules, seat allocator, page builder, and Gemini Flash agent shape what the passenger experiences on their phone.
TRANSITION: Let's begin on Slide 10 with our running passenger persona, Marta Byrne, and what the ADK pipeline executes in the 57 milliseconds before Screen 1 appears.
-->

---
layout: cloud-sidebar-table
title: "Before the first screen renders, the ADK agent evaluates Marta's trip and compresses 8 products into 2 tailored steps."
eyebrow: "PRE-RENDER AGENTIC REASONING · MARTA BYRNE (BOOKING X8Y9QL)"
---

<template #sidebar>
  <p>
    <strong>The Passenger Context (<code>Marta Byrne, 34</code>):</strong> Flying Dublin (<code>DUB</code> T1) → Faro (<code>FAO</code>) on <code>Ryanair FR1234</code> for a <strong>7-night school half-term holiday</strong> with partner <code>Declan B</code> and two children: <code>Fia B (6)</code> and <code>Oisín B (9)</code>.
  </p>
  <p class="mt-2">
    <strong>Why this persona illustrates the full agentic flow:</strong> She has a clear habit (bought <strong>Priority</strong> on 3 of her last 4 trips), an urgent family need (<strong>4 seats together</strong> with young kids), a contextual hold-bag need (7 nights), and a clear suppression signal (<strong>6 prior insurance declines</strong>).
  </p>
  <div class="sidebar-callout">
    <strong>Agent Page Builder Output:</strong><br/>
    <strong>2 Offer Pages, not 7</strong> (<code>~57ms</code> server execution)<br/>
    <span>Canonical Full Basket: <code>€76.00 + €24.00 + €39.99 = €139.99</code></span>
  </div>
</template>

<table class="cs-table-a">
  <thead>
    <tr>
      <th>Rank &amp; Extra</th>
      <th>Score &amp; Price</th>
      <th>Why the Agent Scored It This Way</th>
      <th>Agentic Page Builder Action</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>#1 Priority &amp; 2 Cabin Bags</strong></td>
      <td><code>0.84</code> · <strong>€76.00</strong> (<code>€19×4</code>)</td>
      <td>Repeat habit: purchased on <strong>3 of last 4 trips</strong>.</td>
      <td><span class="pill-keep">Page 1 · Card A (Above Fold)</span></td>
    </tr>
    <tr>
      <td><strong>#2 Sit together (Row 12)</strong></td>
      <td><code>0.71</code> · <strong>€24.00</strong> (<code>12A–12D</code>)</td>
      <td>2 children (ages 6 &amp; 9) with no seats reserved yet.</td>
      <td><span class="pill-keep">Page 1 · Card B + Seat Map (F)</span></td>
    </tr>
    <tr>
      <td><strong>#3 20kg Checked Bag</strong></td>
      <td><code>0.58</code> · <strong>€39.99</strong> (outbound)</td>
      <td>7-night holiday for a family of 4 travellers.</td>
      <td><span class="pill-keep">Page 2 · Card C (Stepper at 0)</span></td>
    </tr>
    <tr>
      <td><strong>#4 Car hire in Faro</strong></td>
      <td><code>0.29</code> · From <strong>€28.00/day</strong></td>
      <td>Leisure route (<code>FAO</code>), but Marta has never rented a car.</td>
      <td><span class="pill-drawer">Page 2 · Collapsed Drawer (1)</span></td>
    </tr>
    <tr>
      <td><strong>#5 Fast Track security</strong></td>
      <td><code>0.14</code> · €28.00</td>
      <td>Not sold at Faro (<code>FAO</code>) on the return leg.</td>
      <td><span class="pill-strip">Removed (Route Ineligible)</span></td>
    </tr>
    <tr>
      <td><strong>#6 Travel insurance</strong></td>
      <td><code>0.11</code> · €64.00</td>
      <td>Declined on <strong>6 consecutive prior trips</strong>.</td>
      <td><span class="pill-strip">Removed (Decline Suppression)</span></td>
    </tr>
    <tr>
      <td><strong>#7–#8 Transfer &amp; Flexi</strong></td>
      <td><code>0.08</code> / <code>0.04</code></td>
      <td>Transfer below <code>0.10</code> floor; Flexi ineligible inside <code>48h</code> window.</td>
      <td><span class="pill-strip">Removed (Floor &amp; 48h Window)</span></td>
    </tr>
  </tbody>
</table>

<style>
.sidebar-callout {
  margin-top: 10px;
  padding: 8px 11px;
  background: #F8F9FA;
  border-left: 3px solid #4285F4;
  font-size: 0.74rem;
}
.sidebar-callout span {
  color: #5F6368;
  font-size: 0.7rem;
}
.pill-keep {
  background: #E6F4EA;
  color: #137333;
  font-weight: 700;
  font-size: 9.5px;
  padding: 2px 6px;
}
.pill-drawer {
  background: #FEF7E0;
  color: #B06000;
  font-weight: 700;
  font-size: 9.5px;
  padding: 2px 6px;
}
.pill-strip {
  background: #FCE8E6;
  color: #C5221F;
  font-weight: 700;
  font-size: 9.5px;
  padding: 2px 6px;
}
</style>

<!--
PURPOSE: Walk through Marta Byrne's persona and show how the agentic pipeline scores all 8 ancillaries, enforces business/suppression rules, and plans a 2-page layout before Screen 1 renders.
VERBAL SCRIPT: Let's meet Marta Byrne. She's checking in 48 hours before departure for a 7-night family trip from Dublin to Faro with her partner Declan and their two children, Fia aged 6 and Oisín aged 9. While the check-in screen loads, the backend agentic workflow evaluates all eight ancillaries in about 57 milliseconds. Priority scores 0.84 because she bought it on 3 of her last 4 trips. Family seating scores 0.71 because she's travelling with two young children and has no seats held. A 20kg hold bag scores 0.58 for a 7-night family holiday. Car Hire scores 0.29—above our 0.10 floor but below the 0.50 primary card threshold—so the agent tucks it into a collapsed drawer on Page 2. And critically, Fast Track, Travel Insurance (which she declined 6 times in a row), Airport Transfer, and Flexi Upgrade are stripped completely. Output: 2 pages instead of 7.
TRANSITION: Let's now step through the Stitch wireframes for Screens E, A, and F to see how this looks on Marta's phone.
-->

---
layout: cloud-split
eyebrow: "WIREFRAME WALKTHROUGH (PART 1: SCREENS E, A & F) · STITCH + ADK AGENT"
title: "Screens E, A & F: The agent sets a 2-step promise, surfaces habitual extras, and pre-allocates child-safe family seating."
ratio: "45-55"
---

<template #left>
  <div class="walkthrough-col">
    <p class="cs-commentary">
      Use the <strong><code>E</code>, <code>A</code>, <code>F</code> buttons</strong> and the <strong><code>Stitch Screen</code> / <code>Interactive</code> toggle</strong> on the right to inspect the generated wireframes:
    </p>
    <div class="wf-cards">
      <div class="wf-card">
        <div class="wf-head"><span class="wf-badge">Screen E</span> <strong>Check-in Start (Dynamic Step Count)</strong></div>
        <p><strong>UI Wireframe:</strong> Full <code>#073590</code> Navy greeting (<code>"Hi Marta,"</code>), flight <code>FR1234</code> (<code>DUB → FAO</code>, <code>06:35</code>, Gate <code>104</code>), and all 4 travellers (<code>Fia B · Child (6)</code>, <code>Oisín B · Child (9)</code>).</p>
        <p class="ag-line"><strong>Agentic Process:</strong> Page builder dynamically injects <code>"2 STEPS TO YOUR BOARDING PASSES"</code> based on surviving offer count—never hardcoded.</p>
      </div>
      <div class="wf-card">
        <div class="wf-head"><span class="wf-badge">Screen A</span> <strong>Offer Page 1 of 2 ("Your usual, ready to go")</strong></div>
        <p><strong>UI Wireframe:</strong> Pale lavender assistant surface (<code>#F2F1FE</code>) holding <strong>Card A: Priority (<code>€76.00</code>)</strong> and <strong>Card B: Sit together (<code>€24.00</code>)</strong>, plus equal-weight <code>"No thanks, continue →"</code>.</p>
        <p class="ag-line"><strong>Agentic Process:</strong> <strong>ADK (<code>Gemini Flash</code>)</strong> writes warm first-person copy (<em>"You added this on your last 3 trips"</em>); toggles start unselected (<code>false</code>).</p>
      </div>
      <div class="wf-card">
        <div class="wf-head"><span class="wf-badge">Screen F</span> <strong>Conditional Seat Map (Row 12: <code>12A–12D</code>)</strong></div>
        <p><strong>UI Wireframe:</strong> Opens only if Marta taps <em>"Choose seats"</em>. Highlights <code>12A–12D</code> in <code>#F1C933</code> yellow and greys out Overwing Exit Row 16 (<code>NO UNDER-16s</code>).</p>
        <p class="ag-line"><strong>Agentic Process:</strong> Seat allocator tool finds 4 contiguous seats for 2 adults + 2 kids; confirming routes directly forward to <strong>Step 2 (<code>Screen B</code>)</strong>.</p>
      </div>
    </div>
  </div>
</template>

<template #right>
  <HelpHubSimulator initialScreen="E" :defaultWireframe="true" />
</template>

<style>
.walkthrough-col {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.wf-cards {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.wf-card {
  background: #F8F9FA;
  border: 1px solid #E8EAED;
  border-left: 3px solid #073590;
  padding: 6px 9px;
  font-size: 0.7rem;
  line-height: 1.34;
}
.wf-head {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 3px;
  color: #10131A;
}
.wf-badge {
  background: #073590;
  color: #FFFFFF;
  font-size: 9px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 4px;
}
.wf-card p {
  margin: 2px 0;
}
.ag-line {
  color: #4B2EDB;
}
</style>

<!--
PURPOSE: Walk the audience through the first half of the user journey wireframes (Screen E Check-in Start, Screen A Offer Page 1, and Screen F Seat Map) and explain the agentic logic behind each screen.
VERBAL SCRIPT: Here on the right, you can view the actual HTML wireframes generated by Google Stitch from your reference screenshots, or click "Interactive" to step through the live flow. On Screen E, Marta sees her flight FR1234 and the four passengers on the booking, topped by a pill reading "2 STEPS TO YOUR BOARDING PASSES"—a count computed dynamically by the agent's page builder. When she taps Start Check-in, Screen A ("Step 1 of 2") groups Priority at €76 and Family Seating at €24 inside the pale lavender assistant container. Notice how the ADK agent speaks in the first person—"You usually travel with Priority"—while keeping every toggle off by default and offering an equal-weight "No thanks, continue" button at the bottom. If Marta taps "Choose seats", Screen F opens the Boeing 737 cabin with Row 12 (12A to 12D) pre-highlighted as "Best row for your group" and Exit Row 16 greyed out because Fia is 6 and Oisín is 9.
TRANSITION: Let's continue to the next slide to walk through the remaining screens: Step 2 (Screen B), Review & Pay (Screen D), the 1-step Zero-Offer path (Screen C), and the Boarding Passes (Screen G).
-->

---
layout: cloud-split
eyebrow: "WIREFRAME WALKTHROUGH (PART 2: SCREENS B, D, C & G) · ADAPTIVE FLOW COMPLETION"
title: "Screens B, D, C & G: The agent demotes secondary extras, streamlines checkout, and collapses Zero-Offer trips to 1 step."
ratio: "45-55"
---

<template #left>
  <div class="walkthrough-col">
    <p class="cs-commentary">
      Click <strong><code>B</code>, <code>D</code>, <code>C</code>, <code>G</code></strong> on the simulator toolbar (or toggle <strong><code>Stitch Screen</code></strong>) to see how the journey concludes across every path:
    </p>
    <div class="wf-cards">
      <div class="wf-card">
        <div class="wf-head"><span class="wf-badge">Screen B</span> <strong>Offer Page 2 of 2 ("Anything in the hold?")</strong></div>
        <p><strong>UI Wireframe:</strong> <strong>Card C: 20kg Checked Bag (<code>€39.99</code>)</strong> with quantity stepper at <code>0</code>, plus collapsed drawer <code>"More extras (1)"</code> hiding Car Hire in Faro (<code>€28/day</code>).</p>
        <p class="ag-line"><strong>Agentic Process:</strong> Contextualizes 7 nights &amp; 4 travellers; keeps <code>0.29</code> score Car Hire closed by default so the screen stays calm.</p>
      </div>
      <div class="wf-card">
        <div class="wf-head"><span class="wf-badge">Screen D</span> <strong>Review &amp; Pay (<code>Total €139.99</code> · <code>Visa ending 4412</code>)</strong></div>
        <p><strong>UI Wireframe:</strong> Itemized summary (<code>Priority €76.00</code>, <code>Seats 12A–12D €24.00</code>, <code>20kg Bag €39.99</code>) with inline <em>"Remove"</em> links and 1-tap Apple/Visa pay.</p>
        <p class="ag-line"><strong>Agentic Process:</strong> If Marta declined all offers (<code>basket == €0</code>), the agent <strong>skips Screen D entirely</strong> and jumps straight to Boarding Passes.</p>
      </div>
      <div class="wf-card">
        <div class="wf-head"><span class="wf-badge">Screen C &amp; G</span> <strong>Zero-Offer (<code>1 STEP</code>) &amp; Boarding Passes (<code>1 of 4</code>)</strong></div>
        <p><strong>UI Wireframe:</strong> <strong>Screen C</strong> shows <code>"1 STEP"</code> &amp; <em>"You're all set — Nothing else to add"</em>. <strong>Screen G</strong> renders 4 swipeable passes with <code>PRIORITY</code> &amp; <code>12A</code> badges.</p>
        <p class="ag-line"><strong>Agentic Process:</strong> Proves the engine is not a hard-sell funnel—when nothing qualifies, 0 offer pages render.</p>
      </div>
    </div>
  </div>
</template>

<template #right>
  <HelpHubSimulator initialScreen="B" :defaultWireframe="false" />
</template>

<!--
PURPOSE: Complete the end-to-end wireframe walkthrough covering Screen B (Offer Page 2 + Drawer), Screen D (Review & Pay €139.99), Screen C (Zero-Offer 1-Step branch), and Screen G (Boarding Passes).
VERBAL SCRIPT: Once Marta confirms her seats on Screen F, our navigation state machine routes her directly forward to Step 2 on Screen B ("Anything in the hold?"). Here the agent highlights a single 20kg checked bag at €39.99—"7 nights, 4 travellers—most families on this route add one bag"—while keeping Car Hire in Faro tucked inside the collapsed "More extras (1)" drawer because its 0.29 score fell below our 0.50 card threshold. If she taps "No thanks" on any offer, the agent suppresses that item for the rest of the session without any "Are you sure?" pop-up. On Screen D, she reviews her €139.99 basket and pays with one tap on her saved Visa ending 4412—or if she added nothing, Screen D is skipped completely. Finally, Screen G issues all four boarding passes with PRIORITY and 12A badges, while Screen C demonstrates our "1 STEP" Zero-Offer state where a traveller with no qualifying offers bypasses upsell pages altogether.
TRANSITION: Now that we have walked through the architecture and the entire passenger journey, let's look at the measurable business impact on Screen 10 and our co-evolution flywheel.
-->
