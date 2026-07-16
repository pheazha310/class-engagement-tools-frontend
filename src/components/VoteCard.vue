<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Poll } from '@/types/poll'

const props = defineProps<{
  poll: Poll
  hasVoted: boolean
}>()

const emit = defineEmits<{
  vote: [optionId: number]
}>()

const selectedOption = ref<number | null>(null)
const submitted = ref(false)

const isDisabled = computed(() => props.hasVoted || submitted.value)

function submitVote() {
  if (!selectedOption.value || isDisabled.value) return
  submitted.value = true
  emit('vote', selectedOption.value)
}
</script>

<template>
  <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
    <h2 class="mb-6 text-xl font-bold text-gray-900 dark:text-white">{{ poll.question }}</h2>

    <div v-if="isDisabled" class="mb-4 rounded-lg bg-green-50 p-4 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
      <p v-if="submitted">Your vote has been submitted! View live results below.</p>
      <p v-else>You have already voted on this poll.</p>
    </div>

    <div class="space-y-3">
      <label
        v-for="option in poll.options"
        :key="option.id"
        class="flex cursor-pointer items-center rounded-lg border border-gray-200 p-4 transition hover:border-indigo-300 has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50 dark:border-gray-600 dark:hover:border-indigo-500 dark:has-[:checked]:border-indigo-400 dark:has-[:checked]:bg-indigo-900/20"
        :class="{ 'pointer-events-none opacity-60': isDisabled }"
      >
        <input
          v-model="selectedOption"
          type="radio"
          :value="option.id"
          :disabled="isDisabled"
          name="poll_option"
          class="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
        <span class="ml-3 text-sm font-medium text-gray-900 dark:text-white">{{ option.option_text }}</span>
      </label>
    </div>

    <button
      v-if="!isDisabled"
      :disabled="!selectedOption"
      class="mt-6 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
      @click="submitVote"
    >
      Submit Vote
    </button>
  </div>
</template>
