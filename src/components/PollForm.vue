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
const isMultipleChoice = ref(props.initialData?.is_multiple_choice ?? false)
const durationMinutes = ref<number | null>(props.initialData?.duration_minutes ?? null)
const isAnonymous = ref(props.initialData?.is_anonymous ?? false)
const isQuiz = ref(props.initialData?.is_quiz ?? false)
const isOpenText = ref(props.initialData?.is_open_text ?? false)
const maxPoints = ref<number | null>(props.initialData?.max_points ?? null)
const optionsCorrect = ref<boolean[]>(props.initialData?.options_correct ?? [])
const errors = ref<Record<string, string>>({})

const canAddOption = computed(() => options.value.length < 10)

const showOptionsConfig = computed(() => !isOpenText.value)

function addOption() {
  if (canAddOption.value) {
    options.value.push('')
    optionsCorrect.value.push(false)
  }
}

function removeOption(index: number) {
  if (options.value.length > 2) {
    options.value.splice(index, 1)
    optionsCorrect.value.splice(index, 1)
  }
}

function updateOption(index: number, value: string) {
  options.value[index] = value
}

function toggleCorrect(index: number) {
  if (!isQuiz.value) return
  if (!isMultipleChoice.value) {
    optionsCorrect.value = optionsCorrect.value.map((_, i) => i === index)
  } else {
    optionsCorrect.value[index] = !optionsCorrect.value[index]
  }
}

function validate(): boolean {
  errors.value = {}

  if (!question.value.trim()) {
    errors.value.question = 'Question is required.'
    return false
  }

  if (showOptionsConfig.value) {
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
  }

  return true
}

function handleSubmit() {
  if (!validate()) return

  const data: PollFormData = {
    question: question.value.trim(),
    options: showOptionsConfig.value ? options.value.filter((o) => o.trim()) : [],
    is_multiple_choice: isMultipleChoice.value,
    duration_minutes: durationMinutes.value,
    is_anonymous: isAnonymous.value,
    is_quiz: isQuiz.value,
    is_open_text: isOpenText.value,
    max_points: isOpenText.value ? null : maxPoints.value,
    options_correct: isQuiz.value && showOptionsConfig.value ? optionsCorrect.value : undefined,
  }

  emit('submit', data)
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

    <!-- Poll Type Toggles -->
    <div class="space-y-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
      <label class="form-label text-xs font-semibold uppercase tracking-wider text-gray-500">Poll Settings</label>

      <div class="flex flex-wrap gap-4">
        <label class="flex items-center gap-2 text-sm">
          <input v-model="isMultipleChoice" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
          <span>Multiple choice</span>
        </label>

        <label class="flex items-center gap-2 text-sm">
          <input v-model="isAnonymous" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
          <span>Anonymous voting</span>
        </label>

        <label class="flex items-center gap-2 text-sm">
          <input v-model="isQuiz" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
          <span>Quiz mode</span>
        </label>

        <label class="flex items-center gap-2 text-sm">
          <input v-model="isOpenText" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
          <span>Open text (word cloud)</span>
        </label>
      </div>

      <div v-if="!isOpenText" class="flex items-center gap-2">
        <label class="text-sm text-gray-600 dark:text-gray-400">Max points per voter:</label>
        <input
          v-model.number="maxPoints"
          type="number"
          class="w-24 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          min="1"
          max="100"
          placeholder="1"
        />
        <span class="text-xs text-gray-400">(leave empty for standard 1 vote per person)</span>
      </div>
    </div>

    <!-- Options (hidden for open text) -->
    <div v-if="showOptionsConfig">
      <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Options ({{ options.length }}/10)</label>
      <div class="space-y-3">
        <div v-for="(option, index) in options" :key="index" class="flex items-center gap-2">
          <OptionInput
            :model-value="option"
            :index="index"
            :removable="options.length > 2"
            @update:model-value="updateOption(index, $event)"
            @remove="removeOption(index)"
          />
          <button
            v-if="isQuiz"
            type="button"
            class="shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition"
            :class="optionsCorrect[index]
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'"
            @click="toggleCorrect(index)"
            :title="optionsCorrect[index] ? 'Correct answer' : 'Mark as correct'"
          >
            {{ optionsCorrect[index] ? '✓ Correct' : 'Mark' }}
          </button>
        </div>
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

    <div v-if="isOpenText" class="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-center text-sm text-gray-500 dark:border-gray-600 dark:bg-gray-800/50 dark:text-gray-400">
      Open text mode enabled. Students will be able to submit free-text responses.
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
