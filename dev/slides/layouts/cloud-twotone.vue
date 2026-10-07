<script setup lang="ts">
import CloudFooter from '../components/CloudFooter.vue'

defineProps<{
  eyebrow?: string
  firstClause?: string
  accentClause?: string
}>()
</script>

<template>
  <div class="slidev-layout cloud-twotone">
    <div v-if="eyebrow" class="cs-eyebrow">{{ eyebrow }}</div>
    <h1 v-if="firstClause || accentClause" class="cs-display-twotone twotone-heading">
      <span>{{ firstClause }}</span>{{ ' ' }}<span class="accent-clause">{{ accentClause }}</span>
    </h1>

    <div class="twotone-body">
      <slot />
    </div>

    <CloudFooter theme="light" />
  </div>
</template>

<style scoped>
.twotone-heading {
  font-size: 1.65rem;
  line-height: 1.24;
  letter-spacing: -0.01em;
  margin: 0 0 14px 0;
}
.twotone-body {
  margin-top: 6px;
}
</style>
