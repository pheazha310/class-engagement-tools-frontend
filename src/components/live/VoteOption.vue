<script setup lang="ts">
defineProps<{
  value: string
  label: string
  selected: boolean
  disabled?: boolean
}>()

defineEmits<{
  select: [value: string]
}>()
</script>

<template>
  <button
    class="group flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition-all"
    :class="[
      selected
        ? 'border-indigo-500 bg-indigo-50 shadow-sm'
        : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/50',
      disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
    ]"
    :disabled="disabled"
    @click="$emit('select', value)"
  >
    <span
      class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all"
      :class="selected ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300 group-hover:border-indigo-300'"
    >
      <span v-if="selected" class="h-2.5 w-2.5 rounded-full bg-white" />
    </span>
    <span class="text-sm font-medium text-gray-900" :class="{ 'text-indigo-900': selected }">{{ label }}</span>
  </button>
</template>
