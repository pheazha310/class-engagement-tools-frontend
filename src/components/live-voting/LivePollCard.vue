<script setup lang="ts">
import { computed } from 'vue'
import BaseCard from './BaseCard.vue'
import BaseBadge from './BaseBadge.vue'
import CountdownBadge from './CountdownBadge.vue'
import type { Poll, PollResultsData } from '@/stores/poll'

const props = defineProps<{
  poll: Poll
  results: PollResultsData | null
}>()

const completionPercent = computed(() => {
  if (!props.results || !props.poll.participant_count) return 0
  return Math.min(100, Math.round((props.results.totalVotes / props.poll.participant_count) * 100))
})

const statusLabel = computed(() => {
  if (props.poll.status === 'active') return 'Active'
  if (props.poll.status === 'ended') return 'Ended'
  return 'Draft'
})

const statusVariant = computed<'live' | 'neutral' | 'danger'>(() => {
  if (props.poll.status === 'active') return 'live'
  if (props.poll.status === 'ended') return 'danger'
  return 'neutral'
})

const statCards = computed(() => [
  {
    label: 'Participants',
    value: props.poll.participant_count ?? 0,
    icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
    cardClass: 'lv-stat-card--blue',
    iconClass: 'lv-stat-icon--blue',
    labelClass: 'lv-stat-label--blue',
  },
  {
    label: 'Total Votes',
    value: props.results?.totalVotes ?? 0,
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    cardClass: 'lv-stat-card--violet',
    iconClass: 'lv-stat-icon--violet',
    labelClass: 'lv-stat-label--violet',
  },
  {
    label: 'Options',
    value: props.poll.options.length,
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
    cardClass: 'lv-stat-card--orange',
    iconClass: 'lv-stat-icon--orange',
    labelClass: 'lv-stat-label--orange',
  },
  {
    label: 'Completion',
    value: `${completionPercent.value}%`,
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
    cardClass: 'lv-stat-card--emerald',
    iconClass: 'lv-stat-icon--emerald',
    labelClass: 'lv-stat-label--emerald',
  },
])
</script>

<template>
  <BaseCard padding="lg" class="lv-poll-card">
    <!-- Background accent bar -->
    <div
      class="lv-poll-accent"
      aria-hidden="true"
    />

    <div class="lv-poll-body">
      <!-- Top row: title + badges -->
      <div class="lv-poll-header">
        <div class="lv-poll-question">
          <h2>{{ poll.question }}</h2>
        </div>
        <div class="lv-poll-badges">
          <BaseBadge :variant="statusVariant" dot>{{ statusLabel }}</BaseBadge>
          <CountdownBadge
            :started-at="poll.started_at"
            :duration-minutes="poll.duration_minutes"
          />
        </div>
      </div>

      <!-- Stats grid -->
      <div class="lv-stats-grid">
        <div
          v-for="stat in statCards"
          :key="stat.label"
          class="lv-stat-card"
          :class="stat.cardClass"
        >
          <svg
            class="lv-stat-icon"
            :class="stat.iconClass"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path :d="stat.icon" />
          </svg>
          <div>
            <p
              class="lv-stat-label"
              :class="stat.labelClass"
            >
              {{ stat.label }}
            </p>
            <p class="lv-stat-value">
              {{ stat.value }}
            </p>
          </div>
        </div>
      </div>

      <!-- Progress bar -->
      <div class="lv-progress" role="progressbar" :aria-valuenow="completionPercent" aria-valuemin="0" aria-valuemax="100">
        <div
          class="lv-progress-bar"
          :style="{ width: `${completionPercent}%` }"
        />
      </div>

      <!-- Room code if available -->
      <div v-if="poll.room_code" class="lv-room-code">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
        <span class="lv-room-code-label">Room Code</span>
        <code class="lv-room-code-value">
          {{ poll.room_code }}
        </code>
      </div>
    </div>
  </BaseCard>
</template>
