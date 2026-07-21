<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  modelValue: any
  options: { id: number | string; name: string }[]
  label: string
  placeholder?: string
  loading?: boolean
  error?: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: any]
}>()

const search = ref('')
const open = ref(false)

const filteredOptions = computed(() => {
  if (!search.value) return props.options
  const q = search.value.toLowerCase()
  return props.options.filter((o) => o.name.toLowerCase().includes(q))
})

const selectedLabel = computed(() => {
  if (!props.modelValue) return ''
  const option = props.options.find((o) => o.id === props.modelValue)
  return option?.name ?? ''
})

function select(id: number | string) {
  emit('update:modelValue', id)
  search.value = ''
  open.value = false
}

function toggle() {
  if (!props.disabled) open.value = !open.value
}

function close() {
  open.value = false
}
</script>

<template>
  <div class="relative">
    <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">{{ label }}</label>
    <div
      class="flex cursor-pointer items-center justify-between rounded-xl border bg-white px-4 py-2.5 text-sm transition-all duration-200"
      :class="
        disabled
          ? 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
          : open
            ? 'border-blue-500 ring-2 ring-blue-100 shadow-sm'
            : error
              ? 'border-red-300 bg-red-50/50'
              : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
      "
      @click="toggle"
    >
      <div class="flex items-center gap-2.5 min-w-0">
        <svg v-if="loading" class="h-4 w-4 animate-spin text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <svg v-else class="h-4 w-4 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
        <span v-if="selectedLabel" class="text-gray-900 font-medium truncate">{{ selectedLabel }}</span>
        <span v-else class="text-gray-400 truncate">{{ placeholder || `Select ${label.toLowerCase()}` }}</span>
      </div>
      <svg
        class="h-4 w-4 flex-shrink-0 text-gray-400 transition-transform duration-200"
        :class="{ 'rotate-180': open }"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
    <Transition
      enter-active-class="transition-all duration-200"
      leave-active-class="transition-all duration-150"
      enter-from-class="scale-95 opacity-0 -translate-y-1"
      leave-to-class="scale-95 opacity-0 -translate-y-1"
    >
      <div v-if="open" class="absolute z-50 mt-1.5 w-full overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg shadow-gray-200/50">
        <div class="border-b border-gray-100 p-2">
          <div class="relative">
            <svg class="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              v-model="search"
              type="text"
              placeholder="Search..."
              class="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 pl-8 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white"
              @click.stop
            />
          </div>
        </div>
        <div class="max-h-48 overflow-y-auto p-1">
          <div v-if="loading" class="flex items-center justify-center py-8">
            <svg class="h-5 w-5 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
          <button
            v-for="option in filteredOptions"
            v-else
            :key="option.id"
            class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition-all duration-150"
            :class="modelValue === option.id ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'"
            @click="select(option.id)"
          >
            <div
              class="flex h-4 w-4 items-center justify-center rounded-full border transition-all"
              :class="modelValue === option.id ? 'border-blue-600 bg-blue-600' : 'border-gray-300'"
            >
              <div v-if="modelValue === option.id" class="h-1.5 w-1.5 rounded-full bg-white" />
            </div>
            {{ option.name }}
          </button>
          <div v-if="!loading && filteredOptions.length === 0" class="px-3 py-6 text-center">
            <svg class="mx-auto mb-2 h-6 w-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p class="text-sm text-gray-400">No results found</p>
          </div>
        </div>
      </div>
    </Transition>

    <div v-if="open" class="fixed inset-0 z-40" @click="close" />
  </div>
</template>
