<script setup lang="ts">
import CloudFooter from '../components/CloudFooter.vue'

defineProps<{
  title?: string
  eyebrow?: string
  ratio?: '40-60' | '45-55' | '50-50'
}>()
</script>

<template>
  <div class="slidev-layout cloud-split">
    <div v-if="eyebrow" class="cs-eyebrow">{{ eyebrow }}</div>
    <h1 v-if="title" class="cs-slide-title">{{ title }}</h1>

    <div class="split-grid" :class="`ratio-${ratio || '40-60'}`">
      <div class="split-left">
        <slot name="left" />
      </div>
      <div class="split-right cs-framed-surface">
        <slot name="right" />
      </div>
    </div>

    <CloudFooter theme="light" />
  </div>
</template>

<style scoped>
.split-grid {
  display: grid;
  gap: 18px;
  align-items: stretch;
  height: 382px;
}
.ratio-40-60 {
  grid-template-columns: 39% 59%;
}
.ratio-45-55 {
  grid-template-columns: 44% 54%;
}
.ratio-50-50 {
  grid-template-columns: 49% 49%;
}
.split-left {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  font-size: 0.8rem;
}
.split-right {
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
