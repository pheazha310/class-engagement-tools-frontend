<script setup lang="ts">
import { clsx } from 'clsx'

withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'ghost' | 'success'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  fullWidth?: boolean
  pill?: boolean
  loading?: boolean
}>(), {
  variant: 'primary',
  size: 'md',
})

defineEmits<{
  click: []
}>()
</script>

<template>
  <button
    :class="clsx(
      'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
      {
        'rounded-lg': !pill,
        'rounded-full': pill,
        'w-full': fullWidth,
        'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 active:bg-indigo-800 shadow-sm hover:shadow-md': variant === 'primary',
        'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus:ring-indigo-500 active:bg-slate-100': variant === 'secondary',
        'text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-slate-400': variant === 'ghost',
        'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500 active:bg-emerald-800 shadow-sm': variant === 'success',
        'px-3 py-1.5 text-xs': size === 'sm',
        'px-4 py-2 text-sm': size === 'md',
        'px-6 py-3 text-base': size === 'lg',
      },
    )"
    :disabled="disabled"
    :aria-disabled="disabled || loading"
    @click="$emit('click')"
  >
    <svg
      v-if="loading"
      class="-ml-1 mr-2 h-4 w-4 animate-spin"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
    <slot />
  </button>
</template>
