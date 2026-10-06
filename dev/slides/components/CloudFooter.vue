<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  theme?: 'light' | 'dark' | 'yellow'
  confidentiality?: string
}>(), {
  theme: 'light',
  confidentiality: 'Proprietary & Confidential'
})

const textColor = computed(() => {
  if (props.theme === 'dark') return '#FFFFFF'
  if (props.theme === 'yellow') return '#202124'
  return '#5F6368'
})
</script>

<template>
  <footer class="cs-footer" :style="{ color: textColor }">
    <div class="cs-footer-left">
      <span class="cs-brand-mark">Google Cloud</span>
    </div>
    <div class="cs-footer-right">
      <span class="cs-confidential">{{ confidentiality }}</span>
      <span class="cs-slide-num"><SlideCurrentNo /></span>
    </div>
  </footer>
</template>

<style scoped>
.cs-footer {
  position: absolute;
  bottom: 12px;
  left: 48px;
  right: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-family: 'Google Sans', 'Roboto', sans-serif;
  font-size: 10.5px;
  font-weight: 400;
  pointer-events: none;
  z-index: 20;
}
.cs-brand-mark {
  font-weight: 500;
  letter-spacing: 0.01em;
}
.cs-footer-right {
  display: flex;
  align-items: center;
  gap: 28px;
}
.cs-slide-num {
  min-width: 18px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
</style>
