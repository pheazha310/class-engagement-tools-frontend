<script setup lang="ts">
import { computed } from 'vue'
import { clsx } from 'clsx'

type Variant = 'primary' | 'secondary' | 'ghost' | 'success'
type Size = 'sm' | 'md' | 'lg'

const props = withDefaults(
  defineProps<{
    variant?: Variant
    size?: Size
    disabled?: boolean
    loading?: boolean
    fullWidth?: boolean
    type?: 'button' | 'submit'
  }>(),
  { variant: 'primary', size: 'md', disabled: false, loading: false, fullWidth: false, type: 'button' },
)

const emit = defineEmits<{
  click: [e: MouseEvent]
}>()

const classes = computed(() => clsx(
  'lv-btn',
  {
    'lv-btn--primary': props.variant === 'primary',
    'lv-btn--secondary': props.variant === 'secondary',
    'lv-btn--ghost': props.variant === 'ghost',
    'lv-btn--success': props.variant === 'success',
    'lv-btn--sm': props.size === 'sm',
    'lv-btn--md': props.size === 'md',
    'lv-btn--lg': props.size === 'lg',
    'lv-btn--full': props.fullWidth,
  },
))
</script>

<template>
  <button :class="classes" :disabled="disabled || loading" :type="type" @click="emit('click', $event)">
    <svg
      v-if="loading"
      class="lv-btn-spinner"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle class="lv-spinner-track" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path
        class="lv-spinner-indicator"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
    <slot />
  </button>
</template>
