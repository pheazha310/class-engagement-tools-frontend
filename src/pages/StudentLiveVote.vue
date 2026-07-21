<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { getPolls, type LivePoll } from '@/utils/pollStorage'
import {
  castVote,
  hasVoted,
  getMyVoteOptionIndex,
  getTotalVotes,
  getResults,
  getVoterId,
  type PollResult,
} from '@/utils/voteStorage'
import { useAuthStore } from '@/stores/auth'
import ToastNotification from '@/components/ToastNotification.vue'

const auth = useAuthStore()

// ── Check if the current user is a teacher (teachers cannot vote)
const isTeacher = computed(() => auth.isAuthenticated && auth.user?.role === 'teacher')

// ── State ──
const polls = ref<LivePoll[]>([])
const loading = ref(true)
const selectedPoll = ref<LivePoll | null>(null)
const selectedOption = ref<number | null>(null)
const voteSubmitted = ref(false)
const showConfirmModal = ref(false)
const isSubmitting = ref(false)
const toastMessage = ref<string | null>(null)
const toastType = ref<'success' | 'error'>('success')

// Active polls only
const activePolls = computed(() =>
  polls.value.filter((p) => p.status === 'active'),
)

// Results for the selected poll
const pollResults = ref<PollResult[]>([])
const totalPollVotes = ref(0)

// Check if voter already voted on selected poll
const alreadyVoted = computed(() => {
  if (!selectedPoll.value) return false
  if (selectedPoll.value.allowMultipleVotes) return false
  return hasVoted(selectedPoll.value.id)
})

const myVoteIndex = computed(() => {
  if (!selectedPoll.value) return -1
  return getMyVoteOptionIndex(selectedPoll.value.id)
})

// Duration label
function getDurationLabel(minutes: number) {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

// ── Auto-refresh polls every 8 seconds ──
const refreshInterval = ref<ReturnType<typeof setInterval> | null>(null)

onMounted(() => {
  loadPolls()
  // Start auto-refresh to pick up newly activated polls and live results
  refreshInterval.value = setInterval(() => {
    if (selectedPoll.value) {
      // Refresh results when viewing a poll (live results update)
      loadResults()
    } else {
      // Refresh the list when not viewing a poll
      loadPolls()
    }
  }, 5000)
})

onUnmounted(() => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
    refreshInterval.value = null
  }
})

function loadPolls() {
  polls.value = getPolls()
  loading.value = false
}

function selectPoll(poll: LivePoll) {
  selectedPoll.value = poll
  selectedOption.value = null
  voteSubmitted.value = false
  showConfirmModal.value = false
  loadResults()
}

function refreshPolls() {
  loadPolls()
  toastMessage.value = 'Polls refreshed!'
  toastType.value = 'success'
}

function goBack() {
  selectedPoll.value = null
  selectedOption.value = null
  voteSubmitted.value = false
}

function selectOption(index: number) {
  if (alreadyVoted.value || voteSubmitted.value) return
  // For multiple choice single-select, just set the option
  if (selectedPoll.value?.type === 'multiple-choice') {
    selectedOption.value = selectedOption.value === index ? null : index
  } else {
    selectedOption.value = index
  }
}

function confirmVote() {
  if (selectedPoll.value === null || selectedOption.value === null) return
  showConfirmModal.value = true
}

function cancelVote() {
  showConfirmModal.value = false
}

function submitVote() {
  if (selectedPoll.value === null || selectedOption.value === null) return
  isSubmitting.value = true

  try {
    castVote(selectedPoll.value.id, selectedOption.value)
    voteSubmitted.value = true
    showConfirmModal.value = false
    toastMessage.value = 'Your vote has been recorded!'
    toastType.value = 'success'
    loadResults()
  } catch {
    toastMessage.value = 'Failed to submit vote.'
    toastType.value = 'error'
  } finally {
    isSubmitting.value = false
  }
}

function loadResults() {
  if (!selectedPoll.value) return
  pollResults.value = getResults(selectedPoll.value.id, selectedPoll.value.options)
  totalPollVotes.value = getTotalVotes(selectedPoll.value.id)
}

function getTypeLabel(type: string) {
  switch (type) {
    case 'multiple-choice':
      return 'Multiple Choice'
    case 'yes-no':
      return 'Yes / No'
    case 'rating-scale':
      return 'Rating Scale'
    default:
      return type
  }
}

function getOptionLabel(poll: LivePoll, index: number): string {
  if (poll.type === 'rating-scale') {
    const labels = ['Poor', 'Fair', 'Average', 'Good', 'Excellent']
    return `${poll.options[index] ?? ''} — ${labels[index] ?? ''}`
  }
  return poll.options[index] ?? ''
}

// Winner bar color
function getBarColor(index: number, total: number): string {
  const colors = [
    'linear-gradient(135deg, #6366F1, #818CF8)',
    'linear-gradient(135deg, #22C55E, #4ADE80)',
    'linear-gradient(135deg, #F59E0B, #FBBF24)',
    'linear-gradient(135deg, #EF4444, #F87171)',
    'linear-gradient(135deg, #EC4899, #F472B6)',
    'linear-gradient(135deg, #14B8A6, #2DD4BF)',
    'linear-gradient(135deg, #8B5CF6, #A78BFA)',
    'linear-gradient(135deg, #F97316, #FB923C)',
  ]
  return colors[index % colors.length] ?? 'linear-gradient(135deg, #6366F1, #818CF8)'
}
</script>

<template>
  <div class="sv-page">
    <!-- Background decorations -->
    <div class="sv-bg-orb sv-bg-orb--1" aria-hidden="true" />
    <div class="sv-bg-orb sv-bg-orb--2" aria-hidden="true" />
    <div class="sv-bg-grid" aria-hidden="true" />

    <div class="sv-container">
      <!-- ──── TEACHER BLOCK ──── -->
      <div v-if="isTeacher" class="sv-teacher-block">
        <div class="sv-teacher-block-icon">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 class="sv-teacher-block-title">Teachers Cannot Vote</h2>
        <p class="sv-teacher-block-desc">
          You are logged in as a teacher. Voting is available for students and unauthenticated users.
          If you want to test the voting experience, please log out or use a different browser.
        </p>
        <div class="sv-teacher-block-actions">
          <router-link to="/live-voting" class="sv-btn sv-btn--outline">
            <svg class="sv-btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Manage Polls
          </router-link>
        </div>
      </div>

      <!-- ──── LIST VIEW ──── -->
      <template v-else-if="!selectedPoll">
        <header class="sv-header">
          <div class="sv-header-left">
            <div class="sv-header-badge">
              <svg class="sv-badge-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Live Voting</span>
            </div>
            <h1 class="sv-title">Active Polls</h1>
            <p class="sv-subtitle">Select an active poll below to cast your vote</p>
          </div>
          <div class="sv-voter-badge">
            <svg class="sv-voter-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span class="sv-voter-label">Voter</span>
          </div>
        </header>

        <!-- Loading -->
        <div v-if="loading" class="sv-loading">
          <div class="sv-spinner" />
          <p>Loading polls...</p>
        </div>

        <!-- Empty state -->
        <div v-else-if="activePolls.length === 0" class="sv-empty">
          <div class="sv-empty-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 class="sv-empty-title">No Active Polls</h3>
          <p class="sv-empty-desc">There are no active polls available for voting right now.</p>
          <button class="sv-refresh-btn" @click="refreshPolls">
            <svg class="sv-refresh-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        <!-- Poll grid -->
        <div v-else class="sv-grid">
          <div
            v-for="poll in activePolls"
            :key="poll.id"
            class="sv-poll-card"
            @click="selectPoll(poll)"
          >
            <div class="sv-poll-card-top">
              <span class="sv-poll-type-badge">
                {{ getTypeLabel(poll.type) }}
              </span>
              <span v-if="hasVoted(poll.id) && !poll.allowMultipleVotes" class="sv-poll-voted-badge">
                <svg class="sv-voted-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                </svg>
                Voted
              </span>
            </div>
            <h3 class="sv-poll-card-title">{{ poll.title }}</h3>
            <p class="sv-poll-card-question">{{ poll.question }}</p>
            <div class="sv-poll-card-footer">
              <span class="sv-poll-card-meta">
                <svg class="sv-meta-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
                {{ getDurationLabel(poll.duration) }}
              </span>
              <span class="sv-poll-card-meta">
                <svg class="sv-meta-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
                {{ poll.options.length }} options
              </span>
              <span class="sv-poll-card-count">{{ getTotalVotes(poll.id) }} votes</span>
            </div>
          </div>
        </div>
      </template>

      <!-- ──── VOTE VIEW ──── -->
      <template v-else>
        <header class="sv-header">
          <div class="sv-header-left">
            <button class="sv-back-btn" @click="goBack">
              <svg class="sv-back-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Polls
            </button>
          </div>
          <div class="sv-voter-badge">
            <svg class="sv-voter-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span class="sv-voter-label">Voter</span>
          </div>
        </header>

        <!-- Poll Detail Card -->
        <div class="sv-detail-card">
          <div class="sv-detail-header">
            <span class="sv-detail-type">{{ getTypeLabel(selectedPoll.type) }}</span>
            <span class="sv-detail-duration">{{ getDurationLabel(selectedPoll.duration) }}</span>
          </div>

          <h2 class="sv-detail-title">{{ selectedPoll.title }}</h2>
          <p v-if="selectedPoll.description" class="sv-detail-desc">{{ selectedPoll.description }}</p>

          <div class="sv-detail-divider" />

          <p class="sv-detail-question">{{ selectedPoll.question }}</p>

          <!-- Already voted state -->
          <div v-if="alreadyVoted && !voteSubmitted" class="sv-voted-msg">
            <svg class="sv-voted-msg-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <strong>You already voted on this poll.</strong>
              <p v-if="myVoteIndex >= 0" class="sv-voted-option">
                You selected: <strong>{{ selectedPoll.options[myVoteIndex] ?? '' }}</strong>
              </p>
            </div>
          </div>

          <!-- Vote options -->
          <div v-if="!voteSubmitted" class="sv-options">
            <!-- Multiple Choice -->
            <template v-if="selectedPoll.type === 'multiple-choice'">
              <button
                v-for="(opt, index) in selectedPoll.options"
                :key="index"
                class="sv-option-btn"
                :class="{
                  'sv-option-btn--selected': selectedOption === index,
                  'sv-option-btn--disabled': alreadyVoted,
                }"
                :disabled="alreadyVoted"
                @click="selectOption(index)"
              >
                <div class="sv-option-radio" :class="{ 'sv-option-radio--checked': selectedOption === index }">
                  <div v-if="selectedOption === index" class="sv-option-radio-dot" />
                </div>
                <span class="sv-option-text">{{ opt }}</span>
              </button>
            </template>

            <!-- Yes / No -->
            <template v-else-if="selectedPoll.type === 'yes-no'">
              <button
                class="sv-option-btn sv-option-btn--yes"
                :class="{ 'sv-option-btn--selected-yes': selectedOption === 0, 'sv-option-btn--disabled': alreadyVoted }"
                :disabled="alreadyVoted"
                @click="selectOption(0)"
              >
                <div class="sv-option-icon sv-option-icon--yes">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span class="sv-option-text">Yes</span>
              </button>
              <button
                class="sv-option-btn sv-option-btn--no"
                :class="{ 'sv-option-btn--selected-no': selectedOption === 1, 'sv-option-btn--disabled': alreadyVoted }"
                :disabled="alreadyVoted"
                @click="selectOption(1)"
              >
                <div class="sv-option-icon sv-option-icon--no">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <span class="sv-option-text">No</span>
              </button>
            </template>

            <!-- Rating Scale -->
            <template v-else>
              <div class="sv-rating-grid">
                <button
                  v-for="(opt, index) in selectedPoll.options"
                  :key="index"
                  class="sv-rating-btn"
                  :class="{ 'sv-rating-btn--active': selectedOption === index, 'sv-rating-btn--disabled': alreadyVoted }"
                  :disabled="alreadyVoted"
                  @click="selectOption(index)"
                >
                  <span class="sv-rating-num">{{ opt }}</span>
                  <div class="sv-rating-bar" :class="{ 'sv-rating-bar--filled': selectedOption !== null && index <= selectedOption }" />
                  <span class="sv-rating-label">{{ ['Poor', 'Fair', 'Average', 'Good', 'Excellent'][index] ?? '' }}</span>
                </button>
              </div>
            </template>
          </div>

          <!-- Results after voting -->
          <div v-if="voteSubmitted" class="sv-results">
            <div class="sv-results-header">
              <span class="sv-results-total">{{ totalPollVotes }} vote{{ totalPollVotes !== 1 ? 's' : '' }}</span>
              <span class="sv-results-badge">Live Results</span>
            </div>
            <div class="sv-results-bars">
              <div
                v-for="(result, index) in pollResults"
                :key="index"
                class="sv-result-row"
              >
                <div class="sv-result-label">
                  <span class="sv-result-option">
                    <span v-if="myVoteIndex === index" class="sv-my-vote-indicator" title="Your vote">●</span>
                    {{ getOptionLabel(selectedPoll!, index) }}
                  </span>
                  <span class="sv-result-stats">
                    {{ result.votes }}
                    <span class="sv-result-pct">({{ result.percentage }}%)</span>
                  </span>
                </div>
                <div class="sv-result-track">
                  <div
                    class="sv-result-fill"
                    :style="{
                      width: result.percentage + '%',
                      background: getBarColor(index, pollResults.length),
                    }"
                  />
                </div>
              </div>
            </div>

            <div class="sv-results-footer">
              <svg class="sv-results-footer-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>{{ selectedPoll.anonymous ? 'Responses are anonymous' : 'Your name is recorded' }}</span>
            </div>
          </div>

          <!-- Submit button -->
          <div v-if="!voteSubmitted && !alreadyVoted" class="sv-detail-actions">
            <button class="sv-btn sv-btn--ghost" @click="goBack">Cancel</button>
            <button
              class="sv-btn sv-btn--primary"
              :disabled="selectedOption === null || isSubmitting"
              @click="confirmVote"
            >
              <svg v-if="!isSubmitting" class="sv-btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <svg v-else class="sv-spinner" fill="none" viewBox="0 0 24 24">
                <circle class="sv-spin-track" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="sv-spin-bar" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {{ isSubmitting ? 'Submitting...' : 'Submit Vote' }}
            </button>
          </div>
        </div>

        <!-- Voter info -->
        <div class="sv-info-card">
          <svg class="sv-info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div class="sv-info-text">
            <strong>Voter ID:</strong> {{ getVoterId().slice(0, 16) }}...
          </div>
        </div>
      </template>
    </div>

    <!-- Confirm Modal -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showConfirmModal" class="sv-modal-overlay" @click.self="cancelVote">
          <div class="sv-modal">
            <div class="sv-modal-icon-wrap">
              <svg class="sv-modal-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 class="sv-modal-title">Confirm Your Vote</h3>
            <p class="sv-modal-text">
              You are about to vote for:
              <strong>{{ selectedPoll?.options[selectedOption ?? 0] ?? '' }}</strong>
            </p>
            <p v-if="selectedPoll?.allowMultipleVotes" class="sv-modal-note">
              Multiple votes are allowed on this poll.
            </p>
            <p v-else class="sv-modal-note">
              You cannot change your vote after submitting.
            </p>
            <div class="sv-modal-actions">
              <button class="sv-btn sv-btn--ghost" @click="cancelVote">Cancel</button>
              <button class="sv-btn sv-btn--primary" :disabled="isSubmitting" @click="submitVote">
                {{ isSubmitting ? 'Submitting...' : 'Confirm Vote' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <ToastNotification :message="toastMessage" :type="toastType" @close="toastMessage = null" />
  </div>
</template>

<style scoped>
/* ── Page Layout ── */
.sv-page {
  position: relative;
  min-height: 100vh;
  background: linear-gradient(135deg, #F0FDF4 0%, #F8FAFC 50%, #ECFDF5 100%);
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  padding: 88px 24px 60px;
}

.sv-bg-orb {
  position: fixed;
  border-radius: 9999px;
  pointer-events: none;
  filter: blur(100px);
  opacity: 0.2;
  z-index: 0;
}

.sv-bg-orb--1 {
  top: -100px;
  right: -60px;
  width: 350px;
  height: 350px;
  background: rgba(34, 197, 94, 0.1);
}

.sv-bg-orb--2 {
  bottom: -120px;
  left: -80px;
  width: 300px;
  height: 300px;
  background: rgba(99, 102, 241, 0.08);
}

.sv-bg-grid {
  position: fixed;
  inset: 0;
  pointer-events: none;
  opacity: 0.1;
  background-image: linear-gradient(rgba(148, 163, 184, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148, 163, 184, 0.05) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.5), transparent 90%);
  -webkit-mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.5), transparent 90%);
  z-index: 0;
}

.sv-container {
  position: relative;
  max-width: 900px;
  margin: 0 auto;
  z-index: 1;
}

/* ── Header ── */
.sv-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 28px;
  gap: 16px;
}

.sv-header-left {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sv-header-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 9999px;
  background: linear-gradient(135deg, #DCFCE7, #BBF7D0);
  color: #16A34A;
  font-size: 12px;
  font-weight: 600;
  width: fit-content;
}

.sv-badge-icon {
  width: 14px;
  height: 14px;
}

.sv-title {
  font-size: 32px;
  font-weight: 800;
  color: #0F172A;
  letter-spacing: -0.03em;
  line-height: 1.2;
  margin: 0;
}

.sv-subtitle {
  font-size: 15px;
  color: #64748B;
  line-height: 1.6;
  margin: 0;
}

.sv-voter-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  white-space: nowrap;
  flex-shrink: 0;
}

.sv-voter-icon {
  width: 18px;
  height: 18px;
  color: #22C55E;
}

.sv-back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid #E2E8F0;
  border-radius: 10px;
  background: white;
  color: #475569;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.sv-back-btn:hover {
  background: #F8FAFC;
  border-color: #CBD5E1;
  color: #0F172A;
  transform: translateY(-1px);
}

.sv-back-icon {
  width: 16px;
  height: 16px;
}

/* ── Loading ── */
.sv-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 80px 24px;
  color: #94A3B8;
  font-size: 14px;
}

.sv-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #E2E8F0;
  border-top-color: #22C55E;
  border-radius: 50%;
  animation: sv-spin 0.8s linear infinite;
}

@keyframes sv-spin {
  to { transform: rotate(360deg); }
}

/* ── Empty State ── */
.sv-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 80px 24px;
  text-align: center;
}

.sv-empty-icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: linear-gradient(135deg, #DCFCE7, #BBF7D0);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #22C55E;
}

.sv-empty-icon svg {
  width: 32px;
  height: 32px;
}

.sv-empty-title {
  font-size: 20px;
  font-weight: 700;
  color: #0F172A;
  margin: 0;
}

.sv-empty-desc {
  font-size: 14px;
  color: #64748B;
  margin: 0;
  max-width: 320px;
}

.sv-refresh-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 10px;
  color: #475569;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ease;
}

.sv-refresh-btn:hover {
  background: #F8FAFC;
  border-color: #CBD5E1;
  transform: translateY(-1px);
}

.sv-refresh-icon {
  width: 16px;
  height: 16px;
}

/* ── Poll Grid ── */
.sv-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.sv-poll-card {
  background: white;
  border: 1.5px solid #E2E8F0;
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sv-poll-card:hover {
  border-color: #86EFAC;
  box-shadow: 0 8px 24px rgba(34, 197, 94, 0.1);
  transform: translateY(-3px);
}

.sv-poll-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.sv-poll-type-badge {
  padding: 3px 10px;
  border-radius: 6px;
  background: #F1F5F9;
  color: #475569;
  font-size: 11px;
  font-weight: 600;
}

.sv-poll-voted-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: 6px;
  background: #DCFCE7;
  color: #16A34A;
  font-size: 11px;
  font-weight: 600;
}

.sv-voted-icon {
  width: 12px;
  height: 12px;
}

.sv-poll-card-title {
  font-size: 17px;
  font-weight: 700;
  color: #0F172A;
  margin: 0;
  line-height: 1.3;
}

.sv-poll-card-question {
  font-size: 13px;
  color: #64748B;
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.sv-poll-card-footer {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-top: 10px;
  border-top: 1px solid #F1F5F9;
  font-size: 12px;
  color: #94A3B8;
}

.sv-poll-card-meta {
  display: flex;
  align-items: center;
  gap: 4px;
}

.sv-meta-icon {
  width: 12px;
  height: 12px;
}

.sv-poll-card-count {
  margin-left: auto;
  font-weight: 600;
  color: #22C55E;
}

/* ── Detail Card ── */
.sv-detail-card {
  background: white;
  border: 1.5px solid #E2E8F0;
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
  margin-bottom: 16px;
}

.sv-detail-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.sv-detail-type {
  padding: 3px 10px;
  border-radius: 6px;
  background: #F1F5F9;
  color: #475569;
  font-size: 12px;
  font-weight: 600;
}

.sv-detail-duration {
  font-size: 12px;
  color: #94A3B8;
}

.sv-detail-title {
  font-size: 24px;
  font-weight: 700;
  color: #0F172A;
  margin: 0 0 8px;
  line-height: 1.3;
}

.sv-detail-desc {
  font-size: 14px;
  color: #64748B;
  margin: 0 0 16px;
  line-height: 1.5;
}

.sv-detail-divider {
  height: 1px;
  background: #E2E8F0;
  margin: 16px 0;
}

.sv-detail-question {
  font-size: 16px;
  font-weight: 600;
  color: #0F172A;
  margin: 0 0 20px;
  line-height: 1.4;
}

/* ── Already voted message ── */
.sv-voted-msg {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border-radius: 12px;
  background: #F0FDF4;
  border: 1px solid #BBF7D0;
  margin-bottom: 20px;
}

.sv-voted-msg-icon {
  width: 24px;
  height: 24px;
  color: #22C55E;
  flex-shrink: 0;
  margin-top: 1px;
}

.sv-voted-msg strong {
  color: #166534;
  font-size: 14px;
}

.sv-voted-option {
  font-size: 13px;
  color: #15803D;
  margin: 4px 0 0;
}

/* ── Vote Options ── */
.sv-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 24px;
}

/* Multiple Choice */
.sv-option-btn {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 14px 18px;
  border: 1.5px solid #E2E8F0;
  border-radius: 12px;
  background: #FAFBFC;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  font-family: inherit;
}

.sv-option-btn:hover:not(:disabled) {
  border-color: #86EFAC;
  background: #F0FDF4;
  transform: translateY(-1px);
}

.sv-option-btn--selected {
  border-color: #22C55E !important;
  background: #F0FDF4 !important;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
}

.sv-option-btn--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.sv-option-radio {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid #CBD5E1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.sv-option-radio--checked {
  border-color: #22C55E;
  background: #22C55E;
}

.sv-option-radio-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: white;
  animation: sv-scale-in 0.2s ease-out;
}

@keyframes sv-scale-in {
  from { transform: scale(0); }
  to { transform: scale(1); }
}

.sv-option-text {
  font-size: 15px;
  font-weight: 500;
  color: #1E293B;
}

/* Yes / No buttons */
.sv-option-btn--yes:hover:not(:disabled) {
  border-color: #86EFAC;
  background: #F0FDF4;
}

.sv-option-btn--no:hover:not(:disabled) {
  border-color: #FECDD3;
  background: #FFF1F2;
}

.sv-option-btn--selected-yes {
  border-color: #22C55E !important;
  background: #F0FDF4 !important;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
}

.sv-option-btn--selected-no {
  border-color: #EF4444 !important;
  background: #FFF1F2 !important;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.sv-option-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  flex-shrink: 0;
}

.sv-option-icon svg {
  width: 18px;
  height: 18px;
}

.sv-option-icon--yes {
  background: #DCFCE7;
  color: #16A34A;
}

.sv-option-icon--no {
  background: #FEE2E2;
  color: #DC2626;
}

/* Rating Scale */
.sv-rating-grid {
  display: flex;
  gap: 8px;
}

.sv-rating-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 8px;
  border: 1.5px solid #E2E8F0;
  border-radius: 12px;
  background: #FAFBFC;
  cursor: pointer;
  transition: all 0.25s ease;
  font-family: inherit;
}

.sv-rating-btn:hover:not(:disabled) {
  border-color: #FBBF24;
  background: #FFFBEB;
  transform: translateY(-3px);
  box-shadow: 0 8px 16px rgba(251, 191, 36, 0.15);
}

.sv-rating-btn--active {
  border-color: #F59E0B !important;
  background: #FFFBEB !important;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.15) !important;
  transform: translateY(-3px) !important;
}

.sv-rating-btn--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.sv-rating-num {
  font-size: 20px;
  font-weight: 800;
  color: #78350F;
}

.sv-rating-bar {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #FEF3C7;
  transition: all 0.3s ease;
}

.sv-rating-bar--filled {
  background: linear-gradient(90deg, #FBBF24, #F59E0B);
  height: 8px;
  border-radius: 4px;
}

.sv-rating-label {
  font-size: 10px;
  font-weight: 600;
  color: #92400E;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* ── Results ── */
.sv-results {
  margin-bottom: 24px;
}

.sv-results-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.sv-results-total {
  font-size: 14px;
  font-weight: 600;
  color: #475569;
}

.sv-results-badge {
  padding: 2px 10px;
  border-radius: 999px;
  background: #DCFCE7;
  color: #16A34A;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.sv-results-bars {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sv-result-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sv-result-label {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.sv-result-option {
  font-weight: 500;
  color: #1E293B;
  display: flex;
  align-items: center;
  gap: 6px;
}

.sv-my-vote-indicator {
  color: #22C55E;
  font-size: 10px;
}

.sv-result-stats {
  color: #64748B;
  font-weight: 600;
}

.sv-result-pct {
  font-weight: 400;
  color: #94A3B8;
}

.sv-result-track {
  height: 26px;
  background: #F1F5F9;
  border-radius: 6px;
  overflow: hidden;
}

.sv-result-fill {
  height: 100%;
  border-radius: 6px;
  transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  min-width: 4px;
}

.sv-results-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #F1F5F9;
  font-size: 13px;
  color: #94A3B8;
}

.sv-results-footer-icon {
  width: 16px;
  height: 16px;
  color: #22C55E;
  flex-shrink: 0;
}

/* ── Detail Actions ── */
.sv-detail-actions {
  display: flex;
  gap: 12px;
}

/* ── Buttons ── */
.sv-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.sv-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.sv-btn-icon {
  width: 18px;
  height: 18px;
}

.sv-btn--ghost {
  background: transparent;
  color: #64748B;
  border: 1px solid #E2E8F0;
}

.sv-btn--ghost:hover:not(:disabled) {
  background: #F8FAFC;
  color: #475569;
  border-color: #CBD5E1;
}

.sv-btn--primary {
  background: linear-gradient(135deg, #22C55E, #16A34A);
  color: white;
  box-shadow: 0 4px 14px rgba(34, 197, 94, 0.3);
}

.sv-btn--primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(34, 197, 94, 0.4);
  background: linear-gradient(135deg, #16A34A, #15803D);
}

.sv-spinner {
  width: 18px;
  height: 18px;
  animation: sv-spin-btn 1s linear infinite;
}

.sv-spin-track {
  opacity: 0.25;
}

.sv-spin-bar {
  opacity: 0.75;
}

@keyframes sv-spin-btn {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ── Info Card ── */
.sv-info-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 18px;
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  font-size: 12px;
  color: #94A3B8;
}

.sv-info-icon {
  width: 16px;
  height: 16px;
  color: #6366F1;
  flex-shrink: 0;
}

.sv-info-text strong {
  color: #64748B;
}

/* ── Modal ── */
.sv-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 24px;
}

.sv-modal {
  background: white;
  border-radius: 20px;
  padding: 32px;
  max-width: 400px;
  width: 100%;
  text-align: center;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.15);
}

.sv-modal-icon-wrap {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #F0FDF4;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}

.sv-modal-icon {
  width: 28px;
  height: 28px;
  color: #22C55E;
}

.sv-modal-title {
  font-size: 18px;
  font-weight: 700;
  color: #0F172A;
  margin: 0 0 8px;
}

.sv-modal-text {
  font-size: 14px;
  color: #475569;
  margin: 0 0 8px;
  line-height: 1.5;
}

.sv-modal-text strong {
  color: #0F172A;
}

.sv-modal-note {
  font-size: 13px;
  color: #94A3B8;
  margin: 0 0 24px;
}

.sv-modal-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.sv-modal-actions .sv-btn {
  flex: 1;
  justify-content: center;
}

/* Modal transitions */
.modal-fade-enter-active {
  transition: all 0.2s ease-out;
}

.modal-fade-leave-active {
  transition: all 0.15s ease-in;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .sv-modal,
.modal-fade-leave-to .sv-modal {
  transform: scale(0.95);
}

/* ── Teacher Block ── */
.sv-teacher-block {
  text-align: center;
  padding: 60px 24px;
  max-width: 480px;
  margin: 40px auto;
  background: white;
  border: 1px solid #FECDD3;
  border-radius: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
}

.sv-teacher-block-icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: linear-gradient(135deg, #FEF2F2, #FEE2E2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  color: #EF4444;
}

.sv-teacher-block-icon svg {
  width: 32px;
  height: 32px;
}

.sv-teacher-block-title {
  font-size: 22px;
  font-weight: 700;
  color: #991B1B;
  margin: 0 0 12px;
}

.sv-teacher-block-desc {
  font-size: 14px;
  color: #64748B;
  line-height: 1.6;
  margin: 0 0 24px;
}

.sv-teacher-block-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
}

.sv-btn--outline {
  background: transparent;
  color: #4F46E5;
  border: 1px solid #CBD5E1;
}

.sv-btn--outline:hover {
  background: #EEF2FF;
  border-color: #6366F1;
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .sv-page {
    padding: 80px 16px 40px;
  }

  .sv-header {
    flex-direction: column;
  }

  .sv-title {
    font-size: 24px;
  }

  .sv-grid {
    grid-template-columns: 1fr;
  }

  .sv-detail-card {
    padding: 20px;
  }

  .sv-rating-grid {
    flex-wrap: wrap;
  }

  .sv-rating-btn {
    min-width: calc(33% - 6px);
    flex: none;
  }

  .sv-modal {
    padding: 24px 20px;
  }
}
</style>
