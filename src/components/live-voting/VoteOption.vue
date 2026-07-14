<script setup lang="ts">
import { computed } from 'vue'
import { clsx } from 'clsx'

const props = withDefaults(
  defineProps<{
    label: string
    value: number
    selected: boolean
    disabled?: boolean
    index?: number
  }>(),
  { disabled: false, index: 0 },
)

const emit = defineEmits<{
  select: [value: number]
}>()

const containerClasses = computed(() => clsx(
  'lv-option-btn',
  {
    'lv-option-btn--idle': !props.selected && !props.disabled,
    'lv-option-btn--selected': props.selected && !props.disabled,
    'lv-option-btn--disabled': props.disabled,
  },
))

const textClass = computed(() => {
  if (props.disabled && props.selected) return 'lv-option-text--dimmed'
  if (props.disabled && !props.selected) return 'lv-option-text--faded'
  return 'lv-option-text--normal'
})
</script>

<template>
  <button
    :class="containerClasses"
    :disabled="disabled"
    :aria-pressed="selected"
    :aria-label="`Option: ${label}`"
    @click="emit('select', value)"
  >
    <!-- Radio circle -->
    <div class="lv-option-radio">
      <div class="lv-option-dot" />
    </div>

    <!-- Option text -->
    <span class="lv-option-text" :class="textClass">
      {{ label }}
    </span>

    <!-- Checkmark icon when selected -->
    <svg
      v-if="selected"
      class="lv-option-check"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  </button>
</template>
