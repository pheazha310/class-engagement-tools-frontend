<template>
  <Teleport to="body">
    <Transition name="toast">
      <div v-if="toastVisible" class="toast" :class="toastType">
        <div class="toast-content">{{ toastMessage }}</div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useToast } from '@/composables/useToast'
const { toastVisible, toastMessage, toastType } = useToast()
</script>

<style scoped>
.toast {
  position: fixed;
  top: 18px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  max-width: calc(100vw - 24px);
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  white-space: pre-line;
  background: rgba(17, 24, 39, 0.92);
  color: rgb(103, 101, 101);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.toast.success {
  background: white;
}

.toast.info {
  background: rgba(79, 70, 229, 0.95);
}

.toast.error {
  background: rgba(220, 38, 38, 0.95);
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-12px);
}

.toast-enter-to,
.toast-leave-from {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}
</style>
