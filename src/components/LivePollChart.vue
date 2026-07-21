<script setup lang="ts">
import { computed } from 'vue'

export interface LivePollResult {
  id: number
  option: string
  votes: number
  percentage: number
}

const props = defineProps<{
  results: LivePollResult[]
  totalVotes: number
  status: string
  animate?: boolean
}>()

const maxPercentage = computed(() => {
  const vals = props.results.map(r => r.percentage)
  return vals.length > 0 ? Math.max(...vals) : 0
})

const winnerIds = computed(() => {
  if (props.totalVotes === 0) return new Set<number>()
  const max = maxPercentage.value
  return new Set(props.results.filter(r => r.percentage === max).map(r => r.id))
})
</script>

<template>
  <div class="live-poll-chart">
    <div class="lpc-header">
      <span class="lpc-total">{{ totalVotes }} vote{{ totalVotes !== 1 ? 's' : '' }}</span>
      <span v-if="status === 'active'" class="lpc-badge lpc-badge-live">Live</span>
      <span v-else class="lpc-badge lpc-badge-ended">Closed</span>
    </div>

    <div class="lpc-bars">
      <div
        v-for="result in results"
        :key="result.id"
        class="lpc-bar-row"
      >
        <div class="lpc-bar-label">
          <span class="lpc-bar-option">{{ result.option }}</span>
          <span class="lpc-bar-stats">
            {{ result.votes }}
            <span class="lpc-bar-pct">({{ result.percentage }}%)</span>
          </span>
        </div>
        <div class="lpc-bar-track">
          <div
            class="lpc-bar-fill"
            :class="{ 'lpc-bar-winner': winnerIds.has(result.id) && result.percentage > 0 }"
            :style="{ width: (animate ? result.percentage : 0) + '%' }"
          ></div>
        </div>
      </div>
    </div>

    <div v-if="results.length === 0" class="lpc-empty">
      No results yet.
    </div>
  </div>
</template>

<style scoped>
.live-poll-chart {
  width: 100%;
}

.lpc-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.lpc-total {
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
}

.lpc-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.lpc-badge-live {
  background: #dcfce7;
  color: #16a34a;
}

.lpc-badge-live::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #16a34a;
  margin-right: 6px;
  animation: lpc-pulse 1.5s infinite;
}

.lpc-badge-ended {
  background: #f1f5f9;
  color: #64748b;
}

.lpc-bars {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.lpc-bar-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.lpc-bar-label {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.lpc-bar-option {
  font-weight: 500;
  color: #1e293b;
}

.lpc-bar-stats {
  color: #94a3b8;
  font-weight: 600;
}

.lpc-bar-pct {
  color: #94a3b8;
  font-weight: 400;
}

.lpc-bar-track {
  height: 28px;
  background: #f1f5f9;
  border-radius: 6px;
  overflow: hidden;
}

.lpc-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #2563eb, #3b82f6);
  border-radius: 6px;
  transition: width 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  min-width: 4px;
}

.lpc-bar-fill.lpc-bar-winner {
  background: linear-gradient(90deg, #16a34a, #22c55e);
}

.lpc-empty {
  text-align: center;
  padding: 40px 20px;
  color: #94a3b8;
  font-size: 14px;
}

@keyframes lpc-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
</style>
