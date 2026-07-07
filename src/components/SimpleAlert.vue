<template>
  <Teleport to="body">
    <Transition name="alert">
      <div v-if="visible" class="alert-overlay" @click="handleOverlayClick">
        <div class="alert-dialog" @click.stop>
          <div class="alert-content">
            <p class="alert-message">{{ message }}</p>
          </div>
          <button class="alert-button" @click="close">
            OK
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  modelValue: boolean
  message: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const visible = ref(props.modelValue)

watch(() => props.modelValue, (newVal) => {
  visible.value = newVal
})

const close = () => {
  visible.value = false
  emit('update:modelValue', false)
}

const handleOverlayClick = () => {
  close()
}
</script>

<style scoped>
.alert-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

.alert-dialog {
  background: white;
  border-radius: 16px;
  padding: 32px 24px 24px;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  text-align: center;
}

.alert-content {
  margin-bottom: 24px;
}

.alert-message {
  font-size: 16px;
  line-height: 1.6;
  color: #1f2937;
  margin: 0;
  white-space: pre-line;
}

.alert-button {
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 12px;
  padding: 12px 32px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 100px;
}

.alert-button:hover {
  background: #4338ca;
  transform: translateY(-1px);
}

.alert-button:active {
  transform: translateY(0);
}

/* Transition animations */
.alert-enter-active,
.alert-leave-active {
  transition: all 0.3s ease;
}

.alert-enter-from,
.alert-leave-to {
  opacity: 0;
}

.alert-enter-from .alert-dialog,
.alert-leave-to .alert-dialog {
  transform: scale(0.9) translateY(-20px);
  opacity: 0;
}
</style>
