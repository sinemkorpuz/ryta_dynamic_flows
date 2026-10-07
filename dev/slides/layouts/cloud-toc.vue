<script setup lang="ts">
import CloudFooter from '../components/CloudFooter.vue'
import RainbowBar from '../components/RainbowBar.vue'

defineProps<{
  title?: string
  subtitle?: string
}>()
</script>

<template>
  <div class="slidev-layout cloud-toc">
    <RainbowBar height="4px" class="mb-5" />
    <div class="toc-grid">
      <!-- Left Title (Slide 03 spec: x=48.0pt, y=62.4pt, 30pt #202124) -->
      <div class="toc-left">
        <h1 class="cs-slide-title">{{ title || 'Contents' }}</h1>
        <p v-if="subtitle" class="toc-sub">{{ subtitle }}</p>
      </div>

      <!-- Right Column with 0.8pt #CCCCCC horizontal divider lines and #4285F4 numbering -->
      <div class="toc-right">
        <slot />
      </div>
    </div>
    <CloudFooter theme="light" />
  </div>
</template>

<style scoped>
.toc-grid {
  display: grid;
  grid-template-columns: 29% 67%;
  gap: 4%;
  margin-top: 4px;
}
.toc-sub {
  font-size: 0.8rem;
  line-height: 1.45;
  color: #5F6368;
  margin-top: 8px;
}
.toc-right :deep(.toc-row) {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 4.5px 4px;
  border-bottom: 1px solid #CCCCCC;
}
.toc-right :deep(.toc-row:first-child) {
  border-top: 1px solid #CCCCCC;
}
.toc-right :deep(.toc-label) {
  font-size: 0.82rem;
  font-weight: 600;
  color: #202124;
}
.toc-right :deep(.toc-desc) {
  display: block;
  font-size: 0.66rem;
  color: #5F6368;
  margin-top: 1px;
}
.toc-right :deep(.toc-num) {
  font-size: 0.9rem;
  font-weight: 600;
  color: #4285F4;
  font-variant-numeric: tabular-nums;
  margin-left: 12px;
  flex-shrink: 0;
}
.toc-right :deep(.toc-badge-end) {
  display: inline-block;
  background: #FEF7E0;
  color: #B06000;
  border: 1px solid #FDE293;
  font-size: 9px;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 3px;
  margin-right: 5px;
  letter-spacing: 0.04em;
  vertical-align: middle;
}
.toc-right :deep(.toc-badge-fallback) {
  display: inline-block;
  background: #F1F3F4;
  color: #3C4043;
  border: 1px solid #DADCE0;
  font-size: 9px;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 3px;
  margin-right: 5px;
  letter-spacing: 0.04em;
  vertical-align: middle;
}
</style>
