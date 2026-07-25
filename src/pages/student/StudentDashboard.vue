<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useLivePollStore } from '@/stores/livePollStore'
import api from '@/services/api'
import type { ActivePollItem } from '@/types/livePoll'

const router = useRouter()
const authStore = useAuthStore()
const pollStore = useLivePollStore()

// ── Reactive State ─────────────────────────────────────────────
const currentHour = ref(new Date().getHours())
const loading = ref(true)
const refreshing = ref(false)
const error = ref<string | null>(null)
const activePolls = ref<ActivePollItem[]>([])
const gameHistory = ref<{ name: string; score: string; date: string; type: string }[]>([])
const stats = ref({
  activePollCount: 0,
  quizzesTaken: 0,
  avgScore: 0,
  streakDays: 0,
})

// ── Computed ───────────────────────────────────────────────────
const studentName = computed(() => authStore.user?.name || 'Student')
const studentEmail = computed(() => authStore.user?.email || '')
const studentSchool = computed(() => authStore.user?.school ?? '')
const studentInitials = computed(() => {
  const name = studentName.value
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0]![0]!.toUpperCase()
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
})

const greeting = computed(() => {
  const h = currentHour.value
  if (h < 12) return { text: 'Good Morning', emoji: '🌅' }
  if (h < 18) return { text: 'Good Afternoon', emoji: '☀️' }
  return { text: 'Good Evening', emoji: '🌙' }
})

const typeLabels: Record<string, string> = {
  multiple_choice: 'Multiple Choice',
  yes_no: 'Yes / No',
  rating: 'Rating Scale',
  open_ended: 'Open Ended',
}

const typeColors: Record<string, string> = {
  multiple_choice: '#3b82f6',
  yes_no: '#10b981',
  rating: '#f59e0b',
  open_ended: '#8b5cf6',
}

const typeBgColors: Record<string, string> = {
  multiple_choice: '#eff6ff',
  yes_no: '#ecfdf5',
  rating: '#fffbeb',
  open_ended: '#f5f3ff',
}

// ── Streak Calculation ──────────────────────────────────────────────────────
function calculateStreak(dates: string[]): number {
  if (!dates.length) return 0

  // Convert to local timezone dates (sv-SE locale formats as YYYY-MM-DD)
  const toLocalDate = (d: string | Date) =>
    new Date(d).toLocaleDateString('sv-SE')

  // Normalize to unique YYYY-MM-DD dates (local tz), sorted descending
  const uniqueDays = [...new Set(dates.map(d => toLocalDate(d)))].filter((d): d is string => typeof d === 'string' && d.length > 0)
  uniqueDays.sort().reverse()

  const now = new Date()
  const today = toLocalDate(now)
  const yesterday = toLocalDate(new Date(now.getTime() - 86400000))

  // Streak only counts if most recent activity is today or yesterday
  const mostRecent = uniqueDays[0]
  if (mostRecent !== today && mostRecent !== yesterday) return 0

  // Count consecutive days backward from the most recent date
  let streak = 1
  for (let i = 1; i < uniqueDays.length; i++) {
    const prev = uniqueDays[i - 1]!
    const curr = uniqueDays[i]!
    const diffMs = new Date(prev).getTime() - new Date(curr).getTime()
    const diffDays = Math.round(diffMs / 86400000)
    if (diffDays === 1) {
      streak++
    } else {
      break
    }
  }

  return streak
}

// ── Data Fetching ──────────────────────────────────────────────
async function fetchData() {
  try {
    const [pollsRes, historyRes] = await Promise.allSettled([
      pollStore.fetchActivePolls(),
      api.get('/api/game-histories').catch(() => ({ data: { data: [] } })),
    ])

    if (pollsRes.status === 'fulfilled') {
      activePolls.value = pollStore.activePolls
    }

    let streakDays = 0

    if (historyRes.status === 'fulfilled') {
      const entries = historyRes.value.data?.data ?? []

      // Compute streak from ALL entries (not just the first 5)
      const activityDates = entries
        .map((h: any) => h.created_at)
        .filter(Boolean)
      streakDays = calculateStreak(activityDates)

      // Save first 5 for the recent activity list
      gameHistory.value = entries.slice(0, 5).map((h: any) => ({
        name: h.quiz_name || h.game_name || 'Quiz Activity',
        score: h.score ? `${h.score}%` : '—',
        date: h.created_at ? new Date(h.created_at).toLocaleDateString() : '—',
        type: h.type || 'quiz',
      }))
    }

    // Compute stats from real data
    const pollVotes = activePolls.value.length
    const quizzesTaken = gameHistory.value.length
    const scores = gameHistory.value
      .map((g) => parseInt(g.score))
      .filter((s) => !isNaN(s))
    const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
    stats.value = {
      activePollCount: pollVotes,
      quizzesTaken,
      avgScore,
      streakDays,
    }

    error.value = null
  } catch (e: any) {
    console.error('Dashboard fetch error:', e)
    error.value = 'Could not load all data'
  } finally {
    loading.value = false
  }
}

async function refreshData() {
  refreshing.value = true
  await fetchData()
  refreshing.value = false
}

function vote(poll: ActivePollItem) {
  if (poll.public_token) {
    router.push({ name: 'live-vote-public', params: { token: poll.public_token } })
  }
}

function navigateTo(path: string) {
  router.push(path)
}

// ── Count-up animation on mount ────────────────────────────────
const animatedStats = ref({ activePollCount: 0, quizzesTaken: 0, avgScore: 0, streakDays: 0 })
let statsTimer: ReturnType<typeof setInterval> | null = null
let greetTimer: ReturnType<typeof setInterval> | null = null

onMounted(async () => {
  await fetchData()
  // Animate stats counting up
  const target = { ...stats.value }
  const duration = 1000
  const steps = 30
  const interval = duration / steps
  let step = 0
  statsTimer = setInterval(() => {
    step++
    const progress = step / steps
    animatedStats.value = {
      activePollCount: Math.round(target.activePollCount * progress),
      quizzesTaken: Math.round(target.quizzesTaken * progress),
      avgScore: Math.round(target.avgScore * progress),
      streakDays: Math.round(target.streakDays * progress),
    }
    if (step >= steps) {
      animatedStats.value = { ...target }
      clearInterval(statsTimer!)
    }
  }, interval)

  // Update greeting every minute
  greetTimer = setInterval(() => { currentHour.value = new Date().getHours() }, 60000)
})

// Cleanup on unmount — must be at top level of setup(), not inside async onMounted
onUnmounted(() => {
  if (statsTimer) clearInterval(statsTimer)
  if (greetTimer) clearInterval(greetTimer)
})
</script>

<template>
  <div class="student-dashboard">
    <!-- ── Animated Background ──────────────────────────────────── -->
    <div class="bg-canvas">
      <div class="bg-orb bg-orb--1" />
      <div class="bg-orb bg-orb--2" />
      <div class="bg-orb bg-orb--3" />
      <div class="bg-grid" />
    </div>

    <!-- ── Main Content ─────────────────────────────────────────── -->
    <main class="main-content">
      <div class="container">
        <!-- ── Greeting Banner ─────────────────────────────────── -->
        <div class="greeting-banner">
          <div class="greeting-text">
            <div class="greeting-emoji">{{ greeting.emoji }}</div>
            <div>
              <h1 class="greeting-title">{{ greeting.text }}, {{ studentName }}!</h1>
              <p class="greeting-sub">Here's your learning overview for today.</p>
            </div>
          </div>
          <div class="greeting-actions">
            <button class="ghost-btn" @click="refreshData" :class="{ spinning: refreshing }">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M23 4v6h-6" />
                <path d="M1 20v-6h6" />
                <path d="M3.5 9a9 9 0 0114.5-3.5L23 10" />
                <path d="M1 14l5 4.5A9 9 0 0020.5 15" />
              </svg>
              <span>Refresh</span>
            </button>
          </div>
        </div>

        <!-- ── Stats Grid ───────────────────────────────────────── -->
        <section class="stats-grid">
          <article class="stat-card" style="--card-hue: 222">
            <div class="stat-glow" />
            <div class="stat-icon" style="background: #eff6ff; color: #3b82f6">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 20V9M12 20V4M19 20v-7M3 20h18" />
              </svg>
            </div>
            <div class="stat-body">
              <span class="stat-value">{{ animatedStats.activePollCount }}</span>
              <span class="stat-label">Active Polls</span>
            </div>
            <div class="stat-trend up">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
              <span>Real-time</span>
            </div>
          </article>

          <article class="stat-card" style="--card-hue: 160">
            <div class="stat-glow" />
            <div class="stat-icon" style="background: #ecfdf5; color: #10b981">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 9a3 3 0 115.5 1.7c-.7.7-1.7 1.1-2.5 1.8V14" />
                <path d="M12 18h.01" />
                <path d="M4 4h16v16H4z" />
              </svg>
            </div>
            <div class="stat-body">
              <span class="stat-value">{{ animatedStats.quizzesTaken }}</span>
              <span class="stat-label">Quizzes Taken</span>
            </div>
            <div class="stat-trend up">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
              <span>Total</span>
            </div>
          </article>

          <article class="stat-card" style="--card-hue: 40">
            <div class="stat-glow" />
            <div class="stat-icon" style="background: #fffbeb; color: #f59e0b">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="12 3 14.7 8.5 20.5 9.2 16.2 13.1 17.5 19 12 16 6.5 19 7.8 13.1 3.5 9.2 9.3 8.5 12 3" />
              </svg>
            </div>
            <div class="stat-body">
              <span class="stat-value">{{ animatedStats.avgScore }}<span class="stat-pct">%</span></span>
              <span class="stat-label">Average Score</span>
            </div>
            <div class="stat-trend up">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
              <span>{{ animatedStats.avgScore >= 70 ? 'Great' : 'Improving' }}</span>
            </div>
          </article>

          <article class="stat-card" style="--card-hue: 270">
            <div class="stat-glow" />
            <div class="stat-icon" style="background: #f5f3ff; color: #8b5cf6">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 8v4l3 3" />
                <path d="M12 22a10 10 0 100-20 10 10 0 000 20z" />
              </svg>
            </div>
            <div class="stat-body">
              <span class="stat-value">{{ animatedStats.streakDays }}</span>
              <span class="stat-label">Day Streak</span>
            </div>
            <div class="stat-trend up">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
              <span>Active</span>
            </div>
          </article>
        </section>

        <!-- ── Content Split ────────────────────────────────────── -->
        <div class="content-split">
          <!-- ── Left: Active Polls ─────────────────────────────── -->
          <section class="card poll-card-section">
            <div class="card-header">
              <h2 class="card-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M5 20V9M12 20V4M19 20v-7M3 20h18" />
                </svg>
                Active Polls
              </h2>
              <button class="card-link" @click="navigateTo('/')">
                View all
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>

            <!-- Loading -->
            <div v-if="loading" class="card-state">
              <div class="loader" />
              <p>Loading polls...</p>
            </div>

            <!-- Empty -->
            <div v-else-if="activePolls.length === 0" class="card-state">
              <div class="empty-illustration">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color: #c5cbdd">
                  <path d="M5 20V9M12 20V4M19 20v-7M3 20h18" />
                </svg>
              </div>
              <h3>No Active Polls</h3>
              <p>Your teachers haven't started any polls yet. Check back soon!</p>
            </div>

            <!-- Poll List -->
            <div v-else class="poll-list">
              <div
                v-for="poll in activePolls"
                :key="poll.id"
                class="poll-item"
                @click="vote(poll)"
              >
                <div class="poll-indicator" :style="{ background: typeColors[poll.poll_type] || '#3b82f6' }" />
                <div class="poll-content">
                  <div class="poll-header">
                    <span class="poll-badge" :style="{ background: typeBgColors[poll.poll_type] || '#eff6ff', color: typeColors[poll.poll_type] || '#3b82f6' }">
                      {{ typeLabels[poll.poll_type] || poll.poll_type }}
                    </span>
                    <span class="poll-live">
                      <span class="live-dot" />
                      Live
                    </span>
                  </div>
                  <h3 class="poll-question">{{ poll.question }}</h3>
                  <p v-if="poll.title" class="poll-meta-title">{{ poll.title }}</p>
                  <div class="poll-footer">
                    <span class="poll-meta">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 6v6l4 2" />
                      </svg>
                      {{ poll.duration_minutes ? `${poll.duration_minutes} min` : 'No time limit' }}
                    </span>
                    <span class="poll-vote-btn">
                      Vote Now
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- ── Right Column ──────────────────────────────────── -->
          <div class="right-col">
            <!-- Profile Card -->
            <div class="card profile-card">
              <div class="profile-bg" />
              <div class="profile-body">
                <div class="profile-avatar">{{ studentInitials }}</div>
                <h3 class="profile-name">{{ studentName }}</h3>
                <p v-if="studentSchool" class="profile-school">{{ studentSchool }}</p>
                <p class="profile-email">{{ studentEmail }}</p>
                <div class="profile-badges">
                  <span class="profile-badge">Student</span>
                  <span v-if="stats.avgScore >= 80" class="profile-badge badge-green">Top Performer</span>
                </div>
                <button class="profile-edit-btn" @click="navigateTo('/profile')">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Edit Profile
                </button>
              </div>
            </div>

            <!-- Recent Activity -->
            <div class="card activity-card">
              <div class="card-header">
                <h2 class="card-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                  Recent Activity
                </h2>
              </div>

              <div v-if="loading" class="card-state">
                <div class="loader" />
              </div>

              <div v-else-if="gameHistory.length === 0" class="card-state">
                <div class="empty-illustration">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color: #c5cbdd">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                </div>
                <p>No recent activity yet. Start a quiz or poll to see your history here!</p>
              </div>

              <div v-else class="activity-list">
                <div
                  v-for="(item, i) in gameHistory"
                  :key="i"
                  class="activity-item"
                >
                  <div class="activity-dot" :class="item.type === 'quiz' ? 'dot-quiz' : 'dot-poll'" />
                  <div class="activity-info">
                    <strong>{{ item.name }}</strong>
                    <span class="activity-date">{{ item.date }}</span>
                  </div>
                  <span class="activity-score" :class="parseInt(item.score) >= 80 ? 'score-high' : 'score-mid'">
                    {{ item.score }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Quick Actions Strip ──────────────────────────────── -->
        <section class="quick-strip">
          <h2 class="section-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
            </svg>
            Quick Actions
          </h2>
          <div class="quick-grid">
            <button class="quick-btn" style="--btn-hue: 222" @click="navigateTo('/')">
              <span class="quick-icon" style="background: #eff6ff; color: #3b82f6">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M5 3l14 9-14 9V3z" />
                </svg>
              </span>
              <span class="quick-label">Vote on Polls</span>
              <span class="quick-arrow">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </span>
            </button>
            <button class="quick-btn" style="--btn-hue: 160" @click="navigateTo('/profile')">
              <span class="quick-icon" style="background: #ecfdf5; color: #10b981">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </span>
              <span class="quick-label">My Profile</span>
              <span class="quick-arrow">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </span>
            </button>
            <button class="quick-btn" style="--btn-hue: 40" @click="navigateTo('/tools')">
              <span class="quick-icon" style="background: #fffbeb; color: #f59e0b">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82.33 1.65 1.65 0 00-.33 1.82v.12a2 2 0 01-4 0v-.12a1.65 1.65 0 00-.33-1.82 1.65 1.65 0 00-1.82-.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82V15a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06c.53.42 1.29.5 1.82.33a1.65 1.65 0 001.15-1.64v-.12a2 2 0 014 0v.12a1.65 1.65 0 001.15 1.64c.53.17 1.29.09 1.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V15z" />
                </svg>
              </span>
              <span class="quick-label">Explore Tools</span>
              <span class="quick-arrow">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </span>
            </button>
            <button class="quick-btn" style="--btn-hue: 270" @click="navigateTo('/')">
              <span class="quick-icon" style="background: #f5f3ff; color: #8b5cf6">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M6 9H4.5a2.5 2.5 0 010-5H6" />
                  <path d="M18 9h1.5a2.5 2.5 0 000-5H18" />
                  <path d="M4 22h16" />
                  <path d="M10 22V9l-3-5h10l-3 5v13" />
                </svg>
              </span>
              <span class="quick-label">Leaderboard</span>
              <span class="quick-arrow">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </span>
            </button>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* ── CSS Variables ──────────────────────────────────────────── */
.student-dashboard {
  --primary: #1a3a8a;
  --primary-light: #3b82f6;
  --primary-soft: #eff6ff;
  --ink: #0f172a;
  --ink-secondary: #475569;
  --muted: #94a3b8;
  --line: #e2e8f0;
  --surface: #ffffff;
  --surface-soft: #f8fafc;
  --green: #10b981;
  --green-soft: #ecfdf5;
  --orange: #f59e0b;
  --orange-soft: #fffbeb;
  --violet: #8b5cf6;
  --violet-soft: #f5f3ff;
  min-height: 100vh;
  background: var(--surface-soft);
  color: var(--ink);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  position: relative;
  overflow-x: hidden;
}

/* ── Background Canvas ──────────────────────────────────────── */
.bg-canvas {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

.bg-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.08;
  animation: orb-float 12s ease-in-out infinite alternate;
}

.bg-orb--1 {
  width: 500px;
  height: 500px;
  top: -10%;
  left: -5%;
  background: #3b82f6;
  animation-delay: 0s;
}

.bg-orb--2 {
  width: 400px;
  height: 400px;
  bottom: -5%;
  right: -5%;
  background: #8b5cf6;
  animation-delay: -4s;
}

.bg-orb--3 {
  width: 300px;
  height: 300px;
  top: 40%;
  right: 30%;
  background: #10b981;
  animation-delay: -8s;
}

@keyframes orb-float {
  0% { transform: translate(0, 0) scale(1); }
  100% { transform: translate(30px, -20px) scale(1.12); }
}

.bg-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(59, 130, 246, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(59, 130, 246, 0.03) 1px, transparent 1px);
  background-size: 60px 60px;
}

/* ── Main Content ───────────────────────────────────────────── */
.main-content {
  position: relative;
  z-index: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 28px 28px 48px;
}

/* ── Greeting Banner ────────────────────────────────────────── */
.greeting-banner {
  margin-top: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 28px;
  padding: 24px 28px;
  border-radius: 16px;
  background: linear-gradient(135deg, #1a3a8a 0%, #3b82f6 100%);
  color: #fff;
  position: relative;
  overflow: hidden;
  animation: banner-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.greeting-banner::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 300px 200px at 10% 90%, rgba(255,255,255,0.08) 0%, transparent),
    radial-gradient(ellipse 200px 300px at 90% 10%, rgba(255,255,255,0.06) 0%, transparent);
  pointer-events: none;
}

@keyframes banner-in {
  0% { opacity: 0; transform: translateY(16px) scale(0.97); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}

.greeting-text {
  display: flex;
  align-items: center;
  gap: 16px;
  position: relative;
  z-index: 1;
}

.greeting-emoji {
  font-size: 36px;
  line-height: 1;
  animation: wave 2s ease-in-out infinite;
}

@keyframes wave {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-8deg); }
  75% { transform: rotate(8deg); }
}

.greeting-title {
  margin: 0;
  font-size: 24px;
  font-weight: 800;
}

.greeting-sub {
  margin: 6px 0 0;
  font-size: 14px;
  opacity: 0.8;
}

.greeting-actions {
  position: relative;
  z-index: 1;
  flex-shrink: 0;
}

.ghost-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  border: 1px solid rgba(255,255,255,0.25);
  border-radius: 10px;
  background: rgba(255,255,255,0.1);
  color: #fff;
  padding: 0 14px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  backdrop-filter: blur(4px);
}

.ghost-btn:hover {
  background: rgba(255,255,255,0.18);
  border-color: rgba(255,255,255,0.35);
}

.ghost-btn.spinning svg:first-child {
  animation: spin 0.8s linear infinite;
}

/* ── Stats Grid ─────────────────────────────────────────────── */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 28px;
  animation: fade-up 0.5s ease 0.1s both;
}

.stat-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 22px;
  border-radius: 14px;
  background: var(--surface);
  border: 1px solid var(--line);
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
  overflow: hidden;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.stat-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.07);
  border-color: rgba(59, 130, 246, 0.2);
}

.stat-glow {
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: hsl(var(--card-hue, 222), 60%, 50%);
}

.stat-icon {
  display: grid;
  width: 46px;
  height: 46px;
  place-items: center;
  border-radius: 11px;
  flex-shrink: 0;
}

.stat-body {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.stat-value {
  font-size: 26px;
  font-weight: 800;
  line-height: 1;
  color: hsl(var(--card-hue, 222), 50%, 35%);
}

.stat-pct {
  font-size: 16px;
  font-weight: 600;
  opacity: 0.6;
}

.stat-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.stat-trend {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  align-self: flex-start;
}

.stat-trend.up {
  background: var(--green-soft);
  color: var(--green);
}

/* ── Content Split ──────────────────────────────────────────── */
.content-split {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 20px;
  margin-bottom: 28px;
  animation: fade-up 0.5s ease 0.2s both;
}

@keyframes fade-up {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ── Cards ──────────────────────────────────────────────────── */
.card {
  border-radius: 16px;
  background: var(--surface);
  border: 1px solid var(--line);
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 22px;
  border-bottom: 1px solid var(--line);
}

.card-title {
  display: flex;
  align-items: center;
  gap: 9px;
  margin: 0;
  font-size: 15px;
  font-weight: 800;
  color: var(--ink);
}

.card-title svg {
  color: var(--primary-light);
}

.card-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 0;
  background: transparent;
  color: var(--primary-light);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.15s ease;
}

.card-link:hover {
  background: var(--primary-soft);
}

.card-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 180px;
  padding: 32px 24px;
  gap: 12px;
  text-align: center;
}

.card-state h3 {
  margin: 0;
  font-size: 15px;
  color: var(--ink);
}

.card-state p {
  margin: 0;
  font-size: 13px;
  color: var(--muted);
  max-width: 260px;
}

.empty-illustration {
  opacity: 0.4;
  margin-bottom: 4px;
}

.loader {
  width: 28px;
  height: 28px;
  border: 3px solid var(--line);
  border-top-color: var(--primary-light);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ── Poll Section ───────────────────────────────────────────── */
.poll-list {
  display: grid;
}

.poll-item {
  display: flex;
  gap: 0;
  cursor: pointer;
  transition: background 0.15s ease;
  border-top: 1px solid var(--line);
}

.poll-item:first-child {
  border-top: 0;
}

.poll-item:hover {
  background: #f8faff;
}

.poll-indicator {
  width: 4px;
  flex-shrink: 0;
}

.poll-content {
  flex: 1;
  padding: 18px 20px;
  display: grid;
  gap: 8px;
}

.poll-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.poll-badge {
  display: inline-flex;
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 700;
}

.poll-live {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: 999px;
  background: var(--green-soft);
  color: var(--green);
  font-size: 9px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--green);
  animation: live-pulse 2s ease-in-out infinite;
}

@keyframes live-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.poll-question {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.4;
  color: var(--ink);
}

.poll-meta-title {
  margin: 0;
  font-size: 12px;
  color: var(--muted);
}

.poll-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 4px;
}

.poll-meta {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: var(--muted);
}

.poll-vote-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 700;
  color: var(--primary-light);
  transition: gap 0.15s ease;
}

.poll-item:hover .poll-vote-btn {
  gap: 8px;
}

/* ── Right Column ───────────────────────────────────────────── */
.right-col {
  display: grid;
  gap: 20px;
  align-content: start;
}

/* ── Profile Card ───────────────────────────────────────────── */
.profile-card {
  position: relative;
}

.profile-bg {
  height: 80px;
  background: linear-gradient(135deg, #1a3a8a, #3b82f6);
}

.profile-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 0 22px 22px;
  margin-top: -32px;
}

.profile-avatar {
  display: grid;
  width: 64px;
  height: 64px;
  place-items: center;
  border-radius: 14px;
  background: linear-gradient(135deg, #1a3a8a, #3b82f6);
  color: #fff;
  font-size: 22px;
  font-weight: 800;
  border: 3px solid #fff;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.1);
  margin-bottom: 12px;
}

.profile-name {
  margin: 0;
  font-size: 17px;
  font-weight: 800;
  color: var(--ink);
}

.profile-school {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--ink-secondary);
}

.profile-email {
  margin: 2px 0 0;
  font-size: 12px;
  color: var(--muted);
}

.profile-badges {
  display: flex;
  gap: 6px;
  margin-top: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.profile-badge {
  padding: 3px 10px;
  border-radius: 6px;
  background: var(--primary-soft);
  color: var(--primary);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.profile-badge.badge-green {
  background: var(--green-soft);
  color: var(--green);
}

.profile-edit-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 14px;
  height: 36px;
  border: 1px solid var(--line);
  border-radius: 9px;
  background: transparent;
  color: var(--ink-secondary);
  padding: 0 14px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.profile-edit-btn:hover {
  background: var(--primary-soft);
  border-color: var(--primary-light);
  color: var(--primary-light);
}

/* ── Activity List ──────────────────────────────────────────── */
.activity-list {
  display: grid;
}

.activity-item {
  display: grid;
  grid-template-columns: 16px 1fr auto;
  gap: 14px;
  align-items: center;
  padding: 14px 22px;
  border-top: 1px solid var(--line);
}

.activity-item:first-child {
  border-top: 0;
}

.activity-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--primary-light);
}

.activity-dot.dot-poll {
  background: var(--green);
}

.activity-dot.dot-quiz {
  background: var(--orange);
}

.activity-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.activity-info strong {
  font-size: 13px;
  font-weight: 700;
  color: var(--ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.activity-date {
  font-size: 11px;
  color: var(--muted);
}

.activity-score {
  font-size: 13px;
  font-weight: 800;
  padding: 3px 10px;
  border-radius: 6px;
}

.score-high {
  color: var(--green);
  background: var(--green-soft);
}

.score-mid {
  color: var(--orange);
  background: var(--orange-soft);
}

/* ── Quick Strip ────────────────────────────────────────────── */
.quick-strip {
  animation: fade-up 0.5s ease 0.3s both;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 9px;
  margin: 0 0 14px;
  font-size: 15px;
  font-weight: 800;
  color: var(--ink);
}

.section-title svg {
  color: var(--primary-light);
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.quick-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 18px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--surface);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  text-align: left;
}

.quick-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.06);
  border-color: hsl(var(--btn-hue, 222), 60%, 75%);
}

.quick-icon {
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border-radius: 10px;
  flex-shrink: 0;
}

.quick-label {
  flex: 1;
  font-size: 13px;
  font-weight: 700;
  color: var(--ink);
}

.quick-arrow {
  color: var(--muted);
  transition: transform 0.15s ease;
}

.quick-btn:hover .quick-arrow {
  transform: translateX(4px);
}

/* ── Responsive ─────────────────────────────────────────────── */
@media (max-width: 1100px) {
  .content-split {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .quick-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 800px) {
  .nav-inner {
    flex-wrap: wrap;
    gap: 10px;
    padding: 10px 18px;
  }

  .nav-links {
    order: 3;
    width: 100%;
    justify-content: center;
  }

  .nav-btn {
    flex: 1;
    justify-content: center;
  }

  .nav-btn span {
    font-size: 12px;
  }

  .greeting-banner {
    flex-direction: column;
    text-align: center;
    padding: 20px;
  }

  .greeting-text {
    flex-direction: column;
  }

  .user-chip-info {
    display: none;
  }
}

@media (max-width: 600px) {
  .main-content {
    padding: 16px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .quick-grid {
    grid-template-columns: 1fr;
  }

  .greeting-title {
    font-size: 20px;
  }
}
</style>
