<script setup lang="ts">
import CloudFooter from '../components/CloudFooter.vue'

defineProps<{
  title?: string
  eyebrow?: string
}>()
</script>

<template>
  <div class="slidev-layout cloud-sidebar-table">
    <!-- Top Standard Slide Title (30pt Regular #202124) -->
    <h1 v-if="title" class="cs-slide-title">{{ title }}</h1>

    <div class="sidebar-table-grid">
      <!-- Left Context Sidebar (Slides 26-31 spec: x=36pt, w=259.2pt) -->
      <aside class="sidebar-zone">
        <div v-if="eyebrow" class="cs-eyebrow">{{ eyebrow }}</div>
        <div class="cs-commentary">
          <slot name="sidebar" />
        </div>
      </aside>

      <!-- Right Visualization / Table Zone (x=330pt..684pt) -->
      <section class="table-zone">
        <slot />
      </section>
    </div>

    <CloudFooter theme="light" />
  </div>
</template>

<style scoped>
.sidebar-table-grid {
  display: grid;
  grid-template-columns: 34% 63%;
  gap: 3%;
  align-items: start;
  margin-top: 8px;
}
.sidebar-zone {
  padding-right: 6px;
}
.table-zone {
  width: 100%;
}
</style>
