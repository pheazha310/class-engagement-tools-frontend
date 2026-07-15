<script setup lang="ts">
import { useRouter } from 'vue-router'
import BaseBadge from './BaseBadge.vue'
import BaseButton from './BaseButton.vue'
import CountdownBadge from './CountdownBadge.vue'
import ParticipantCounter from './ParticipantCounter.vue'
import type { Poll } from '@/stores/poll'

const props = defineProps<{
  poll: Poll | null
  participantCount: number
  totalVotes: number
}>()

defineEmits<{
  joinPoll: []
}>()

const router = useRouter()

const handleCreatePoll = () => {
  router.push('/teacher/polls/create')
}
</script>

<template>
  <section
    class="lv-hero"
    role="region"
    aria-label="Live voting banner"
  >
    <!-- Subtle decorative gradient -->
    <div
      class="lv-hero-glow lv-hero-glow--1"
      aria-hidden="true"
    />
    <div
      class="lv-hero-glow lv-hero-glow--2"
      aria-hidden="true"
    />

    <div class="lv-hero-inner">
      <!-- Left: Copy -->
      <div class="lv-hero-content">
        <div class="lv-hero-badges">
          <BaseBadge variant="live" dot>Live Voting</BaseBadge>
          <CountdownBadge
            v-if="poll"
            :started-at="poll.started_at"
            :duration-minutes="poll.duration_minutes"
          />
        </div>

        <h1 class="lv-hero-title">
          Cast your vote instantly
        </h1>

        <p class="lv-hero-desc">
          Join the active poll, pick your answer, and watch results animate in real time.
          No account required.
        </p>

        <div class="lv-hero-meta">
          <ParticipantCounter :count="participantCount" label="participants" />
          <div class="lv-hero-divider" aria-hidden="true" />
          <span class="lv-hero-votes">
            <strong>{{ totalVotes }}</strong> votes cast
          </span>
        </div>

        <div class="lv-hero-actions">
          <BaseButton v-if="poll" size="lg" @click="$emit('joinPoll')">
            Join &amp; Vote
          </BaseButton>
          <BaseButton variant="secondary" size="lg" @click="handleCreatePoll">
            Create Poll
          </BaseButton>
        </div>
      </div>

      <!-- Right: Illustration -->
      <div
        class="lv-hero-illustration"
        aria-hidden="true"
      >
        <div class="lv-hero-graphic">
          <div class="lv-hero-graphic-ring" />
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
            <rect x="9" y="3" width="6" height="4" rx="1" />
            <path d="M9 14l2 2 4-4" />
          </svg>
          <!-- Floating dots animation -->
          <span class="lv-hero-dot-ping" />
          <span class="lv-hero-dot-static" />
        </div>
      </div>
    </div>
  </section>
</template>
