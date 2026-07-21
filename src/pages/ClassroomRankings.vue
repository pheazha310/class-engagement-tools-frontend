<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useClassroomQuizStore } from '@/stores/classroomQuizStore'

const router = useRouter()
const route = useRoute()
const store = useClassroomQuizStore()

const quizId = route.params.quizId as string
const quiz = computed(() => store.getQuizById(quizId))
const rankings = computed(() => store.getRankingsForQuiz(quizId))

const searchQuery = ref('')

onMounted(() => {
  store.init()
  if (!quiz.value) {
    router.push('/classroom')
  }
})

const filteredRankings = computed(() => {
  let result = rankings.value
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(r => r.student_name.toLowerCase().includes(q))
  }
  return result
})

const totalSubmissions = computed(() => rankings.value.length)
const averageScore = computed(() => {
  if (rankings.value.length === 0) return 0
  const total = rankings.value.reduce((acc, r) => acc + r.score, 0)
  return Math.round(total / rankings.value.length)
})
const passCount = computed(() => rankings.value.filter(r => r.status === 'pass').length)

function goBack() {
  router.push('/classroom')
}

function retakeQuiz() {
  router.push(`/classroom/quiz/${quizId}`)
}

function formatTimeTaken(minutes: number) {
  if (minutes < 1) return `${Math.round(minutes * 60)}s`
  const m = Math.floor(minutes)
  const s = Math.round((minutes - m) * 60)
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}

function getRankBadge(rank: number) {
  if (rank === 1) return 'rank-badge rank-badge--gold'
  if (rank === 2) return 'rank-badge rank-badge--silver'
  if (rank === 3) return 'rank-badge rank-badge--bronze'
  return 'rank-badge'
}

function getRankIcon(rank: number) {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return `#${rank}`
}
</script>

<template>
  <div class="rankings-page">
    <div class="rankings-bg" aria-hidden="true"></div>

    <div class="rankings-container">
      <!-- Header -->
      <header class="rankings-header">
        <div class="rankings-header-left">
          <button class="btn-back-icon" @click="goBack" title="Back to quizzes">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <div class="rankings-header-icon">
            <svg class="rankings-header-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 9 6 9 8.5V15a2 2 0 0 1-2 2H4" />
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 15 6 15 8.5V15a2 2 0 0 0 2 2h3" />
              <path d="M12 3v18" />
            </svg>
          </div>
          <div>
            <h1 class="rankings-header-title" v-if="quiz">{{ quiz.title }} — Rankings</h1>
            <h1 class="rankings-header-title" v-else>Rankings</h1>
            <p class="rankings-header-subtitle" v-if="quiz">
              {{ totalSubmissions }} student{{ totalSubmissions !== 1 ? 's' : '' }} · {{ quiz.subject }} · {{ quiz.class_name }}
            </p>
          </div>
        </div>
        <button v-if="quiz && !store.hasStudentSubmitted(quizId, store.currentStudentName)" class="btn btn-retake" @click="retakeQuiz">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          Take Quiz
        </button>
      </header>

      <!-- Stats -->
      <div class="stats-row">
        <div class="stat-card">
          <span class="stat-value">{{ totalSubmissions }}</span>
          <span class="stat-label">Participants</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ averageScore }}</span>
          <span class="stat-label">Avg Score</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ passCount }}</span>
          <span class="stat-label">Passed</span>
        </div>
      </div>

      <!-- Search -->
      <div class="search-section">
        <div class="search-wrapper">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search students..."
            class="search-input"
          />
        </div>
      </div>

      <!-- Rankings table -->
      <div v-if="filteredRankings.length === 0" class="empty-state">
        <div class="empty-icon">🏆</div>
        <h3 class="empty-title">No rankings yet</h3>
        <p class="empty-desc">Nobody has taken this quiz yet. Be the first!</p>
        <button v-if="quiz" class="btn btn-empty" @click="retakeQuiz">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          Take Quiz Now
        </button>
      </div>

      <div v-else class="rankings-card">
        <table class="rankings-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Student</th>
              <th>Score</th>
              <th>Percentage</th>
              <th>Time</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(rank, index) in filteredRankings"
              :key="rank.id"
              class="rank-row"
              :class="{ 'rank-row--top': index < 3, 'rank-row--self': rank.student_name === store.currentStudentName }"
            >
              <td class="td-rank">
                <span :class="getRankBadge(index + 1)">{{ getRankIcon(index + 1) }}</span>
              </td>
              <td class="td-name">
                <div class="student-avatar">{{ rank.student_name.charAt(0).toUpperCase() }}</div>
                <span class="student-name">{{ rank.student_name }}</span>
                <span v-if="rank.student_name === store.currentStudentName" class="you-badge">You</span>
              </td>
              <td class="td-score">
                <span class="score-value">{{ rank.score }}</span>
                <span class="score-unit">pts</span>
              </td>
              <td class="td-percentage">
                <div class="percentage-bar">
                  <div class="percentage-bar-bg">
                    <div
                      class="percentage-bar-fill"
                      :class="{ 'bar-high': rank.percentage >= 80, 'bar-mid': rank.percentage >= 50 && rank.percentage < 80, 'bar-low': rank.percentage < 50 }"
                      :style="{ width: `${rank.percentage}%` }"
                    ></div>
                  </div>
                  <span class="percentage-text">{{ Math.round(rank.percentage) }}%</span>
                </div>
              </td>
              <td class="td-time">{{ formatTimeTaken(rank.time_taken) }}</td>
              <td class="td-status">
                <span class="status-badge" :class="rank.status === 'pass' ? 'status-pass' : 'status-fail'">
                  {{ rank.status === 'pass' ? 'Pass' : 'Fail' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ============================================================
   PAGE CONTAINER
   ============================================================ */
.rankings-page {
  position: relative;
  min-height: 100vh;
  padding: 7rem 1rem 4rem;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

.rankings-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(ellipse 70% 50% at 50% -15%, rgba(37, 99, 235, 0.07), transparent),
    radial-gradient(ellipse 50% 40% at 20% 90%, rgba(59, 130, 246, 0.04), transparent);
  z-index: 0;
}

.rankings-container {
  position: relative;
  z-index: 1;
  max-width: 1100px;
  margin: 0 auto;
}

/* ============================================================
   HEADER
   ============================================================ */
.rankings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 2.5rem;
  padding: 0 0.25rem;
  flex-wrap: wrap;
}

.rankings-header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.btn-back-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;
}

.btn-back-icon svg {
  width: 20px;
  height: 20px;
}

.btn-back-icon:hover {
  border-color: #3b82f6;
  color: #2563eb;
  background: #eff6ff;
}

.rankings-header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
  box-shadow: 0 8px 24px rgba(37, 99, 235, 0.25);
  flex-shrink: 0;
}

.rankings-header-svg {
  width: 26px;
  height: 26px;
  color: #fff;
}

.rankings-header-title {
  font-size: 1.625rem;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: -0.02em;
  margin: 0;
  line-height: 1.3;
}

.rankings-header-subtitle {
  font-size: 0.9rem;
  color: #64748b;
  margin: 0.2rem 0 0;
  line-height: 1.4;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.6rem 1.2rem;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 600;
  font-family: inherit;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.btn-icon {
  width: 16px;
  height: 16px;
}

.btn-retake {
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: #ffffff;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);
}

.btn-retake:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(37, 99, 235, 0.4);
}

.btn-empty {
  margin-top: 1.5rem;
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: #ffffff;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);
}

.btn-empty:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(37, 99, 235, 0.4);
}

/* ============================================================
   STATS
   ============================================================ */
.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.75rem;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 1.25rem 1rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 800;
  color: #2563eb;
  line-height: 1.1;
}

.stat-label {
  font-size: 0.8rem;
  font-weight: 500;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* ============================================================
   SEARCH
   ============================================================ */
.search-section {
  margin-bottom: 1.25rem;
}

.search-wrapper {
  position: relative;
  max-width: 400px;
}

.search-icon {
  position: absolute;
  left: 13px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  color: #94a3b8;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 0.7rem 0.85rem 0.7rem 2.5rem;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  color: #1e293b;
  font-size: 0.875rem;
  font-family: inherit;
  outline: none;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.search-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

/* ============================================================
   RANKINGS TABLE
   ============================================================ */
.rankings-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.rankings-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.rankings-table thead th {
  text-align: left;
  padding: 0.85rem 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 2px solid #e2e8f0;
  background: #f8fafc;
}

.rank-row {
  border-bottom: 1px solid #f1f5f9;
  transition: background 0.15s ease;
}

.rank-row:hover {
  background: #f8fafc;
}

.rank-row--top {
  background: #fffbeb;
}

.rank-row--top:hover {
  background: #fef3c7;
}

.rank-row--self {
  background: #eff6ff !important;
}

.rank-row td {
  padding: 0.85rem 1rem;
  vertical-align: middle;
}

.td-rank {
  width: 60px;
}

.rank-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 700;
  background: #eff6ff;
  color: #2563eb;
}

.rank-badge--gold {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  color: #92400e;
}

.rank-badge--silver {
  background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
  color: #475569;
}

.rank-badge--bronze {
  background: linear-gradient(135deg, #fed7aa, #fdba74);
  color: #7c2d12;
}

.td-name {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.student-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: linear-gradient(135deg, #0d9488, #14b8a6);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 700;
  flex-shrink: 0;
}

.student-name {
  font-weight: 600;
  color: #1e293b;
}

.you-badge {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0.15rem 0.45rem;
  background: #dbeafe;
  color: #2563eb;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.td-score {
  white-space: nowrap;
}

.score-value {
  font-weight: 700;
  color: #1e293b;
  font-size: 1rem;
}

.score-unit {
  font-size: 0.75rem;
  color: #94a3b8;
  margin-left: 0.15rem;
}

.percentage-bar {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-width: 120px;
}

.percentage-bar-bg {
  flex: 1;
  height: 8px;
  background: #f1f5f9;
  border-radius: 999px;
  overflow: hidden;
}

.percentage-bar-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.6s ease;
}

.bar-high {
  background: linear-gradient(90deg, #16a34a, #22c55e);
}

.bar-mid {
  background: linear-gradient(90deg, #eab308, #facc15);
}

.bar-low {
  background: linear-gradient(90deg, #ef4444, #f87171);
}

.percentage-text {
  font-weight: 600;
  font-size: 0.85rem;
  color: #475569;
  min-width: 40px;
  text-align: right;
}

.td-time {
  white-space: nowrap;
  color: #64748b;
  font-size: 0.85rem;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.65rem;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.status-pass {
  background: #d1fae5;
  color: #065f46;
}

.status-fail {
  background: #fee2e2;
  color: #991b1b;
}

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  border: 2px dashed #cbd5e1;
  border-radius: 16px;
  background: #ffffff;
  text-align: center;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.5rem;
}

.empty-desc {
  font-size: 1rem;
  color: #64748b;
  margin: 0;
}

/* ============================================================
   RESPONSIVE
   ============================================================ */
@media (max-width: 768px) {
  .rankings-page {
    padding: 1.25rem 0.75rem 3rem;
  }

  .rankings-header {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }

  .rankings-header-left {
    flex-direction: column;
    text-align: center;
    gap: 0.6rem;
  }

  .rankings-header-icon {
    width: 48px;
    height: 48px;
  }

  .rankings-header-title {
    font-size: 1.3rem;
  }

  .stats-row {
    grid-template-columns: repeat(3, 1fr);
    gap: 0.6rem;
  }

  .stat-card {
    padding: 1rem 0.5rem;
  }

  .stat-value {
    font-size: 1.4rem;
  }

  .rankings-table thead {
    display: none;
  }

  .rank-row {
    display: flex;
    flex-direction: column;
    padding: 1rem;
  }

  .rank-row td {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.4rem 0;
  }

  .td-rank {
    width: auto;
  }

  .percentage-bar {
    min-width: auto;
    width: 100%;
  }
}
</style>
