<script setup lang="ts">
import { computed } from 'vue'
import { clsx } from 'clsx'

const props = withDefaults(
  defineProps<{
    padding?: 'sm' | 'md' | 'lg' | 'none'
    hover?: boolean
  }>(),
  { padding: 'md', hover: false },
)

const classes = computed(() => clsx(
  'lv-card',
  {
    'lv-card--pad-sm': props.padding === 'sm',
    'lv-card--pad-md': props.padding === 'md',
    'lv-card--pad-lg': props.padding === 'lg',
    'lv-card--pad-none': props.padding === 'none',
    'lv-card--hover': props.hover,
  },
))
</script>

<template>
  <div :class="classes">
    <slot />
  </div>
</template>
