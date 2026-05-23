<script setup lang="ts">
defineProps<{
  title: string;
}>();
</script>

<template>
  <section class="panel">
    <h2>{{ title }}</h2>
    <slot />
  </section>
</template>

<style scoped>
.panel {
  margin-bottom: 1.5rem;
  padding: 1.25rem;
  border: 1px solid #e4e4e7;
  border-radius: 10px;
  background: #fff;
}

.panel h2 {
  margin: 0 0 1rem;
  font-size: 1rem;
  font-weight: 700;
}
</style>
