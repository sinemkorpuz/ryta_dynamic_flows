<script setup lang="ts">
import { computed } from 'vue'
import CloudFooter from '../components/CloudFooter.vue'

const props = withDefaults(defineProps<{
  color?: 'blue' | 'green' | 'yellow' | 'red'
  sectionNo?: string
  title?: string
  subtitle?: string
}>(), {
  color: 'blue',
  sectionNo: '01'
})

const bgMap = {
  blue: '#4285F4',
  green: '#34A853',
  yellow: '#FBBC05',
  red: '#EA4335'
}

/* Critical Cloudstyle 2.0 Contrast Rule:
   On #FBBC05 yellow backgrounds, all text, divider lines, and icons MUST switch to #202124 (DARK1). */
const isYellow = computed(() => props.color === 'yellow')
const fgColor = computed(() => (isYellow.value ? '#202124' : '#FFFFFF'))
const lineColor = computed(() => (isYellow.value ? 'rgba(32, 33, 36, 0.35)' : 'rgba(255, 255, 255, 0.45)'))
const footerTheme = computed(() => (isYellow.value ? 'yellow' : 'dark'))
</script>

<template>
  <div
    class="slidev-layout cloud-break"
    :style="{ backgroundColor: bgMap[color], color: fgColor }"
  >
    <div class="break-grid">
      <!-- Left Column: Section Number & Title (Slides 08-11 spec: x=36pt, y=50.4pt, 30pt) -->
      <div class="break-left">
        <div class="break-number" :style="{ color: fgColor }">{{ sectionNo }}</div>
        <h1 class="break-title" :style="{ color: fgColor }">{{ title }}</h1>
        <p v-if="subtitle" class="break-subtitle" :style="{ color: fgColor }">{{ subtitle }}</p>
      </div>

      <!-- Right Column: Subtopics Index with Horizontal Lines and Icons -->
      <div class="break-right" :style="{ '--break-line': lineColor, '--break-fg': fgColor }">
        <slot />
      </div>
    </div>

    <CloudFooter :theme="footerTheme" />
  </div>
</template>

<style scoped>
.cloud-break {
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.break-grid {
  display: grid;
  grid-template-columns: 38% 56%;
  gap: 6%;
  align-items: start;
  margin-top: -12px;
}
.break-number {
  font-size: 2.2rem;
  font-weight: 400;
  line-height: 1.1;
  margin-bottom: 8px;
}
.break-title {
  font-size: 1.85rem;
  font-weight: 400 !important;
  line-height: 1.22;
  margin: 0 0 12px 0;
}
.break-subtitle {
  font-size: 0.88rem;
  line-height: 1.48;
  opacity: 0.9;
}
.break-right :deep(.subtopic-row) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 4px;
  border-bottom: 1px solid var(--break-line);
  color: var(--break-fg);
}
.break-right :deep(.subtopic-row:first-child) {
  border-top: 1px solid var(--break-line);
}
.break-right :deep(.subtopic-title) {
  font-size: 0.92rem;
  font-weight: 500;
}
.break-right :deep(.subtopic-meta) {
  display: block;
  font-size: 0.75rem;
  opacity: 0.88;
  margin-top: 2px;
}
.break-right :deep(.subtopic-icon) {
  font-size: 0.95rem;
  font-weight: 700;
}
</style>
