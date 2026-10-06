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
          <svg viewBox="0 0 380 300" class="arch-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="380" height="300" fill="#F8F9FA" />
            <!-- Multicolor Geometric Cloudstyle Arch -->
            <path d="M40 300 A150 150 0 0 1 340 300" stroke="#4285F4" stroke-width="28" fill="none" />
            <path d="M76 300 A114 114 0 0 1 304 300" stroke="#34A853" stroke-width="24" fill="none" />
            <path d="M108 300 A82 82 0 0 1 272 300" stroke="#FBBC05" stroke-width="20" fill="none" />
            <path d="M136 300 A54 54 0 0 1 244 300" stroke="#EA4335" stroke-width="16" fill="none" />
            <!-- Floating Architecture Telemetry Pill -->
            <rect x="28" y="24" width="324" height="78" rx="8" fill="#FFFFFF" stroke="#D9D9D9" stroke-width="1.2" />
            <circle cx="52" cy="50" r="8" fill="#073590" />
            <text x="68" y="54" fill="#202124" font-family="Google Sans, sans-serif" font-size="12" font-weight="700">FR1234 · DUB → FAO · Booking X8Y9QL</text>
            <text x="68" y="74" fill="#5F6368" font-family="Google Sans, sans-serif" font-size="11">7 Pages → 2 Steps · p95 ≤ 300ms · +6.3pp Conversion</text>
            <rect x="268" y="40" width="68" height="22" rx="11" fill="#E6F4EA" />
            <text x="281" y="55" fill="#137333" font-family="Google Sans, sans-serif" font-size="10" font-weight="700">~57ms SLA</text>
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
  top: 34px;
  right: 48px;
  font-size: 11px;
  color: #202124;
}
.cover-grid {
  display: grid;
  grid-template-columns: 54% 43%;
  gap: 3%;
  align-items: center;
  margin-top: 24px;
  flex: 1;
}
.cover-eyebrow {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.09em;
  color: #4285F4;
  margin-bottom: 12px;
}
.cover-headline {
  font-size: 2.55rem;
  line-height: 1.14;
  margin: 0 0 16px 0;
}
.cover-subtitle {
  font-size: 1.02rem;
  line-height: 1.45;
  color: #5F6368;
  margin: 0 0 18px 0;
}
.cover-meta {
  font-size: 0.85rem;
  color: #202124;
}
.arch-frame {
  border: 1px solid #5F6368;
  background: #F8F9FA;
  overflow: hidden;
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
