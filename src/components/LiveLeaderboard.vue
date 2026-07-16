<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { fetchLeaderboard, type LeaderboardEntry } from '@/services/game'
import { subscribeToGameSession, type ScoreUpdatedPayload } from '@/services/websocket'

const props = defineProps<{
  gameSessionId: number | null
  currentPlayerName?: string
}>()

const entries = ref<LeaderboardEntry[]>([])
const isLoading = ref(true)
const errorMessage = ref('')
let unsubscribeScoreUpdates: (() => void) | null = null
let pollTimer: ReturnType<typeof setInterval> | null = null

const topThree = computed(() => entries.value.slice(0, 3))
const rest = computed(() => entries.value.slice(3))

function getRankBadge(index: number): string {
  if (index === 0) return '🥇'
  if (index === 1) return '🥈'
  if (index === 2) return '🥉'
  return `#${index + 1}`
}

async function loadLeaderboard() {
  if (!props.gameSessionId) return

  try {
    const data = await fetchLeaderboard(props.gameSessionId)
    entries.value = data.leaderboard
    errorMessage.value = ''
  } catch {
    errorMessage.value = 'Failed to load leaderboard'
  } finally {
    isLoading.value = false
  }
}

function handleScoreUpdate(payload: ScoreUpdatedPayload) {
  if (payload.gameSessionId !== props.gameSessionId) return

  const existingIndex = entries.value.findIndex(
    (entry) => entry.participantName === payload.participantName,
  )

  if (existingIndex >= 0) {
    entries.value[existingIndex] = {
      participantName: payload.participantName,
      score: payload.score,
    }
  } else if (payload.score > 0 || payload.pointsAwarded > 0) {
    entries.value.push({
      participantName: payload.participantName,
      score: payload.score,
    })
  }

  entries.value = [...entries.value].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return a.participantName.localeCompare(b.participantName)
  })
}

async function subscribeToUpdates() {
  if (!props.gameSessionId) return

  try {
    unsubscribeScoreUpdates = await subscribeToGameSession(
      props.gameSessionId,
      handleScoreUpdate,
    )
  } catch {
    // WebSocket unavailable; fall back to polling
  }

  pollTimer = setInterval(() => {
    loadLeaderboard()
  }, 5000)
}

onMounted(() => {
  loadLeaderboard()
  subscribeToUpdates()
})

onUnmounted(() => {
  if (unsubscribeScoreUpdates) {
    unsubscribeScoreUpdates()
    unsubscribeScoreUpdates = null
  }
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
})
</script>

<template>
  <div class="live-leaderboard">
    <div class="live-leaderboard-header">
      <h3 class="live-leaderboard-title">🏆 Live Leaderboard</h3>
      <span class="live-leaderboard-badge">LIVE</span>
    </div>

    <div v-if="isLoading" class="live-leaderboard-loading">
      <div class="live-leaderboard-spinner"></div>
      <p class="live-leaderboard-loading-text">Loading standings…</p>
    </div>

    <div v-else-if="errorMessage" class="live-leaderboard-error">
      {{ errorMessage }}
      <button class="live-leaderboard-retry" type="button" @click="loadLeaderboard">
        Retry
      </button>
    </div>

    <div v-else-if="entries.length === 0" class="live-leaderboard-empty">
      <p class="live-leaderboard-empty-text">No scores yet. Be the first to answer!</p>
    </div>

    <div v-else class="live-leaderboard-body">
      <div class="live-leaderboard-podium">
        <div
          v-for="(entry, idx) in topThree"
          :key="entry.participantName"
          class="live-leaderboard-podium-item"
          :class="`live-leaderboard-podium-item--${idx + 1}`"
        >
          <span class="live-leaderboard-podium-rank">{{ getRankBadge(idx) }}</span>
          <span class="live-leaderboard-podium-name" :title="entry.participantName">
            {{ entry.participantName }}
          </span>
          <span class="live-leaderboard-podium-score">{{ entry.score }} pts</span>
        </div>
      </div>

      <div class="live-leaderboard-list">
        <div
          v-for="(entry, idx) in rest"
          :key="entry.participantName"
          class="live-leaderboard-row"
          :class="{ 'live-leaderboard-row--current': entry.participantName === currentPlayerName }"
        >
          <span class="live-leaderboard-row-rank">#{{ idx + 4 }}</span>
          <span class="live-leaderboard-row-name" :title="entry.participantName">
            {{ entry.participantName }}
          </span>
          <span class="live-leaderboard-row-score">{{ entry.score }} pts</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.live-leaderboard {
  background: #ffffff;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.07);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.live-leaderboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: linear-gradient(to bottom, #f8fafc, #ffffff);
  border-bottom: 1px solid #f1f5f9;
}

.live-leaderboard-title {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  color: #0f172a;
}

.live-leaderboard-badge {
  font-size: 10px;
  font-weight: 800;
  color: #fff;
  background: linear-gradient(135deg, #ef4444 0%, #f97316 100%);
  padding: 3px 10px;
  border-radius: 999px;
  letter-spacing: 0.12em;
  animation: live-pulse 2s ease-in-out infinite;
}

.live-leaderboard-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  gap: 14px;
}

.live-leaderboard-spinner {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 3px solid #e2e8f0;
  border-top-color: #6366f1;
  animation: spin 0.8s linear infinite;
}

.live-leaderboard-loading-text {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
}

.live-leaderboard-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 28px 20px;
  font-size: 13px;
  font-weight: 600;
  color: #dc2626;
  text-align: center;
}

.live-leaderboard-retry {
  padding: 8px 18px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
}

.live-leaderboard-empty {
  padding: 32px 20px;
  text-align: center;
}

.live-leaderboard-empty-text {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: #94a3b8;
}

.live-leaderboard-body {
  display: flex;
  flex-direction: column;
}

.live-leaderboard-podium {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 16px;
  background: linear-gradient(to bottom, #faf5ff, #ffffff);
  border-bottom: 1px solid #f1f5f9;
}

.live-leaderboard-podium-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid transparent;
  transition: background 0.2s;
}

.live-leaderboard-podium-item--1 {
  background: linear-gradient(to right, #fef9c3, #fefce8);
  border-color: #fde047;
}

.live-leaderboard-podium-item--2 {
  background: linear-gradient(to right, #f1f5f9, #f8fafc);
  border-color: #cbd5e1;
}

.live-leaderboard-podium-item--3 {
  background: linear-gradient(to right, #fff7ed, #fef3c7);
  border-color: #fcd34d;
}

.live-leaderboard-podium-rank {
  font-size: 20px;
  width: 28px;
  text-align: center;
  flex-shrink: 0;
}

.live-leaderboard-podium-name {
  flex: 1;
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.live-leaderboard-podium-score {
  font-size: 14px;
  font-weight: 800;
  color: #6366f1;
  white-space: nowrap;
}

.live-leaderboard-list {
  display: flex;
  flex-direction: column;
}

.live-leaderboard-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  border-bottom: 1px solid #f1f5f9;
  transition: background 0.15s;
}

.live-leaderboard-row:last-child {
  border-bottom: none;
}

.live-leaderboard-row:hover {
  background: #f8fafc;
}

.live-leaderboard-row--current {
  background: #eef2ff;
}

.live-leaderboard-row--current .live-leaderboard-row-name {
  color: #6366f1;
}

.live-leaderboard-row-rank {
  width: 28px;
  font-size: 12px;
  font-weight: 800;
  color: #94a3b8;
  flex-shrink: 0;
  text-align: center;
}

.live-leaderboard-row-name {
  flex: 1;
  font-size: 13px;
  font-weight: 600;
  color: #334155;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.live-leaderboard-row-score {
  font-size: 13px;
  font-weight: 700;
  color: #6366f1;
  white-space: nowrap;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes live-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.75; transform: scale(0.95); }
}
</style>
