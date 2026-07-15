<script setup lang="ts">
withDefaults(defineProps<{
  size?: 'sm' | 'md' | 'lg'
}>(), {
  size: 'md',
})
</script>

<template>
  <div class="flex items-center justify-center p-4">
    <div
      class="animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600"
      :class="{
        'h-6 w-6': size === 'sm',
        'h-10 w-10': size === 'md',
        'h-16 w-16': size === 'lg',
      }"
    />
  </div>
</template>
