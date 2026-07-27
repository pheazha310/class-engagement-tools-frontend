<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { livePollService } from '@/services/livePollService'
import type { LivePoll } from '@/types/livePoll'

const router = useRouter()

// ── State ──
const allPolls = ref<LivePoll[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

// ── Computed Analytics ──
const totalPolls = computed(() => allPolls.value.length)

const activePolls = computed(() =>
  allPolls.value.filter((p) => p.status === 'active'),
)

const draftPolls = computed(() =>
  allPolls.value.filter((p) => p.status === 'draft'),
)

const totalVotes = computed(() => {
  return allPolls.value.reduce((sum, poll) => {
    const pollVotes = poll.options.reduce((optSum, opt) => optSum + (opt.votes || 0), 0)
    return sum + pollVotes
  }, 0)
})

const avgVotesPerPoll = computed(() => {
  if (totalPolls.value === 0) return 0
  return Math.round(totalVotes.value / totalPolls.value)
})

const engagementRate = computed(() => {
  // Estimate: based on active vs total poll engagement
  const nonDraft = allPolls.value.filter((p) => p.status !== 'draft')
  if (nonDraft.length === 0) return 0
  const votedPolls = nonDraft.filter((p) => {
    const pollVotes = p.options.reduce((sum, opt) => sum + (opt.votes || 0), 0)
    return pollVotes > 0
  })
  return Math.round((votedPolls.length / nonDraft.length) * 100)
})

// Recent polls (sorted by created_at, newest first)
const recentPolls = computed(() =>
  [...allPolls.value]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5),
)

// Polls for the bar chart (last 8 polls that have votes)
const chartPolls = computed(() => {
  return [...allPolls.value]
    .filter((p) => {
      const pollVotes = p.options.reduce((sum, opt) => sum + (opt.votes || 0), 0)
      return pollVotes > 0
    })
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .slice(-8)
})

const maxChartVotes = computed(() => {
  if (chartPolls.value.length === 0) return 1
  return Math.max(
    ...chartPolls.value.map((p) =>
      p.options.reduce((sum, opt) => sum + (opt.votes || 0), 0),
    ),
    1,
  )
})

// Vote distribution data for current active poll
const topOption = computed(() => {
  const active = activePolls.value[0]
  if (!active || active.options.length === 0) return null
  return [...active.options].sort((a, b) => (b.votes || 0) - (a.votes || 0))[0] || null
})

const voteDistribution = computed(() => {
  const active = activePolls.value[0]
  if (!active) return []
  const total = active.options.reduce((sum, opt) => sum + (opt.votes || 0), 0)
  if (total === 0) return []
  return active.options.map((opt) => ({
    label: opt.option_text,
    votes: opt.votes || 0,
    percentage: Math.round(((opt.votes || 0) / total) * 100),
    isTop: (opt.votes || 0) >= (topOption.value?.votes || 0) && topOption.value !== null,
  }))
})

// ── Helper functions ──
function getPollVotes(poll: LivePoll): number {
  return poll.options.reduce((sum, opt) => sum + (opt.votes || 0), 0)
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return 'var(--green)'
    case 'closed':
      return 'var(--muted)'
    case 'draft':
      return 'var(--orange)'
    default:
      return 'var(--muted)'
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'active':
      return 'Live'
    case 'closed':
      return 'Closed'
    case 'draft':
      return 'Draft'
    default:
      return status
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function goToPoll(pollId: string) {
  router.push(`/teacher/live-polls/${pollId}/results`)
}

function goToCreate() {
  router.push('/teacher/live-polls/create')
}

function goToManage() {
  router.push('/teacher/live-polls')
}

// ── Lifecycle ──
onMounted(async () => {
  try {
    const response = await livePollService.getPolls({ per_page: 50 })
    allPolls.value = response.data || []
  } catch {
    error.value = 'Could not load poll analytics.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="poll-analytics">
    <!-- Header -->
    <div class="panel-header">
      <div class="panel-title-group">
        <h2>
          <span class="pa-title-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
          Poll Analytics
        </h2>
        <span class="pa-subtitle">Real-time participation metrics</span>
      </div>
      <div class="pa-header-actions">
        <button class="ghost-button" type="button" @click="goToManage">
          <span>View All</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <button class="outline-button pa-create-btn" type="button" @click="goToCreate">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 4v16m8-8H4" />
          </svg>
          <span>New Poll</span>
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading && allPolls.length === 0" class="pa-loading">
      <div class="spinner" />
      <span>Loading analytics...</span>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="pa-error">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <span>{{ error }}</span>
    </div>

    <!-- Empty State -->
    <div v-else-if="allPolls.length === 0" class="pa-empty">
      <div class="pa-empty-icon">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3>No poll data yet</h3>
      <p>Create your first poll to see participation analytics here.</p>
      <button class="primary-button" type="button" @click="goToCreate">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 4v16m8-8H4" />
        </svg>
        <span>Create Poll</span>
      </button>
    </div>

    <!-- Analytics Content -->
    <div v-else class="pa-content">
      <!-- ──── Metrics Grid ──── -->
      <div class="pa-metrics">
        <div class="pa-metric pa-metric-total">
          <div class="pa-metric-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div class="pa-metric-body">
            <strong>{{ totalPolls }}</strong>
            <span>Total Polls</span>
          </div>
        </div>
        <div class="pa-metric pa-metric-votes">
          <div class="pa-metric-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 11l7-7 7 7M5 19l7-7 7 7" />
            </svg>
          </div>
          <div class="pa-metric-body">
            <strong>{{ totalVotes }}</strong>
            <span>Total Votes</span>
          </div>
        </div>
        <div class="pa-metric pa-metric-active">
          <div class="pa-metric-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          </div>
          <div class="pa-metric-body">
            <strong>{{ activePolls.length }}</strong>
            <span>Active Polls</span>
          </div>
        </div>
        <div class="pa-metric pa-metric-avg">
          <div class="pa-metric-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="20" x2="12" y2="10" />
              <line x1="18" y1="20" x2="18" y2="4" />
              <line x1="6" y1="20" x2="6" y2="16" />
            </svg>
          </div>
          <div class="pa-metric-body">
            <strong>{{ avgVotesPerPoll }}</strong>
            <span>Avg Votes/Poll</span>
          </div>
        </div>
        <div class="pa-metric pa-metric-engagement">
          <div class="pa-metric-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <div class="pa-metric-body">
            <strong>{{ engagementRate }}%</strong>
            <span>Engagement Rate</span>
          </div>
        </div>
        <div class="pa-metric pa-metric-draft">
          <div class="pa-metric-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </div>
          <div class="pa-metric-body">
            <strong>{{ draftPolls.length }}</strong>
            <span>Drafts</span>
          </div>
        </div>
      </div>

      <!-- ──── Two-Column Layout ──── -->
      <div class="pa-columns">
        <!-- Left: Vote Distribution Chart (Active Poll) -->
        <div class="pa-chart-section" v-if="voteDistribution.length > 0">
          <div class="pa-section-header">
            <h3>Current Vote Distribution</h3>
            <span class="pa-poll-name">{{ activePolls[0]?.title || activePolls[0]?.question }}</span>
          </div>
          <div class="pa-vote-bars">
            <div
              v-for="(item, index) in voteDistribution"
              :key="index"
              class="pa-vote-bar-row"
            >
              <div class="pa-vote-bar-label">
                <span class="pa-vote-option-text">{{ item.label }}</span>
                <span class="pa-vote-stats">
                  <strong>{{ item.votes }}</strong>
                  <span class="pa-vote-pct">{{ item.percentage }}%</span>
                </span>
              </div>
              <div class="pa-vote-bar-track">
                <div
                  class="pa-vote-bar-fill"
                  :class="{ 'pa-vote-bar-leading': item.isTop }"
                  :style="{ width: item.percentage + '%' }"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Left Empty State -->
        <div v-else class="pa-chart-section pa-chart-empty">
          <div class="pa-section-header">
            <h3>Vote Distribution</h3>
          </div>
          <div class="pa-chart-placeholder">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="20" x2="12" y2="10" />
              <line x1="18" y1="20" x2="18" y2="4" />
              <line x1="6" y1="20" x2="6" y2="16" />
            </svg>
            <p>No active polls to show vote distribution.</p>
          </div>
        </div>

        <!-- Right: Bar chart - Vote trend over recent polls -->
        <div class="pa-trend-section" v-if="chartPolls.length > 0">
          <div class="pa-section-header">
            <h3>Vote Trend</h3>
            <span class="pa-trend-count">{{ chartPolls.length }} polls</span>
          </div>
          <div class="pa-trend-chart">
            <div
              v-for="poll in chartPolls"
              :key="poll.id"
              class="pa-trend-bar-group"
            >
              <div class="pa-trend-bar-wrap">
                <div
                  class="pa-trend-bar"
                  :style="{
                    height: (getPollVotes(poll) / maxChartVotes) * 100 + '%',
                  }"
                >
                  <span class="pa-trend-bar-val">{{ getPollVotes(poll) }}</span>
                </div>
              </div>
              <span class="pa-trend-bar-label">
                {{ new Date(poll.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Right Empty State -->
        <div v-else class="pa-trend-section pa-trend-empty">
          <div class="pa-section-header">
            <h3>Vote Trend</h3>
          </div>
          <div class="pa-chart-placeholder">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            <p>Vote data will appear here after polls receive responses.</p>
          </div>
        </div>
      </div>

      <!-- ──── Recent Polls List ──── -->
      <div class="pa-recent-section">
        <div class="pa-section-header">
          <h3>Recent Polls</h3>
          <button class="link-button" type="button" @click="goToManage">View All</button>
        </div>
        <div class="pa-recent-list">
          <div
            v-for="poll in recentPolls"
            :key="poll.id"
            class="pa-recent-row"
            @click="goToPoll(poll.id)"
          >
            <div class="pa-recent-info">
              <strong class="pa-recent-title">{{ poll.title || poll.question }}</strong>
              <span class="pa-recent-meta">
                {{ formatDate(poll.created_at) }}
                <span class="pa-recent-dot">·</span>
                {{ poll.poll_type === 'multiple_choice' ? 'Multiple Choice' : poll.poll_type === 'yes_no' ? 'Yes/No' : 'Rating' }}
              </span>
            </div>
            <div class="pa-recent-right">
              <span
                class="pa-recent-badge"
                :style="{ background: getStatusColor(poll.status) + '18', color: getStatusColor(poll.status) }"
              >
                <span
                  class="pa-badge-dot"
                  :style="{ background: getStatusColor(poll.status) }"
                />
                {{ getStatusLabel(poll.status) }}
              </span>
              <span class="pa-recent-votes">
                <strong>{{ getPollVotes(poll) }}</strong>
                <span>vote{{ getPollVotes(poll) !== 1 ? 's' : '' }}</span>
              </span>
              <svg class="pa-recent-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── Root ── */
.poll-analytics {
  border: 1px solid rgba(197, 203, 221, 0.9);
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(250, 252, 255, 0.98) 100%);
  box-shadow: 0 16px 30px rgba(21, 33, 72, 0.08);
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 72px;
  padding: 0 26px;
  border-bottom: 1px solid #e8edf8;
}

.panel-title-group {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.panel-header h2 {
  margin: 0;
  font-size: 17px;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--ink);
}

.pa-title-icon {
  display: inline-grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border-radius: 8px;
  background: var(--green-soft);
  color: var(--green);
}

.pa-subtitle {
  font-size: 12px;
  color: var(--muted);
  font-weight: 600;
  display: none;
}

@media (min-width: 980px) {
  .pa-subtitle {
    display: inline;
  }
}

.pa-header-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.pa-create-btn {
  min-height: 34px;
  font-size: 12px;
}

/* ── Loading / Error / Empty ── */
.pa-loading,
.pa-error,
.pa-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 200px;
  padding: 32px 24px;
  text-align: center;
}

.pa-error {
  color: var(--red);
  flex-direction: row;
  min-height: 80px;
}

.pa-empty-icon {
  width: 60px;
  height: 60px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--green-soft);
  color: var(--green);
}

.pa-empty h3 {
  margin: 0;
  font-size: 18px;
  color: var(--ink);
}

.pa-empty p {
  margin: 0;
  color: var(--muted);
}

/* ── Content ── */
.pa-content {
  padding: 24px 26px;
}

/* ── Metrics Grid ── */
.pa-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.pa-metric {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 14px;
  border-radius: 12px;
  background: #f8faff;
  border: 1px solid #e8edf8;
  transition: all 0.2s ease;
}

.pa-metric:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(21, 33, 72, 0.06);
}

.pa-metric-icon {
  display: inline-grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border-radius: 10px;
  flex-shrink: 0;
}

.pa-metric-total .pa-metric-icon {
  background: var(--primary-soft);
  color: var(--primary);
}

.pa-metric-votes .pa-metric-icon {
  background: var(--green-soft);
  color: var(--green);
}

.pa-metric-active .pa-metric-icon {
  background: var(--red-soft);
  color: var(--red);
}

.pa-metric-avg .pa-metric-icon {
  background: #eef2ff;
  color: #6366F1;
}

.pa-metric-engagement .pa-metric-icon {
  background: #fff7e7;
  color: #f07800;
}

.pa-metric-draft .pa-metric-icon {
  background: #f0e8fe;
  color: #8d35ff;
}

.pa-metric-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.pa-metric-body strong {
  font-size: 20px;
  line-height: 1.1;
  font-weight: 900;
  color: var(--ink);
}

.pa-metric-body span {
  font-size: 11px;
  font-weight: 700;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

/* ── Two-Column Layout ── */
.pa-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  margin-bottom: 24px;
}

.pa-chart-section,
.pa-trend-section {
  border: 1px solid #e8edf8;
  border-radius: 14px;
  padding: 18px;
  background: #fafcff;
}

.pa-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 16px;
}

.pa-section-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 800;
  color: var(--ink);
}

.pa-poll-name {
  font-size: 11px;
  color: var(--muted);
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 140px;
}

.pa-trend-count {
  font-size: 11px;
  color: var(--muted);
  font-weight: 700;
  background: #eef3ff;
  padding: 2px 8px;
  border-radius: 999px;
}

/* ── Vote Bars ── */
.pa-vote-bars {
  display: grid;
  gap: 12px;
}

.pa-vote-bar-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.pa-vote-bar-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 12px;
}

.pa-vote-option-text {
  color: var(--ink);
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pa-vote-stats {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.pa-vote-stats strong {
  font-size: 14px;
  color: var(--primary);
}

.pa-vote-pct {
  font-size: 11px;
  color: var(--muted);
  font-weight: 600;
}

.pa-vote-bar-track {
  height: 8px;
  border-radius: 999px;
  background: #e8edf8;
  overflow: hidden;
}

.pa-vote-bar-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--primary), #2d4ec4);
  transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.pa-vote-bar-leading {
  background: linear-gradient(90deg, var(--green), #22C55E);
}

/* ── Chart Placeholder ── */
.pa-chart-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 32px 16px;
  color: var(--muted);
  text-align: center;
}

.pa-chart-placeholder p {
  margin: 0;
  font-size: 13px;
  line-height: 1.4;
}

/* ── Trend Bar Chart ── */
.pa-trend-chart {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  height: 140px;
}

.pa-trend-bar-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  gap: 6px;
  min-width: 0;
}

.pa-trend-bar-wrap {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  height: 110px;
  width: 100%;
}

.pa-trend-bar {
  width: 100%;
  max-width: 48px;
  border-radius: 6px 6px 0 0;
  background: linear-gradient(180deg, var(--primary), #2d4ec4);
  min-height: 4px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 4px;
  transition: height 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
}

.pa-trend-bar:hover {
  filter: brightness(1.1);
  box-shadow: 0 4px 12px rgba(0, 31, 158, 0.3);
}

.pa-trend-bar-val {
  font-size: 9px;
  font-weight: 800;
  color: #fff;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.pa-trend-bar:hover .pa-trend-bar-val {
  opacity: 1;
}

.pa-trend-bar-label {
  font-size: 9px;
  color: var(--muted);
  font-weight: 600;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

/* ── Recent Polls ── */
.pa-recent-section {
  border: 1px solid #e8edf8;
  border-radius: 14px;
  overflow: hidden;
}

.pa-recent-section .pa-section-header {
  padding: 14px 18px;
  margin-bottom: 0;
  border-bottom: 1px solid #e8edf8;
}

.pa-recent-list {
  display: flex;
  flex-direction: column;
}

.pa-recent-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 18px;
  cursor: pointer;
  transition: background 0.15s ease;
  border-bottom: 1px solid #f0f3fa;
}

.pa-recent-row:last-child {
  border-bottom: 0;
}

.pa-recent-row:hover {
  background: #f5f8ff;
}

.pa-recent-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
  flex: 1;
}

.pa-recent-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pa-recent-meta {
  font-size: 11px;
  color: var(--muted);
  font-weight: 600;
}

.pa-recent-dot {
  margin: 0 6px;
}

.pa-recent-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.pa-recent-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
}

.pa-badge-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
}

.pa-recent-votes {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--muted);
}

.pa-recent-votes strong {
  font-size: 14px;
  color: var(--primary);
}

.pa-recent-chevron {
  color: var(--muted);
  opacity: 0.4;
  transition: all 0.2s ease;
}

.pa-recent-row:hover .pa-recent-chevron {
  opacity: 1;
  color: var(--primary);
  transform: translateX(2px);
}

/* ── Responsive ── */
@media (max-width: 1280px) {
  .pa-metrics {
    grid-template-columns: repeat(3, 1fr);
  }

  .pa-columns {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 980px) {
  .pa-metrics {
    grid-template-columns: repeat(2, 1fr);
  }

  .panel-header {
    flex-direction: column;
    align-items: flex-start;
    padding: 18px 18px;
  }

  .pa-header-actions {
    width: 100%;
  }

  .pa-header-actions .ghost-button,
  .pa-header-actions .outline-button {
    flex: 1;
  }
}

@media (max-width: 720px) {
  .pa-metrics {
    grid-template-columns: 1fr;
  }

  .pa-content {
    padding: 18px;
  }

  .pa-recent-right {
    gap: 8px;
  }

  .pa-recent-badge {
    display: none;
  }
}
</style>
