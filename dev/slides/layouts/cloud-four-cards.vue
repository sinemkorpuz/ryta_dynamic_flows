<script setup lang="ts">
import CloudFooter from '../components/CloudFooter.vue'

defineProps<{
  title?: string
  eyebrow?: string
}>()
</script>

<template>
  <div class="slidev-layout cloud-four-cards">
    <div v-if="eyebrow" class="cs-eyebrow">{{ eyebrow }}</div>
    <h1 v-if="title" class="cs-slide-title">{{ title }}</h1>

    <div class="cards-matrix">
      <slot />
    </div>

    <div class="cards-footer-slot">
      <slot name="bottom" />
    </div>

    <CloudFooter theme="light" />
  </div>
</template>

<style scoped>
.cards-matrix {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-top: 10px;
}
.cards-footer-slot {
  margin-top: 12px;
}
</style>
