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
      'base-btn',
      {
        'base-btn--primary': variant === 'primary',
        'base-btn--secondary': variant === 'secondary',
        'base-btn--ghost': variant === 'ghost',
        'base-btn--success': variant === 'success',
        'base-btn--sm': size === 'sm',
        'base-btn--md': size === 'md',
        'base-btn--lg': size === 'lg',
        'base-btn--pill': pill,
        'base-btn--full': fullWidth,
      },
    )"
    :disabled="disabled"
    :aria-disabled="disabled || loading"
    @click="$emit('click')"
  >
    <svg
      v-if="loading"
      class="base-btn__spinner"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle class="base-btn__spinner-track" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path class="base-btn__spinner-path" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
    <slot />
  </button>
</template>

<style scoped>
.base-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 8px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  user-select: none;
  outline: none;
  border: none;
  line-height: 1;
  white-space: nowrap;
}

.base-btn:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.base-btn:focus-visible {
  box-shadow: 0 0 0 3px rgba(0, 31, 158, 0.2);
}

/* ── Sizes ── */
.base-btn--sm { padding: 6px 12px; font-size: 12px; border-radius: 6px; gap: 6px; }
.base-btn--md { padding: 10px 18px; font-size: 14px; }
.base-btn--lg { padding: 14px 24px; font-size: 16px; border-radius: 10px; }

.base-btn--pill { border-radius: 9999px; }

.base-btn--full { width: 100%; }

/* ── Variants ── */
.base-btn--primary {
  background: linear-gradient(135deg, #2d4ec4 0%, #001f9e 100%);
  color: #fff;
  box-shadow: 0 6px 14px rgba(0, 31, 158, 0.2);
}

.base-btn--primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 22px rgba(0, 31, 158, 0.3);
}

.base-btn--primary:active:not(:disabled) {
  transform: translateY(0);
}

.base-btn--secondary {
  border: 1.5px solid #c5cbdd;
  background: #fff;
  color: #001f9e;
}

.base-btn--secondary:hover:not(:disabled) {
  border-color: #001f9e;
  background: rgba(0, 31, 158, 0.04);
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(0, 31, 158, 0.08);
}

.base-btn--secondary:active:not(:disabled) {
  transform: translateY(0);
}

.base-btn--ghost {
  background: transparent;
  color: #001f9e;
  padding: 6px 10px;
  gap: 4px;
}

.base-btn--ghost:hover:not(:disabled) {
  background: rgba(0, 31, 158, 0.06);
  color: #00157a;
}

.base-btn--success {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: #fff;
  box-shadow: 0 6px 14px rgba(22, 163, 74, 0.2);
}

.base-btn--success:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 22px rgba(22, 163, 74, 0.3);
}

.base-btn--success:active:not(:disabled) {
  transform: translateY(0);
}

/* Spinner */
.base-btn__spinner {
  width: 16px;
  height: 16px;
  animation: base-btn-spin 0.8s linear infinite;
}

.base-btn__spinner-track {
  opacity: 0.25;
}

.base-btn__spinner-path {
  opacity: 0.75;
}

@keyframes base-btn-spin {
  to { transform: rotate(360deg); }
}
</style>
