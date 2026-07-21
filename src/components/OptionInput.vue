<script setup lang="ts">
defineProps<{
  modelValue: string
  index: number
  removable: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  remove: [index: number]
}>()
</script>

<template>
  <div class="flex items-center gap-2">
    <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-medium text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
      {{ index + 1 }}
    </div>
    <input
      :value="modelValue"
      type="text"
      class="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-indigo-400"
      :placeholder="`Option ${index + 1}`"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <button
      v-if="removable"
      type="button"
      class="shrink-0 rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
      @click="emit('remove', index)"
    >
      <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
</template>
