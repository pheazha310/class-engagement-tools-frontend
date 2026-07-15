<script setup lang="ts">
import { computed } from 'vue'
import { clsx } from 'clsx'

type Variant = 'live' | 'default' | 'success' | 'warning' | 'danger' | 'neutral'

const props = withDefaults(defineProps<{ variant?: Variant; dot?: boolean }>(), {
  variant: 'default',
  dot: false,
})

const classes = computed(() => clsx('lv-badge', {
  'lv-badge--live': props.variant === 'live',
  'lv-badge--default': props.variant === 'default',
  'lv-badge--success': props.variant === 'success',
  'lv-badge--warning': props.variant === 'warning',
  'lv-badge--danger': props.variant === 'danger',
  'lv-badge--neutral': props.variant === 'neutral',
}))

const dotClasses = computed(() => clsx('lv-badge-dot', {
  'lv-badge-dot--live': props.variant === 'live',
  'lv-badge-dot--default': props.variant === 'default',
  'lv-badge-dot--success': props.variant === 'success',
  'lv-badge-dot--warning': props.variant === 'warning',
  'lv-badge-dot--danger': props.variant === 'danger',
  'lv-badge-dot--neutral': props.variant === 'neutral',
}))
</script>

<template>
  <span :class="classes">
    <span v-if="dot" :class="dotClasses" />
    <slot />
  </span>
</template>
