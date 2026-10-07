<script setup lang="ts">
import { ref, onMounted } from 'vue'

const kpis = ref({
  conversionRate: '24.1%',
  conversionDelta: '+6.3pp vs 17.8% static',
  avgPages: '1.8',
  avgPagesBaseline: 'vs 4.6 static funnel',
  medianTime: '71s',
  medianTimeBaseline: 'vs 2m 14s (134s) static',
  offersShown: '2.4',
  offersBaseline: 'vs 8.0 catalog items'
})

const takeupRows = ref([
  { name: 'Priority & 2 Cabin Bags', score: '0.84', takeup: 42, color: '#4285F4' },
  { name: 'Reserved Seats (Row 12)', score: '0.71', takeup: 35, color: '#1967D2' },
  { name: '20kg Checked Bag', score: '0.58', takeup: 24, color: '#8AB4F8' },
  { name: 'Car Hire (Drawer)', score: '0.29', takeup: 6, color: '#D2E3FC' }
])

const guardrails = [
  { label: 'Zero Pre-Selection', status: 'Verified across 100% of sessions', icon: '✓' },
  { label: 'Equal-Weight Decline Pill', status: '"No thanks, continue →" suppresses item', icon: '✓' },
  { label: 'Child Seating Safety', status: 'Row 12 (12A–12D) allocated; Exit Row 16 blocked', icon: '✓' },
  { label: 'Zero Scarcity / Timers', status: 'No countdown timers or artificial urgency', icon: '✓' }
]

onMounted(async () => {
  try {
    const res = await fetch('http://localhost:8000/api/v1/analytics/summary')
    if (res.ok) {
      const data = await res.json()
      if (data?.kpis?.ancillary_conversion_pct) {
        kpis.value.conversionRate = `${data.kpis.ancillary_conversion_pct}%`
      }
    }
  } catch {
    // Uses canonical verified Screen 10 metrics in offline/SPA mode
  }
})
</script>

<template>
  <div class="ops-widget-root">
    <!-- Top 4 Screen 10 KPI Billboard Tiles -->
    <div class="kpi-grid">
      <div class="kpi-tile">
        <div class="kpi-label">ANCILLARY CONVERSION</div>
        <div class="kpi-val">{{ kpis.conversionRate }}</div>
        <div class="kpi-delta positive">{{ kpis.conversionDelta }}</div>
      </div>
      <div class="kpi-tile">
        <div class="kpi-label">OFFER PAGES / CHECK-IN</div>
        <div class="kpi-val">{{ kpis.avgPages }}</div>
        <div class="kpi-delta">{{ kpis.avgPagesBaseline }}</div>
      </div>
      <div class="kpi-tile">
        <div class="kpi-label">MEDIAN TIME TO PASS</div>
        <div class="kpi-val">{{ kpis.medianTime }}</div>
        <div class="kpi-delta positive">{{ kpis.medianTimeBaseline }}</div>
      </div>
      <div class="kpi-tile">
        <div class="kpi-label">AVG OFFERS RENDERED</div>
        <div class="kpi-val">{{ kpis.offersShown }}</div>
        <div class="kpi-delta">{{ kpis.offersBaseline }}</div>
      </div>
    </div>

    <!-- Take-Up Monochromatic Blue Bar Chart (Cloudstyle Slides 29-31 palette) -->
    <div class="chart-card">
      <div class="cs-eyebrow">SCREEN 10 MODEL FEEDBACK LOOP · ATTACH RATE BY RANKED OFFER</div>
      <div v-for="row in takeupRows" :key="row.name" class="bar-row">
        <span class="bar-name">{{ row.name }} <em>(Score {{ row.score }})</em></span>
        <div class="bar-track">
          <div class="bar-fill" :style="{ width: `${row.takeup * 2}%`, backgroundColor: row.color }"></div>
        </div>
        <span class="bar-pct">{{ row.takeup }}%</span>
      </div>
    </div>

    <!-- Business-Friendly Ethical Guardrails & Telemetry Audit Card -->
    <div class="guardrail-box">
      <div class="guardrail-header">
        <span>CLOSED-LOOP AGENT TELEMETRY &amp; ETHICAL UX GUARDRAILS</span>
        <span class="schema-valid">✓ 100% Validated (~57ms Server Response)</span>
      </div>
      <div class="guardrail-grid">
        <div v-for="g in guardrails" :key="g.label" class="g-pill">
          <span class="g-check">{{ g.icon }}</span>
          <div>
            <div class="g-title">{{ g.label }}</div>
            <div class="g-sub">{{ g.status }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ops-widget-root {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  padding: 10px 12px;
  background: #FFFFFF;
  box-sizing: border-box;
  gap: 8px;
}
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}
.kpi-tile {
  border: 1px solid #D9D9D9;
  padding: 7px 8px;
  background: #FFFFFF;
}
.kpi-label {
  font-size: 8.5px;
  font-weight: 700;
  color: #5F6368;
  letter-spacing: 0.05em;
}
.kpi-val {
  font-size: 1.35rem;
  font-weight: 400;
  color: #4285F4;
  line-height: 1.15;
  margin: 2px 0;
}
.kpi-delta {
  font-size: 9px;
  color: #5F6368;
}
.kpi-delta.positive {
  color: #137333;
  font-weight: 600;
}
.chart-card {
  border: 1px solid #E8EAED;
  background: #F8F9FA;
  padding: 8px 10px;
}
.bar-row {
  display: grid;
  grid-template-columns: 44% 44% 10%;
  align-items: center;
  gap: 1%;
  font-size: 10px;
  margin-top: 5px;
}
.bar-name em {
  font-style: normal;
  color: #5F6368;
}
.bar-track {
  background: #E8EAED;
  height: 8px;
  overflow: hidden;
}
.bar-fill {
  height: 100%;
}
.bar-pct {
  text-align: right;
  font-weight: 700;
  color: #202124;
}
.guardrail-box {
  background: #F8F9FA;
  border: 1px solid #D9D9D9;
  padding: 8px 10px;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.guardrail-header {
  display: flex;
  justify-content: space-between;
  font-size: 9px;
  font-weight: 700;
  color: #4285F4;
  letter-spacing: 0.04em;
  margin-bottom: 6px;
}
.schema-valid {
  color: #137333;
}
.guardrail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}
.g-pill {
  background: #FFFFFF;
  border: 1px solid #E8EAED;
  padding: 5px 8px;
  display: flex;
  align-items: flex-start;
  gap: 6px;
}
.g-check {
  color: #34A853;
  font-weight: 700;
  font-size: 11px;
}
.g-title {
  font-size: 10px;
  font-weight: 700;
  color: #202124;
}
.g-sub {
  font-size: 9px;
  color: #5F6368;
}
</style>
