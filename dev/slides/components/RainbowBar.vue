<script setup lang="ts">
defineProps<{
  height?: string
}>()
</script>

<template>
  <div class="cs-rainbow-bar" :style="{ height: height || '5px' }">
    <span class="seg-blue"></span>
    <span class="seg-red"></span>
    <span class="seg-yellow"></span>
    <span class="seg-green"></span>
  </div>
</template>

<style scoped>
.cs-rainbow-bar {
  display: grid;
  grid-template-columns: 38% 20% 24% 18%;
  width: 100%;
  overflow: hidden;
}
.seg-blue { background-color: #4285F4; }
.seg-red { background-color: #EA4335; }
.seg-yellow { background-color: #FBBC05; }
.seg-green { background-color: #34A853; }
</style>
