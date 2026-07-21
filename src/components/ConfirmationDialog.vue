<script setup lang="ts">
defineProps<{
  show: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      leave-active-class="transition-opacity duration-150"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800">
          <h3 class="mb-2 text-lg font-semibold text-gray-900 dark:text-white">{{ title }}</h3>
          <p class="mb-6 text-sm text-gray-600 dark:text-gray-300">{{ message }}</p>
          <div class="flex justify-end gap-3">
            <button
              class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              @click="emit('cancel')"
            >
              {{ cancelText || 'Cancel' }}
            </button>
            <button
              class="rounded-lg px-4 py-2 text-sm font-medium text-white transition"
              :class="{
                'bg-red-600 hover:bg-red-700': variant === 'danger' || !variant,
                'bg-yellow-600 hover:bg-yellow-700': variant === 'warning',
                'bg-indigo-600 hover:bg-indigo-700': variant === 'info',
              }"
              @click="emit('confirm')"
            >
              {{ confirmText || 'Confirm' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
