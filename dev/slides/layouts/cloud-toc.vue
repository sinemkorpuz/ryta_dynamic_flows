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
  grid-template-columns: 32% 64%;
  gap: 4%;
  margin-top: 12px;
}
.toc-sub {
  font-size: 0.84rem;
  line-height: 1.5;
  color: #5F6368;
  margin-top: 10px;
}
.toc-right :deep(.toc-row) {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 14px 4px;
  border-bottom: 1px solid #CCCCCC;
}
.toc-right :deep(.toc-row:first-child) {
  border-top: 1px solid #CCCCCC;
}
.toc-right :deep(.toc-label) {
  font-size: 1.08rem;
  font-weight: 400;
  color: #202124;
}
.toc-right :deep(.toc-desc) {
  display: block;
  font-size: 0.76rem;
  color: #5F6368;
  margin-top: 3px;
}
.toc-right :deep(.toc-num) {
  font-size: 1.15rem;
  font-weight: 400;
  color: #4285F4;
  font-variant-numeric: tabular-nums;
  margin-left: 16px;
}
</style>
