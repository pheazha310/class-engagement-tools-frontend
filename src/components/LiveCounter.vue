<script setup lang="ts">
defineProps<{
  value: number
  label: string
}>()
</script>

<template>
  <div class="rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 p-5 text-center text-white shadow-lg">
    <div class="text-3xl font-bold tabular-nums">{{ value }}</div>
    <div class="mt-1 text-sm text-indigo-100">{{ label }}</div>
  </div>
</template>
