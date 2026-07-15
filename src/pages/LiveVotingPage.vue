<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { usePollStore } from '@/stores/poll'
import { listenToPoll } from '@/services/echo'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import ToastNotification from '@/components/ToastNotification.vue'
import type { VoteUpdatedPayload } from '@/types/poll'

// External CSS (no Tailwind utility classes)
import '@/assets/css/live-voting.css'

// Page-specific live voting components
import LiveHero from '@/components/live-voting/LiveHero.vue'
import LivePollCard from '@/components/live-voting/LivePollCard.vue'
import VotePanel from '@/components/live-voting/VotePanel.vue'
import ResultsPanel from '@/components/live-voting/ResultsPanel.vue'
import ActivityTimeline from '@/components/live-voting/ActivityTimeline.vue'

const pollStore = usePollStore()

const showResults = ref(false)
const toastMessage = ref<string | null>(null)
const toastType = ref<'success' | 'error'>('success')
const cleanup = ref<(() => void) | null>(null)

const currentPoll = computed(() => pollStore.currentPoll)
const participantCount = computed(() => currentPoll.value?.participant_count ?? 0)
const totalVotes = computed(() => pollStore.results?.totalVotes ?? 0)

// Simulated activity feed based on poll state
const activities = computed(() => {
  const items: Array<{
    id: string
    type: 'join' | 'vote' | 'start' | 'close' | 'create'
    message: string
    timestamp: Date | string
  }> = []

  if (!currentPoll.value) return items

  if (currentPoll.value.started_at) {
    items.push({
      id: 'start-1',
      type: 'start',
      message: 'Poll started',
      timestamp: currentPoll.value.started_at,
    })
  }

  if (pollStore.hasVoted) {
    items.push({
      id: 'vote-1',
      type: 'vote',
      message: 'Your vote was submitted',
      timestamp: new Date(),
    })
  }

  if (participantCount.value > 0) {
    const joinCount = Math.min(participantCount.value, 5)
    for (let i = 1; i <= joinCount; i++) {
      const joinDate = currentPoll.value.started_at
        ? new Date(new Date(currentPoll.value.started_at).getTime() - i * 2000)
        : new Date(Date.now() - i * 3000)
      items.push({
        id: `join-${i}`,
        type: 'join',
        message: i === 1 ? 'Someone joined the poll' : `${joinCount}+ participants joined`,
        timestamp: joinDate,
      })
    }
  }

  if (currentPoll.value.status === 'ended') {
    items.push({
      id: 'close-1',
      type: 'close',
      message: 'Poll has ended',
      timestamp: currentPoll.value.ended_at ?? new Date(),
    })
  }

  return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 8)
})

onMounted(async () => {
  try {
    await pollStore.fetchActivePoll()
    if (pollStore.hasVoted && currentPoll.value) {
      showResults.value = true
      await pollStore.fetchResults(currentPoll.value.id)
    }
  } catch {
    // No active poll or request failed
  }
})

async function handleVote(optionId: number | null, _points?: number, _textResponse?: string) {
  if (!currentPoll.value) return

  try {
    await pollStore.submitVote(optionId, _points, _textResponse)
    toastMessage.value = 'Vote submitted successfully!'
    toastType.value = 'success'
    showResults.value = true

    // Listen for real-time updates
    cleanup.value = listenToPoll(currentPoll.value.id, (payload: VoteUpdatedPayload) => {
      if (!pollStore.results) return
      pollStore.results.totalVotes = payload.totalVotes
      pollStore.results.results = payload.results
      if (payload.totalPoints !== undefined) pollStore.results.totalPoints = payload.totalPoints
      if (payload.has_weights !== undefined) pollStore.results.has_weights = payload.has_weights
    })
  } catch (error: any) {
    toastMessage.value = error.response?.data?.message || 'Failed to submit vote.'
    toastType.value = 'error'
    pollStore.hasVoted = false
  }
}

function handleJoinPoll() {
  // Scroll to the vote panel
  const voteSection = document.getElementById('vote-section')
  voteSection?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

onUnmounted(() => {
  cleanup.value?.()
  pollStore.reset()
})
</script>

<template>
  <div class="lv-page">
    <!-- Subtle background orbs -->
    <div class="lv-bg-orb lv-bg-orb--1" aria-hidden="true" />
    <div class="lv-bg-orb lv-bg-orb--2" aria-hidden="true" />
    <div class="lv-bg-grid" aria-hidden="true" />

    <div class="lv-container">
      <!-- Loading state -->
      <div v-if="pollStore.loading && !pollStore.currentPoll" class="lv-loading-state">
        <LoadingSpinner size="lg" />
      </div>

      <!-- Empty state -->
      <div
        v-else-if="!pollStore.currentPoll && !pollStore.loading"
        class="lv-empty-state"
      >
        <div class="lv-empty-icon">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
        </div>
        <h2 class="lv-empty-title">No Active Poll</h2>
        <p class="lv-empty-desc">
          There is no active poll available right now. Check back later or create a new one.
        </p>
      </div>

      <!-- Active poll content -->
      <template v-else-if="currentPoll">
        <div class="lv-space-y-8">
          <!-- Hero -->
          <LiveHero
            :poll="currentPoll"
            :participant-count="participantCount"
            :total-votes="totalVotes"
            @join-poll="handleJoinPoll"
          />

          <!-- Live Poll Card -->
          <LivePollCard
            :poll="currentPoll"
            :results="pollStore.results"
          />

          <!-- Two-column layout: Vote/Results + Activity -->
          <div class="lv-grid-2col">
            <!-- Left column: Voting or Results -->
            <div id="vote-section">
              <!-- Voting area (before voting) -->
              <VotePanel
                v-if="!showResults"
                :poll="currentPoll"
                :has-voted="pollStore.hasVoted"
                :loading="pollStore.loading"
                @vote="handleVote"
              />

              <!-- Results (after voting) -->
              <ResultsPanel
                v-else
                :results="pollStore.results"
              />
            </div>

            <!-- Right column: Activity timeline -->
            <div class="lv-space-y-6">
              <ActivityTimeline :activities="activities" />
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Toast notifications -->
    <ToastNotification
      :message="toastMessage"
      :type="toastType"
      @close="toastMessage = null"
    />
  </div>
</template>
