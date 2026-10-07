<script setup lang="ts">
defineProps<{
  title?: string
  accentTitle?: string
  subtitle?: string
  date?: string
  author?: string
  confidentiality?: string
}>()
</script>

<template>
  <div class="slidev-layout cloud-cover">
    <!-- Top-Right Confidentiality Notice (Slide 02 spec: x=549.8pt, y=44.0pt) -->
    <div class="cover-confidential">
      {{ confidentiality || 'Proprietary & Confidential' }}
    </div>

    <div class="cover-grid">
      <!-- Left Headline & Date Block -->
      <div class="cover-left">
        <div class="cover-eyebrow">CUSTOMER DEMO · APP 2026 HELP HUB</div>
        <h1 class="cs-display-twotone cover-headline">
          <span>{{ title || 'Ryanair Dynamic Ancillary Flows' }}</span>
          <br v-if="accentTitle" />
          <span v-if="accentTitle" class="accent-clause">{{ accentTitle }}</span>
        </h1>
        <p v-if="subtitle" class="cover-subtitle">{{ subtitle }}</p>
        <div class="cover-meta">
          <slot />
        </div>
      </div>

      <!-- Right Hero Graphic / Multicolor Cloudstyle Arch (Slide 02 spec: 0.8pt #5F6368 border) -->
      <div class="cover-right">
        <div class="arch-frame">
          <!-- Crisp HTML/CSS Summary Card (no overlapping SVG text) -->
          <div class="arch-telemetry-card">
            <div class="arch-card-top">
              <div class="arch-flight-title">
                <span class="arch-navy-dot"></span>
                <span>FR1234 · DUB → FAO</span>
                <code class="arch-pnr">X8Y9QL</code>
              </div>
              <span class="arch-sla-pill">~57ms SLA</span>
            </div>
            <div class="arch-card-metrics">
              <span class="arch-metric-chip">7 Pages → 2 Steps</span>
              <span class="arch-metric-chip">p95 ≤ 300ms</span>
              <span class="arch-metric-chip">+6.3pp Conversion</span>
            </div>
          </div>

          <!-- Pure Vector Multicolor Cloudstyle Arch -->
          <svg viewBox="0 0 380 200" class="arch-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="380" height="200" fill="#F8F9FA" />
            <path d="M40 200 A150 150 0 0 1 340 200" stroke="#4285F4" stroke-width="26" fill="none" />
            <path d="M76 200 A114 114 0 0 1 304 200" stroke="#34A853" stroke-width="22" fill="none" />
            <path d="M108 200 A82 82 0 0 1 272 200" stroke="#FBBC05" stroke-width="18" fill="none" />
            <path d="M136 200 A54 54 0 0 1 244 200" stroke="#EA4335" stroke-width="14" fill="none" />
          </svg>
        </div>
      </div>
    </div>

    <!-- Bottom-Left Official Google Cloud Lockup -->
    <div class="cover-logo">
      <span class="gc-dots">
        <i style="background:#4285F4"></i>
        <i style="background:#EA4335"></i>
        <i style="background:#FBBC05"></i>
        <i style="background:#34A853"></i>
      </span>
      <span class="gc-wordmark">Google Cloud</span>
      <span class="gc-divider">|</span>
      <span class="gc-partner">Ryanair Dynamic Ancillary Flows (ryta)</span>
    </div>
  </div>
</template>

<style scoped>
.cloud-cover {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 36px 48px 34px 48px;
}
.cover-confidential {
  position: absolute;
  top: 28px;
  right: 48px;
  font-size: 11px;
  color: #5F6368;
}
.cover-grid {
  display: grid;
  grid-template-columns: 54% 43%;
  gap: 3%;
  align-items: center;
  margin-top: 20px;
  flex: 1;
}
.cover-eyebrow {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.09em;
  color: #4285F4;
  margin-bottom: 10px;
}
.cover-headline {
  font-size: 2.15rem;
  line-height: 1.18;
  margin: 0 0 14px 0;
}
.cover-subtitle {
  font-size: 0.94rem;
  line-height: 1.46;
  color: #5F6368;
  margin: 0 0 16px 0;
}
.cover-meta {
  font-size: 0.82rem;
  color: #202124;
}
.arch-frame {
  border: 1px solid #5F6368;
  background: #F8F9FA;
  overflow: hidden;
  padding: 14px 14px 0 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.arch-telemetry-card {
  background: #FFFFFF;
  border: 1px solid #D9D9D9;
  border-radius: 8px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}
.arch-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.arch-flight-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  font-weight: 700;
  color: #202124;
  white-space: nowrap;
}
.arch-navy-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #073590;
  display: inline-block;
  flex-shrink: 0;
}
.arch-pnr {
  font-size: 0.68rem !important;
  padding: 1px 5px !important;
}
.arch-sla-pill {
  background: #E6F4EA;
  color: #137333;
  font-size: 0.66rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
  white-space: nowrap;
  flex-shrink: 0;
}
.arch-card-metrics {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.arch-metric-chip {
  background: #F1F3F4;
  color: #3C4043;
  font-size: 0.66rem;
  font-weight: 500;
  padding: 2px 7px;
  border-radius: 4px;
  white-space: nowrap;
}
.arch-svg {
  display: block;
  width: 100%;
  height: auto;
}
.cover-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
}
.gc-dots {
  display: inline-flex;
  gap: 4px;
}
.gc-dots i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}
.gc-wordmark {
  font-size: 15px;
  font-weight: 500;
  color: #5F6368;
}
.gc-divider {
  color: #CCCCCC;
}
.gc-partner {
  font-size: 12.5px;
  color: #202124;
  font-weight: 500;
}
</style>
