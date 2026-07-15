<script setup lang="ts">
import { clsx } from 'clsx'

withDefaults(defineProps<{
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  size?: 'sm' | 'md'
  dot?: boolean
  pulse?: boolean
}>(), {
  variant: 'default',
  size: 'sm',
})
</script>

<template>
  <span
    :class="clsx(
      'inline-flex items-center gap-1.5 rounded-full font-medium leading-none',
      {
        'bg-slate-100 text-slate-700': variant === 'default',
        'bg-emerald-50 text-emerald-700': variant === 'success',
        'bg-amber-50 text-amber-700': variant === 'warning',
        'bg-red-50 text-red-700': variant === 'danger',
        'bg-indigo-50 text-indigo-700': variant === 'info',
        'px-2 py-1 text-[11px]': size === 'sm',
        'px-3 py-1.5 text-xs': size === 'md',
      },
    )"
  >
    <span
      v-if="dot"
      :class="clsx(
        'h-1.5 w-1.5 rounded-full',
        {
          'bg-slate-500': variant === 'default',
          'bg-emerald-500': variant === 'success',
          'bg-amber-500': variant === 'warning',
          'bg-red-500': variant === 'danger',
          'bg-indigo-500': variant === 'info',
          'animate-pulse': pulse,
        },
      )"
    />
    <slot />
  </span>
</template>
