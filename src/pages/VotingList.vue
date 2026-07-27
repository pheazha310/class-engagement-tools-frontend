<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { RouterLink } from 'vue-router'
import { getPolls, deletePoll, updatePoll, type LivePoll } from '@/utils/pollStorage'
import { getResults, getTotalVotes, type PollResult } from '@/utils/voteStorage'
import { useAuthStore } from '@/stores/auth'
import ToastNotification from '@/components/ToastNotification.vue'
import ConfirmationDialog from '@/components/ConfirmationDialog.vue'

const router = useRouter()
const auth = useAuthStore()
const isTeacher = computed(() => auth.isAuthenticated && auth.user?.role === 'teacher')

const polls = ref<LivePoll[]>([])
const searchQuery = ref('')
const toastMessage = ref<string | null>(null)
const toastType = ref<'success' | 'error'>('success')
const showDeleteDialog = ref(false)
const pollToDelete = ref<string | null>(null)

// ── Results Modal ──
const showResultsModal = ref(false)
const resultsPoll = ref<LivePoll | null>(null)
const resultsData = ref<PollResult[]>([])
const resultsTotalVotes = ref(0)
const resultsRefreshInterval = ref<ReturnType<typeof setInterval> | null>(null)

// ── Share Modal ──
const showShareModal = ref(false)
const sharePollUrl = ref('')
const sharePollTitle = ref('')
const linkCopied = ref(false)

const filteredPolls = computed(() => {
  if (!searchQuery.value.trim()) return polls.value
  const q = searchQuery.value.toLowerCase()
  return polls.value.filter(
    (p) =>
      p.title.toLowerCase().includes(q) ||
      p.question.toLowerCase().includes(q) ||
      p.status.toLowerCase().includes(q),
  )
})

const activePolls = computed(() => filteredPolls.value.filter((p) => p.status === 'active'))
const draftPolls = computed(() => filteredPolls.value.filter((p) => p.status === 'draft'))
const endedPolls = computed(() => filteredPolls.value.filter((p) => p.status === 'ended'))

onMounted(() => {
  loadPolls()
})

function loadPolls() {
  polls.value = getPolls()
}

function navigateToCreate() {
  router.push('/live-voting/create')
}

function navigateToEdit(pollId: string) {
  router.push(`/live-voting/${pollId}/edit`)
}

function confirmDelete(id: string) {
  pollToDelete.value = id
  showDeleteDialog.value = true
}

function executeDelete() {
  if (!pollToDelete.value) return
  deletePoll(pollToDelete.value)
  loadPolls()
  toastMessage.value = 'Poll deleted successfully.'
  toastType.value = 'success'
  showDeleteDialog.value = false
  pollToDelete.value = null
}

function activatePoll(id: string) {
  updatePoll(id, { status: 'active' })
  loadPolls()
  toastMessage.value = 'Poll is now live! Share the link with your students.'
  toastType.value = 'success'
  // Auto-open share modal after activating
  const poll = polls.value.find((p) => p.id === id)
  if (poll) setTimeout(() => openShareModal(poll), 800)
}

function endPoll(id: string) {
  updatePoll(id, { status: 'ended' })
  loadPolls()
  toastMessage.value = 'Poll ended successfully.'
  toastType.value = 'success'
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case 'active':
      return 'status-badge--active'
    case 'draft':
      return 'status-badge--draft'
    case 'ended':
      return 'status-badge--ended'
    default:
      return ''
  }
}

function getTypeIcon(type: string) {
  switch (type) {
    case 'multiple-choice':
      return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
    case 'yes-no':
      return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
    case 'rating-scale':
      return 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z'
    default:
      return ''
  }
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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function openShareModal(poll: LivePoll) {
  sharePollUrl.value = `${window.location.origin}/vote/live`
  sharePollTitle.value = poll.title
  linkCopied.value = false
  showShareModal.value = true
}

function copyVotingLink() {
  navigator.clipboard.writeText(sharePollUrl.value).then(() => {
    linkCopied.value = true
    toastMessage.value = 'Voting link copied to clipboard!'
    toastType.value = 'success'
    setTimeout(() => {
      if (!showShareModal.value) linkCopied.value = false
    }, 2000)
  }).catch(() => {
    toastMessage.value = 'Failed to copy link.'
    toastType.value = 'error'
  })
}

function getDurationLabel(minutes: number) {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

// ── Results Modal ──
function openResults(poll: LivePoll) {
  resultsPoll.value = poll
  loadResults()
  showResultsModal.value = true

  // Auto-refresh results every 3 seconds for live polls
  if (poll.status === 'active') {
    resultsRefreshInterval.value = setInterval(() => {
      if (resultsPoll.value && resultsPoll.value.status === 'active') {
        loadResults()
      }
    }, 3000)
  }
}

function closeResults() {
  showResultsModal.value = false
  resultsPoll.value = null
  resultsData.value = []
  resultsTotalVotes.value = 0
  if (resultsRefreshInterval.value) {
    clearInterval(resultsRefreshInterval.value)
    resultsRefreshInterval.value = null
  }
}

function loadResults() {
  if (!resultsPoll.value) return
  resultsData.value = getResults(resultsPoll.value.id, resultsPoll.value.options)
  resultsTotalVotes.value = getTotalVotes(resultsPoll.value.id)
}

function getTotalVotesForPoll(pollId: string): number {
  return getTotalVotes(pollId)
}

// Clean up on unmount
onUnmounted(() => {
  if (resultsRefreshInterval.value) {
    clearInterval(resultsRefreshInterval.value)
  }
})

// ── Result bar color ──
function getBarColor(index: number): string {
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

function getWinnerIndex(): number {
  if (resultsData.value.length === 0) return -1
  const maxVotes = Math.max(...resultsData.value.map((r) => r.votes))
  if (maxVotes === 0) return -1
  return resultsData.value.findIndex((r) => r.votes === maxVotes)
}
</script>

<template>
  <div class="vl-page">
    <!-- Background decorations -->
    <div class="vl-bg-orb vl-bg-orb--1" aria-hidden="true" />
    <div class="vl-bg-orb vl-bg-orb--2" aria-hidden="true" />
    <div class="vl-bg-grid" aria-hidden="true" />

    <div class="vl-container">
      <!-- Header -->
      <header class="vl-header">
        <div class="vl-header-left">
          <div class="vl-header-badge">
            <svg class="vl-header-badge-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Live Voting</span>
          </div>
          <h1 class="vl-title">My Voting Polls</h1>
          <p class="vl-subtitle">{{ isTeacher ? 'Create, manage, and launch live polls for your classroom' : 'View available polls and cast your vote' }}</p>
        </div>
        <button v-if="isTeacher" class="vl-create-btn" @click="navigateToCreate">
          <svg class="vl-create-btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Create Poll
        </button>
      </header>

      <RouterLink to="/tools" class="btn-back">← Back to all tools</RouterLink>

      <!-- Search -->
      <div class="vl-search-bar">
        <svg class="vl-search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          class="vl-search-input"
          placeholder="Search polls by title, question, or status..."
        />
      </div>

      <!-- Empty state -->
      <div v-if="polls.length === 0" class="vl-empty">
        <div class="vl-empty-icon">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <template v-if="isTeacher">
          <h3 class="vl-empty-title">No polls yet</h3>
          <p class="vl-empty-desc">Create your first live voting poll to engage your students.</p>
          <button class="vl-empty-btn" @click="navigateToCreate">
            <svg class="vl-empty-btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Create Your First Poll
          </button>
        </template>
        <template v-else>
          <h3 class="vl-empty-title">No polls available</h3>
          <p class="vl-empty-desc">There are no active polls right now. Check back later or ask your teacher to start one.</p>
          <router-link to="/vote/live" class="vl-empty-btn">
            <svg class="vl-empty-btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Go to Voting Page
          </router-link>
        </template>
      </div>

      <!-- Poll sections -->
      <div v-else class="vl-sections">
        <!-- Active polls -->
        <section v-if="activePolls.length > 0" class="vl-section">
          <div class="vl-section-header">
            <div class="vl-section-title">
              <span class="vl-section-dot vl-section-dot--active" />
              Active Polls
              <span class="vl-section-count">{{ activePolls.length }}</span>
            </div>
          </div>
          <div class="vl-grid">
            <div v-for="poll in activePolls" :key="poll.id" class="vl-card vl-card--active">
              <div class="vl-card-top">
                <div class="vl-card-badges">
                  <span class="vl-type-badge" :title="getTypeLabel(poll.type)">
                    <svg class="vl-type-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getTypeIcon(poll.type)" />
                    </svg>
                    {{ getTypeLabel(poll.type) }}
                  </span>
                  <span class="status-badge" :class="getStatusBadgeClass(poll.status)">
                    <span class="status-dot" />
                    {{ poll.status }}
                  </span>
                </div>
                <div class="vl-card-meta">
                  <span class="vl-card-meta-item">
                    <svg class="vl-meta-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                    </svg>
                    {{ getDurationLabel(poll.duration) }}
                  </span>
                  <span class="vl-card-meta-item">
                    <svg class="vl-meta-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                    {{ poll.options.length }} options
                  </span>
                </div>
              </div>
              <div class="vl-card-body">
                <h3 class="vl-card-title">{{ poll.title }}</h3>
                <p class="vl-card-question">{{ poll.question }}</p>
              </div>
              <div class="vl-card-footer">
                <div class="vl-card-footer-left">
                  <div class="vl-card-date">{{ formatDate(poll.createdAt) }}</div>
                  <span class="vl-card-votes">
                    <svg class="vl-card-votes-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                    {{ getTotalVotesForPoll(poll.id) }} vote{{ getTotalVotesForPoll(poll.id) !== 1 ? 's' : '' }}
                  </span>
                </div>
                <div v-if="isTeacher" class="vl-card-actions">
                  <button class="vl-action-btn vl-action-btn--results" title="View Results" @click="openResults(poll)">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </button>
                  <button class="vl-action-btn vl-action-btn--share" title="Share Voting Link" @click="openShareModal(poll)">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
                    </svg>
                  </button>
                  <button class="vl-action-btn vl-action-btn--end" title="End Poll" @click="endPoll(poll.id)">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
                    </svg>
                  </button>
                  <button class="vl-action-btn vl-action-btn--delete" title="Delete" @click="confirmDelete(poll.id)">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Draft polls -->
        <section v-if="draftPolls.length > 0" class="vl-section">
          <div class="vl-section-header">
            <div class="vl-section-title">
              <span class="vl-section-dot vl-section-dot--draft" />
              Drafts
              <span class="vl-section-count">{{ draftPolls.length }}</span>
            </div>
          </div>
          <div class="vl-grid">
            <div v-for="poll in draftPolls" :key="poll.id" class="vl-card vl-card--draft">
              <div class="vl-card-top">
                <div class="vl-card-badges">
                  <span class="vl-type-badge" :title="getTypeLabel(poll.type)">
                    <svg class="vl-type-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getTypeIcon(poll.type)" />
                    </svg>
                    {{ getTypeLabel(poll.type) }}
                  </span>
                  <span class="status-badge" :class="getStatusBadgeClass(poll.status)">
                    <span class="status-dot" />
                    {{ poll.status }}
                  </span>
                </div>
              </div>
              <div class="vl-card-body">
                <h3 class="vl-card-title">{{ poll.title }}</h3>
                <p class="vl-card-question">{{ poll.question }}</p>
              </div>
              <div class="vl-card-footer">
                <div class="vl-card-date">{{ formatDate(poll.createdAt) }}</div>
                <div v-if="isTeacher" class="vl-card-actions">
                  <button class="vl-action-btn vl-action-btn--activate" title="Activate Poll" @click="activatePoll(poll.id)">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                  <button class="vl-action-btn vl-action-btn--edit" title="Edit" @click="navigateToEdit(poll.id)">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button class="vl-action-btn vl-action-btn--delete" title="Delete" @click="confirmDelete(poll.id)">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Ended polls -->
        <section v-if="endedPolls.length > 0" class="vl-section">
          <div class="vl-section-header">
            <div class="vl-section-title">
              <span class="vl-section-dot vl-section-dot--ended" />
              Ended Polls
              <span class="vl-section-count">{{ endedPolls.length }}</span>
            </div>
          </div>
          <div class="vl-grid">
            <div v-for="poll in endedPolls" :key="poll.id" class="vl-card vl-card--ended">
              <div class="vl-card-top">
                <div class="vl-card-badges">
                  <span class="vl-type-badge" :title="getTypeLabel(poll.type)">
                    <svg class="vl-type-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getTypeIcon(poll.type)" />
                    </svg>
                    {{ getTypeLabel(poll.type) }}
                  </span>
                  <span class="status-badge" :class="getStatusBadgeClass(poll.status)">
                    <span class="status-dot" />
                    {{ poll.status }}
                  </span>
                </div>
              </div>
              <div class="vl-card-body">
                <h3 class="vl-card-title">{{ poll.title }}</h3>
                <p class="vl-card-question">{{ poll.question }}</p>
              </div>
              <div class="vl-card-footer">
                <div class="vl-card-footer-left">
                  <div class="vl-card-date">{{ formatDate(poll.createdAt) }}</div>
                  <span class="vl-card-votes">
                    <svg class="vl-card-votes-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                    {{ getTotalVotesForPoll(poll.id) }} vote{{ getTotalVotesForPoll(poll.id) !== 1 ? 's' : '' }}
                  </span>
                </div>
                <div v-if="isTeacher" class="vl-card-actions">
                  <button class="vl-action-btn vl-action-btn--results" title="View Results" @click="openResults(poll)">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </button>
                  <button class="vl-action-btn vl-action-btn--delete" title="Delete" @click="confirmDelete(poll.id)">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- No results message -->
        <div v-if="filteredPolls.length === 0 && polls.length > 0" class="vl-no-results">
          <svg class="vl-no-results-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <p>No polls match your search.</p>
        </div>
      </div>
    </div>

    <!-- Results Modal -->
    <Teleport to="body">
      <Transition name="share-fade">
        <div v-if="showResultsModal" class="vl-share-overlay vl-results-overlay" @click.self="closeResults">
          <div class="vl-results-modal">
            <!-- Header -->
            <div class="vl-results-header">
              <div class="vl-results-header-left">
                <div class="vl-results-icon-wrap">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h3 class="vl-results-title">Poll Results</h3>
                  <p class="vl-results-subtitle" v-if="resultsPoll">
                    {{ resultsPoll.title }}
                    <span v-if="resultsPoll.status === 'active'" class="vl-results-live-badge">
                      <span class="vl-results-live-dot" />
                      Live
                    </span>
                  </p>
                </div>
              </div>
              <button class="vl-results-close-btn" @click="closeResults">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Question -->
            <div class="vl-results-question" v-if="resultsPoll">
              {{ resultsPoll.question }}
            </div>

            <!-- Stats row -->
            <div class="vl-results-stats">
              <div class="vl-results-stat">
                <span class="vl-results-stat-value">{{ resultsTotalVotes }}</span>
                <span class="vl-results-stat-label">Total Votes</span>
              </div>
              <div class="vl-results-stat">
                <span class="vl-results-stat-value">{{ resultsData.length }}</span>
                <span class="vl-results-stat-label">Options</span>
              </div>
              <div class="vl-results-stat">
                <span class="vl-results-stat-value" :class="resultsPoll?.status === 'active' ? 'text-green-600' : 'text-gray-600'">
                  {{ resultsPoll?.status === 'active' ? 'Active' : 'Ended' }}
                </span>
                <span class="vl-results-stat-label">Status</span>
              </div>
            </div>

            <!-- Vote bars -->
            <div class="vl-results-bars">
              <div v-if="resultsTotalVotes === 0" class="vl-results-empty">
                <svg class="vl-results-empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>No votes yet. Share the poll link with your students!</p>
              </div>
              <div
                v-for="(result, index) in resultsData"
                :key="index"
                class="vl-results-bar-row"
                :class="{ 'vl-results-bar-row--winner': index === getWinnerIndex() && resultsTotalVotes > 0 }"
              >
                <div class="vl-results-bar-label">
                  <span class="vl-results-bar-option">
                    <span v-if="index === getWinnerIndex() && resultsTotalVotes > 0" class="vl-results-crown" title="Leading option">👑</span>
                    {{ result.option }}
                  </span>
                  <span class="vl-results-bar-stats">
                    <strong>{{ result.votes }}</strong>
                    <span class="vl-results-bar-pct">({{ result.percentage }}%)</span>
                  </span>
                </div>
                <div class="vl-results-bar-track">
                  <div
                    class="vl-results-bar-fill"
                    :style="{
                      width: result.percentage + '%',
                      background: getBarColor(index),
                    }"
                  />
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="vl-results-footer">
              <div v-if="resultsPoll?.status === 'active'" class="vl-results-auto-refresh">
                <div class="vl-results-pulse-loader" />
                <span>Auto-updating every 3s</span>
              </div>
              <button class="vl-results-close-btn-text" @click="closeResults">
                Close Results
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Share Modal -->
    <Teleport to="body">
      <Transition name="share-fade">
        <div v-if="showShareModal" class="vl-share-overlay" @click.self="showShareModal = false">
          <div class="vl-share-modal">
            <div class="vl-share-header">
              <div class="vl-share-icon-wrap">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
                </svg>
              </div>
              <h3 class="vl-share-title">Share Voting Link</h3>
              <p class="vl-share-desc">
                Share this link with your students so they can vote on <strong>{{ sharePollTitle }}</strong>
              </p>
            </div>

            <div class="vl-share-url-box">
              <div class="vl-share-url-text">{{ sharePollUrl }}</div>
              <button class="vl-share-copy-btn" :class="{ 'vl-share-copy-btn--copied': linkCopied }" @click="copyVotingLink">
                <svg v-if="!linkCopied" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
                <svg v-else fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                </svg>
                {{ linkCopied ? 'Copied!' : 'Copy Link' }}
              </button>
            </div>

            <div class="vl-share-info">
              <svg class="vl-share-info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Students don't need to log in to vote. Share this link in your classroom chat, email, or write it on the board.</span>
            </div>

            <button class="vl-share-close-btn" @click="showShareModal = false">
              Close
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>

    <ConfirmationDialog
      :show="showDeleteDialog"
      title="Delete Poll"
      message="Are you sure you want to delete this poll? This action cannot be undone."
      confirm-text="Delete"
      variant="danger"
      @confirm="executeDelete"
      @cancel="showDeleteDialog = false"
    />

    <ToastNotification :message="toastMessage" :type="toastType" @close="toastMessage = null" />
  </div>
</template>

<style scoped>
/* ── Page Layout ── */
.vl-page {
  position: relative;
  min-height: 100vh;
  background: linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 50%, #EEF2FF 100%);
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  padding: 88px 24px 60px;
}

.vl-bg-orb {
  position: fixed;
  border-radius: 9999px;
  pointer-events: none;
  filter: blur(100px);
  opacity: 0.3;
  z-index: 0;
}

.vl-bg-orb--1 {
  top: -80px;
  right: -80px;
  width: 300px;
  height: 300px;
  background: rgba(99, 102, 241, 0.12);
}

.vl-bg-orb--2 {
  bottom: -120px;
  left: -80px;
  width: 350px;
  height: 350px;
  background: rgba(168, 85, 247, 0.1);
}

.vl-bg-grid {
  position: fixed;
  inset: 0;
  pointer-events: none;
  opacity: 0.12;
  background-image: linear-gradient(rgba(148, 163, 184, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148, 163, 184, 0.06) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.5), transparent 90%);
  -webkit-mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.5), transparent 90%);
  z-index: 0;
}

.vl-container {
  position: relative;
  max-width: 1100px;
  margin: 0 auto;
  z-index: 1;
}

/* ── Header ── */
.vl-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 28px;
  gap: 16px;
}

.vl-header-left {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.vl-header-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 9999px;
  background: linear-gradient(135deg, #EEF2FF, #E0E7FF);
  color: #4F46E5;
  font-size: 12px;
  font-weight: 600;
  width: fit-content;
}

.vl-header-badge-icon {
  width: 14px;
  height: 14px;
}

.vl-title {
  font-size: 32px;
  font-weight: 800;
  color: #0F172A;
  letter-spacing: -0.03em;
  line-height: 1.2;
  margin: 0;
}

.vl-subtitle {
  font-size: 15px;
  color: #64748B;
  line-height: 1.6;
  margin: 0;
  max-width: 480px;
}

.vl-create-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #4F46E5, #6366F1);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  box-shadow: 0 4px 14px rgba(79, 70, 229, 0.3);
}

.vl-create-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(79, 70, 229, 0.4);
}

.vl-create-btn-icon {
  width: 18px;
  height: 18px;
}

/* ── Search ── */
.vl-search-bar {
  position: relative;
  margin-bottom: 28px;
  max-width: 480px;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  padding: 10px 20px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
  border: 1.5px solid #e2e8f0;
  color: #334155;
  transition: all 0.2s ease;
  margin-bottom: 24px;
}

.btn-back:hover {
  border-color: #2563eb;
  color: #2563eb;
}

.vl-search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  color: #94A3B8;
  pointer-events: none;
}

.vl-search-input {
  width: 100%;
  padding: 12px 16px 12px 42px;
  background: white;
  border: 1.5px solid #E2E8F0;
  border-radius: 12px;
  font-size: 14px;
  color: #0F172A;
  font-family: inherit;
  outline: none;
  transition: all 0.2s ease;
}

.vl-search-input::placeholder {
  color: #94A3B8;
}

.vl-search-input:focus {
  border-color: #6366F1;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.08);
}

/* ── Empty State ── */
.vl-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 80px 24px;
  text-align: center;
}

.vl-empty-icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: linear-gradient(135deg, #EEF2FF, #E0E7FF);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4F46E5;
}

.vl-empty-icon svg {
  width: 32px;
  height: 32px;
}

.vl-empty-title {
  font-size: 20px;
  font-weight: 700;
  color: #0F172A;
  margin: 0;
}

.vl-empty-desc {
  font-size: 14px;
  color: #64748B;
  margin: 0;
}

.vl-empty-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #4F46E5, #6366F1);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 14px rgba(79, 70, 229, 0.3);
}

.vl-empty-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(79, 70, 229, 0.4);
}

.vl-empty-btn-icon {
  width: 18px;
  height: 18px;
}

/* ── Sections ── */
.vl-sections {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.vl-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.vl-section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 700;
  color: #0F172A;
}

.vl-section-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.vl-section-dot--active {
  background: #22C55E;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.2);
  animation: pulse-dot 2s infinite;
}

.vl-section-dot--draft {
  background: #F59E0B;
}

.vl-section-dot--ended {
  background: #94A3B8;
}

.vl-section-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  border-radius: 999px;
  background: #F1F5F9;
  color: #64748B;
  font-size: 12px;
  font-weight: 600;
}

@keyframes pulse-dot {
  0%,
  100% {
    box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.2);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(34, 197, 94, 0.1);
  }
}

/* ── Card Grid ── */
.vl-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

/* ── Card ── */
.vl-card {
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 16px;
  padding: 20px;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.vl-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
  transform: translateY(-2px);
}

.vl-card--active {
  border-color: #BBF7D0;
  background: linear-gradient(135deg, #FAFBFF, #F0FDF4);
}

.vl-card--draft {
  border-color: #FDE68A;
  background: linear-gradient(135deg, #FAFBFF, #FFFBEB);
}

.vl-card--ended {
  opacity: 0.8;
}

.vl-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.vl-card-badges {
  display: flex;
  align-items: center;
  gap: 6px;
}

.vl-type-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 6px;
  background: #F1F5F9;
  color: #475569;
  font-size: 11px;
  font-weight: 600;
}

.vl-type-icon {
  width: 12px;
  height: 12px;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  text-transform: capitalize;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.status-badge--active {
  background: #DCFCE7;
  color: #16A34A;
}

.status-badge--active .status-dot {
  background: #16A34A;
}

.status-badge--draft {
  background: #FEF3C7;
  color: #D97706;
}

.status-badge--draft .status-dot {
  background: #D97706;
}

.status-badge--ended {
  background: #F1F5F9;
  color: #64748B;
}

.status-badge--ended .status-dot {
  background: #64748B;
}

.vl-card-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.vl-card-meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #94A3B8;
}

.vl-meta-icon {
  width: 12px;
  height: 12px;
}

.vl-card-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.vl-card-title {
  font-size: 16px;
  font-weight: 700;
  color: #0F172A;
  margin: 0;
  line-height: 1.3;
}

.vl-card-question {
  font-size: 13px;
  color: #64748B;
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.vl-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid #F1F5F9;
}

.vl-card-footer-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.vl-card-date {
  font-size: 12px;
  color: #94A3B8;
}

.vl-card-votes {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  color: #6366F1;
  background: #EEF2FF;
  padding: 2px 10px;
  border-radius: 999px;
  white-space: nowrap;
}

.vl-card-votes-icon {
  width: 12px;
  height: 12px;
}

.vl-card-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.vl-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  transition: all 0.15s ease;
}

.vl-action-btn svg {
  width: 16px;
  height: 16px;
}

.vl-action-btn--results {
  color: #8B5CF6;
}

.vl-action-btn--results:hover {
  background: #F5F3FF;
  color: #7C3AED;
}

.vl-action-btn--end {
  color: #22C55E;
}

.vl-action-btn--end:hover {
  background: #F0FDF4;
  color: #16A34A;
}

.vl-action-btn--share {
  color: #6366F1;
}

.vl-action-btn--share:hover {
  background: #EEF2FF;
  color: #4F46E5;
}

.vl-action-btn--activate {
  color: #22C55E;
}

.vl-action-btn--activate:hover {
  background: #F0FDF4;
  color: #16A34A;
}

.vl-action-btn--edit {
  color: #6366F1;
}

.vl-action-btn--edit:hover {
  background: #EEF2FF;
  color: #4F46E5;
}

.vl-action-btn--delete {
  color: #FCA5A5;
}

.vl-action-btn--delete:hover {
  background: #FEF2F2;
  color: #EF4444;
}

/* ── Share Modal ── */
.vl-share-overlay {
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

.vl-share-modal {
  background: white;
  border-radius: 20px;
  padding: 32px;
  max-width: 460px;
  width: 100%;
  text-align: center;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.15);
}

.vl-share-header {
  margin-bottom: 20px;
}

.vl-share-icon-wrap {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #EEF2FF, #E0E7FF);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  color: #4F46E5;
}

.vl-share-icon-wrap svg {
  width: 26px;
  height: 26px;
}

.vl-share-title {
  font-size: 20px;
  font-weight: 700;
  color: #0F172A;
  margin: 0 0 8px;
}

.vl-share-desc {
  font-size: 14px;
  color: #64748B;
  margin: 0;
  line-height: 1.5;
}

.vl-share-desc strong {
  color: #0F172A;
}

.vl-share-url-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px;
  background: #F1F5F9;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  margin-bottom: 16px;
}

.vl-share-url-text {
  flex: 1;
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 600;
  color: #4F46E5;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.vl-share-copy-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border: none;
  border-radius: 9px;
  background: #6366F1;
  color: white;
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  flex-shrink: 0;
}

.vl-share-copy-btn svg {
  width: 16px;
  height: 16px;
}

.vl-share-copy-btn:hover {
  background: #4F46E5;
}

.vl-share-copy-btn--copied {
  background: #22C55E;
}

.vl-share-copy-btn--copied:hover {
  background: #16A34A;
}

.vl-share-info {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 10px;
  background: #FFFBEB;
  color: #92400E;
  font-size: 12px;
  line-height: 1.5;
  text-align: left;
  margin-bottom: 20px;
  border: 1px solid #FDE68A;
}

.vl-share-info-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  margin-top: 2px;
  color: #F59E0B;
}

.vl-share-close-btn {
  padding: 10px 32px;
  border: 1px solid #E2E8F0;
  border-radius: 10px;
  background: white;
  color: #64748B;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ease;
}

.vl-share-close-btn:hover {
  background: #F8FAFC;
  color: #475569;
  border-color: #CBD5E1;
}

.share-fade-enter-active { transition: all 0.2s ease-out; }
.share-fade-leave-active { transition: all 0.15s ease-in; }
.share-fade-enter-from,
.share-fade-leave-to { opacity: 0; }
.share-fade-enter-from .vl-share-modal,
.share-fade-leave-to .vl-share-modal { transform: scale(0.95); }

/* ── No Results ── */
.vl-no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 60px 24px;
  color: #94A3B8;
  font-size: 14px;
}

.vl-no-results-icon {
  width: 40px;
  height: 40px;
}

/* ── Responsive ── */
/* ── Results Modal ── */
.vl-results-overlay {
  z-index: 3000 !important;
}

.vl-results-modal {
  background: white;
  border-radius: 20px;
  max-width: 560px;
  width: 100%;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.15);
  animation: vl-results-in 0.25s ease-out;
}

@keyframes vl-results-in {
  from { opacity: 0; transform: scale(0.95) translateY(8px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.vl-results-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 24px 28px 0;
}

.vl-results-header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.vl-results-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, #F5F3FF, #EDE9FE);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #7C3AED;
  flex-shrink: 0;
}

.vl-results-icon-wrap svg {
  width: 22px;
  height: 22px;
}

.vl-results-title {
  font-size: 18px;
  font-weight: 700;
  color: #0F172A;
  margin: 0;
}

.vl-results-subtitle {
  font-size: 13px;
  color: #64748B;
  margin: 2px 0 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.vl-results-live-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 1px 8px;
  border-radius: 999px;
  background: #DCFCE7;
  color: #16A34A;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.vl-results-live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #16A34A;
  animation: vl-pulse-dot 1.5s infinite;
}

@keyframes vl-pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.8); }
}

.vl-results-close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #94A3B8;
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.vl-results-close-btn svg {
  width: 18px;
  height: 18px;
}

.vl-results-close-btn:hover {
  background: #F1F5F9;
  color: #475569;
}

.vl-results-question {
  padding: 16px 28px 0;
  font-size: 16px;
  font-weight: 600;
  color: #0F172A;
  line-height: 1.4;
}

.vl-results-stats {
  display: flex;
  gap: 12px;
  padding: 16px 28px 0;
}

.vl-results-stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 12px 8px;
  background: #F8FAFC;
  border-radius: 12px;
  border: 1px solid #F1F5F9;
}

.vl-results-stat-value {
  font-size: 22px;
  font-weight: 800;
  color: #0F172A;
  line-height: 1.2;
}

.vl-results-stat-label {
  font-size: 11px;
  font-weight: 600;
  color: #94A3B8;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.text-green-600 {
  color: #16A34A !important;
}

.text-gray-600 {
  color: #475569 !important;
}

.vl-results-bars {
  padding: 20px 28px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.vl-results-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 32px 16px;
  text-align: center;
  color: #94A3B8;
  font-size: 14px;
}

.vl-results-empty-icon {
  width: 40px;
  height: 40px;
  color: #CBD5E1;
}

.vl-results-bar-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.vl-results-bar-row--winner .vl-results-bar-option {
  font-weight: 700;
  color: #0F172A;
}

.vl-results-bar-row--winner .vl-results-bar-track {
  background: #FEF3C7;
}

.vl-results-bar-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  gap: 12px;
}

.vl-results-bar-option {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #1E293B;
  font-weight: 500;
  min-width: 0;
  word-break: break-word;
}

.vl-results-crown {
  font-size: 16px;
  animation: vl-bounce 1s ease-in-out infinite;
}

@keyframes vl-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

.vl-results-bar-stats {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #64748B;
  white-space: nowrap;
  flex-shrink: 0;
}

.vl-results-bar-stats strong {
  font-size: 15px;
  color: #0F172A;
}

.vl-results-bar-pct {
  font-size: 12px;
  color: #94A3B8;
}

.vl-results-bar-track {
  height: 28px;
  background: #F1F5F9;
  border-radius: 8px;
  overflow: hidden;
}

.vl-results-bar-fill {
  height: 100%;
  border-radius: 8px;
  transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  min-width: 4px;
}

.vl-results-footer {
  padding: 16px 28px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.vl-results-auto-refresh {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #94A3B8;
}

.vl-results-pulse-loader {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #22C55E;
  animation: vl-pulse-dot 1.5s infinite;
}

.vl-results-close-btn-text {
  padding: 8px 20px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  background: white;
  color: #64748B;
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s ease;
}

.vl-results-close-btn-text:hover {
  background: #F8FAFC;
  color: #475569;
  border-color: #CBD5E1;
}

@media (max-width: 768px) {
  .vl-page {
    padding: 80px 16px 40px;
  }
  .vl-header {
    flex-direction: column;
  }
  .vl-title {
    font-size: 24px;
  }
  .vl-grid {
    grid-template-columns: 1fr;
  }
  .vl-search-bar {
    max-width: 100%;
  }
}
</style>
