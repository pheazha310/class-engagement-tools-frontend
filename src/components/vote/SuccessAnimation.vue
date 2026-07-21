<script setup lang="ts">
import { onMounted, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    show: boolean
    selectedLabel?: string
    autoDismiss?: boolean
    dismissDelay?: number
    onDismiss?: () => void
  }>(),
  {
    selectedLabel: '',
    autoDismiss: true,
    dismissDelay: 2500,
  },
)

const emit = defineEmits<{
  dismiss: []
}>()

const confettiPieces = ref<
  Array<{
    id: number
    left: string
    color: string
    delay: string
    size: string
    rotation: string
  }>
>([])

const colors = [
  '#4F46E5', '#7C3AED', '#10B981', '#F59E0B',
  '#EF4444', '#3B82F6', '#EC4899', '#8B5CF6',
  '#06B6D4', '#F97316', '#22C55E',
]

onMounted(() => {
  if (props.show) {
    generateConfetti()
    if (props.autoDismiss && props.dismissDelay > 0) {
      setTimeout(() => {
        emit('dismiss')
      }, props.dismissDelay)
    }
  }
})

function generateConfetti() {
  const pieces = []
  for (let i = 0; i < 40; i++) {
    pieces.push({
      id: i,
      left: `${Math.random() * 100}%`,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: `${Math.random() * 0.5}s`,
      size: `${6 + Math.random() * 6}px`,
      rotation: `${Math.random() * 360}deg`,
    })
  }
  confettiPieces.value = pieces
}

function handleDismiss() {
  emit('dismiss')
  props.onDismiss?.()
}
</script>

<template>
  <Teleport to="body">
    <Transition name="vm-success-fade">
      <div v-if="show" class="vm-success-overlay" @click="handleDismiss">
        <!-- Confetti -->
        <div class="vm-confetti-container" aria-hidden="true">
          <div
            v-for="piece in confettiPieces"
            :key="piece.id"
            class="vm-confetti-piece"
            :style="{
              left: piece.left,
              background: piece.color,
              width: piece.size,
              height: piece.size,
              animationDelay: piece.delay,
              transform: `rotate(${piece.rotation})`,
            }"
          />
        </div>

        <!-- Success card -->
        <div class="vm-success-card" role="alert" aria-live="assertive">
          <div class="vm-success-circle">
            <svg class="vm-success-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline class="vm-success-icon-path" points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 class="vm-success-title">Vote Submitted!</h2>
          <p class="vm-success-desc">
            <template v-if="selectedLabel">Your response "{{ selectedLabel }}" has been recorded.</template>
            <template v-else>Your response has been recorded successfully.</template>
          </p>
          <button class="vm-success-btn" @click="handleDismiss">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
            View Results
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.vm-success-fade-enter-active {
  transition: opacity 0.3s ease;
}
.vm-success-fade-leave-active {
  transition: opacity 0.5s ease;
}
.vm-success-fade-enter-from,
.vm-success-fade-leave-to {
  opacity: 0;
}
</style>
