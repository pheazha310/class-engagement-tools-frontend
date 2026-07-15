<script setup lang="ts">
import { computed } from 'vue'
import type { PollResultsData } from '@/stores/poll'

const props = defineProps<{
  results: PollResultsData | null
}>()

const winner = computed(() => {
  if (!props.results?.results?.length) return null
  return [...props.results.results].sort((a, b) => b.votes - a.votes)[0]
})

const isTied = computed(() => {
  if (!props.results?.results?.length || !winner.value) return false
  return props.results.results.filter((r) => r.votes === winner.value!.votes).length > 1
})
</script>

<template>
  <div
    v-if="winner"
    class="lv-winner"
    role="region"
    aria-label="Leading option"
  >
    <div class="lv-winner-body">
      <!-- Trophy icon -->
      <div class="lv-winner-trophy">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M6 9H4.5a2.5 2.5 0 010-5H6" />
          <path d="M18 9h1.5a2.5 2.5 0 000-5H18" />
          <path d="M4 22h16" />
          <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
          <path d="M18 2H6v7a6 6 0 0012 0V2Z" />
        </svg>
      </div>

      <div class="lv-winner-info">
        <p class="lv-winner-label">
          {{ isTied ? 'Tied Leader' : 'Leading' }}
        </p>
        <p class="lv-winner-name lv-truncate">
          {{ winner.option }}
        </p>
        <p class="lv-winner-stats">
          <strong>{{ winner.votes }}</strong> vote{{ winner.votes === 1 ? '' : 's' }}
          ·
          <strong>{{ winner.percentage }}%</strong>
        </p>
      </div>

      <!-- Percentage badge -->
      <div class="lv-winner-pct">
        {{ winner.percentage }}%
      </div>
    </div>
  </div>
</template>
