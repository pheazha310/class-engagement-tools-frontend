<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { usePollStore } from '@/stores/pollStore'
import { pollService } from '@/services/pollService'
import type { Poll } from '@/types/poll'
import '@/assets/css/vote-module.css'

import AlertMessage from '@/components/vote/AlertMessage.vue'

const pollStore = usePollStore()

// ── State ──
const pollInfo = ref<Poll | null>(null)
const lastUpdated = ref<Date>(new Date())
const localError = ref<string | null>(null)
const isPolling = ref(false)
const showLoading = ref(true)
let pollTimer: ReturnType<typeof setInterval> | null = null
let pageVisibilityHandler: (() => void) | null = null

// ── Computed ──
const results = computed(() => pollStore.results)
const loading = computed(() => pollStore.loading)
const hasResults = computed(() => results.value && results.value.results && results.value.results.length > 0)

const maxVotes = computed(() => {
  if (!hasResults.value) return 0
  return Math.max(...results.value!.results.map((r: any) => r.votes))
})

const maxPercentage = computed(() => {
  if (!hasResults.value) return 0
  return Math.max(...results.value!.results.map((r: any) => r.percentage ?? 0))
})

const leadingOptions = computed(() => {
  if (!hasResults.value || maxVotes.value === 0) return []
  return results.value!.results.filter((r: any) => r.votes === maxVotes.value).map((r: any) => r.option)
})

const sortedResults = computed(() => {
  if (!hasResults.value) return []
  return [...results.value!.results].sort((a: any, b: any) => b.votes - a.votes)
})

const lastUpdatedText = computed(() => {
  const d = lastUpdated.value
  const now = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
  if (diff < 5) return 'Just now'
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return d.toLocaleTimeString()
})

const isQuiz = computed(() => pollStore.results?.is_quiz ?? false)
const isAnonymous = computed(() => pollStore.results?.is_anonymous ?? false)

// ── Methods ──
async function fetchResults(showLoader = false) {
  if (!pollStore.currentPoll && !pollStore.activePoll) {
    // Try to find active poll
    try {
      const response = await pollService.getActivePoll()
      if (response?.poll) {
        pollInfo.value = response.poll
        pollStore.currentPoll = response.poll
      } else {
        localError.value = 'No active poll found.'
        showLoading.value = false
        return
      }
    } catch (err: any) {
      if (err?.response?.status === 404) {
        localError.value = 'No active poll found.'
      } else {
        localError.value = 'Failed to load poll results.'
      }
      showLoading.value = false
      return
    }
  }

  const pollId = pollStore.currentPoll?.id || pollStore.activePoll?.id
  if (!pollId) {
    localError.value = 'No poll ID available.'
    showLoading.value = false
    return
  }

  if (!pollInfo.value && pollStore.currentPoll) {
    pollInfo.value = pollStore.currentPoll
  }

  try {
    await pollStore.fetchResults(pollId)
    lastUpdated.value = new Date()
    localError.value = null
  } catch {
    if (!hasResults.value) {
      localError.value = 'Failed to load results.'
    }
  } finally {
    showLoading.value = false
  }
}

function startAutoRefresh() {
  // Refresh every 4 seconds
  pollTimer = setInterval(() => {
    isPolling.value = true
    const pollId = pollStore.currentPoll?.id || pollStore.activePoll?.id
    if (pollId) {
      pollStore.fetchResults(pollId).finally(() => {
        lastUpdated.value = new Date()
        isPolling.value = false
      })
    }
  }, 4000)
}

function stopAutoRefresh() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

function retryFetch() {
  localError.value = null
  showLoading.value = true
  fetchResults(true)
}

// ── Lifecycle ──
onMounted(async () => {
  await fetchResults(true)
  startAutoRefresh()
})

onUnmounted(() => {
  stopAutoRefresh()
  pollStore.clearError()
})
</script>

<template>
  <div class="vm-page">
    <!-- Background -->
    <div class="vm-bg-orb vm-bg-orb--1" aria-hidden="true" />
    <div class="vm-bg-orb vm-bg-orb--2" aria-hidden="true" />
    <div class="vm-bg-grid" aria-hidden="true" />

    <div class="vm-container vm-container--wide">
      <!-- Loading Skeleton -->
      <div v-if="showLoading" class="vm-skeleton-card">
        <div class="vm-skeleton vm-skeleton-line vm-skeleton-line--short" />
        <div class="vm-skeleton vm-skeleton-line vm-skeleton-line--long" style="margin-bottom:20px;" />
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px;">
          <div class="vm-skeleton" style="height:88px;border-radius:12px;" />
          <div class="vm-skeleton" style="height:88px;border-radius:12px;" />
          <div class="vm-skeleton" style="height:88px;border-radius:12px;" />
        </div>
        <div class="vm-skeleton vm-skeleton-block" />
        <div class="vm-skeleton vm-skeleton-block" />
        <div class="vm-skeleton vm-skeleton-block" />
      </div>

      <!-- Error State -->
      <div v-else-if="localError && !hasResults" class="vm-card vm-card--padding" style="text-align:center;">
        <AlertMessage
          type="error"
          title="Error Loading Results"
          :message="localError"
          retry-label="Try Again"
          @retry="retryFetch"
        />
      </div>

      <!-- Results Dashboard -->
      <template v-else-if="hasResults || pollInfo">
        <!-- Header -->
        <div class="vm-results-header">
          <h1 class="vm-results-title">{{ results?.question || pollInfo?.question || 'Live Results' }}</h1>
          <p v-if="results?.question || pollInfo?.question" class="vm-results-question">
            {{ results?.question || pollInfo?.question }}
          </p>

          <!-- Stats Row -->
          <div class="vm-stats-row">
            <div class="vm-stat-card">
              <svg class="vm-stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87" />
                <path d="M16 3.13a4 4 0 010 7.75" />
              </svg>
              <div class="vm-stat-value">{{ results?.totalVotes ?? pollInfo?.total_votes ?? 0 }}</div>
              <div class="vm-stat-label">Total Votes</div>
            </div>
            <div class="vm-stat-card">
              <svg class="vm-stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
              <div class="vm-stat-value">{{ pollInfo?.participant_count ?? results?.totalVotes ?? 0 }}</div>
              <div class="vm-stat-label">Participants</div>
            </div>
            <div class="vm-stat-card">
              <svg class="vm-stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <div class="vm-stat-value">{{ results?.results?.length ?? 0 }}</div>
              <div class="vm-stat-label">Options</div>
            </div>
          </div>

          <!-- Last Updated -->
          <div class="vm-last-updated">
            <span v-if="isPolling" class="vm-last-updated-dot" />
            <span v-else class="vm-last-updated-dot" style="background:var(--vm-slate-300);animation:none;" />
            Last updated: {{ lastUpdatedText }}
            <span v-if="isPolling" style="color:var(--vm-emerald-500);font-weight:500;margin-left:4px;">Live</span>
          </div>
        </div>

        <!-- Winner Banner (when there are votes) -->
        <div v-if="maxVotes > 0 && leadingOptions.length > 0" class="vm-winner-banner">
          <div class="vm-winner-trophy">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 9H4.5a2.5 2.5 0 010-5H6" />
              <path d="M18 9h1.5a2.5 2.5 0 000-5H18" />
              <path d="M4 22h16" />
              <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
              <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
              <path d="M18 2H6v7a6 6 0 0012 0V2Z" />
            </svg>
          </div>
          <div class="vm-winner-info">
            <div class="vm-winner-label">
              {{ leadingOptions.length > 1 ? 'Tied Leader' : 'Leading Option' }}
            </div>
            <div class="vm-winner-name">{{ leadingOptions.length > 1 ? leadingOptions.join(', ') : leadingOptions[0] }}</div>
            <div class="vm-winner-stats">
              <strong>{{ maxVotes }}</strong> vote{{ maxVotes !== 1 ? 's' : '' }}
              ·
              <template v-if="maxPercentage > 0">
                <strong>{{ maxPercentage }}%</strong> of total
              </template>
            </div>
          </div>
        </div>

        <!-- Results Bars -->
        <div v-if="hasResults" class="vm-result-bar-section">
          <h3 class="vm-result-bar-section-title">Vote Breakdown</h3>
          <div class="vm-result-list">
            <div
              v-for="(result, index) in sortedResults"
              :key="result.id"
              class="vm-result-item"
              :class="{ 'vm-result-item--leading': result.votes === maxVotes && maxVotes > 0 }"
            >
              <div class="vm-result-top">
                <div class="vm-result-option-group">
                  <span
                    class="vm-result-rank"
                    :class="
                      index === 0
                        ? 'vm-result-rank--1'
                        : index === 1
                          ? 'vm-result-rank--2'
                          : index === 2
                            ? 'vm-result-rank--3'
                            : 'vm-result-rank--other'
                    "
                  >
                    {{ index + 1 }}
                  </span>
                  <span class="vm-result-option-name">{{ result.option || result.option_text }}</span>
                </div>
                <div class="vm-result-stats">
                  <span class="vm-result-votes">{{ result.votes }}</span>
                  <span class="vm-result-pct">{{ result.percentage ?? 0 }}%</span>
                </div>
              </div>
              <div class="vm-result-bar-track">
                <div
                  class="vm-result-bar-fill"
                  :style="{ width: `${maxPercentage > 0 ? (result.percentage / maxPercentage) * 100 : 0}%` }"
                  :aria-valuenow="result.percentage"
                  aria-valuemin="0"
                  aria-valuemax="100"
                  role="progressbar"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Empty Results -->
        <div v-else class="vm-card vm-card--padding">
          <div class="vm-empty">
            <div class="vm-empty-icon-wrap">
              <svg class="vm-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
            </div>
            <h2 class="vm-empty-title">No Votes Yet</h2>
            <p class="vm-empty-text">
              Votes will appear here as participants submit their responses. The page updates automatically every few seconds.
            </p>
          </div>
        </div>
      </template>

      <!-- Fallback empty -->
      <div v-else class="vm-card vm-card--padding" style="text-align:center;">
        <div class="vm-empty">
          <div class="vm-empty-icon-wrap">
            <svg class="vm-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="9" y1="21" x2="9" y2="9" />
            </svg>
          </div>
          <h2 class="vm-empty-title">No Results Available</h2>
          <p class="vm-empty-text">
            There are no poll results to display at this time.
          </p>
        </div>
      </div>
    </div>

    <!-- Toast notification for auto-refresh errors -->
    <div v-if="localError && hasResults" class="vm-toast-container">
      <div class="vm-toast vm-toast--error">
        <svg class="vm-toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4" />
          <path d="M12 16h.01" />
        </svg>
        <span>Failed to refresh results. Retrying...</span>
      </div>
    </div>
  </div>
</template>
