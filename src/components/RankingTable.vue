<script setup lang="ts">
import type { QuizRanking } from '@/types/ranking'

defineProps<{
  rankings: QuizRanking[]
  loading?: boolean
}>()

function formatTimeTaken(minutes: number) {
  if (minutes < 1) return `${Math.round(minutes * 60)}s`
  const m = Math.floor(minutes)
  const s = Math.round((minutes - m) * 60)
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
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
  <div class="ranking-table-wrapper">
    <!-- Desktop table view -->
    <div class="ranking-table-desktop">
      <table class="ranking-table">
        <thead class="ranking-table-head">
          <tr>
            <th class="th-rank">Rank</th>
            <th class="th-name">Student Name</th>
            <th class="th-score">Score</th>
            <th class="th-percentage">Percentage</th>
            <th class="th-time">Time Taken</th>
            <th class="th-date">Submission Date</th>
            <th class="th-status">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(rank, index) in rankings"
            :key="rank.id"
            class="ranking-row"
            :class="{ 'ranking-row--top': index < 3 }"
          >
            <td class="td-rank">
              <span :class="getRankBadge(index + 1)">{{ getRankIcon(index + 1) }}</span>
            </td>
            <td class="td-name">
              <div class="student-avatar">{{ rank.student_name.charAt(0).toUpperCase() }}</div>
              <span class="student-name">{{ rank.student_name }}</span>
            </td>
            <td class="td-score">
              <span class="score-value">{{ rank.score }}</span>
              <span class="score-unit">pts</span>
            </td>
            <td class="td-percentage">
              <div class="percentage-bar-wrapper">
                <div class="percentage-bar-bg">
                  <div
                    class="percentage-bar-fill"
                    :class="{ 'percentage-bar-fill--high': rank.percentage >= 80, 'percentage-bar-fill--mid': rank.percentage >= 50 && rank.percentage < 80, 'percentage-bar-fill--low': rank.percentage < 50 }"
                    :style="{ width: `${rank.percentage}%` }"
                  ></div>
                </div>
                <span class="percentage-text">{{ Math.round(rank.percentage) }}%</span>
              </div>
            </td>
            <td class="td-time">{{ formatTimeTaken(rank.time_taken) }}</td>
            <td class="td-date">{{ formatDate(rank.submitted_at) }}</td>
            <td class="td-status">
              <span class="status-badge" :class="rank.status === 'pass' ? 'status-badge--pass' : 'status-badge--fail'">
                {{ rank.status === 'pass' ? 'Pass' : 'Fail' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Mobile card view -->
    <div class="ranking-cards-mobile">
      <div
        v-for="(rank, index) in rankings"
        :key="rank.id"
        class="ranking-mobile-card"
        :class="{ 'ranking-mobile-card--top': index < 3 }"
      >
        <div class="mobile-card-top">
          <div class="mobile-card-rank">
            <span :class="getRankBadge(index + 1)">{{ getRankIcon(index + 1) }}</span>
          </div>
          <div class="mobile-card-student">
            <div class="student-avatar">{{ rank.student_name.charAt(0).toUpperCase() }}</div>
            <span class="student-name">{{ rank.student_name }}</span>
          </div>
          <span class="status-badge" :class="rank.status === 'pass' ? 'status-badge--pass' : 'status-badge--fail'">
            {{ rank.status === 'pass' ? 'Pass' : 'Fail' }}
          </span>
        </div>
        <div class="mobile-card-stats">
          <div class="mobile-stat">
            <span class="mobile-stat-label">Score</span>
            <span class="mobile-stat-value">{{ rank.score }} pts</span>
          </div>
          <div class="mobile-stat">
            <span class="mobile-stat-label">Percentage</span>
            <span class="mobile-stat-value">{{ Math.round(rank.percentage) }}%</span>
          </div>
          <div class="mobile-stat">
            <span class="mobile-stat-label">Time</span>
            <span class="mobile-stat-value">{{ formatTimeTaken(rank.time_taken) }}</span>
          </div>
        </div>
        <div class="mobile-card-date">{{ formatDate(rank.submitted_at) }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ranking-table-wrapper {
  overflow-x: auto;
}

/* ============================================================
   DESKTOP TABLE
   ============================================================ */
.ranking-table-desktop {
  display: block;
}

.ranking-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.ranking-table-head th {
  text-align: left;
  padding: 0.75rem 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 2px solid #e2e8f0;
  white-space: nowrap;
}

.ranking-row {
  border-bottom: 1px solid #f1f5f9;
  transition: background 0.15s ease;
}

.ranking-row:hover {
  background: #f8fafc;
}

.ranking-row--top {
  background: #eff6ff;
}

.ranking-row--top:hover {
  background: #dbeafe;
}

.ranking-row td {
  padding: 0.85rem 1rem;
  vertical-align: middle;
}

/* Rank column */
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

/* Student name */
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

/* Score */
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

/* Percentage bar */
.percentage-bar-wrapper {
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

.percentage-bar-fill--high {
  background: linear-gradient(90deg, #16a34a, #22c55e);
}

.percentage-bar-fill--mid {
  background: linear-gradient(90deg, #eab308, #facc15);
}

.percentage-bar-fill--low {
  background: linear-gradient(90deg, #ef4444, #f87171);
}

.percentage-text {
  font-weight: 600;
  font-size: 0.85rem;
  color: #475569;
  min-width: 40px;
  text-align: right;
}

/* Time & Date */
.td-time, .td-date {
  white-space: nowrap;
  color: #64748b;
  font-size: 0.85rem;
}

/* Status badge */
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

.status-badge--pass {
  background: #d1fae5;
  color: #065f46;
}

.status-badge--fail {
  background: #fee2e2;
  color: #991b1b;
}

/* ============================================================
   MOBILE CARDS
   ============================================================ */
.ranking-cards-mobile {
  display: none;
}

@media (max-width: 768px) {
  .ranking-table-desktop {
    display: none;
  }

  .ranking-cards-mobile {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }

  .ranking-mobile-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    padding: 1rem;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  }

.ranking-mobile-card--top {
  border-color: #3b82f6;
  background: #eff6ff;
}

  .mobile-card-top {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    margin-bottom: 0.75rem;
  }

  .mobile-card-rank {
    flex-shrink: 0;
  }

  .mobile-card-student {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
  }

  .mobile-card-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem;
    padding: 0.75rem 0;
    border-top: 1px solid #f1f5f9;
    border-bottom: 1px solid #f1f5f9;
  }

  .mobile-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.15rem;
  }

  .mobile-stat-label {
    font-size: 0.65rem;
    color: #94a3b8;
    text-transform: uppercase;
    font-weight: 600;
    letter-spacing: 0.03em;
  }

  .mobile-stat-value {
    font-size: 0.9rem;
    font-weight: 700;
    color: #1e293b;
  }

  .mobile-card-date {
    font-size: 0.75rem;
    color: #94a3b8;
    margin-top: 0.5rem;
    text-align: center;
  }
}
</style>
