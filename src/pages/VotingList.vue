<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getPolls, deletePoll, updatePoll, type LivePoll } from '@/utils/pollStorage'
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
                <div class="vl-card-date">{{ formatDate(poll.createdAt) }}</div>
                <div v-if="isTeacher" class="vl-card-actions">
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
                <div class="vl-card-date">{{ formatDate(poll.createdAt) }}</div>
                <div v-if="isTeacher" class="vl-card-actions">
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

.vl-card-date {
  font-size: 12px;
  color: #94A3B8;
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
