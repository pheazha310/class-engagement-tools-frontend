<script setup lang="ts">
import { ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  message: string | null
  type?: 'success' | 'error' | 'info'
  duration?: number
}>(), {
  type: 'info',
  duration: 4000,
})

const emit = defineEmits<{
  close: []
}>()

const visible = ref(false)

watch(() => props.message, (newVal) => {
  if (newVal) {
    visible.value = true
    setTimeout(() => {
      visible.value = false
      emit('close')
    }, props.duration)
  }
})

const bgClass = {
  success: 'bg-green-600',
  error: 'bg-red-600',
  info: 'bg-indigo-600',
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-all duration-300"
      leave-active-class="transition-all duration-200"
      enter-from-class="translate-y-2 opacity-0"
      leave-to-class="translate-y-2 opacity-0"
    >
      <div
        v-if="visible && message"
        class="fixed right-4 top-4 z-50 flex items-center gap-3 rounded-xl px-5 py-3 text-white shadow-lg"
        :class="bgClass[type]"
      >
        <span class="text-sm font-medium">{{ message }}</span>
        <button class="text-white/80 hover:text-white" @click="visible = false; emit('close')">&times;</button>
      </div>
    </Transition>
  </Teleport>
</template>
