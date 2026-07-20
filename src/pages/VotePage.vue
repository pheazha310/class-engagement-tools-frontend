<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { usePollStore } from '@/stores/pollStore'
import type { Poll, PollResultsData } from '@/types/poll'
import '@/assets/css/vote-module.css'

import ConfirmModal from '@/components/vote/ConfirmModal.vue'
import SuccessAnimation from '@/components/vote/SuccessAnimation.vue'
import AlertMessage from '@/components/vote/AlertMessage.vue'

const pollStore = usePollStore()

// ── State ──
const selectedOptionId = ref<number | null>(null)
const selectedOptionIds = ref<number[]>([])
const showConfirm = ref(false)
const showSuccess = ref(false)
const hasSubmitted = ref(false)
const submissionError = ref<string | null>(null)
const countdownNow = ref(Date.now())
let countdownInterval: ReturnType<typeof setInterval> | null = null

// ── Computed ──
const poll = computed(() => pollStore.activePoll)
const loading = computed(() => pollStore.loading)
const error = computed(() => pollStore.error)
const pollStatus = computed(() => poll.value?.status ?? 'unknown')

const isLive = computed(() => pollStatus.value === 'active')
const isEnded = computed(() => pollStatus.value === 'ended')
const isDraft = computed(() => pollStatus.value === 'draft')

const isMulti = computed(() => poll.value?.is_multiple_choice ?? false)
const isYesNo = computed(() => {
  if (!poll.value?.options) return false
  return poll.value.options.length === 2
})
const isOpenText = computed(() => poll.value?.is_open_text ?? false)

const canVote = computed(() => isLive.value && !hasSubmitted.value && !pollStore.hasVoted)
const isSubmitDisabled = computed(() => {
  if (!canVote.value || hasSubmitted.value) return true
  if (isOpenText.value) return !textResponse.value.trim()
  if (isMulti.value) return selectedOptionIds.value.length === 0
  return selectedOptionId.value === null
})

const selectedLabel = computed(() => {
  if (isMulti.value) return `${selectedOptionIds.value.length} option${selectedOptionIds.value.length !== 1 ? 's' : ''}`
  const option = poll.value?.options?.find((o) => o.id === selectedOptionId.value)
  return option?.option_text ?? ''
})

const countdownDisplay = computed(() => {
  if (!poll.value?.started_at || !poll.value?.duration_minutes) return null
  const start = new Date(poll.value.started_at).getTime()
  const end = start + poll.value.duration_minutes * 60 * 1000
  const remaining = Math.max(0, Math.floor((end - countdownNow.value) / 1000))
  if (remaining <= 0) return '0:00'
  const m = Math.floor(remaining / 60)
  const s = remaining % 60
  return `${m}:${s.toString().padStart(2, '0')}`
})

const isCountdownUrgent = computed(() => {
  if (!poll.value?.started_at || !poll.value?.duration_minutes) return false
  const start = new Date(poll.value.started_at).getTime()
  const end = start + poll.value.duration_minutes * 60 * 1000
  const remaining = Math.max(0, Math.floor((end - countdownNow.value) / 1000))
  return remaining > 0 && remaining <= 60
})

const textResponse = ref('')

// ── Methods ──
function selectOption(id: number) {
  if (!canVote.value) return
  if (isMulti.value) {
    const idx = selectedOptionIds.value.indexOf(id)
    if (idx === -1) {
      selectedOptionIds.value.push(id)
    } else {
      selectedOptionIds.value.splice(idx, 1)
    }
  } else {
    selectedOptionId.value = id
  }
}

function openConfirm() {
  if (isSubmitDisabled.value) return
  showConfirm.value = true
}

function cancelVote() {
  showConfirm.value = false
}

async function confirmVote() {
  if (!poll.value) return
  // Keep modal open with loading state while submitting
  submissionError.value = null

  try {
    if (isOpenText.value) {
      await pollStore.submitVote(poll.value.id, null, undefined, textResponse.value.trim())
    } else if (isMulti.value) {
      for (const id of selectedOptionIds.value) {
        await pollStore.submitVote(poll.value.id, id)
      }
    } else if (selectedOptionId.value !== null) {
      await pollStore.submitVote(poll.value.id, selectedOptionId.value)
    }

    // Success - close modal and show animation
    showConfirm.value = false
    hasSubmitted.value = true
    showSuccess.value = true
  } catch (err: any) {
    // Failed - close modal and show error
    showConfirm.value = false
    hasSubmitted.value = false
    submissionError.value = err?.response?.data?.message || err?.message || 'Failed to submit vote. Please try again.'
  }
}

function dismissSuccess() {
  showSuccess.value = false
}

function retryFetch() {
  pollStore.clearError()
  fetchActivePoll()
}

async function fetchActivePoll() {
  try {
    await pollStore.fetchActivePoll()
    if (pollStore.hasVoted) {
      hasSubmitted.value = true
    }
  } catch {
    // Handled by store error state
  }
}

// ── Lifecycle ──
onMounted(() => {
  fetchActivePoll()
  countdownInterval = setInterval(() => {
    countdownNow.value = Date.now()
  }, 1000)
})

onUnmounted(() => {
  if (countdownInterval) clearInterval(countdownInterval)
  pollStore.clearError()
})
</script>

<template>
  <div class="vm-page">
    <!-- Background -->
    <div class="vm-bg-orb vm-bg-orb--1" aria-hidden="true" />
    <div class="vm-bg-orb vm-bg-orb--2" aria-hidden="true" />
    <div class="vm-bg-grid" aria-hidden="true" />

    <div class="vm-container">
      <!-- Loading State -->
      <div v-if="loading && !poll" class="vm-skeleton-card">
        <div class="vm-skeleton vm-skeleton-line vm-skeleton-line--short" />
        <div class="vm-skeleton vm-skeleton-line vm-skeleton-line--long" style="margin-bottom:16px;" />
        <div class="vm-skeleton vm-skeleton-line vm-skeleton-line--medium" style="margin-bottom:20px;" />
        <div class="vm-skeleton vm-skeleton-block" />
        <div class="vm-skeleton vm-skeleton-block" />
        <div class="vm-skeleton vm-skeleton-block" />
        <div class="vm-skeleton vm-skeleton-btn" />
      </div>

      <!-- Error fetching poll -->
      <div v-else-if="error && !poll" class="vm-card vm-card--padding" style="text-align:center;">
        <AlertMessage
          type="error"
          title="Connection Error"
          :message="error"
          retry-label="Try Again"
          @retry="retryFetch"
        />
      </div>

      <!-- No Active Poll -->
      <div v-else-if="!poll" class="vm-card vm-card--padding">
        <div class="vm-empty">
          <div class="vm-empty-icon-wrap">
            <svg class="vm-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
          </div>
          <h2 class="vm-empty-title">No Active Poll</h2>
          <p class="vm-empty-text">
            There is no active poll available right now. Please check back later or wait for your teacher to start one.
          </p>
        </div>
      </div>

      <!-- Active Poll -->
      <template v-else>
        <!-- Poll Header -->
        <div class="vm-poll-header">
          <div class="vm-poll-meta">
            <span class="vm-poll-teacher">
              <svg class="vm-poll-teacher-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87" />
                <path d="M16 3.13a4 4 0 010 7.75" />
              </svg>
              Teacher
            </span>

            <div class="vm-poll-status-group">
              <!-- Status Badge -->
              <span v-if="isLive" class="vm-badge vm-badge--live">
                <span class="vm-badge-dot vm-badge-dot--live" />
                Live
              </span>
              <span v-else-if="isEnded" class="vm-badge vm-badge--ended">
                <span class="vm-badge-dot vm-badge-dot--ended" />
                Closed
              </span>
              <span v-else class="vm-badge vm-badge--draft">
                Draft
              </span>

              <!-- Countdown -->
              <div
                v-if="countdownDisplay && isLive"
                class="vm-countdown"
                :class="isCountdownUrgent ? 'vm-countdown--urgent' : 'vm-countdown--normal'"
              >
                <svg class="vm-countdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {{ countdownDisplay }}
              </div>
            </div>
          </div>

          <h1 class="vm-poll-title">{{ poll.question }}</h1>
          <p v-if="isMulti" class="vm-poll-question">Select one or more options</p>
          <p v-else-if="isYesNo" class="vm-poll-question">Choose Yes or No</p>
          <p v-else class="vm-poll-question">Select one option below</p>
        </div>

        <!-- Main Vote Card -->
        <div class="vm-card vm-card--padding" style="position:relative;">
          <div class="vm-card-accent" aria-hidden="true" />

          <!-- Already Voted Banner -->
          <AlertMessage
            v-if="pollStore.hasVoted"
            type="success"
            title="Already Voted"
            message="You have already submitted your response for this poll."
          />

          <!-- Poll Ended Banner -->
          <AlertMessage
            v-else-if="isEnded"
            type="info"
            title="Poll Closed"
            message="This poll has ended. Responses can no longer be submitted."
          />

          <!-- Submission Error -->
          <AlertMessage
            v-if="submissionError"
            type="error"
            title="Submission Failed"
            :message="submissionError"
            retry-label="Retry"
            @retry="confirmVote"
          />

          <!-- Vote Options (only if can vote) -->
          <template v-if="canVote">
            <!-- Default: Single Choice / True-False -->
            <div v-if="!isMulti && !isOpenText" class="vm-options-group" role="radiogroup" :aria-label="`Poll options for: ${poll.question}`">
              <button
                v-for="opt in poll.options"
                :key="opt.id"
                class="vm-option-card"
                :class="{ 'vm-option--selected': selectedOptionId === opt.id }"
                role="radio"
                :aria-checked="selectedOptionId === opt.id"
                :aria-label="opt.option_text"
                @click="selectOption(opt.id)"
              >
                <span class="vm-option-indicator">
                  <span class="vm-option-dot" />
                </span>
                <span class="vm-option-label">{{ opt.option_text }}</span>
              </button>
            </div>

            <!-- Multiple Choice -->
            <div v-else-if="isMulti && !isOpenText" class="vm-options-group" role="group" :aria-label="`Poll options for: ${poll.question}`">
              <button
                v-for="opt in poll.options"
                :key="opt.id"
                class="vm-option-card"
                :class="{ 'vm-option--selected': selectedOptionIds.includes(opt.id) }"
                role="checkbox"
                :aria-checked="selectedOptionIds.includes(opt.id)"
                :aria-label="opt.option_text"
                @click="selectOption(opt.id)"
              >
                <span class="vm-option-checkbox">
                  <svg class="vm-option-check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <span class="vm-option-label">{{ opt.option_text }}</span>
              </button>
            </div>

            <!-- Open Text -->
            <div v-else-if="isOpenText" class="vm-open-text">
              <textarea
                v-model="textResponse"
                class="vm-textarea"
                rows="4"
                placeholder="Type your response here..."
                maxlength="1000"
                aria-label="Your response"
              />
              <p class="vm-textarea-count">{{ textResponse.length }}/1000</p>
            </div>
          </template>

          <!-- Submit Button -->
          <button
            v-if="canVote"
            class="vm-btn vm-btn--primary vm-btn--full"
            :disabled="isSubmitDisabled"
            style="margin-top: 8px;"
            @click="openConfirm"
          >
            Submit Vote
          </button>

          <!-- Results Link (if already voted or ended) -->
          <div v-if="pollStore.hasVoted || isEnded" style="margin-top:16px;text-align:center;">
            <router-link
              :to="`/results`"
              class="vm-btn vm-btn--secondary"
              style="display:inline-flex;width:auto;"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 20V10" />
                <path d="M12 20V4" />
                <path d="M6 20v-6" />
              </svg>
              View Live Results
            </router-link>
          </div>
        </div>
      </template>
    </div>

    <!-- Confirmation Modal -->
    <ConfirmModal
      :show="showConfirm"
      :selected-label="selectedLabel"
      :question-type="isMulti ? 'multiple' : 'single'"
      :selected-count="selectedOptionIds.length"
      :loading="pollStore.loading"
      @confirm="confirmVote"
      @cancel="cancelVote"
    />

    <!-- Success Animation -->
    <SuccessAnimation
      :show="showSuccess"
      :selected-label="selectedLabel"
      @dismiss="dismissSuccess"
    />
  </div>
</template>

<style scoped>
.vm-textarea {
  width: 100%;
  padding: 14px 16px;
  border: 2px solid var(--vm-border);
  border-radius: var(--vm-radius-sm);
  font-family: var(--vm-font);
  font-size: 15px;
  line-height: 1.6;
  color: var(--vm-text);
  background: var(--vm-card);
  resize: vertical;
  min-height: 100px;
  transition: border-color var(--vm-transition);
  outline: none;
}

.vm-textarea:focus {
  border-color: var(--vm-primary);
  box-shadow: 0 0 0 3px var(--vm-indigo-200);
}

.vm-textarea::placeholder {
  color: var(--vm-text-muted);
}

.vm-textarea-count {
  font-size: 12px;
  color: var(--vm-text-muted);
  margin-top: 6px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.vm-open-text {
  margin-bottom: 8px;
}
</style>
