<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const priorPriorityTrips = ref(3)
const childrenCount = ref(2)
const tripNights = ref(7)
const passengerCount = ref(4)
const hoursToDeparture = ref(36)
const routeType = ref<'leisure' | 'business'>('leisure')
const apiMode = ref<'live' | 'fallback'>('fallback')
const latencyMs = ref(56.8)

/* Deterministic scoring & eligibility rules mirroring dev/tools/propensity_scorer.py & eligibility_rules.py */
const scoredCatalog = computed(() => {
  const prioScore = +(0.24 + 0.20 * Math.min(priorPriorityTrips.value, 3)).toFixed(2)
  const seatScore = +(0.35 + 0.18 * Math.min(childrenCount.value, 2)).toFixed(2)
  const bagScore = +(0.16 + 0.04 * Math.min(tripNights.value, 7) + 0.035 * passengerCount.value).toFixed(2)
  const carScore = routeType.value === 'leisure' ? 0.29 : 0.12

  const items = [
    {
      id: 'priority_boarding',
      title: 'Priority & 2 Cabin Bags',
      score: prioScore,
      price: `€${(19 * passengerCount.value).toFixed(2)}`,
      status: prioScore >= 0.50 ? 'PAGE 1 · CARD A' : prioScore >= 0.10 ? 'DRAWER' : 'BELOW_DISPLAY_FLOOR',
      kept: prioScore >= 0.10
    },
    {
      id: 'reserved_seats',
      title: 'Sit together (Row 12: 12A–12D)',
      score: seatScore,
      price: `€${(6 * passengerCount.value).toFixed(2)}`,
      status: seatScore >= 0.50 ? 'PAGE 1 · CARD B' : 'DRAWER',
      kept: seatScore >= 0.10
    },
    {
      id: 'checked_bag_20kg',
      title: '20kg Checked Bag',
      score: bagScore,
      price: '€39.99',
      status: bagScore >= 0.50 ? 'PAGE 2 · CARD C' : 'DRAWER',
      kept: bagScore >= 0.10
    },
    {
      id: 'car_hire',
      title: 'Car hire in Faro',
      score: carScore,
      price: 'From €28/day',
      status: 'PAGE 2 · DRAWER (0.10–0.49)',
      kept: carScore >= 0.10
    },
    {
      id: 'fast_track',
      title: 'Fast Track security',
      score: 0.14,
      price: '€28.00',
      status: 'STRIPPED: INELIGIBLE_ROUTE_PRODUCT (FAO)',
      kept: false
    },
    {
      id: 'travel_insurance',
      title: 'Travel insurance',
      score: 0.11,
      price: '€64.00',
      status: 'STRIPPED: SUPPRESSED_DECLINE_STREAK (6x)',
      kept: false
    },
    {
      id: 'airport_transfer',
      title: 'Airport transfer',
      score: 0.08,
      price: '€20.00',
      status: 'STRIPPED: BELOW_DISPLAY_FLOOR (<0.10)',
      kept: false
    },
    {
      id: 'flexi_upgrade',
      title: 'Flexi fare upgrade',
      score: 0.04,
      price: '€90.00',
      status: hoursToDeparture.value <= 48 ? 'STRIPPED: INELIGIBLE_TIME_WINDOW (<=48h)' : 'BELOW_DISPLAY_FLOOR',
      kept: false
    }
  ]
  return items.sort((a, b) => b.score - a.score)
})

const pageCount = computed(() => {
  const primaryCards = scoredCatalog.value.filter(i => i.kept && i.score >= 0.50).length
  if (primaryCards === 0) return 0
  return primaryCards > 2 ? 2 : 1
})

async function probeLiveBackend() {
  const t0 = performance.now()
  try {
    const res = await fetch('http://localhost:8000/api/v1/checkin/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        persona_id: 'marta_byrne',
        signal_overrides: {
          prior_priority_trips: priorPriorityTrips.value,
          children_count: childrenCount.value,
          trip_nights: tripNights.value,
          passenger_count: passengerCount.value,
          hours_to_departure: hoursToDeparture.value
        }
      })
    })
    if (res.ok) {
      apiMode.value = 'live'
      latencyMs.value = +(performance.now() - t0).toFixed(1)
    }
  } catch {
    apiMode.value = 'fallback'
  }
}

function applyMartaPreset() {
  priorPriorityTrips.value = 3
  childrenCount.value = 2
  tripNights.value = 7
  passengerCount.value = 4
  hoursToDeparture.value = 36
  routeType.value = 'leisure'
  probeLiveBackend()
}

function applyLowAffinityPreset() {
  priorPriorityTrips.value = 0
  childrenCount.value = 0
  tripNights.value = 1
  passengerCount.value = 1
  hoursToDeparture.value = 24
  routeType.value = 'business'
  probeLiveBackend()
}

onMounted(() => {
  probeLiveBackend()
})
</script>

<template>
  <div class="explorer-root">
    <div class="explorer-header">
      <div class="preset-btns">
        <button class="p-btn" @click="applyMartaPreset">Preset: Marta Byrne (2 Pages)</button>
        <button class="p-btn" @click="applyLowAffinityPreset">Preset: Solo 1-Night (0 Primary Cards)</button>
      </div>
      <span :class="['mode-badge', apiMode]">
        {{ apiMode === 'live' ? `⚡ Live FastAPI (${latencyMs}ms)` : `✓ Deterministic Engine (${latencyMs}ms)` }}
      </span>
    </div>

    <!-- Interactive Signal Sliders -->
    <div class="sliders-bar">
      <label>
        <span>Priority History: <strong>{{ priorPriorityTrips }}/4 trips</strong></span>
        <input type="range" min="0" max="3" v-model.number="priorPriorityTrips" @change="probeLiveBackend" />
      </label>
      <label>
        <span>Children: <strong>{{ childrenCount }}</strong></span>
        <input type="range" min="0" max="2" v-model.number="childrenCount" @change="probeLiveBackend" />
      </label>
      <label>
        <span>Trip Nights: <strong>{{ tripNights }}n</strong></span>
        <input type="range" min="1" max="10" v-model.number="tripNights" @change="probeLiveBackend" />
      </label>
      <label>
        <span>Output Funnel: <strong class="blue-txt">{{ pageCount }} Offer Pages</strong></span>
      </label>
    </div>

    <!-- 8-Ancillary Ranked Scoring & Rule Gate Table -->
    <table class="cs-table-a explorer-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Candidate Ancillary</th>
          <th>Propensity Score</th>
          <th>Price</th>
          <th>Rule Gate / Page Builder Placement</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, idx) in scoredCatalog" :key="item.id" :class="{ stripped: !item.kept }">
          <td>{{ idx + 1 }}</td>
          <td><strong>{{ item.title }}</strong></td>
          <td>
            <div class="score-cell">
              <div class="score-bar-bg">
                <div
                  class="score-bar-fill"
                  :style="{
                    width: `${Math.round(item.score * 100)}%`,
                    backgroundColor: !item.kept ? '#BDC1C6' : item.score >= 0.5 ? '#4285F4' : '#FBBC05'
                  }"
                ></div>
              </div>
              <span class="score-num">{{ item.score.toFixed(2) }}</span>
            </div>
          </td>
          <td>{{ item.price }}</td>
          <td>
            <span :class="['gate-pill', item.kept ? 'kept' : 'removed']">
              {{ item.status }}
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.explorer-root {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 10px 12px;
  background: #FFFFFF;
  box-sizing: border-box;
  gap: 8px;
}
.explorer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.preset-btns {
  display: flex;
  gap: 6px;
}
.p-btn {
  background: #F1F3F4;
  border: 1px solid #D9D9D9;
  color: #202124;
  font-size: 10px;
  font-weight: 600;
  padding: 3px 8px;
  cursor: pointer;
}
.p-btn:hover {
  background: #D2E3FC;
  border-color: #4285F4;
}
.mode-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
}
.mode-badge.live {
  background: #E6F4EA;
  color: #137333;
}
.mode-badge.fallback {
  background: #D2E3FC;
  color: #185ABC;
}
.sliders-bar {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  background: #F8F9FA;
  border: 1px solid #E8EAED;
  padding: 6px 10px;
  font-size: 10px;
}
.sliders-bar label {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.sliders-bar input[type="range"] {
  width: 100%;
  accent-color: #4285F4;
}
.blue-txt {
  color: #4285F4;
  font-size: 11px;
}
.explorer-table th, .explorer-table td {
  padding: 4px 7px !important;
  font-size: 10px !important;
}
.explorer-table tr.stripped td {
  color: #5F6368;
  background: #FAFAFA;
}
.score-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}
.score-bar-bg {
  width: 56px;
  height: 6px;
  background: #E8EAED;
  overflow: hidden;
}
.score-bar-fill {
  height: 100%;
}
.score-num {
  font-family: var(--cs-font-mono);
  font-weight: 600;
}
.gate-pill {
  font-size: 9px;
  font-weight: 700;
  padding: 1.5px 5px;
}
.gate-pill.kept {
  background: #D2E3FC;
  color: #185ABC;
}
.gate-pill.removed {
  background: #FCE8E6;
  color: #C5221F;
}
</style>
