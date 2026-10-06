<script setup lang="ts">
import { ref, computed } from 'vue'

type ScreenId = 'E' | 'A' | 'F' | 'B' | 'D' | 'C' | 'G'

const persona = ref<'marta_byrne' | 'zero_offer'>('marta_byrne')
const currentScreen = ref<ScreenId>('E')
const priorityAdded = ref(false)
const seatsConfirmed = ref(false)
const bagCount = ref(0)
const drawerOpen = ref(false)
const carAdded = ref(false)
const activePassIdx = ref(0)
const liveIframeMode = ref(false)

const passengers = [
  { name: 'Marta Byrne', role: 'Adult (Lead)', seat: '12A', badge: 'MB' },
  { name: 'Declan B', role: 'Adult', seat: '12B', badge: 'DB' },
  { name: 'Fia B', role: 'Child (6)', seat: '12C', badge: 'FB' },
  { name: 'Oisín B', role: 'Child (9)', seat: '12D', badge: 'OB' }
]

const basketTotal = computed(() => {
  let total = 0
  if (priorityAdded.value) total += 76.0
  if (seatsConfirmed.value) total += 24.0
  if (bagCount.value > 0) total += +(bagCount.value * 39.99).toFixed(2)
  if (carAdded.value) total += 28.0
  return total.toFixed(2)
})

const hasBasketItems = computed(() => parseFloat(basketTotal.value) > 0)

function selectPersona(p: 'marta_byrne' | 'zero_offer') {
  persona.value = p
  currentScreen.value = 'E'
  if (p === 'zero_offer') {
    priorityAdded.value = false
    seatsConfirmed.value = false
    bagCount.value = 0
    carAdded.value = false
  }
}

function loadCanonicalFullBasket() {
  persona.value = 'marta_byrne'
  priorityAdded.value = true
  seatsConfirmed.value = true
  bagCount.value = 1
  carAdded.value = false
  currentScreen.value = 'D'
}

function startCheckin() {
  if (persona.value === 'zero_offer') {
    currentScreen.value = 'C'
  } else {
    currentScreen.value = 'A'
  }
}

function confirmSeatsFromMap() {
  seatsConfirmed.value = true
  // Critical Invariant: Confirm seats on Screen F jumps directly to Offer Page 2 (Screen B)
  currentScreen.value = 'B'
}

function continueFromPage2() {
  // Critical Invariant: Empty basket skips Review & Pay (Screen D) and goes straight to Boarding Passes (Screen G)
  if (hasBasketItems.value) {
    currentScreen.value = 'D'
  } else {
    currentScreen.value = 'G'
  }
}
</script>

<template>
  <div class="hh-sim-root">
    <!-- Top Presenter Control Bar -->
    <div class="hh-toolbar">
      <div class="hh-persona-tabs">
        <button
          :class="['hh-tab', { active: persona === 'marta_byrne' && !liveIframeMode }]"
          @click="liveIframeMode = false; selectPersona('marta_byrne')"
        >
          Marta (2 Steps)
        </button>
        <button
          :class="['hh-tab', { active: persona === 'zero_offer' && !liveIframeMode }]"
          @click="liveIframeMode = false; selectPersona('zero_offer')"
        >
          Zero-Offer (1 Step)
        </button>
        <button
          class="hh-tab"
          title="Jump to canonical €139.99 basket on Screen D"
          @click="liveIframeMode = false; loadCanonicalFullBasket()"
        >
          €139.99 Checkout
        </button>
      </div>

      <div class="hh-screen-pills" v-if="!liveIframeMode">
        <button
          v-for="s in (['E', 'A', 'F', 'B', 'D', 'C', 'G'] as ScreenId[])"
          :key="s"
          :class="['scr-pill', { active: currentScreen === s }]"
          @click="currentScreen = s"
        >
          {{ s }}
        </button>
      </div>

      <button
        :class="['hh-tab live-toggle', { active: liveIframeMode }]"
        @click="liveIframeMode = !liveIframeMode"
        title="Toggle live FastAPI :8000 iframe"
      >
        {{ liveIframeMode ? ' Interactive Sim' : '⚡ :8000 App' }}
      </button>
    </div>

    <!-- Live FastAPI Iframe Mode -->
    <div v-if="liveIframeMode" class="hh-iframe-wrap">
      <iframe src="http://localhost:8000/" class="hh-iframe" title="Live Ryanair Help Hub App"></iframe>
    </div>

    <!-- Native Dual-Mode App 2026 Help Hub Viewport -->
    <div v-else class="hh-viewport">
      <!-- ================================================================
           FULL GREETING HEADER (Exclusively on Screen E and Screen C)
           ================================================================ -->
      <header v-if="currentScreen === 'E' || currentScreen === 'C'" class="hh-header-full">
        <div class="hh-header-top">
          <div class="hh-harp-badge">RYANAIR</div>
          <div class="hh-avatar-group">
            <span class="hh-bell">🔔</span>
            <span class="hh-avatar">MB</span>
          </div>
        </div>
        <div class="hh-greeting">Hi Marta,</div>
        <div class="hh-greeting-sub">Let's get you checked in · Ask or search for help with this trip</div>
      </header>

      <!-- ================================================================
           COMPACT NAVIGATION HEADER (Screens A, F, B, D, G)
           ================================================================ -->
      <header v-else class="hh-header-compact">
        <button
          v-if="currentScreen === 'F'"
          class="hh-back-btn"
          @click="currentScreen = 'A'"
        >←</button>
        <button
          v-else-if="currentScreen === 'B'"
          class="hh-back-btn"
          title="Offer Page 2 Back Arrow always returns to Offer Page 1 (Screen A)"
          @click="currentScreen = 'A'"
        >←</button>
        <button
          v-else-if="currentScreen === 'D'"
          class="hh-back-btn"
          @click="currentScreen = 'B'"
        >←</button>
        <button
          v-else
          class="hh-back-btn"
          @click="currentScreen = 'E'"
        >←</button>

        <span class="hh-compact-title">
          <template v-if="currentScreen === 'A' || currentScreen === 'B'">Check in</template>
          <template v-else-if="currentScreen === 'F'">Choose your seats</template>
          <template v-else-if="currentScreen === 'D'">Review your extras</template>
          <template v-else-if="currentScreen === 'G'">Boarding passes</template>
        </span>

        <!-- Strict Step-Numbering Invariant: ONLY Offer Pages A & B carry step numbers -->
        <span v-if="currentScreen === 'A'" class="hh-step-chip">Step 1 of 2</span>
        <span v-else-if="currentScreen === 'B'" class="hh-step-chip">Step 2 of 2</span>
        <span v-else class="hh-step-placeholder"></span>
      </header>

      <!-- ================================================================
           SCREEN E: CHECK-IN START
           ================================================================ -->
      <div v-if="currentScreen === 'E'" class="hh-body">
        <div class="hh-step-overline">
          {{ persona === 'marta_byrne' ? '2 STEPS TO YOUR BOARDING PASSES' : '1 STEP' }}
        </div>

        <div class="hh-card">
          <div class="hh-flight-row">
            <div>
              <div class="hh-route">DUB → FAO</div>
              <div class="hh-meta">FR1234 · Tue 14 Oct · Departs 06:35 · Gate 104</div>
            </div>
            <span class="hh-status-yellow">Check-in open</span>
          </div>
          <div class="hh-ref-line">Booking Ref: <strong>X8Y9QL</strong> · 7 nights · Value fare</div>
        </div>

        <div class="hh-card">
          <div class="hh-section-label">4 PASSENGERS</div>
          <div class="hh-pax-grid">
            <div v-for="p in passengers" :key="p.name" class="hh-pax-item">
              <span class="hh-pax-avatar">{{ p.badge }}</span>
              <div>
                <div class="hh-pax-name">{{ p.name }}</div>
                <div class="hh-pax-role">{{ p.role }}</div>
              </div>
            </div>
          </div>
        </div>

        <button class="hh-btn-primary" @click="startCheckin">
          Start check-in →
        </button>
      </div>

      <!-- ================================================================
           SCREEN A: OFFER PAGE 1 OF 2 ("Your usual, ready to go")
           ================================================================ -->
      <div v-else-if="currentScreen === 'A'" class="hh-body">
        <div class="hh-lavender-panel">
          <div class="hh-ai-header">
            <span class="hh-sparkle">✦</span>
            <span>You usually travel with Priority</span>
          </div>
          <p class="hh-ai-copy">
            I've put your usual cabin bags and family seating together in one place for this flight.
          </p>

          <!-- Card A: Priority & 2 Cabin Bags (Starts unselected — Zero Pre-Selection) -->
          <div class="hh-inner-card">
            <div class="hh-card-top">
              <div>
                <span class="hh-pill-indigo">Your usual · Score 0.84</span>
                <div class="hh-card-title">Priority &amp; 2 Cabin Bags</div>
                <div class="hh-meta">You added this on your last 3 trips · €19 × 4 pax</div>
              </div>
              <div class="hh-price">€76.00</div>
            </div>
            <div class="hh-card-actions">
              <span class="hh-link-subtle">Applies to all 4 · Choose who</span>
              <button
                :class="['hh-toggle-pill', { selected: priorityAdded }]"
                @click="priorityAdded = !priorityAdded"
              >
                {{ priorityAdded ? '✓ Added (€76.00)' : '+ Add for all 4' }}
              </button>
            </div>
          </div>

          <!-- Card B: Sit together (Row 12 12A-12D) -->
          <div class="hh-inner-card">
            <div class="hh-card-top">
              <div>
                <span class="hh-pill-amber">Recommended · Score 0.71</span>
                <div class="hh-card-title">Sit together (Row 12: 12A–12D)</div>
                <div class="hh-meta">2 children (ages 6 &amp; 9) · €6.00 × 4 contiguous seats</div>
              </div>
              <div class="hh-price">€24.00</div>
            </div>
            <div class="hh-card-actions">
              <span class="hh-seat-preview">Row 12 · 12A 12B 12C 12D</span>
              <button class="hh-toggle-pill" @click="currentScreen = 'F'">
                {{ seatsConfirmed ? '✓ Row 12 Confirmed' : 'Choose seats →' }}
              </button>
            </div>
          </div>
        </div>

        <div class="hh-dual-actions">
          <button v-if="priorityAdded || seatsConfirmed" class="hh-btn-primary" @click="currentScreen = 'B'">
            Continue to Step 2 →
          </button>
          <!-- First-Class Decline Action: Equal visual weight outlined pill -->
          <button class="hh-btn-decline" @click="currentScreen = 'B'">
            No thanks, continue →
          </button>
        </div>
      </div>

      <!-- ================================================================
           SCREEN F: BOEING 737 SEAT MAP (Sub-screen of A, Zero Timers)
           ================================================================ -->
      <div v-else-if="currentScreen === 'F'" class="hh-body">
        <div class="hh-lavender-panel compact">
          <div class="hh-ai-header">
            <span class="hh-sparkle">✦</span>
            <span>I've found 4 seats together in Row 12</span>
          </div>
          <p class="hh-ai-copy">
            Best row for your group (Marta, Declan, Fia 6y, Oisín 9y). No countdown timer pressure.
          </p>
        </div>

        <div class="hh-card seatmap-card">
          <div class="seat-row">
            <span class="row-num">11</span>
            <span class="seat-box taken">11A</span>
            <span class="seat-box open">11B</span>
            <span class="seat-box open">11C</span>
            <span class="aisle">AISLE</span>
            <span class="seat-box taken">11D</span>
            <span class="seat-box open">11E</span>
            <span class="seat-box open">11F</span>
          </div>
          <div class="seat-row recommended-row">
            <span class="row-num">12</span>
            <span class="seat-box rec">12A</span>
            <span class="seat-box rec">12B</span>
            <span class="seat-box rec">12C</span>
            <span class="aisle">★</span>
            <span class="seat-box rec">12D</span>
            <span class="seat-box open">12E</span>
            <span class="seat-box open">12F</span>
          </div>
          <div class="seat-row">
            <span class="row-num">13</span>
            <span class="seat-box open">13A</span>
            <span class="seat-box open">13B</span>
            <span class="seat-box taken">13C</span>
            <span class="aisle">AISLE</span>
            <span class="seat-box open">13D</span>
            <span class="seat-box open">13E</span>
            <span class="seat-box open">13F</span>
          </div>
          <!-- Note: Row 14 is never rendered; Row 16 is Overwing Exit blocked for children 6 & 9 -->
          <div class="seat-row exit-restricted">
            <span class="row-num">16</span>
            <span class="exit-banner">OVERWING EXIT ROW — NO UNDER-16s (Fia 6y, Oisín 9y)</span>
          </div>
        </div>

        <button class="hh-btn-primary" @click="confirmSeatsFromMap">
          Confirm seats 12A–12D · €24.00 →
        </button>
      </div>

      <!-- ================================================================
           SCREEN B: OFFER PAGE 2 OF 2 ("Anything in the hold?")
           ================================================================ -->
      <div v-else-if="currentScreen === 'B'" class="hh-body">
        <div class="hh-lavender-panel">
          <div class="hh-ai-header">
            <span class="hh-sparkle">✦</span>
            <span>Most families on this route add a bag</span>
          </div>
          <p class="hh-ai-copy">
            Customise your checked luggage allowance for this flight (7 nights, 4 travellers).
          </p>

          <!-- Card C: 20kg Checked Bag (Stepper starting at 0) -->
          <div class="hh-inner-card">
            <div class="hh-card-top">
              <div>
                <span class="hh-pill-indigo">Score 0.58 · Outbound</span>
                <div class="hh-card-title">20kg Checked Bag</div>
                <div class="hh-meta">1 shared hold bag for 7 nights in Faro</div>
              </div>
              <div class="hh-price">€39.99</div>
            </div>
            <div class="hh-card-actions">
              <span class="hh-link-subtle">Starts at 0 (zero pre-selection)</span>
              <div class="hh-stepper">
                <button @click="bagCount = Math.max(0, bagCount - 1)">−</button>
                <span>{{ bagCount }}</span>
                <button @click="bagCount = Math.min(3, bagCount + 1)">+</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Collapsed Drawer: "More extras (1)" for Car Hire (0.29) -->
        <div class="hh-card drawer-card">
          <div class="drawer-header" @click="drawerOpen = !drawerOpen">
            <span>More extras (1) — Car hire in Faro (Score 0.29)</span>
            <span>{{ drawerOpen ? '▲' : '▼' }}</span>
          </div>
          <div v-if="drawerOpen" class="drawer-content">
            <div class="hh-meta">Faro Airport pickup · Collapsed below 0.50 primary card threshold</div>
            <button class="hh-toggle-pill" @click="carAdded = !carAdded">
              {{ carAdded ? '✓ Added (€28/day)' : '+ Add from €28.00/day' }}
            </button>
          </div>
        </div>

        <div class="hh-dual-actions">
          <button v-if="hasBasketItems" class="hh-btn-primary" @click="continueFromPage2">
            Review &amp; Pay (€{{ basketTotal }}) →
          </button>
          <button class="hh-btn-decline" @click="continueFromPage2">
            No thanks, continue →
          </button>
        </div>
      </div>

      <!-- ================================================================
           SCREEN D: REVIEW & PAY (Conditional: basket > 0)
           ================================================================ -->
      <div v-else-if="currentScreen === 'D'" class="hh-body">
        <div class="hh-card">
          <div class="hh-section-label">YOUR EXTRAS FOR FR1234 (DUB → FAO)</div>
          <div v-if="priorityAdded" class="checkout-line">
            <div>
              <div class="hh-pax-name">Priority &amp; 2 Cabin Bags × 4</div>
              <div class="hh-meta">Marta, Declan, Fia, Oisín</div>
            </div>
            <div class="checkout-right">
              <strong>€76.00</strong>
              <button class="remove-btn" @click="priorityAdded = false">Remove</button>
            </div>
          </div>
          <div v-if="seatsConfirmed" class="checkout-line">
            <div>
              <div class="hh-pax-name">Reserved Seats (12A, 12B, 12C, 12D)</div>
              <div class="hh-meta">Row 12 family block</div>
            </div>
            <div class="checkout-right">
              <strong>€24.00</strong>
              <button class="remove-btn" @click="seatsConfirmed = false">Remove</button>
            </div>
          </div>
          <div v-if="bagCount > 0" class="checkout-line">
            <div>
              <div class="hh-pax-name">20kg Checked Bag × {{ bagCount }}</div>
              <div class="hh-meta">Outbound DUB → FAO</div>
            </div>
            <div class="checkout-right">
              <strong>€{{ (bagCount * 39.99).toFixed(2) }}</strong>
              <button class="remove-btn" @click="bagCount = 0">Remove</button>
            </div>
          </div>

          <div class="checkout-total-row">
            <span>Total due (Visa ending 4412)</span>
            <span class="checkout-total-val">€{{ basketTotal }}</span>
          </div>
        </div>

        <button class="hh-btn-primary" @click="currentScreen = 'G'">
          Pay €{{ basketTotal }} and get boarding passes →
        </button>
      </div>

      <!-- ================================================================
           SCREEN C: ZERO-OFFER STATE ("1 STEP" — Zero Offer Cards)
           ================================================================ -->
      <div v-else-if="currentScreen === 'C'" class="hh-body">
        <div class="hh-step-overline">1 STEP</div>
        <div class="hh-card">
          <div class="hh-flight-row">
            <div>
              <div class="hh-route">DUB → FAO</div>
              <div class="hh-meta">FR1234 · Departs 06:35 · Gate 104 · Ref X8Y9QL</div>
            </div>
            <span class="hh-status-green">Ready</span>
          </div>
        </div>

        <div class="hh-lavender-panel">
          <div class="hh-ai-header">
            <span class="hh-sparkle">✦</span>
            <span>You're all set</span>
          </div>
          <p class="hh-ai-copy">
            Nothing else to add for this trip. Zero ancillaries passed the 0.10 eligibility floor, so we compressed the funnel to 0 offer pages.
          </p>
        </div>

        <button class="hh-btn-primary" @click="currentScreen = 'G'">
          Get boarding passes →
        </button>
      </div>

      <!-- ================================================================
           SCREEN G: BOARDING PASSES (4 Swipeable Passes)
           ================================================================ -->
      <div v-else-if="currentScreen === 'G'" class="hh-body">
        <div class="pass-tabs">
          <button
            v-for="(p, idx) in passengers"
            :key="p.name"
            :class="['pass-tab', { active: activePassIdx === idx }]"
            @click="activePassIdx = idx"
          >
            {{ idx + 1 }}/4 {{ p.name.split(' ')[0] }}
          </button>
        </div>

        <div class="hh-card pass-card">
          <div class="pass-header">
            <div>
              <div class="hh-route">DUB → FAO</div>
              <div class="hh-meta">FR1234 · 14 Oct · Boarding 05:55 · Gate 104</div>
            </div>
            <div class="pass-badges">
              <span v-if="priorityAdded" class="badge-priority">PRIORITY</span>
              <span class="badge-seat">{{ seatsConfirmed ? passengers[activePassIdx].seat : 'ALLOCATED' }}</span>
            </div>
          </div>

          <div class="pass-pax-row">
            <div>
              <div class="hh-pax-name">{{ passengers[activePassIdx].name }}</div>
              <div class="hh-meta">{{ passengers[activePassIdx].role }} · Ref X8Y9QL</div>
            </div>
            <div class="qr-mock">▣ QR</div>
          </div>
        </div>

        <button class="hh-btn-primary" @click="currentScreen = 'E'">
           Add all 4 to Apple Wallet
        </button>
        <button class="hh-link-manage" @click="currentScreen = 'D'">
          Changed your mind? Manage extras
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hh-sim-root {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #F8F9FA;
  font-family: var(--hh-font-sans);
}
.hh-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 8px;
  background: #202124;
  color: #FFFFFF;
  gap: 6px;
  flex-wrap: wrap;
}
.hh-persona-tabs, .hh-screen-pills {
  display: flex;
  gap: 4px;
}
.hh-tab, .scr-pill {
  background: rgba(255, 255, 255, 0.12);
  color: #E8EAED;
  border: none;
  border-radius: 4px;
  padding: 3px 7px;
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
}
.hh-tab.active, .scr-pill.active {
  background: #4285F4;
  color: #FFFFFF;
}
.live-toggle.active {
  background: #34A853;
}
.hh-iframe-wrap {
  flex: 1;
  width: 100%;
  height: 100%;
}
.hh-iframe {
  width: 100%;
  height: 100%;
  border: none;
}
.hh-viewport {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #FFFFFF;
  overflow-y: auto;
}
.hh-header-full {
  background: #073590;
  color: #FFFFFF;
  padding: 10px 14px 12px 14px;
  border-bottom-left-radius: 14px;
  border-bottom-right-radius: 14px;
}
.hh-header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}
.hh-harp-badge {
  font-size: 10px;
  font-weight: 700;
  color: #F1C933;
  letter-spacing: 0.08em;
}
.hh-avatar-group {
  display: flex;
  align-items: center;
  gap: 6px;
}
.hh-avatar {
  background: #002164;
  border: 2px solid #F1C933;
  color: #FFFFFF;
  font-size: 9px;
  font-weight: 700;
  padding: 2px 5px;
  border-radius: 999px;
}
.hh-greeting {
  font-size: 1.1rem;
  font-weight: 700;
  line-height: 1.15;
}
.hh-greeting-sub {
  font-size: 10px;
  opacity: 0.85;
  margin-top: 2px;
}
.hh-header-compact {
  background: #073590;
  color: #FFFFFF;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.hh-back-btn {
  background: rgba(255,255,255,0.15);
  color: #FFFFFF;
  border: none;
  border-radius: 999px;
  width: 22px;
  height: 22px;
  font-size: 12px;
  cursor: pointer;
}
.hh-compact-title {
  font-size: 12px;
  font-weight: 700;
}
.hh-step-chip {
  background: #F1C933;
  color: #10131A;
  font-size: 9.5px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 999px;
}
.hh-body {
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}
.hh-step-overline {
  background: #EEF2FF;
  color: #073590;
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.08em;
  padding: 4px 10px;
  border-radius: 999px;
  align-self: flex-start;
}
.hh-card {
  background: #FFFFFF;
  border: 1px solid #E4E7EC;
  border-radius: 10px;
  padding: 9px 11px;
}
.hh-flight-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.hh-route {
  font-size: 14px;
  font-weight: 700;
  color: #10131A;
}
.hh-meta {
  font-size: 10px;
  color: #5B6472;
}
.hh-ref-line {
  font-size: 10px;
  color: #10131A;
  margin-top: 4px;
}
.hh-status-yellow {
  background: #F1C933;
  color: #10131A;
  font-size: 9.5px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 999px;
}
.hh-status-green {
  background: #DCFCE7;
  color: #15803D;
  font-size: 9.5px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 999px;
}
.hh-section-label {
  font-size: 9.5px;
  font-weight: 700;
  color: #5B6472;
  letter-spacing: 0.06em;
  margin-bottom: 6px;
}
.hh-pax-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}
.hh-pax-item {
  display: flex;
  align-items: center;
  gap: 6px;
}
.hh-pax-avatar {
  background: #EEF2FF;
  color: #073590;
  font-size: 9px;
  font-weight: 700;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.hh-pax-name {
  font-size: 11px;
  font-weight: 600;
  color: #10131A;
}
.hh-pax-role {
  font-size: 9.5px;
  color: #5B6472;
}
.hh-lavender-panel {
  background: #F2F1FE;
  border-radius: 14px;
  padding: 9px 10px;
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.hh-ai-header {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #4B2EDB;
  font-size: 11.5px;
  font-weight: 700;
}
.hh-ai-copy {
  font-size: 10px;
  color: #5B6472;
  margin: 0;
  line-height: 1.35;
}
.hh-inner-card {
  background: #FFFFFF;
  border: 1px solid #E4E7EC;
  border-radius: 10px;
  padding: 8px 10px;
}
.hh-card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.hh-pill-indigo {
  background: #EEF2FF;
  color: #4338CA;
  font-size: 8.5px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 999px;
}
.hh-pill-amber {
  background: #FEF3C7;
  color: #B45309;
  font-size: 8.5px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 999px;
}
.hh-card-title {
  font-size: 12px;
  font-weight: 700;
  color: #10131A;
  margin-top: 2px;
}
.hh-price {
  font-size: 13px;
  font-weight: 700;
  color: #073590;
}
.hh-card-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 6px;
}
.hh-link-subtle, .hh-seat-preview {
  font-size: 9.5px;
  color: #5B6472;
}
.hh-toggle-pill {
  background: #FFFFFF;
  color: #073590;
  border: 1px solid #073590;
  border-radius: 999px;
  padding: 3px 9px;
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
}
.hh-toggle-pill.selected {
  background: #073590;
  color: #FFFFFF;
}
.hh-dual-actions {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-top: auto;
}
.hh-btn-primary {
  background: #073590;
  color: #FFFFFF;
  border: 1.5px solid #073590;
  border-radius: 999px;
  padding: 7px 12px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  width: 100%;
  text-align: center;
}
.hh-btn-decline {
  background: #FFFFFF;
  color: #073590;
  border: 1.5px solid #073590;
  border-radius: 999px;
  padding: 7px 12px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  width: 100%;
  text-align: center;
}
.seatmap-card {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.seat-row {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 9.5px;
}
.recommended-row {
  background: #FEF9C3;
  padding: 3px 4px;
  border-radius: 6px;
  border: 1px solid #F1C933;
}
.row-num {
  width: 16px;
  font-weight: 700;
  color: #5B6472;
}
.seat-box {
  padding: 3px 5px;
  border-radius: 4px;
  font-weight: 600;
  border: 1px solid #E4E7EC;
}
.seat-box.rec {
  background: #F1C933;
  color: #10131A;
  border-color: #073590;
  font-weight: 700;
}
.seat-box.taken {
  background: #E4E7EC;
  color: #9CA3AF;
}
.aisle {
  flex: 1;
  text-align: center;
  font-size: 8px;
  color: #9CA3AF;
}
.exit-restricted {
  opacity: 0.45;
  background: #F3F4F6;
  padding: 4px 6px;
  border-radius: 4px;
}
.exit-banner {
  font-size: 8.5px;
  font-weight: 700;
  color: #B91C1C;
}
.hh-stepper {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #073590;
  border-radius: 999px;
  padding: 1px 8px;
}
.hh-stepper button {
  background: none;
  border: none;
  color: #073590;
  font-weight: 700;
  cursor: pointer;
}
.drawer-header {
  display: flex;
  justify-content: space-between;
  font-size: 10.5px;
  font-weight: 600;
  color: #10131A;
  cursor: pointer;
}
.drawer-content {
  margin-top: 6px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.checkout-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 0;
  border-bottom: 1px solid #E4E7EC;
}
.checkout-right {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
}
.remove-btn {
  background: none;
  border: none;
  color: #B91C1C;
  font-size: 9.5px;
  cursor: pointer;
  text-decoration: underline;
}
.checkout-total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 7px;
  font-size: 11.5px;
  font-weight: 700;
  color: #10131A;
}
.checkout-total-val {
  font-size: 14px;
  color: #073590;
}
.pass-tabs {
  display: flex;
  gap: 4px;
}
.pass-tab {
  flex: 1;
  background: #F3F4F6;
  border: 1px solid #E4E7EC;
  border-radius: 6px;
  padding: 3px 4px;
  font-size: 9.5px;
  font-weight: 600;
  cursor: pointer;
}
.pass-tab.active {
  background: #073590;
  color: #FFFFFF;
}
.pass-header, .pass-pax-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}
.pass-badges {
  display: flex;
  gap: 4px;
}
.badge-priority {
  background: #F1C933;
  color: #10131A;
  font-size: 8.5px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
}
.badge-seat {
  background: #073590;
  color: #FFFFFF;
  font-size: 8.5px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
}
.qr-mock {
  background: #10131A;
  color: #FFFFFF;
  font-family: monospace;
  font-size: 10px;
  padding: 6px 8px;
  border-radius: 4px;
}
.hh-link-manage {
  background: none;
  border: none;
  color: #073590;
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
  text-align: center;
}
</style>
