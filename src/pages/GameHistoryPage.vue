<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import Navbar from '@/components/Navbar.vue'
import { fetchGameHistories, fetchGameHistoryById } from '@/services/game'
import type { GameHistory } from '@/types/game'
import { gameTypes } from '@/types/game'

const histories = ref<GameHistory[]>([])
const selectedHistory = ref<GameHistory | null>(null)
const isLoading = ref(true)
const errorMessage = ref('')

const view = ref<'list' | 'detail'>('list')

function getGameTypeOption(gameType: string) {
  return gameTypes.find((g) => g.id === gameType) ?? { id: gameType, title: gameType, icon: '🎮' }
}

function formatDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getDuration(startedAt: string, endedAt: string): string {
  const start = new Date(startedAt).getTime()
  const end = new Date(endedAt).getTime()
  if (Number.isNaN(start) || Number.isNaN(end)) return ''
  const diffMs = end - start
  const minutes = Math.floor(diffMs / 60000)
  const seconds = Math.floor((diffMs % 60000) / 1000)
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  }
  return `${seconds}s`
}

async function loadHistories() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const data = await fetchGameHistories()
    histories.value = data.data
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Failed to load game history.'
  } finally {
    isLoading.value = false
  }
}

async function viewDetails(history: GameHistory) {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const data = await fetchGameHistoryById(history.id)
    selectedHistory.value = data.data
    view.value = 'detail'
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Failed to load game details.'
  } finally {
    isLoading.value = false
  }
}

function goBack() {
  view.value = 'list'
  selectedHistory.value = null
}

onMounted(() => {
  loadHistories()
})

const sortedScores = computed(() => {
  if (!selectedHistory.value) return []
  return [...selectedHistory.value.scores].sort((a, b) => b.score - a.score)
})
</script>

<template>
  <div class="game-history-page">
    <Navbar />

    <section class="game-history-hero">
      <div class="container">
        <div class="game-history-hero-content">
          <h1 class="game-history-hero-title">Game History</h1>
          <p class="game-history-hero-subtitle">
            Browse completed game sessions and review past results.
          </p>
        </div>
      </div>
    </section>

    <section class="game-history-content">
      <div class="container">
        <Transition name="view-fade" mode="out-in">
          <div v-if="view === 'list'" key="list">
            <div class="list-header">
              <h2 class="section-title">Completed Games</h2>
              <button class="btn-refresh" @click="loadHistories" :disabled="isLoading">
                <span class="refresh-icon">&#x21bb;</span> Refresh
              </button>
            </div>

            <Transition name="alert-fade" mode="out-in">
              <div v-if="errorMessage" key="error" class="alert alert-error">{{ errorMessage }}</div>
            </Transition>

            <div v-if="isLoading" class="loading-state">
              <div class="spinner"></div>
              <p>Loading game history...</p>
            </div>

            <div v-else-if="histories.length === 0" class="empty-state">
              <div class="empty-icon">📭</div>
              <p class="empty-title">No completed games yet</p>
              <p class="empty-subtitle">Completed games will appear here after they end.</p>
              <RouterLink to="/games/create" class="btn-create">Create a Game</RouterLink>
            </div>

            <div v-else class="history-list">
              <div
                v-for="history in histories"
                :key="history.id"
                class="history-card"
                @click="viewDetails(history)"
              >
                <div class="history-card-header">
                  <div class="history-game-icon">{{ getGameTypeOption(history.game_type).icon }}</div>
                  <div class="history-game-info">
                    <h3 class="history-game-title">{{ getGameTypeOption(history.game_type).title }}</h3>
                    <span class="history-game-date">{{ formatDate(history.started_at) }}</span>
                  </div>
                  <div class="history-card-badge">
                    <span class="badge-dot"></span>
                    Ended
                  </div>
                </div>

                <div class="history-card-body">
                  <div class="history-stat">
                    <span class="history-stat-label">Participants</span>
                    <span class="history-stat-value">{{ history.participants.length }}</span>
                  </div>
                  <div class="history-stat">
                    <span class="history-stat-label">Questions</span>
                    <span class="history-stat-value">{{ history.total_questions }}</span>
                  </div>
                  <div class="history-stat">
                    <span class="history-stat-label">Duration</span>
                    <span class="history-stat-value">{{ getDuration(history.started_at, history.ended_at) }}</span>
                  </div>
                  <div class="history-stat">
                    <span class="history-stat-label">Top Score</span>
                     <span class="history-stat-value">{{ history.scores.length > 0 ? history.scores[0]!.score : 0 }}</span>
                  </div>
                </div>

                <div class="history-card-footer">
                  <span class="view-details-link">View Results &rarr;</span>
                </div>
              </div>
            </div>
          </div>

          <div v-else key="detail" class="detail-view">
            <div class="detail-header">
              <button class="btn-back" @click="goBack">&larr; Back to history</button>
              <div class="detail-title-group" v-if="selectedHistory">
                <span class="detail-icon">{{ getGameTypeOption(selectedHistory.game_type).icon }}</span>
                <div>
                  <h2 class="detail-title">{{ getGameTypeOption(selectedHistory.game_type).title }}</h2>
                  <p class="detail-date">{{ formatDate(selectedHistory.started_at) }} &mdash; {{ formatDate(selectedHistory.ended_at) }}</p>
                </div>
              </div>
            </div>

            <Transition name="alert-fade" mode="out-in">
              <div v-if="errorMessage" key="error" class="alert alert-error">{{ errorMessage }}</div>
            </Transition>

            <div v-if="isLoading" class="loading-state">
              <div class="spinner"></div>
              <p>Loading results...</p>
            </div>

            <div v-else-if="selectedHistory" class="detail-content">
              <div class="detail-stats-grid">
                <div class="detail-stat-card">
                  <span class="detail-stat-value">{{ selectedHistory.participants.length }}</span>
                  <span class="detail-stat-label">Participants</span>
                </div>
                <div class="detail-stat-card">
                  <span class="detail-stat-value">{{ selectedHistory.total_questions }}</span>
                  <span class="detail-stat-label">Questions</span>
                </div>
                <div class="detail-stat-card">
                  <span class="detail-stat-value">{{ getDuration(selectedHistory.started_at, selectedHistory.ended_at) }}</span>
                  <span class="detail-stat-label">Duration</span>
                </div>
              </div>

              <div class="results-card">
                <h3 class="results-title">Leaderboard</h3>
                <div v-if="sortedScores.length === 0" class="no-scores">
                  No scores recorded for this session.
                </div>
                <div v-else class="leaderboard-list">
                  <div
                    v-for="(entry, index) in sortedScores"
                    :key="entry.participant"
                    class="leaderboard-item"
                    :class="{ 'leaderboard-top': index < 3 }"
                  >
                    <div class="leaderboard-rank">
                      <span v-if="index === 0" class="rank-medal gold">🥇</span>
                      <span v-else-if="index === 1" class="rank-medal silver">🥈</span>
                      <span v-else-if="index === 2" class="rank-medal bronze">🥉</span>
                      <span v-else class="rank-number">{{ index + 1 }}</span>
                    </div>
                    <div class="leaderboard-name">{{ entry.participant }}</div>
                    <div class="leaderboard-score">{{ entry.score }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </section>
  </div>
</template>

<style scoped>
.game-history-page {
  min-height: 100vh;
}

.game-history-hero {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 120px 20px 80px;
  text-align: center;
}

.game-history-hero-content {
  max-width: 800px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.game-history-hero-title {
  font-size: 40px;
  font-weight: 800;
  margin-bottom: 16px;
  letter-spacing: -0.02em;
}

.game-history-hero-subtitle {
  font-size: 18px;
  opacity: 0.95;
  line-height: 1.6;
}

.game-history-content {
  padding: 60px 20px;
  background: linear-gradient(to bottom, #f8fafc, #f1f5f9);
}

.section-title {
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 0;
}

.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 12px;
}

.btn-refresh {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 8px;
  border: 1.5px solid #e2e8f0;
  background: white;
  color: #334155;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-refresh:hover:not(:disabled) {
  border-color: #2563eb;
  color: #2563eb;
}

.btn-refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.refresh-icon {
  font-size: 18px;
  line-height: 1;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 16px;
  color: #64748b;
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid #e2e8f0;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-title {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 8px;
}

.empty-subtitle {
  font-size: 14px;
  color: #64748b;
  margin-bottom: 24px;
}

.btn-create {
  display: inline-flex;
  align-items: center;
  padding: 12px 24px;
  border-radius: 10px;
  border: none;
  background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
  color: white;
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3);
  transition: all 0.2s ease;
}

.btn-create:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(37, 99, 235, 0.4);
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.history-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  border: 1px solid #e2e8f0;
  cursor: pointer;
  transition: all 0.2s ease;
}

.history-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
  border-color: #cbd5e1;
}

.history-card-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.history-game-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  border-radius: 12px;
  font-size: 24px;
  flex-shrink: 0;
}

.history-game-info {
  flex: 1;
  min-width: 0;
}

.history-game-title {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 4px;
}

.history-game-date {
  font-size: 13px;
  color: #64748b;
}

.history-card-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  background: #f1f5f9;
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  border: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.badge-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
}

.history-card-body {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 16px;
  padding: 16px 0;
  border-top: 1px solid #f1f5f9;
  border-bottom: 1px solid #f1f5f9;
}

.history-stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.history-stat-label {
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.history-stat-value {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
}

.history-card-footer {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.view-details-link {
  font-size: 14px;
  font-weight: 600;
  color: #2563eb;
}

.detail-view {
  max-width: 800px;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  padding: 10px 18px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
  border: 1.5px solid #e2e8f0;
  color: #334155;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-back:hover {
  border-color: #2563eb;
  color: #2563eb;
}

.detail-title-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.detail-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  border-radius: 12px;
  font-size: 22px;
  flex-shrink: 0;
}

.detail-title {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 2px;
}

.detail-date {
  font-size: 13px;
  color: #64748b;
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.detail-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 16px;
}

.detail-stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  text-align: center;
}

.detail-stat-value {
  font-size: 24px;
  font-weight: 800;
  color: #0f172a;
}

.detail-stat-label {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.results-card {
  background: white;
  border-radius: 16px;
  padding: 28px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  border: 1px solid #e2e8f0;
}

.results-title {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 20px;
  padding-bottom: 14px;
  border-bottom: 2px solid #f1f5f9;
}

.no-scores {
  text-align: center;
  padding: 32px 20px;
  color: #64748b;
  font-size: 14px;
}

.leaderboard-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.leaderboard-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  border-radius: 10px;
  background: #f8fafc;
  border: 1px solid #f1f5f9;
  transition: all 0.15s ease;
}

.leaderboard-top {
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  border-color: #fde68a;
}

.leaderboard-rank {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.rank-medal {
  font-size: 20px;
  line-height: 1;
}

.rank-number {
  font-size: 14px;
  font-weight: 700;
  color: #64748b;
}

.leaderboard-name {
  flex: 1;
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.leaderboard-score {
  font-size: 16px;
  font-weight: 800;
  color: #2563eb;
  flex-shrink: 0;
}

.alert {
  padding: 14px 18px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 20px;
}

.alert-error {
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
}

.view-fade-enter-active,
.view-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.view-fade-enter-from {
  opacity: 0;
  transform: translateY(14px);
}

.view-fade-leave-to {
  opacity: 0;
  transform: translateY(-14px);
}

.alert-fade-enter-active,
.alert-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.alert-fade-enter-from {
  opacity: 0;
  transform: translateY(-6px);
}

.alert-fade-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

@media (max-width: 768px) {
  .game-history-hero {
    padding: 100px 20px 60px;
  }

  .game-history-hero-title {
    font-size: 28px;
  }

  .game-history-hero-subtitle {
    font-size: 16px;
  }

  .game-history-content {
    padding: 40px 20px;
  }

  .list-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .history-card-header {
    flex-wrap: wrap;
  }

  .history-card-body {
    grid-template-columns: repeat(2, 1fr);
  }

  .detail-stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
