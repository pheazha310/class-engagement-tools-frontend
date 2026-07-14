<script setup lang="ts">
import { clsx } from 'clsx'

withDefaults(defineProps<{
  variant?: 'default' | 'elevated' | 'outlined' | 'ghost'
  padding?: 'none' | 'sm' | 'md' | 'lg'
}>(), {
  variant: 'default',
  padding: 'md',
})
</script>

<template>
  <div
    :class="clsx(
      'rounded-2xl border bg-white',
      {
        'border-slate-200 shadow-sm': variant === 'default',
        'border-slate-100 shadow-[0_8px_30px_rgba(15,23,42,0.08)]': variant === 'elevated',
        'border-slate-200 shadow-none': variant === 'outlined',
        'border-transparent bg-transparent shadow-none': variant === 'ghost',
        'p-0': padding === 'none',
        'p-4': padding === 'sm',
        'p-5': padding === 'md',
        'p-7': padding === 'lg',
      },
    )"
  >
    <slot />
  </div>
</template>
