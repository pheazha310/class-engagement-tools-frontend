<script setup lang="ts">
defineProps<{
  title: string
  description?: string
  icon?: string
}>()
</script>

<template>
  <div class="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-600">
    <span class="mb-4 text-5xl">{{ icon || '📋' }}</span>
    <h3 class="mb-2 text-lg font-semibold text-gray-900 dark:text-white">{{ title }}</h3>
    <p v-if="description" class="max-w-md text-sm text-gray-500 dark:text-gray-400">{{ description }}</p>
    <slot />
  </div>
</template>
