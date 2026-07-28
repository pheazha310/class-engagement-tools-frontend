<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import TeacherLayout from '@/components/teacher/TeacherLayout.vue'
import TeacherIcon from '@/components/teacher/TeacherIcon.vue'
import { pollService } from '@/services/pollService'
import type { PollResultsData, PollResult } from '@/types/poll'
import { showNotification } from '@/utils/notifications'

const router = useRouter()
const route = useRoute()

const loading = ref(true)
const data = ref<PollResultsData | null>(null)
const pollId = ref('')
const refreshInterval = ref<ReturnType<typeof setInterval> | null>(null)

const hasResults = computed(() => data.value && data.value.totalVotes > 0)
const results = computed<PollResult[]>(() => data.value?.results || [])
const maxVotes = computed(() => Math.max(...results.value.map((r) => r.votes), 1))
const isLive = computed(() => data.value?.status === 'active')

async function fetchResults() {
  if (!pollId.value) return
  try {
    const res = await pollService.getResults(pollId.value)
    data.value = res
  } catch {
    showNotification('Failed to load results.', 'error')
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.push('/teacher/live-polls')
}

onMounted(async () => {
  pollId.value = route.params.id as string
  await fetchResults()
  if (data.value?.status === 'active') {
    refreshInterval.value = setInterval(fetchResults, 5000)
  }
})

onUnmounted(() => {
  if (refreshInterval.value) clearInterval(refreshInterval.value)
})
</script>

<template>
  <TeacherLayout sidebar-active="live-polls" page-title="Poll Results" page-subtitle="View real-time results and responses.">
    <div v-if="loading" class="loading-state"><div class="spinner"></div><p>Loading results...</p></div>

    <template v-else-if="data">
      <div class="results-header">
        <div class="results-header-left">
          <button class="outline-button" type="button" @click="goBack"><TeacherIcon icon="chevronLeft" :size="18" /><span>Back to Polls</span></button>
          <div class="results-title-group">
            <h2 class="results-question">{{ data.question }}</h2>
            <div class="results-meta">
              <span class="results-meta-item"><TeacherIcon icon="users" :size="16" />{{ data.totalVotes }} vote{{ data.totalVotes !== 1 ? 's' : '' }}</span>
              <mark :class="data.status === 'active' ? 'live' : 'ended'">{{ data.status === 'active' ? 'LIVE' : 'Ended' }}</mark>
            </div>
          </div>
        </div>
      </div>

      <div v-if="!hasResults" class="empty-state">
        <div class="empty-icon"><TeacherIcon icon="poll" :size="56" /></div>
        <h3>No votes yet</h3>
        <p>Waiting for participants to submit their responses.</p>
      </div>

      <div v-else-if="data.is_open_text" class="open-text-section">
        <div class="section-title-bar"><h3 class="section-title">Text Responses</h3></div>
        <div class="text-responses">
          <div v-for="(item, idx) in results" :key="idx" class="text-response-card">
            <p class="text-response-content">{{ item.text || item.option }}</p>
          </div>
        </div>
      </div>

      <div v-else class="results-chart-section">
        <div class="section-title-bar"><h3 class="section-title">Results</h3></div>
        <div class="bar-chart">
          <div v-for="(r, idx) in results" :key="idx" class="bar-row">
            <div class="bar-label">
              <span class="bar-option-label">{{ String.fromCharCode(65 + idx) }}</span>
              <span class="bar-option-text">{{ r.option }}</span>
            </div>
            <div class="bar-track">
              <div class="bar-fill" :style="{ width: (r.votes / maxVotes) * 100 + '%' }" :class="{ 'bar-correct': r.is_correct }"></div>
            </div>
            <div class="bar-stats">
              <span class="bar-votes">{{ r.votes }}</span>
              <span class="bar-pct">{{ r.percentage.toFixed(1) }}%</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="data.quiz_summary" class="quiz-summary-section">
        <div class="section-title-bar"><h3 class="section-title">Quiz Summary</h3></div>
        <div class="quiz-stats-grid">
          <div class="quiz-stat-card">
            <div class="quiz-stat-value">{{ data.quiz_summary.correct_percentage.toFixed(1) }}%</div>
            <div class="quiz-stat-label">Correct</div>
          </div>
          <div class="quiz-stat-card">
            <div class="quiz-stat-value">{{ data.quiz_summary.correct_votes }} / {{ data.quiz_summary.total_votes }}</div>
            <div class="quiz-stat-label">Accuracy</div>
          </div>
        </div>
        <div v-if="data.quiz_summary.correct_students?.length" class="correct-students">
          <h4>Correct Responses</h4>
          <ul>
            <li v-for="s in data.quiz_summary.correct_students" :key="s.student_id">{{ s.student_name }}</li>
          </ul>
        </div>
      </div>
    </template>
  </TeacherLayout>
</template>

<style scoped>
.results-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
.results-header-left { display: flex; flex-direction: column; gap: 12px; }
.results-title-group { display: flex; flex-direction: column; gap: 8px; }
.results-question { margin: 0; font-size: 22px; font-weight: 800; color: var(--ink); }
.results-meta { display: flex; align-items: center; gap: 12px; }
.results-meta-item { display: flex; align-items: center; gap: 6px; font-size: 14px; color: var(--muted); }
.results-meta mark { font-size: 11px; padding: 3px 10px; border-radius: 5px; font-weight: 800; text-transform: uppercase; }
.results-meta mark.live { background: #dcfce7; color: #16a34a; animation: pulse 2s infinite; }
.results-meta mark.ended { background: #f1f5f9; color: #64748b; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .6; } }
.section-title-bar { margin-bottom: 16px; }
.section-title { margin: 0; font-size: 16px; font-weight: 700; color: var(--ink); }
.bar-chart { display: flex; flex-direction: column; gap: 14px; }
.bar-row { display: flex; align-items: center; gap: 14px; }
.bar-label { display: flex; align-items: center; gap: 10px; min-width: 180px; flex-shrink: 0; }
.bar-option-label { width: 26px; height: 26px; display: grid; place-items: center; border-radius: 50%; background: var(--primary-soft); color: var(--primary); font-size: 12px; font-weight: 800; }
.bar-option-text { font-size: 14px; font-weight: 600; color: var(--ink); }
.bar-track { flex: 1; height: 24px; background: #eef3ff; border-radius: 12px; overflow: hidden; }
.bar-fill { height: 100%; background: var(--primary); border-radius: 12px; transition: width .5s cubic-bezier(.16,1,.3,1); min-width: 0; }
.bar-fill.bar-correct { background: #22c55e; }
.bar-stats { display: flex; align-items: center; gap: 10px; min-width: 80px; justify-content: flex-end; }
.bar-votes { font-size: 14px; font-weight: 800; color: var(--ink); }
.bar-pct { font-size: 12px; color: var(--muted); font-weight: 600; }
.open-text-section, .results-chart-section, .quiz-summary-section { background: #fff; border: 1px solid var(--line); border-radius: 12px; padding: 24px; margin-bottom: 20px; }
.text-responses { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
.text-response-card { padding: 16px; background: #fafcff; border: 1px solid #e6eaf3; border-radius: 10px; }
.text-response-content { margin: 0; font-size: 14px; line-height: 1.5; color: var(--ink); }
.quiz-stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; margin-bottom: 20px; }
.quiz-stat-card { padding: 20px; text-align: center; background: #fafcff; border: 1px solid #e6eaf3; border-radius: 10px; }
.quiz-stat-value { font-size: 28px; font-weight: 800; color: var(--ink); }
.quiz-stat-label { font-size: 13px; color: var(--muted); margin-top: 4px; }
.correct-students h4 { font-size: 14px; font-weight: 700; color: var(--ink); margin: 0 0 10px; }
.correct-students ul { margin: 0; padding: 0; list-style: none; display: flex; flex-wrap: wrap; gap: 8px; }
.correct-students li { background: #dcfce7; color: #16a34a; padding: 4px 12px; border-radius: 6px; font-size: 13px; font-weight: 600; }
.empty-state { text-align: center; padding: 60px 20px; }
.empty-icon { color: var(--muted); margin-bottom: 16px; }
.empty-state h3 { margin: 0 0 8px; font-size: 18px; color: var(--ink); }
.empty-state p { margin: 0; color: var(--muted); font-size: 15px; }
.loading-state { text-align: center; padding: 60px 20px; }
.spinner { width: 32px; height: 32px; border: 3px solid #e6eaf3; border-top-color: var(--primary); border-radius: 50%; animation: spin .6s linear infinite; margin: 0 auto 12px; }
@keyframes spin { to { transform: rotate(360deg); } }
.outline-button { display: inline-flex; align-items: center; gap: 6px; padding: 8px 18px; border: 1px solid #d0d5e0; border-radius: 8px; background: #fff; color: var(--ink); font-size: 14px; font-weight: 600; cursor: pointer; transition: all .15s; }
.outline-button:hover { border-color: var(--primary); color: var(--primary); }
</style>
