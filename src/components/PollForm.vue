<script setup lang="ts">
import { ref, computed } from 'vue'
import OptionInput from './OptionInput.vue'
import type { PollFormData } from '@/types/poll'

const props = withDefaults(defineProps<{
  initialData?: Partial<PollFormData>
  isEditing?: boolean
}>(), {
  isEditing: false,
})

const emit = defineEmits<{
  submit: [data: PollFormData]
  cancel: []
}>()

const question = ref(props.initialData?.question || '')
const options = ref<string[]>(props.initialData?.options || ['', ''])
const errors = ref<Record<string, string>>({})

const canAddOption = computed(() => options.value.length < 10)

function addOption() {
  if (canAddOption.value) {
    options.value.push('')
  }
}

function removeOption(index: number) {
  if (options.value.length > 2) {
    options.value.splice(index, 1)
  }
}

function updateOption(index: number, value: string) {
  options.value[index] = value
}

function validate(): boolean {
  errors.value = {}

  if (!question.value.trim()) {
    errors.value.question = 'Question is required.'
    return false
  }

  const filledOptions = options.value.filter((o) => o.trim())
  if (filledOptions.length < 2) {
    errors.value.options = 'At least 2 options are required.'
    return false
  }

  const unique = new Set(filledOptions.map((o) => o.trim().toLowerCase()))
  if (unique.size !== filledOptions.length) {
    errors.value.options = 'Duplicate options are not allowed.'
    return false
  }

  return true
}

function handleSubmit() {
  if (!validate()) return
  emit('submit', {
    question: question.value.trim(),
    options: options.value.filter((o) => o.trim()),
  })
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <div>
      <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Question</label>
      <input
        v-model="question"
        type="text"
        class="block w-full rounded-lg border border-gray-300 px-4 py-2.5 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        placeholder="What is your favorite framework?"
      />
      <p v-if="errors.question" class="mt-1 text-sm text-red-500">{{ errors.question }}</p>
    </div>

    <div>
      <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Options ({{ options.length }}/10)</label>
      <div class="space-y-3">
        <OptionInput
          v-for="(option, index) in options"
          :key="index"
          :model-value="option"
          :index="index"
          :removable="options.length > 2"
          @update:model-value="updateOption(index, $event)"
          @remove="removeOption(index)"
        />
      </div>
      <p v-if="errors.options" class="mt-1 text-sm text-red-500">{{ errors.options }}</p>

      <button
        v-if="canAddOption"
        type="button"
        class="mt-3 flex items-center gap-1.5 text-sm font-medium text-indigo-600 transition hover:text-indigo-800 dark:text-indigo-400"
        @click="addOption"
      >
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Add Option
      </button>
    </div>

    <div class="flex justify-end gap-3 pt-2">
      <button
        type="button"
        class="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
        @click="emit('cancel')"
      >
        Cancel
      </button>
      <button
        type="submit"
        class="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
      >
        {{ isEditing ? 'Update Poll' : 'Create Poll' }}
      </button>
    </div>
  </form>
</template>
