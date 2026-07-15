<script setup lang="ts">
import { ref, computed } from 'vue'
import BaseCard from './BaseCard.vue'
import BaseButton from './BaseButton.vue'
import VoteOption from './VoteOption.vue'
import type { Poll } from '@/stores/poll'

const props = defineProps<{
  poll: Poll
  hasVoted: boolean
  loading?: boolean
}>()

const emit = defineEmits<{
  vote: [optionId: number | null, points?: number, textResponse?: string]
}>()

const selectedOption = ref<number | null>(null)
const submitted = ref(false)

const isDisabled = computed(() => props.hasVoted || submitted.value)
const hasSelection = computed(() => selectedOption.value !== null)

function handleSelect(value: number) {
  if (isDisabled.value) return
  selectedOption.value = value
}

function submitVote() {
  if (isDisabled.value || !hasSelection.value) return
  submitted.value = true
  emit('vote', selectedOption.value)
}
</script>

<template>
  <BaseCard padding="lg" class="lv-vote-card" @keydown.enter.prevent="submitVote">
    <!-- Success banner -->
    <div
      v-if="isDisabled"
      class="lv-vote-success"
      role="alert"
    >
      <div class="lv-vote-success-icon">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      </div>
      <div>
        <p class="lv-vote-success-title">Vote recorded!</p>
        <p class="lv-vote-success-desc">Your response has been submitted. Results are updating live below.</p>
      </div>
    </div>

    <!-- Header -->
    <div class="lv-vote-header">
      <p class="lv-vote-section-label">Vote</p>
      <h3 class="lv-vote-question">{{ poll.question }}</h3>
      <p v-if="!isDisabled" class="lv-vote-instruction">
        Select one option below to cast your vote.
      </p>
    </div>

    <!-- Options grid -->
    <div class="lv-vote-options" role="radiogroup" :aria-label="`Poll options for: ${poll.question}`">
      <VoteOption
        v-for="(option, idx) in poll.options"
        :key="option.id"
        :label="option.option_text"
        :value="option.id"
        :selected="selectedOption === option.id"
        :disabled="isDisabled"
        :index="idx"
        @select="handleSelect"
      />
    </div>

    <!-- Submit button -->
    <div class="lv-section">
      <BaseButton
        :disabled="!hasSelection || isDisabled"
        :loading="loading"
        :full-width="true"
        size="lg"
        :variant="isDisabled ? 'success' : 'primary'"
        @click="submitVote"
      >
        <template v-if="isDisabled">
          Vote Submitted
        </template>
        <template v-else>
          Submit Vote
        </template>
      </BaseButton>
    </div>

    <!-- Keyboard hint -->
    <p v-if="!isDisabled" class="lv-kbd-hint">
      Press <kbd class="lv-kbd">Enter</kbd> to submit
    </p>
  </BaseCard>
</template>
