<script setup lang="ts">
import { ref } from 'vue'

type TierKey = 'all' | 'client' | 'lb' | 'server' | 'adk'

const activeTier = ref<TierKey>('all')

const tierInfo: Record<TierKey, { badge: string; title: string; desc: string }> = {
  all: {
    badge: 'End-to-End System Topology',
    title: 'Client → Cloud Load Balancer → FastAPI Server → Google ADK Agent & Tools',
    desc: 'Mobile and operator clients connect via an HTTPS Load Balancer to the Antigravity-generated FastAPI server, which orchestrates the Google ADK Agent (gemini-3.8-flash), declarative skills, and <10ms domain tools within a p95 ≤ 300ms SLA.',
  },
  client: {
    badge: '1. Client Tier (dev/ui/)',
    title: 'Mobile Passenger App (Stitch Screens E..G) & Screen 10 Operator Dashboard',
    desc: 'Passenger mobile client renders the 0-to-2 page Help Hub check-in flow with zero pre-selection; Screen 10 companion web client visualizes live conversion (24.1%) and funnel telemetry.',
  },
  lb: {
    badge: '2. Edge & Load Balancer Tier',
    title: 'HTTPS Load Balancer, API Routing & Static Asset Edge',
    desc: 'Terminates TLS, routes /api/v1/checkin/* and /api/v1/analytics/* traffic to the FastAPI server pool, serves Stitch static wireframes, and enforces request timeouts.',
  },
  server: {
    badge: '3. Application Server Tier (dev/core/)',
    title: 'FastAPI Server, Session State Machine, Contract Validator & Telemetry Emitter',
    desc: 'Stateless HTTP workers backed by a concurrency-safe session store, Draft 2020-12 JSON Schema validation (contracts/*.jsons), ADKOrchestrator (220ms circuit breaker), and OpenTelemetry JSONL logging.',
  },
  adk: {
    badge: '4. ADK Agent & Tools Tier (dev/skills/ + dev/tools/)',
    title: 'Google ADK Runtime (gemini-3.8-flash), 3 Declarative Skills & 4 Domain Tools',
    desc: 'Combines LLM reasoning (first-person copy & Help Hub Q&A) with deterministic Python tools (propensity_scorer, eligibility_rules, seat_allocator, basket_pricing) and PSS booking fixtures.',
  },
}
</script>

<template>
  <div class="topo-root cs-framed-surface">
    <!-- Top Interactive Tier Bar -->
    <div class="topo-toolbar">
      <div class="topo-toolbar-left">
        <span class="topo-dot"></span>
        <span class="topo-heading">SYSTEM COMPONENT ARCHITECTURE · CLIENT → LOAD BALANCER → SERVER → ADK &amp; TOOLS</span>
      </div>
      <div class="topo-pills">
        <button :class="['t-pill', { active: activeTier === 'all' }]" @click="activeTier = 'all'">Full System</button>
        <button :class="['t-pill', { active: activeTier === 'client' }]" @click="activeTier = 'client'">1. Clients</button>
        <button :class="['t-pill', { active: activeTier === 'lb' }]" @click="activeTier = 'lb'">2. Load Balancer</button>
        <button :class="['t-pill', { active: activeTier === 'server' }]" @click="activeTier = 'server'">3. FastAPI Server</button>
        <button :class="['t-pill', { active: activeTier === 'adk' }]" @click="activeTier = 'adk'">4. ADK Agent &amp; Tools</button>
      </div>
    </div>

    <!-- Top Design-Time Co-Generation Banner (HTML Flexbox — Never Overlaps) -->
    <div class="design-pipeline-bar">
      <span class="dp-label">DESIGN-TIME CO-GENERATION:</span>
      <span class="dp-step dp-step-neutral">Customer Reference Screenshots</span>
      <span class="dp-arrow">→</span>
      <span class="dp-step dp-step-stitch"><strong>Google Stitch</strong> (UI Wireframes E..G)</span>
      <span class="dp-arrow">→</span>
      <span class="dp-step dp-step-spec"><strong>Shared Specs</strong> &amp; <code>contracts/*.jsons</code></span>
      <span class="dp-arrow">→</span>
      <span class="dp-step dp-step-ag"><strong>Antigravity</strong> (Co-Generated Server, ADK &amp; Tools)</span>
    </div>

    <!-- Main 4-Tier Architecture Grid with Directed Vector SVG Connectors -->
    <div class="topo-grid">
      <!-- ================================================================
           TIER 1: CLIENT TIER (dev/ui/)
           ================================================================ -->
      <div
        :class="['tier-col', { dimmed: activeTier !== 'all' && activeTier !== 'client' }]"
        @click="activeTier = 'client'"
      >
        <div class="tier-header tier-header-navy">1. CLIENT TIER (<code>dev/ui/</code>)</div>
        <div class="tier-body">
          <!-- Mobile Passenger App Card -->
          <div class="comp-box comp-box-navy">
            <div class="comp-head">
              <svg viewBox="0 0 16 16" class="comp-icon" fill="none">
                <rect x="4" y="1.5" width="8" height="13" rx="1.5" stroke="#073590" stroke-width="1.4" fill="#EEF3FC" />
                <circle cx="8" cy="12.2" r="0.8" fill="#073590" />
              </svg>
              <div>
                <div class="comp-kicker kicker-navy">MOBILE PASSENGER APP</div>
                <div class="comp-title">App 2026 Help Hub</div>
              </div>
            </div>
            <ul class="comp-list">
              <li>Stitch Screens <code>E, A, F, B, D, C, G</code></li>
              <li>Dynamic <code>0–2</code> Offer Pages</li>
              <li class="txt-purple"><code>#F2F1FE</code> Assistant &amp; Live Q&amp;A</li>
            </ul>
            <div class="comp-chip chip-blue">Zero Pre-Selection · 1-Tap Pay</div>
          </div>

          <!-- Web Analytics Client Card -->
          <div class="comp-box comp-box-blue">
            <div class="comp-head">
              <svg viewBox="0 0 16 16" class="comp-icon" fill="none">
                <rect x="1.5" y="2.5" width="13" height="9" rx="1.2" stroke="#185ABC" stroke-width="1.4" fill="#E8F0FE" />
                <path d="M5 14 H11 M8 11.5 V14" stroke="#185ABC" stroke-width="1.4" stroke-linecap="round" />
              </svg>
              <div>
                <div class="comp-kicker kicker-blue">WEB ANALYTICS CLIENT</div>
                <div class="comp-title">Screen 10 Dashboard</div>
              </div>
            </div>
            <ul class="comp-list">
              <li>Model Feedback Loop KPIs</li>
              <li class="txt-green"><code>24.1%</code> Conv. (<code>+6.3pp</code>) · <code>71s</code></li>
              <li><code>GET /api/v1/analytics/summary</code></li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Connector 1: Clients <-> Load Balancer -->
      <div class="conn-col">
        <div class="conn-item">
          <span class="conn-tag tag-blue">HTTPS</span>
          <svg viewBox="0 0 32 12" class="conn-svg">
            <path d="M4 6 H28 M7 2.5 L2.5 6 L7 9.5 M25 2.5 L29.5 6 L25 9.5" stroke="#185ABC" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
        <div class="conn-item">
          <span class="conn-tag tag-gray">REST</span>
          <svg viewBox="0 0 32 12" class="conn-svg">
            <path d="M4 6 H28 M7 2.5 L2.5 6 L7 9.5 M25 2.5 L29.5 6 L25 9.5" stroke="#5F6368" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
      </div>

      <!-- ================================================================
           TIER 2: CLOUD LOAD BALANCER
           ================================================================ -->
      <div
        :class="['tier-col', { dimmed: activeTier !== 'all' && activeTier !== 'lb' }]"
        @click="activeTier = 'lb'"
      >
        <div class="tier-header tier-header-blue">2. LOAD BALANCER</div>
        <div class="tier-body">
          <div class="comp-box comp-box-blue">
            <div class="comp-head">
              <svg viewBox="0 0 16 16" class="comp-icon" fill="none">
                <circle cx="8" cy="8" r="6" stroke="#185ABC" stroke-width="1.4" fill="#E8F0FE" />
                <path d="M4.5 8 H11.5 M8.5 5 L11.5 8 L8.5 11" stroke="#185ABC" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <div>
                <div class="comp-kicker kicker-blue">HTTPS / L7 EDGE</div>
                <div class="comp-title">Cloud Load Balancer</div>
              </div>
            </div>
            <ul class="comp-list">
              <li>TLS Termination &amp; Edge</li>
              <li>Path Routing (<code>/api/v1/*</code>)</li>
              <li>CORS &amp; Rate Policy</li>
            </ul>
            <div class="comp-chip chip-green">p95 ≤ 300ms SLA</div>
          </div>

          <div class="comp-box comp-box-gray">
            <div class="comp-kicker kicker-purple">STATIC ASSET EDGE</div>
            <div class="comp-title">Stitch HTML Bundles</div>
            <div class="comp-sub">Serves <code>/ui</code> &amp; <code>/stitch/Screen-*.html</code> with zero-latency fallback</div>
          </div>
        </div>
      </div>

      <!-- Connector 2: Load Balancer <-> FastAPI Server -->
      <div class="conn-col">
        <div class="conn-item">
          <span class="conn-tag tag-blue">JSON</span>
          <svg viewBox="0 0 32 12" class="conn-svg">
            <path d="M4 6 H28 M7 2.5 L2.5 6 L7 9.5 M25 2.5 L29.5 6 L25 9.5" stroke="#185ABC" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span class="conn-sub">≤300ms</span>
        </div>
      </div>

      <!-- ================================================================
           TIER 3: APPLICATION SERVER (FastAPI)
           ================================================================ -->
      <div
        :class="['tier-col', { dimmed: activeTier !== 'all' && activeTier !== 'server' }]"
        @click="activeTier = 'server'"
      >
        <div class="tier-header tier-header-dark">3. APPLICATION SERVER (<code>FastAPI</code>)</div>
        <div class="tier-body">
          <!-- FastAPI + CheckinFlowService -->
          <div class="comp-box comp-box-blue">
            <div class="comp-kicker kicker-blue">HTTP API SERVER · <code>dev/core/app.py</code></div>
            <div class="comp-title">FastAPI + CheckinFlowService</div>
            <div class="comp-sub"><code>POST /sessions · /actions · /seats · /assist</code></div>
            <div class="comp-chip chip-blue">Contract Validator: <code>contracts/*.jsons</code></div>
          </div>

          <!-- 2-Column Sub-Grid: Session Store + ADKOrchestrator -->
          <div class="server-subgrid">
            <div class="comp-box comp-box-gray">
              <div class="comp-kicker kicker-navy">SESSION STORE</div>
              <div class="comp-title">State Machine</div>
              <div class="comp-sub">Basket (<code>€</code>), Declines &amp; Seats (<code>12A–D</code>)</div>
            </div>
            <div class="comp-box comp-box-yellow">
              <div class="comp-kicker kicker-amber">ORCHESTRATOR</div>
              <div class="comp-title">ADKOrchestrator</div>
              <div class="comp-sub"><code>220ms</code> Breaker · <strong class="txt-green">~57ms obs.</strong></div>
            </div>
          </div>

          <!-- OpenTelemetry & JSONL Emitter -->
          <div class="comp-box comp-box-green">
            <div class="comp-kicker kicker-green">OBSERVABILITY · <code>dev/core/telemetry.py</code></div>
            <div class="comp-title">OpenTelemetry &amp; JSONL Emitter</div>
            <div class="comp-sub">Validates <code>telemetry.jsons</code> → <code>golden_trace.jsonl</code></div>
          </div>
        </div>
      </div>

      <!-- Connector 3: Server <-> Google ADK & Tools -->
      <div class="conn-col">
        <div class="conn-item">
          <span class="conn-tag tag-green">Skills</span>
          <svg viewBox="0 0 32 12" class="conn-svg">
            <path d="M4 6 H28 M7 2.5 L2.5 6 L7 9.5 M25 2.5 L29.5 6 L25 9.5" stroke="#137333" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
        <div class="conn-item">
          <span class="conn-tag tag-purple">≤220ms</span>
          <svg viewBox="0 0 32 12" class="conn-svg">
            <path d="M4 6 H28 M7 2.5 L2.5 6 L7 9.5 M25 2.5 L29.5 6 L25 9.5" stroke="#4B2EDB" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
      </div>

      <!-- ================================================================
           TIER 4: GOOGLE ADK, DECLARATIVE SKILLS & DOMAIN TOOLS
           ================================================================ -->
      <div
        :class="['tier-col', { dimmed: activeTier !== 'all' && activeTier !== 'adk' }]"
        @click="activeTier = 'adk'"
      >
        <div class="tier-header tier-header-green">4. GOOGLE ADK, SKILLS &amp; TOOLS</div>
        <div class="tier-body">
          <!-- 3 Declarative Skills -->
          <div class="comp-box comp-box-green">
            <div class="comp-kicker kicker-green">3 DECLARATIVE SKILLS (<code>dev/skills/</code>)</div>
            <div class="skill-rows">
              <div><strong>1. ancillary_ranking</strong> — Score + 4 rule gates</div>
              <div><strong>2. page_builder</strong> — Pack 0–2 pages + drawer</div>
              <div><strong>3. assistant_copy</strong> — ADK copy + guardrails</div>
            </div>
          </div>

          <!-- Google ADK Agent -->
          <div class="comp-box comp-box-purple">
            <div class="comp-kicker kicker-purple">GOOGLE ADK AGENT (<code>google.adk.agents.Agent</code>)</div>
            <div class="comp-title">Gemini Flash (<code>gemini-3.8-flash</code>)</div>
            <div class="comp-sub">Grounded 1st-person copy &amp; Help Hub Q&amp;A · <span class="txt-green">No "AI" / No timers</span></div>
          </div>

          <!-- 4 Deterministic Domain Tools -->
          <div class="comp-box comp-box-blue">
            <div class="comp-kicker kicker-blue">4 DETERMINISTIC TOOLS (<code>dev/tools/</code> · <code>&lt;10ms</code>)</div>
            <div class="tools-grid-2x2">
              <span class="tool-badge tool-blue">propensity_scorer</span>
              <span class="tool-badge tool-blue">eligibility_rules</span>
              <span class="tool-badge tool-green">seat_allocator</span>
              <span class="tool-badge tool-green">basket_pricing</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Interactive Tier Callout -->
    <div class="topo-footer">
      <span class="topo-badge">{{ tierInfo[activeTier].badge }}</span>
      <div class="topo-footer-copy">
        <strong>{{ tierInfo[activeTier].title }}:</strong>
        <span>{{ tierInfo[activeTier].desc }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.topo-root {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: #FFFFFF;
  height: 356px;
  padding: 6px 10px;
  box-sizing: border-box;
  user-select: none;
  gap: 5px;
}
.topo-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #E8EAED;
  padding-bottom: 4px;
  flex-shrink: 0;
}
.topo-toolbar-left {
  display: flex;
  align-items: center;
  gap: 6px;
}
.topo-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #185ABC;
}
.topo-heading {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: #202124;
}
.topo-pills {
  display: flex;
  gap: 4px;
}
.t-pill {
  font-size: 8.5px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 999px;
  border: 1px solid #DADCE0;
  background: #F8F9FA;
  color: #3C4043;
  cursor: pointer;
}
.t-pill.active {
  background: #185ABC;
  color: #FFFFFF;
  border-color: #185ABC;
}

/* Design-Time Pipeline Strip */
.design-pipeline-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #F5F0FF;
  border: 1px solid #D2C4FC;
  border-radius: 4px;
  padding: 3px 8px;
  font-size: 8.5px;
  flex-shrink: 0;
}
.dp-label {
  font-weight: 700;
  color: #4B2EDB;
  letter-spacing: 0.03em;
}
.dp-step {
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 8.3px;
}
.dp-step-neutral {
  background: #FFFFFF;
  color: #202124;
  border: 1px solid #DADCE0;
  font-weight: 600;
}
.dp-step-stitch {
  background: #EDE7F6;
  color: #4B2EDB;
}
.dp-step-spec {
  background: #E6F4EA;
  color: #137333;
}
.dp-step-ag {
  background: #E8F0FE;
  color: #174EA6;
}
.dp-arrow {
  color: #5F6368;
  font-weight: 700;
  font-size: 9px;
}

/* Main 4-Tier Architecture Grid */
.topo-grid {
  flex: 1;
  display: grid;
  grid-template-columns: 1.18fr 32px 0.92fr 32px 1.38fr 32px 1.45fr;
  align-items: stretch;
  min-height: 0;
}
.tier-col {
  display: flex;
  flex-direction: column;
  background: #F8F9FA;
  border: 1px solid #BDC1C6;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  transition: opacity 0.15s ease;
}
.tier-col.dimmed {
  opacity: 0.3;
}
.tier-header {
  font-size: 8.5px;
  font-weight: 700;
  color: #FFFFFF;
  text-align: center;
  padding: 3.5px 4px;
  letter-spacing: 0.03em;
  flex-shrink: 0;
}
.tier-header code {
  background: rgba(255, 255, 255, 0.2) !important;
  color: #FFFFFF !important;
  border: none !important;
  font-size: 8px !important;
  padding: 0 3px !important;
}
.tier-header-navy { background: #073590; }
.tier-header-blue { background: #185ABC; }
.tier-header-dark { background: #202124; }
.tier-header-green { background: #137333; }

.tier-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 5px;
  gap: 4px;
}

/* Component Cards inside Tiers */
.comp-box {
  background: #FFFFFF;
  border-radius: 4px;
  padding: 4px 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.comp-box-navy { border: 1px solid #073590; }
.comp-box-blue { border: 1px solid #4285F4; }
.comp-box-gray { border: 1px solid #DADCE0; }
.comp-box-yellow { background: #FEF7E0; border: 1px solid #FBBC05; }
.comp-box-green { border: 1px solid #34A853; }
.comp-box-purple { background: #F5F0FF; border: 1px solid #4B2EDB; }

.comp-head {
  display: flex;
  align-items: center;
  gap: 5px;
}
.comp-icon {
  width: 15px;
  height: 15px;
  flex-shrink: 0;
}
.comp-kicker {
  font-size: 7.5px;
  font-weight: 700;
  letter-spacing: 0.03em;
  line-height: 1.15;
}
.kicker-navy { color: #073590; }
.kicker-blue { color: #185ABC; }
.kicker-purple { color: #4B2EDB; }
.kicker-amber { color: #B06000; }
.kicker-green { color: #137333; }

.comp-title {
  font-size: 9px;
  font-weight: 700;
  color: #202124;
  line-height: 1.2;
}
.comp-sub {
  font-size: 7.8px;
  color: #3C4043;
  line-height: 1.25;
}
.comp-list {
  margin: 1px 0 0 0;
  padding-left: 11px;
  font-size: 7.8px;
  color: #3C4043;
  line-height: 1.28;
}
.comp-chip {
  font-size: 7.5px;
  font-weight: 700;
  text-align: center;
  padding: 1.5px 4px;
  border-radius: 3px;
  margin-top: 1px;
}
.chip-blue { background: #E8F0FE; color: #174EA6; }
.chip-green { background: #E6F4EA; color: #137333; }

.server-subgrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
}

.skill-rows {
  display: flex;
  flex-direction: column;
  gap: 1.5px;
  font-size: 7.8px;
  color: #3C4043;
  line-height: 1.25;
}

.tools-grid-2x2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3px;
  margin-top: 2px;
}
.tool-badge {
  font-family: var(--cs-font-mono);
  font-size: 7.5px;
  font-weight: 700;
  text-align: center;
  padding: 2px 3px;
  border-radius: 3px;
}
.tool-blue { background: #E8F0FE; color: #174EA6; }
.tool-green { background: #E6F4EA; color: #137333; }

.txt-purple { color: #4B2EDB; font-weight: 600; }
.txt-green { color: #137333; font-weight: 600; }

/* Connector Columns */
.conn-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-around;
  padding: 16px 0;
}
.conn-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
}
.conn-svg {
  width: 30px;
  height: 11px;
}
.conn-tag {
  font-size: 7px;
  font-weight: 700;
  padding: 0.5px 3px;
  border-radius: 2px;
}
.tag-blue { background: #E8F0FE; color: #185ABC; }
.tag-gray { background: #F1F3F4; color: #5F6368; }
.tag-green { background: #E6F4EA; color: #137333; }
.tag-purple { background: #F5F0FF; color: #4B2EDB; }
.conn-sub {
  font-size: 6.8px;
  color: #5F6368;
  font-weight: 600;
}

/* Bottom Callout */
.topo-footer {
  background: #F8F9FA;
  border: 1px solid #E8EAED;
  border-left: 3px solid #185ABC;
  padding: 4px 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.topo-badge {
  background: #E8F0FE;
  color: #174EA6;
  font-size: 8.5px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  white-space: nowrap;
}
.topo-footer-copy {
  font-size: 8.5px;
  color: #202124;
  line-height: 1.25;
}
.topo-footer-copy span {
  color: #3C4043;
  margin-left: 4px;
}
</style>
