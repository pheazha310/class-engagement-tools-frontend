<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    type: 'info' | 'success' | 'warning' | 'error'
    title?: string
    message: string
    retryLabel?: string
    showIcon?: boolean
  }>(),
  {
    showIcon: true,
  },
)

const emit = defineEmits<{
  retry: []
}>()

const iconPath = computed(() => {
  switch (props.type) {
    case 'info':
      return 'M12 16v-4m0-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
    case 'success':
      return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
    case 'warning':
      return 'M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
    case 'error':
      return 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
    default:
      return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
  }
})
</script>

<template>
  <div class="vm-alert" :class="`vm-alert--${type}`" role="alert">
    <svg v-if="showIcon" class="vm-alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path :d="iconPath" />
    </svg>
    <div class="vm-alert-content">
      <p v-if="title" class="vm-alert-title">{{ title }}</p>
      <p class="vm-alert-text">{{ message }}</p>
      <button
        v-if="retryLabel"
        class="vm-alert-retry"
        @click="emit('retry')"
      >
        {{ retryLabel }}
      </button>
    </div>
  </div>
</template>
