---
layout: cloud-break
color: green
sectionNo: "01"
title: "System & Google ADK Architecture"
subtitle: "Establishing the end-to-end system topology and Google ADK agent internals before walking through the passenger screens."
---

<div class="subtopic-row">
  <div>
    <span class="subtopic-title">System Architecture Overview: Design-Time Pipeline &amp; 4-Tier Runtime Topology</span>
    <span class="subtopic-meta">How <code>Google Stitch</code> &amp; <code>Antigravity</code> feed the live stack: <code>Client Tier</code> → <code>Cloud Load Balancer</code> → <code>FastAPI Server</code> → <code>Google ADK</code></span>
  </div>
  <span class="subtopic-icon">→</span>
</div>

<div class="subtopic-row">
  <div>
    <span class="subtopic-title">Google ADK Agent Internals, Declarative Skills &amp; Deterministic Tools Workflow</span>
    <span class="subtopic-meta">Inside the <code>~57ms</code> execution loop: <code>ADKOrchestrator</code>, 3 skills, 4 sub-<code>10ms</code> domain tools, <code>gemini-3.8-flash</code> &amp; <code>220ms</code> circuit breaker</span>
  </div>
  <span class="subtopic-icon">→</span>
</div>

<div class="subtopic-row">
  <div>
    <span class="subtopic-title">Bridging Architecture to the End-to-End User Journey Walkthrough</span>
    <span class="subtopic-meta">Seeing how every tool and guardrail drives Marta Byrne's 7 generated Stitch wireframes (<code>Screens E, A, F, B, D, C, G</code>)</span>
  </div>
  <span class="subtopic-icon">→</span>
</div>

<!--
PURPOSE: Introduce Section 01 — presenting the end-to-end system architecture diagram and the deep-dive Google ADK agent/skills/tools workflow diagram up front so the audience has the full technical mental model before stepping through the UI wireframes.
VERBAL SCRIPT: Before we walk through the mobile screens, let's establish the technical mental model of what Google Stitch, Antigravity, and Google ADK built. In this section, we first look at the end-to-end System Architecture topology across our Client Tier, Cloud Load Balancer, FastAPI Application Server, and Google ADK runtime. Second, we zoom into the Google ADK Agent Internals to see how the orchestrator, three declarative skills, and four deterministic tools collaborate in under 60 milliseconds. Having this architecture in mind will make every step of Marta Byrne's wireframe journey immediately clear.
TRANSITION: Let's start with the end-to-end System Architecture Overview diagram on Slide 07.
-->

---
layout: default
eyebrow: "SYSTEM ARCHITECTURE OVERVIEW · CLIENT → LOAD BALANCER → FASTAPI SERVER → GOOGLE ADK"
title: "End-to-End System Topology: How Stitch UI clients, Cloud Load Balancer, FastAPI, and Google ADK connect."
---

<SystemOverviewDiagram />

<!--
PURPOSE: Present the complete end-to-end system architecture diagram covering design-time co-generation (Customer Screenshots -> Google Stitch -> Contracts -> Antigravity) at the top and live 4-tier runtime execution (Client Tier -> Cloud Load Balancer -> FastAPI Application Server -> Google ADK, Skills & Tools) below.
VERBAL SCRIPT: This diagram gives you the complete system component view—and you can click any of the four tiers to isolate and inspect it. Across the top is our Design-Time Pipeline: customer reference screenshots flow into Google Stitch to produce the seven mobile HTML wireframes, while shared specifications and JSON Schemas in the contracts folder instruct Antigravity to co-generate the server, ADK agent, and tools. Below is our live 4-tier runtime topology. Tier 1 on the left is the Client Tier: the Ryanair App 2026 Help Hub mobile client and the Screen 10 web analytics dashboard. Tier 2 is our Cloud Load Balancer handling HTTPS termination, API path routing under a 300-millisecond p95 SLA, and static asset delivery. Tier 3 is our FastAPI Application Server housing the CheckinFlowService, in-memory Session Store, ADKOrchestrator with its 220-millisecond circuit breaker, and OpenTelemetry trace emitter. And Tier 4 on the right is the Google ADK runtime combining three declarative skills, the Gemini Flash agent, and four deterministic domain tools.
TRANSITION: Now let's zoom into Tier 4 on Slide 08 to inspect the internal Google ADK agent and tool execution workflow.
-->

---
layout: default
eyebrow: "GOOGLE ADK AGENT INTERNALS · ORCHESTRATOR, DECLARATIVE SKILLS, TOOLS & GUARDRAILS"
title: "Google ADK Execution Workflow: How the agent, 3 skills, and 4 deterministic tools execute check-in in ~57ms."
---

<AdkWorkflowDiagram />

<!--
PURPOSE: Walk through the detailed internal execution workflow inside the Google ADK layer, showing how the ADKOrchestrator, the 3 declarative skills (ancillary_ranking, page_builder, assistant_copy), the 4 deterministic tools, and the 220ms guardrail circuit breaker interact.
VERBAL SCRIPT: Here we zoom directly into the Google ADK internals that run when a passenger starts check-in or asks a question. Execution flows across four functional zones—and you can click any zone to highlight its components. In Zone 1 on the left, FastAPI calls the ADKOrchestrator, which resolves Booking X8Y9QL in under 2 milliseconds and coordinates three declarative skills: ancillary_ranking, page_builder, and assistant_copy. In Zone 2 in the center, those skills invoke four deterministic Python tools in under 10 milliseconds total: Tool 1 scores all 8 ancillaries, Tool 2 enforces four hard protection gates, Tool 3 runs the Boeing 737 cabin seat allocator for Row 12 with child exit-row locks, and Tool 4 computes exact euro basket totals with zero hallucination risk. In Zone 3 on the top right, the assistant_copy skill passes the grounded tool outputs into our Google ADK Gemini Flash agent to synthesize warm, first-person guidance. And in Zone 4 on the bottom right, a 220-millisecond circuit breaker and our ethical copy validator verify the output before emitting a schema-valid OpenTelemetry trace back to the client.
TRANSITION: Now that we have seen both the system topology and the ADK agent internals, let's trace this exact pipeline in action across Marta Byrne's end-to-end user journey and Stitch wireframes.
-->
