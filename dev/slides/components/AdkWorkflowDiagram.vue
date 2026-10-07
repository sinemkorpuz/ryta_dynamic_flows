<script setup lang="ts">
import { ref } from 'vue'

type FocusKey = 'all' | 'runner' | 'tools' | 'llm' | 'guardrails'

const activeFocus = ref<FocusKey>('all')

const focusInfo: Record<FocusKey, { badge: string; title: string; detail: string }> = {
  all: {
    badge: 'ADK Agent Internals (~57ms)',
    title: 'Complete Google ADK Agent, Declarative Skills, Tool Registry & Guardrail Loop',
    detail: 'FastAPI delegates to CheckinFlowService & ADKOrchestrator, which coordinate 3 declarative skills, 4 deterministic <10ms Python tools, and the google.adk.agents.Agent (gemini-3.8-flash) inside a 220ms circuit-breaker.',
  },
  runner: {
    badge: '1. Orchestrator & Skills',
    title: 'ADKOrchestrator (dev/core/orchestrator.py) & 3 Declarative Skills (dev/skills/)',
    detail: 'Manages ExecutionContext (trace_id, session_id), sequences ancillary_ranking → page_builder → assistant_copy, and enforces the 220ms async timeout around LLM calls.',
  },
  tools: {
    badge: '2. Deterministic Tool Registry (<10ms)',
    title: '4 Stateless Airline Domain Tools Registered on the ADK Agent (dev/tools/)',
    detail: 'score_ancillaries() [0.00–1.00], apply_eligibility_rules() [4 removal gates], build_seat_map() [Row 12 12A–12D & child exit-row lock], and build_basket_state() [exact €139.99 math].',
  },
  llm: {
    badge: '3. ADK Agent & Gemini Flash',
    title: 'google.adk.agents.Agent(model="gemini-3.8-flash", tools=[...])',
    detail: 'Synthesizes warm first-person assistant copy ("You usually travel with Priority") and grounded Help Hub Q&A answers (temperature=0.2, max_output_tokens=160) from tool outputs.',
  },
  guardrails: {
    badge: '4. Circuit Breaker, Guardrails & Telemetry',
    title: '220ms Fallback + Anti-Dark-Pattern Validator + OpenTelemetry Audit',
    detail: 'validate_assistant_copy() blocks "AI/bot" labels, MM:SS countdown timers, scarcity text, and Row 14; falls back to canonical Stitch copy on timeout and emits schema-valid traces to telemetry.jsons.',
  },
}
</script>

<template>
  <div class="adk-int-root cs-framed-surface">
    <!-- Top Interactive Component Filter -->
    <div class="adk-int-toolbar">
      <div class="adk-int-left">
        <span class="adk-int-dot"></span>
        <span class="adk-int-title">GOOGLE ADK AGENT INTERNALS · ORCHESTRATOR, SKILLS, TOOL REGISTRY &amp; GUARDRAILS</span>
      </div>
      <div class="adk-int-pills">
        <button :class="['f-pill', { active: activeFocus === 'all' }]" @click="activeFocus = 'all'">Full Internals</button>
        <button :class="['f-pill', { active: activeFocus === 'runner' }]" @click="activeFocus = 'runner'">1. Orchestrator &amp; Skills</button>
        <button :class="['f-pill', { active: activeFocus === 'tools' }]" @click="activeFocus = 'tools'">2. 4 ADK Tools (&lt;10ms)</button>
        <button :class="['f-pill', { active: activeFocus === 'llm' }]" @click="activeFocus = 'llm'">3. ADK Agent (Gemini Flash)</button>
        <button :class="['f-pill', { active: activeFocus === 'guardrails' }]" @click="activeFocus = 'guardrails'">4. Circuit Breaker &amp; Guardrails</button>
      </div>
    </div>

    <!-- Execution Sequence & Latency SLA Bar (HTML Flexbox — Never Overlaps) -->
    <div class="sla-sequence-bar">
      <span class="sla-label">RUNTIME SLA (<code>p95 ≤ 300ms</code>):</span>
      <span class="sla-step"><strong>① Signals</strong> (<code>&lt;2ms</code>)</span>
      <span class="sla-arr">→</span>
      <span class="sla-step sla-step-green"><strong>② 4 ADK Tools</strong> (<code>&lt;10ms</code>)</span>
      <span class="sla-arr">→</span>
      <span class="sla-step sla-step-purple"><strong>③ Gemini Flash Copy</strong> (<code>~45ms</code>)</span>
      <span class="sla-arr">→</span>
      <span class="sla-step sla-step-amber"><strong>④ 220ms Guardrail &amp; Trace</strong> (<strong>~57.1ms Total</strong>)</span>
    </div>

    <!-- Main 3-Column Internal ADK Architecture Grid with Directed SVG Connectors -->
    <div class="adk-grid">
      <!-- ================================================================
           ZONE 1: ORCHESTRATOR & 3 DECLARATIVE SKILLS
           ================================================================ -->
      <div
        :class="['zone-col zone-col-blue', { dimmed: activeFocus !== 'all' && activeFocus !== 'runner' }]"
        @click="activeFocus = 'runner'"
      >
        <div class="zone-header zh-blue">1. ORCHESTRATOR &amp; 3 SKILLS</div>
        <div class="zone-body">
          <div class="z-box z-box-navy">
            <div class="z-kicker zk-navy">INCOMING CALL · <code>resolve_signals()</code> (<code>&lt;2ms</code>)</div>
            <div class="z-title">Booking <code>X8Y9QL</code> · <code>FR1234</code> (<code>DUB → FAO</code>)</div>
            <div class="z-desc">2 Adults + 2 Kids (<code>6y, 9y</code>) · <code>3/4</code> Priority · <code>6×</code> Ins. Decline</div>
          </div>

          <div class="z-box z-box-green">
            <div class="z-kicker zk-green">SKILL 1 · <code>dev/skills/ancillary_ranking</code></div>
            <div class="z-title"><code>rank_and_filter_ancillaries()</code></div>
            <div class="z-desc">Calls <strong>Tool 1</strong> (Scorer) → <strong>Tool 2</strong> (4 Protection Gates)</div>
          </div>

          <div class="z-box z-box-green">
            <div class="z-kicker zk-green">SKILL 2 · <code>dev/skills/page_builder</code></div>
            <div class="z-title"><code>CheckinFlowService</code> (0–2 Page Packer)</div>
            <div class="z-desc"><code>≥0.50</code> → Cards · <code>0.10–0.49</code> → Drawer · Calls <strong>Tools 3 &amp; 4</strong></div>
          </div>

          <div class="z-box z-box-purple">
            <div class="z-kicker zk-purple">SKILL 3 · <code>dev/skills/assistant_copy</code></div>
            <div class="z-title"><code>synthesize_assistant_panel()</code> &amp; Q&amp;A</div>
            <div class="z-desc">Delegates to <code>ADKOrchestrator.run_with_fallback()</code></div>
          </div>
        </div>
      </div>

      <!-- Connector 1: Skills -> Tools -->
      <div class="wf-conn-col">
        <div class="wf-conn-item">
          <span class="wf-tag wf-tag-blue">Call</span>
          <svg viewBox="0 0 28 12" class="wf-svg">
            <path d="M2 6 H25 M21 2.5 L25.5 6 L21 9.5" stroke="#185ABC" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
        <div class="wf-conn-item">
          <span class="wf-tag wf-tag-green">JSON</span>
          <svg viewBox="0 0 28 12" class="wf-svg">
            <path d="M26 6 H3 M7 2.5 L2.5 6 L7 9.5" stroke="#137333" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
      </div>

      <!-- ================================================================
           ZONE 2: DETERMINISTIC ADK TOOL REGISTRY (<10ms)
           ================================================================ -->
      <div
        :class="['zone-col zone-col-green', { dimmed: activeFocus !== 'all' && activeFocus !== 'tools' }]"
        @click="activeFocus = 'tools'"
      >
        <div class="zone-header zh-green">2. DETERMINISTIC ADK TOOL REGISTRY (<code>&lt;10ms</code>)</div>
        <div class="zone-body">
          <div class="z-box z-box-blue">
            <div class="z-kicker zk-blue">TOOL 1 · <code>propensity_scorer.py</code> (<code>&lt;5ms</code>)</div>
            <div class="z-title"><code>score_ancillaries(signals)</code> → 8 Ranked Scores</div>
            <div class="z-desc"><strong class="txt-green">Priority 0.84 · Seats 0.71 · 20kg Bag 0.58</strong> · Car 0.29</div>
          </div>

          <div class="z-box z-box-red">
            <div class="z-kicker zk-red">TOOL 2 · <code>eligibility_rules.py</code> (<code>&lt;3ms</code>)</div>
            <div class="z-title"><code>apply_eligibility_rules()</code> → 4 Hard Gates</div>
            <div class="z-desc">Strips: <code>FAO FastTrack</code>, <code>&lt;48h Flexi</code>, <code>6× Ins.</code>, <code>&lt;0.10 Transfer</code></div>
          </div>

          <div class="z-box z-box-green">
            <div class="z-kicker zk-green">TOOL 3 · <code>seat_allocator.py</code> (<code>&lt;4ms</code>)</div>
            <div class="z-title"><code>build_seat_map()</code> → B737 Child-Safe Cabin</div>
            <div class="z-desc">Pre-allocates <code>Row 12 (12A–12D, €24)</code> · Locks Exit Row 16</div>
          </div>

          <div class="z-box z-box-amber">
            <div class="z-kicker zk-amber">TOOL 4 · <code>basket_pricing.py</code> (<code>&lt;2ms</code>)</div>
            <div class="z-title"><code>build_basket_state()</code> &amp; Boarding Passes</div>
            <div class="z-desc">Exact math: <code>€76 + €24 + €39.99 = €139.99</code> · <code>€0</code> skips Screen D</div>
          </div>
        </div>
      </div>

      <!-- Connector 2: Tools <-> ADK Agent & Guardrails -->
      <div class="wf-conn-col">
        <div class="wf-conn-item">
          <span class="wf-tag wf-tag-purple">tools=[]</span>
          <svg viewBox="0 0 28 12" class="wf-svg">
            <path d="M3 6 H25 M6 2.5 L2 6 L6 9.5 M22 2.5 L26 6 L22 9.5" stroke="#4B2EDB" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
        <div class="wf-conn-item">
          <span class="wf-tag wf-tag-amber">≤220ms</span>
          <svg viewBox="0 0 28 12" class="wf-svg">
            <path d="M2 6 H25 M21 2.5 L25.5 6 L21 9.5" stroke="#B06000" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
      </div>

      <!-- ================================================================
           RIGHT STACK: ZONE 3 (ADK AGENT) + ZONE 4 (CIRCUIT BREAKER & GUARDRAILS)
           ================================================================ -->
      <div class="right-stack">
        <!-- ZONE 3: GOOGLE ADK AGENT INTERNALS -->
        <div
          :class="['zone-col zone-col-purple', { dimmed: activeFocus !== 'all' && activeFocus !== 'llm' }]"
          @click="activeFocus = 'llm'"
        >
          <div class="zone-header zh-purple">3. GOOGLE ADK AGENT (<code>Gemini Flash</code>)</div>
          <div class="zone-body">
            <div class="z-box z-box-white">
              <div class="z-kicker zk-purple">ADK AGENT · <code>dev/core/orchestrator.py</code></div>
              <div class="z-title"><code>Agent(model="gemini-3.8-flash")</code></div>
              <div class="z-desc">Registered with all 4 tools · <code>temp=0.2</code> · <code>max_tokens=160</code></div>
            </div>
            <div class="z-box z-box-white">
              <div class="z-kicker zk-navy">EMPATHETIC 1ST-PERSON COPY &amp; LIVE Q&amp;A</div>
              <div class="z-desc"><em>"You usually travel with Priority — added on your last 3 trips."</em><br/><strong class="txt-purple">"I've found 4 seats together — Row 12, near the front."</strong></div>
            </div>
          </div>
        </div>

        <!-- ZONE 4: CIRCUIT BREAKER, GUARDRAILS & TELEMETRY -->
        <div
          :class="['zone-col zone-col-dark', { dimmed: activeFocus !== 'all' && activeFocus !== 'guardrails' }]"
          @click="activeFocus = 'guardrails'"
        >
          <div class="zone-header zh-dark">4. CIRCUIT BREAKER, GUARDRAILS &amp; TELEMETRY</div>
          <div class="zone-body">
            <div class="guardrail-subgrid">
              <div class="z-box z-box-amber">
                <div class="z-kicker zk-amber">220ms BREAKER</div>
                <div class="z-title"><code>wait_for(0.22s)</code></div>
                <div class="z-desc">Timeout → Instant Stitch copy fallback</div>
              </div>
              <div class="z-box z-box-green">
                <div class="z-kicker zk-green">COPY VALIDATOR</div>
                <div class="z-title"><code>validate_copy()</code></div>
                <div class="z-desc">Blocks <code>"AI"</code>, <code>MM:SS</code> timers &amp; <code>Row 14</code></div>
              </div>
            </div>
            <div class="telemetry-out-pill">
              ✓ Emits Valid Trace (<code>contracts/telemetry.jsons</code>) &amp; Returns JSON
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Interactive Explanation Strip -->
    <div class="adk-int-footer">
      <span class="adk-int-badge">{{ focusInfo[activeFocus].badge }}</span>
      <div class="adk-int-copy">
        <strong>{{ focusInfo[activeFocus].title }}:</strong>
        <span>{{ focusInfo[activeFocus].detail }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.adk-int-root {
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
.adk-int-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #E8EAED;
  padding-bottom: 4px;
  flex-shrink: 0;
}
.adk-int-left {
  display: flex;
  align-items: center;
  gap: 6px;
}
.adk-int-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #137333;
}
.adk-int-title {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: #202124;
}
.adk-int-pills {
  display: flex;
  gap: 4px;
}
.f-pill {
  font-size: 8.5px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 999px;
  border: 1px solid #DADCE0;
  background: #F8F9FA;
  color: #3C4043;
  cursor: pointer;
}
.f-pill.active {
  background: #137333;
  color: #FFFFFF;
  border-color: #137333;
}

/* Runtime SLA Sequence Bar */
.sla-sequence-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #F8F9FA;
  border: 1px solid #DADCE0;
  border-radius: 4px;
  padding: 3px 8px;
  font-size: 8.3px;
  flex-shrink: 0;
}
.sla-label {
  font-weight: 700;
  color: #202124;
}
.sla-step {
  background: #EEF3FC;
  color: #073590;
  padding: 1px 6px;
  border-radius: 3px;
}
.sla-step-green { background: #E6F4EA; color: #137333; }
.sla-step-purple { background: #F5F0FF; color: #4B2EDB; }
.sla-step-amber { background: #FEF7E0; color: #B06000; }
.sla-arr {
  color: #5F6368;
  font-weight: 700;
}

/* Main 3-Column Internal ADK Grid */
.adk-grid {
  flex: 1;
  display: grid;
  grid-template-columns: 1.15fr 30px 1.28fr 30px 1.35fr;
  align-items: stretch;
  min-height: 0;
}
.zone-col {
  display: flex;
  flex-direction: column;
  background: #F8F9FA;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  transition: opacity 0.15s ease;
}
.zone-col.dimmed {
  opacity: 0.28;
}
.zone-col-blue { border: 1px solid #185ABC; }
.zone-col-green { border: 1px solid #137333; }
.zone-col-purple { background: #F5F0FF; border: 1px solid #4B2EDB; }
.zone-col-dark { border: 1px solid #B06000; }

.zone-header {
  font-size: 8.3px;
  font-weight: 700;
  color: #FFFFFF;
  text-align: center;
  padding: 3px 4px;
  letter-spacing: 0.03em;
  flex-shrink: 0;
}
.zone-header code {
  background: rgba(255, 255, 255, 0.2) !important;
  color: #FFFFFF !important;
  border: none !important;
  font-size: 7.8px !important;
  padding: 0 3px !important;
}
.zh-blue { background: #185ABC; }
.zh-green { background: #137333; }
.zh-purple { background: #4B2EDB; }
.zh-dark { background: #202124; color: #FBBC05; }

.zone-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 4px 5px;
  gap: 3.5px;
}

.right-stack {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 4px;
}
.right-stack .zone-col {
  flex: 1;
}

/* Individual Component Cards inside Zones */
.z-box {
  background: #FFFFFF;
  border-radius: 4px;
  padding: 3.5px 6px;
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.z-box-navy { background: #EEF3FC; border: 1px solid #D2E3FC; }
.z-box-blue { background: #E8F0FE; border: 1px solid #4285F4; }
.z-box-green { background: #FFFFFF; border: 1px solid #34A853; }
.z-box-red { background: #FCE8E6; border: 1px solid #EA4335; }
.z-box-amber { background: #FEF7E0; border: 1px solid #FBBC05; }
.z-box-purple { background: #F5F0FF; border: 1px solid #4B2EDB; }
.z-box-white { background: #FFFFFF; border: 1px solid #D2C4FC; }

.z-kicker {
  font-size: 7.2px;
  font-weight: 700;
  letter-spacing: 0.02em;
  line-height: 1.15;
}
.zk-navy { color: #073590; }
.zk-blue { color: #174EA6; }
.zk-green { color: #137333; }
.zk-red { color: #C5221F; }
.zk-amber { color: #B06000; }
.zk-purple { color: #4B2EDB; }

.z-title {
  font-size: 8.5px;
  font-weight: 700;
  color: #202124;
  line-height: 1.2;
}
.z-desc {
  font-size: 7.6px;
  color: #3C4043;
  line-height: 1.22;
}

.guardrail-subgrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
}
.telemetry-out-pill {
  background: #E8F0FE;
  border: 1px solid #4285F4;
  color: #174EA6;
  font-size: 7.6px;
  font-weight: 700;
  text-align: center;
  padding: 2px 4px;
  border-radius: 3px;
}

.txt-green { color: #137333; }
.txt-purple { color: #4B2EDB; }

/* Connector Columns */
.wf-conn-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-around;
  padding: 18px 0;
}
.wf-conn-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
}
.wf-svg {
  width: 26px;
  height: 11px;
}
.wf-tag {
  font-size: 6.8px;
  font-weight: 700;
  padding: 0.5px 3px;
  border-radius: 2px;
}
.wf-tag-blue { background: #E8F0FE; color: #185ABC; }
.wf-tag-green { background: #E6F4EA; color: #137333; }
.wf-tag-purple { background: #F5F0FF; color: #4B2EDB; }
.wf-tag-amber { background: #FEF7E0; color: #B06000; }

/* Bottom Callout */
.adk-int-footer {
  background: #F8F9FA;
  border: 1px solid #E8EAED;
  border-left: 3px solid #137333;
  padding: 4px 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.adk-int-badge {
  background: #E6F4EA;
  color: #137333;
  font-size: 8.5px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  white-space: nowrap;
}
.adk-int-copy {
  font-size: 8.5px;
  color: #202124;
  line-height: 1.25;
}
.adk-int-copy span {
  color: #3C4043;
  margin-left: 4px;
}
</style>
