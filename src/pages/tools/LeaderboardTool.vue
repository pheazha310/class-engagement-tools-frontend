<script setup lang="ts">
import { ref, computed } from 'vue'
import Navbar from '@/components/Navbar.vue'

interface LeaderEntry {
  rank: number
  name: string
  initials: string
  score: number
  quizzes: number
  streak: number
  trend: 'up' | 'down' | 'stable'
}

const sortBy = ref<'score' | 'quizzes' | 'streak' | 'name'>('score')
const filterClass = ref('all')

const allEntries: LeaderEntry[] = [
  { rank: 1, name: 'Emma Thompson', initials: 'ET', score: 97, quizzes: 15, streak: 8, trend: 'up' },
  { rank: 2, name: 'Liam Chen', initials: 'LC', score: 93, quizzes: 14, streak: 6, trend: 'up' },
  { rank: 3, name: 'Sophia Patel', initials: 'SP', score: 91, quizzes: 13, streak: 7, trend: 'stable' },
  { rank: 4, name: 'Noah Williams', initials: 'NW', score: 88, quizzes: 12, streak: 5, trend: 'up' },
  { rank: 5, name: 'Olivia Martinez', initials: 'OM', score: 85, quizzes: 14, streak: 4, trend: 'down' },
  { rank: 6, name: 'Ethan Kim', initials: 'EK', score: 82, quizzes: 11, streak: 6, trend: 'up' },
  { rank: 7, name: 'Ava Johnson', initials: 'AJ', score: 79, quizzes: 10, streak: 3, trend: 'stable' },
  { rank: 8, name: 'Mason Brown', initials: 'MB', score: 76, quizzes: 9, streak: 5, trend: 'up' },
  { rank: 9, name: 'Isabella Garcia', initials: 'IG', score: 74, quizzes: 11, streak: 2, trend: 'down' },
  { rank: 10, name: 'Lucas Lee', initials: 'LL', score: 71, quizzes: 8, streak: 4, trend: 'up' },
  { rank: 11, name: 'Mia Rodriguez', initials: 'MR', score: 68, quizzes: 10, streak: 3, trend: 'stable' },
  { rank: 12, name: 'James Wilson', initials: 'JW', score: 65, quizzes: 7, streak: 1, trend: 'down' },
]

const sortedEntries = computed(() => {
  const sorted = [...allEntries]
  switch (sortBy.value) {
    case 'score': sorted.sort((a, b) => b.score - a.score); break
    case 'quizzes': sorted.sort((a, b) => b.quizzes - a.quizzes); break
    case 'streak': sorted.sort((a, b) => b.streak - a.streak); break
    case 'name': sorted.sort((a, b) => a.name.localeCompare(b.name)); break
  }
  return sorted.map((e, i) => ({ ...e, rank: i + 1 }))
})

const topThree = computed(() => sortedEntries.value.slice(0, 3))
const others = computed(() => sortedEntries.value.slice(3))

function formatScore(s: number) {
  return s + '%'
}

function getRankMedal(rank: number) {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return ''
}
</script>

<template>
  <div class="tool-page">
    <Navbar />

    <section class="tool-hero">
      <div class="container">
        <div class="tool-hero-content">
          <div class="tool-icon">🏆</div>
          <h1>Leaderboard</h1>
          <p>Track and display student achievement rankings with live score updates.</p>
        </div>
      </div>
    </section>

    <section class="tool-main">
      <div class="container">
        <!-- Podium -->
        <section v-if="topThree.length >= 3" class="podium-section">
          <div class="podium-grid">
            <div class="podium-item rank-2">
              <div class="podium-avatar">{{ topThree[1].initials }}</div>
              <div class="podium-medal">{{ getRankMedal(2) }}</div>
              <strong class="podium-name">{{ topThree[1].name }}</strong>
              <span class="podium-score">{{ formatScore(topThree[1].score) }}</span>
              <div class="podium-bar bar-2">2nd</div>
            </div>
            <div class="podium-item rank-1">
              <div class="podium-crown">👑</div>
              <div class="podium-avatar champ">{{ topThree[0].initials }}</div>
              <div class="podium-medal">{{ getRankMedal(1) }}</div>
              <strong class="podium-name">{{ topThree[0].name }}</strong>
              <span class="podium-score">{{ formatScore(topThree[0].score) }}</span>
              <div class="podium-bar bar-1">1st</div>
            </div>
            <div class="podium-item rank-3">
              <div class="podium-avatar">{{ topThree[2].initials }}</div>
              <div class="podium-medal">{{ getRankMedal(3) }}</div>
              <strong class="podium-name">{{ topThree[2].name }}</strong>
              <span class="podium-score">{{ formatScore(topThree[2].score) }}</span>
              <div class="podium-bar bar-3">3rd</div>
            </div>
          </div>
        </section>

        <!-- Controls -->
        <div class="lb-controls">
          <div class="lb-sort">
            <label>Sort by:</label>
            <select v-model="sortBy" class="lb-select">
              <option value="score">Score</option>
              <option value="quizzes">Quizzes</option>
              <option value="streak">Streak</option>
              <option value="name">Name</option>
            </select>
          </div>
          <div class="lb-count">{{ sortedEntries.length }} students</div>
        </div>

        <!-- Table -->
        <div class="lb-table">
          <div class="lb-row lb-header">
            <span class="lb-rank">Rank</span>
            <span class="lb-name">Student</span>
            <span class="lb-score">Score</span>
            <span class="lb-quizzes">Quizzes</span>
            <span class="lb-streak">Streak</span>
            <span class="lb-trend">Trend</span>
          </div>
          <div v-for="e in sortedEntries" :key="e.rank" class="lb-row" :class="{ 'lb-top': e.rank <= 3 }">
            <span class="lb-rank">
              <span v-if="e.rank <= 3" class="lb-medal">{{ getRankMedal(e.rank) }}</span>
              <span v-else class="lb-rank-num">#{{ e.rank }}</span>
            </span>
            <span class="lb-name">
              <div class="lb-avatar">{{ e.initials }}</div>
              <strong>{{ e.name }}</strong>
            </span>
            <span class="lb-score">
              <div class="lb-score-bar-wrap">
                <div class="lb-score-bar" :style="{ width: e.score + '%' }"></div>
                <span>{{ formatScore(e.score) }}</span>
              </div>
            </span>
            <span class="lb-quizzes">{{ e.quizzes }}</span>
            <span class="lb-streak">{{ e.streak }}d</span>
            <span class="lb-trend">
              <span v-if="e.trend === 'up'" class="trend-up">↑</span>
              <span v-else-if="e.trend === 'down'" class="trend-down">↓</span>
              <span v-else class="trend-stable">→</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.tool-page { min-height: 100vh; background: #f8fafc; }
.container { max-width: 820px; margin: 0 auto; padding: 0 20px; }

.tool-hero {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: #fff; padding: 120px 20px 60px; text-align: center;
}
.tool-hero-content { max-width: 640px; margin: 0 auto; }
.tool-icon { font-size: 60px; margin-bottom: 16px; }
.tool-hero h1 { font-size: 40px; font-weight: 800; margin-bottom: 12px; }
.tool-hero p { font-size: 17px; opacity: .92; line-height: 1.6; }

.tool-main { padding: 40px 20px 60px; }

.podium-section { margin-bottom: 28px; }
.podium-grid { display: grid; grid-template-columns: 1fr 1.2fr 1fr; gap: 12px; align-items: end; max-width: 600px; margin: 0 auto; }
.podium-item { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 20px 12px 0; border-radius: 14px; background: #fff; border: 1px solid #e2e8f0; position: relative; }
.rank-1 { padding-top: 28px; border-color: #FFD700; box-shadow: 0 8px 24px rgba(255,215,0,.12); }
.rank-2 { padding-top: 16px; }
.rank-3 { padding-top: 16px; }
.podium-crown { position: absolute; top: -14px; font-size: 28px; }
.podium-avatar { display: grid; width: 48px; height: 48px; place-items: center; border-radius: 50%; background: #e2e8f0; color: #475569; font-size: 16px; font-weight: 800; }
.podium-avatar.champ { width: 56px; height: 56px; font-size: 18px; background: #fef3c7; color: #d97706; border: 2px solid #FFD700; }
.podium-medal { font-size: 24px; margin: 4px 0; }
.podium-name { font-size: 13px; font-weight: 700; color: #0f172a; }
.podium-score { font-size: 11px; color: #64748b; margin: 2px 0 10px; font-weight: 800; }
.podium-bar { width: 100%; padding: 6px 0; border-radius: 0 0 14px 14px; font-weight: 800; font-size: 12px; margin-top: auto; text-align: center; }
.bar-1 { background: linear-gradient(135deg,#FFD700,#FFA500); color: #fff; }
.bar-2 { background: linear-gradient(135deg,#E8E8E8,#C0C0C0); color: #555; }
.bar-3 { background: linear-gradient(135deg,#F5DEB3,#CD7F32); color: #fff; }

.lb-controls { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; padding: 12px 18px; background: #fff; border-radius: 10px; border: 1px solid #e2e8f0; }
.lb-sort { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: #475569; }
.lb-select { border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 10px; font-size: 13px; font-weight: 600; color: #0f172a; background: #fff; cursor: pointer; }
.lb-count { font-size: 13px; color: #64748b; font-weight: 600; }

.lb-table { border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #fff; }
.lb-row { display: grid; grid-template-columns: 60px minmax(160px,1.5fr) 1fr 80px 80px 60px; align-items: center; min-height: 56px; border-top: 1px solid #f1f5f9; padding: 0 18px; gap: 10px; transition: background .15s; }
.lb-row:hover { background: #f8faff; }
.lb-header { min-height: 42px; background: #f1f5f9; color: #64748b; font-size: 11px; font-weight: 800; text-transform: uppercase; }
.lb-top { background: #fffbeb; }
.lb-top:hover { background: #fff8d0; }

.lb-rank { display: flex; align-items: center; gap: 4px; }
.lb-medal { font-size: 20px; }
.lb-rank-num { font-size: 13px; font-weight: 700; color: #94a3b8; }
.lb-name { display: flex; align-items: center; gap: 10px; }
.lb-name strong { font-size: 14px; color: #0f172a; }
.lb-avatar { display: grid; width: 32px; height: 32px; place-items: center; border-radius: 8px; background: #fef3c7; color: #d97706; font-size: 10px; font-weight: 800; }
.lb-score-bar-wrap { display: flex; align-items: center; gap: 8px; }
.lb-score-bar { height: 6px; border-radius: 999px; background: linear-gradient(90deg,#f59e0b,#d97706); min-width: 4px; max-width: 100px; }
.lb-score-bar-wrap span { font-size: 13px; font-weight: 800; color: #0f172a; white-space: nowrap; }
.lb-quizzes, .lb-streak { font-size: 13px; color: #475569; font-weight: 600; }
.trend-up { color: #059669; font-weight: 800; font-size: 18px; }
.trend-down { color: #dc2626; font-weight: 800; font-size: 18px; }
.trend-stable { color: #94a3b8; font-weight: 800; font-size: 18px; }

@media (max-width:640px) {
  .tool-hero h1 { font-size: 28px; }
  .podium-grid { grid-template-columns: 1fr; max-width: 280px; }
  .lb-row { grid-template-columns: 40px 1fr 60px 40px 50px 40px; padding: 0 12px; font-size: 12px; }
  .lb-header { display: none; }
}
</style>
