<script setup lang="ts">
import CloudFooter from '../components/CloudFooter.vue'

defineProps<{
  title?: string
  eyebrow?: string
}>()
</script>

<template>
  <div class="slidev-layout cloud-default">
    <div v-if="eyebrow" class="cs-eyebrow">{{ eyebrow }}</div>
    <h1 v-if="title" class="cs-slide-title">{{ title }}</h1>
    <div class="default-body">
      <slot />
    </div>
    <CloudFooter theme="light" />
  </div>
</template>

<style scoped>
.default-body {
  font-size: 0.85rem;
  line-height: 1.5;
  color: #202124;
}
</style>
