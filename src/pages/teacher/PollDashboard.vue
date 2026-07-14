<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { usePollStore } from '@/stores/poll'
import QRCodeModal from '@/components/QRCodeModal.vue'
import type { QrCodeData } from '@/types/poll'

const route = useRoute()
const pollStore = usePollStore()

const question = ref('')
const options = ref<string[]>(['', ''])
const optionsCorrect = ref<boolean[]>([])
const isMultipleChoice = ref(false)
const durationMinutes = ref<number | null>(null)
const isAnonymous = ref(false)
const isQuiz = ref(false)
const isOpenText = ref(false)
const maxPoints = ref<number | null>(null)
const showCreateForm = ref(false)
const selectedPollId = ref<number | null>(null)
const tabParam = (route.query.tab as string) || 'active'
const selectedTab = ref<'active' | 'draft' | 'ended'>(tabParam === 'draft' ? 'draft' : tabParam === 'ended' ? 'ended' : 'active')
const createError = ref<string | null>(null)
const qrCodeData = ref<QrCodeData | null>(null)
const showQrModal = ref(false)

function addOption() {
  if (options.value.length < 6) {
    options.value.push('')
    optionsCorrect.value.push(false)
  }
}

function removeOption(index: number) {
  if (options.value.length > 2) {
    options.value.splice(index, 1)
    optionsCorrect.value.splice(index, 1)
  }
}

async function handleCreate() {
  createError.value = null
  if (!question.value.trim()) { createError.value = 'Question is required'; return }
  const validOptions = isOpenText.value ? [] : options.value.map(o => o.trim()).filter(Boolean)
  if (!isOpenText.value && validOptions.length < 2) { createError.value = 'At least 2 options required'; return }
  const poll = await pollStore.createPoll({
    question: question.value.trim(),
    options: validOptions,
    is_multiple_choice: isMultipleChoice.value,
    duration_minutes: durationMinutes.value,
    is_anonymous: isAnonymous.value,
    is_quiz: isQuiz.value,
    is_open_text: isOpenText.value,
    max_points: isOpenText.value ? null : maxPoints.value,
    options_correct: isQuiz.value && !isOpenText.value ? optionsCorrect.value : undefined,
  })
  if (poll) {
    question.value = ''
    options.value = ['', '']
    optionsCorrect.value = []
    isMultipleChoice.value = false
    durationMinutes.value = null
    isAnonymous.value = false
    isQuiz.value = false
    isOpenText.value = false
    maxPoints.value = null
    showCreateForm.value = false
  }
}

async function showQrCode(pollId: number) {
  try {
    const data = await pollStore.apiCall<QrCodeData>(`/api/polls/${pollId}/qr`)
    qrCodeData.value = data
    showQrModal.value = true
  } catch {
    // ignore
  }
}

async function handleStart(pollId: number) {
  await pollStore.startPoll(pollId)
}

async function handleEnd(pollId: number) {
  await pollStore.endPoll(pollId)
  if (selectedPollId.value === pollId) {
    await pollStore.fetchResults(pollId)
    pollStore.stopPolling()
  }
}

async function handleDelete(pollId: number) {
  if (confirm('Delete this poll? This cannot be undone.')) {
    await pollStore.deletePoll(pollId)
    if (selectedPollId.value === pollId) {
      selectedPollId.value = null
      pollStore.results = null
    }
  }
}

function viewResults(pollId: number) {
  selectedPollId.value = pollId
  pollStore.fetchResults(pollId)
  const poll = pollStore.polls.find(p => p.id === pollId)
  if (poll?.status === 'active') {
    pollStore.startPolling(pollId)
  }
}

function closeResults() {
  selectedPollId.value = null
  pollStore.results = null
  pollStore.stopPolling()
}

onMounted(() => {
  pollStore.fetchTeacherPolls()
})

onUnmounted(() => {
  pollStore.stopPolling()
})
</script>

<template>
  <div class="poll-dashboard">
    <div class="pd-header">
      <h1 class="pd-title">Live Voting</h1>
      <button class="btn btn-primary" @click="showCreateForm = !showCreateForm">
        {{ showCreateForm ? 'Cancel' : '+ New Poll' }}
      </button>
    </div>

    <!-- Create Poll Form -->
    <div v-if="showCreateForm" class="create-form">
      <h2 class="cf-title">Create New Poll</h2>
      <div v-if="createError" class="alert alert-error">{{ createError }}</div>

      <label class="form-group">
        <span class="form-label">Question</span>
        <input v-model="question" type="text" class="input" placeholder="e.g. What is your favorite programming language?" maxlength="500" />
      </label>

      <!-- Poll Settings -->
      <div class="form-group">
        <span class="form-label">Poll Settings</span>
        <div class="form-row">
          <label class="form-group form-group--inline">
            <input v-model="isMultipleChoice" type="checkbox" class="checkbox" />
            <span class="form-label">Multiple choice</span>
          </label>
          <label class="form-group form-group--inline">
            <input v-model="isAnonymous" type="checkbox" class="checkbox" />
            <span class="form-label">Anonymous</span>
          </label>
          <label class="form-group form-group--inline">
            <input v-model="isQuiz" type="checkbox" class="checkbox" />
            <span class="form-label">Quiz mode</span>
          </label>
          <label class="form-group form-group--inline">
            <input v-model="isOpenText" type="checkbox" class="checkbox" />
            <span class="form-label">Open text</span>
          </label>
        </div>
        <div v-if="!isOpenText" class="form-row" style="margin-top:8px">
          <label class="form-group form-group--inline">
            <span class="form-label">Max points</span>
            <input v-model.number="maxPoints" type="number" class="input input--sm" min="1" max="100" placeholder="1" />
          </label>
          <label class="form-group form-group--inline">
            <span class="form-label">Duration (min)</span>
            <input v-model.number="durationMinutes" type="number" class="input input--sm" min="1" max="120" placeholder="Optional" />
          </label>
        </div>
      </div>

      <!-- Options -->
      <div v-if="!isOpenText" class="form-group">
        <span class="form-label">Options ({{ options.length }}/6)</span>
        <div v-for="(opt, i) in options" :key="i" class="option-row">
          <input v-model="options[i]" type="text" class="input" :placeholder="`Option ${i + 1}`" maxlength="255" />
          <button v-if="isQuiz" type="button" class="btn btn-sm" :class="optionsCorrect[i] ? 'btn-primary' : 'btn-ghost'" @click="optionsCorrect[i] = !optionsCorrect[i]">
            {{ optionsCorrect[i] ? '✓' : 'Mark' }}
          </button>
          <button v-if="options.length > 2" class="btn-icon btn-remove" @click="removeOption(i)" title="Remove">✕</button>
        </div>
        <button v-if="options.length < 6" class="btn btn-sm btn-ghost" @click="addOption">+ Add option</button>
      </div>

      <div v-if="isOpenText" class="alert" style="background:#f0f9ff;color:#0369a1;border:1px solid #bae6fd">
        Open text mode: students submit free-text responses.
      </div>

      <button class="btn btn-primary" :disabled="pollStore.loading" @click="handleCreate">
        {{ pollStore.loading ? 'Creating...' : 'Create Poll' }}
      </button>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button :class="['tab', { active: selectedTab === 'active' }]" @click="selectedTab = 'active'">
        Active ({{ pollStore.activePolls.length }})
      </button>
      <button :class="['tab', { active: selectedTab === 'draft' }]" @click="selectedTab = 'draft'">
        Drafts ({{ pollStore.draftPolls.length }})
      </button>
      <button :class="['tab', { active: selectedTab === 'ended' }]" @click="selectedTab = 'ended'">
        History ({{ pollStore.endedPolls.length }})
      </button>
    </div>

    <!-- Results Panel -->
    <div v-if="selectedPollId && pollStore.results" class="results-panel">
      <div class="rp-header">
        <h2 class="rp-title">{{ pollStore.results.question }}</h2>
        <button class="btn btn-sm btn-ghost" @click="closeResults">✕ Close</button>
      </div>
      <p class="rp-meta">
        {{ pollStore.results.totalVotes }} vote{{ pollStore.results.totalVotes !== 1 ? 's' : '' }}
        <span v-if="pollStore.results.status === 'active'" class="badge badge-live">Live</span>
        <span v-else class="badge badge-ended">Ended</span>
      </p>
      <div class="results-list">
        <div v-for="r in pollStore.results.results" :key="r.id" class="result-bar-wrap">
          <div class="result-bar-label">
            <span class="result-bar-text">{{ r.option }}</span>
            <span class="result-bar-stats">{{ r.votes }} ({{ r.percentage }}%)</span>
          </div>
          <div class="result-bar-track">
            <div class="result-bar-fill" :style="{ width: r.percentage + '%' }" :class="{ winner: r.percentage > 0 && r.percentage === Math.max(...pollStore.results.results.map(x => x.percentage)) }"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error display -->
    <div v-if="pollStore.error" class="alert alert-error">{{ pollStore.error }}</div>

    <!-- Poll List -->
    <div v-if="pollStore.loading && pollStore.polls.length === 0" class="loading">Loading polls...</div>
    <div v-else-if="pollStore[`${selectedTab}Polls`]?.length === 0" class="empty">
      No {{ selectedTab }} polls yet.
    </div>
    <div v-else class="poll-list">
      <div v-for="poll in pollStore[`${selectedTab}Polls`]" :key="poll.id" class="poll-card">
        <div class="poll-card-body">
          <div class="poll-card-top">
            <h3 class="poll-card-title">{{ poll.question }}</h3>
            <span :class="['badge', `badge-${poll.status}`]">{{ poll.status }}</span>
          </div>
          <div class="poll-card-meta">
            <span>{{ poll.options?.length || 0 }} options</span>
            <span v-if="poll.is_multiple_choice">Multiple choice</span>
            <span v-if="poll.room_code" class="room-code">Code: <strong>{{ poll.room_code }}</strong></span>
            <span v-if="poll.participant_count != null">{{ poll.participant_count }} participant{{ poll.participant_count !== 1 ? 's' : '' }}</span>
          </div>
        </div>
        <div class="poll-card-actions">
          <button v-if="poll.status === 'draft'" class="btn btn-sm btn-primary" @click="handleStart(poll.id)">Start</button>
          <button v-if="poll.status === 'active'" class="btn btn-sm btn-warning" @click="handleEnd(poll.id)">End</button>
          <button class="btn btn-sm btn-ghost" @click="viewResults(poll.id)">Results</button>
          <button v-if="poll.status !== 'ended'" class="btn btn-sm btn-ghost" @click="showQrCode(poll.id)">QR</button>
          <button v-if="poll.status === 'draft'" class="btn btn-sm btn-danger" @click="handleDelete(poll.id)">Delete</button>
        </div>
      </div>
    </div>
  </div>

<QRCodeModal
    v-if="qrCodeData"
    :show="showQrModal"
    :join-url="qrCodeData.join_url"
    :room-code="qrCodeData.room_code"
    @close="showQrModal = false"
  />
</template>

<style scoped>
.poll-dashboard {
  min-height: 100vh;
  padding: 88px 24px 40px;
  max-width: 800px;
  margin: 0 auto;
}

.pd-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.pd-title {
  font-size: 28px;
  font-weight: 800;
  color: #0f172a;
}

.create-form {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.cf-title {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group--inline {
  flex-direction: row;
  align-items: center;
  gap: 8px;
}

.form-row {
  display: flex;
  gap: 16px;
  align-items: flex-end;
  flex-wrap: wrap;
}

.form-label {
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.input {
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
  background: #fff;
  color: #0f172a;
}

.input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1); }

.input--sm { width: 100px; }

.option-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.option-row .input { flex: 1; }

.checkbox {
  width: 18px;
  height: 18px;
  accent-color: #2563eb;
  cursor: pointer;
}

.alert {
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
}

.alert-error { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }

.tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 16px;
  background: #f1f5f9;
  border-radius: 10px;
  padding: 4px;
}

.tab {
  flex: 1;
  padding: 10px 16px;
  border: none;
  background: transparent;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
}

.tab.active {
  background: white;
  color: #0f172a;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}

.poll-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.poll-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  transition: box-shadow 0.2s;
}

.poll-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.06); }

.poll-card-body { flex: 1; min-width: 0; }

.poll-card-top {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.poll-card-title {
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.poll-card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 13px;
  color: #94a3b8;
}

.room-code strong {
  color: #2563eb;
  font-family: monospace;
  font-size: 15px;
  letter-spacing: 0.1em;
}

.poll-card-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.badge-draft { background: #f1f5f9; color: #64748b; }
.badge-active { background: #dcfce7; color: #16a34a; }
.badge-ended { background: #fef3c7; color: #d97706; }
.badge-live { background: #dcfce7; color: #16a34a; animation: pulse 2s infinite; }
.badge-ended { background: #f1f5f9; color: #64748b; }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  font-family: inherit;
}

.btn-sm { padding: 6px 14px; font-size: 13px; }
.btn-primary { background: #2563eb; color: white; }
.btn-primary:hover { background: #1d4ed8; }
.btn-warning { background: #f59e0b; color: white; }
.btn-warning:hover { background: #d97706; }
.btn-danger { background: #ef4444; color: white; }
.btn-danger:hover { background: #dc2626; }
.btn-ghost { background: transparent; color: #64748b; }
.btn-ghost:hover { background: #f1f5f9; color: #0f172a; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  background: #fef2f2;
  color: #ef4444;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s;
}
.btn-icon:hover { background: #fee2e2; }

.loading, .empty {
  text-align: center;
  padding: 60px 20px;
  color: #94a3b8;
  font-size: 15px;
}

/* Results Panel */
.results-panel {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
}

.rp-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.rp-title {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.rp-meta {
  font-size: 14px;
  color: #64748b;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.result-bar-wrap {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.result-bar-label {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.result-bar-text {
  font-weight: 500;
  color: #1e293b;
}

.result-bar-stats {
  color: #94a3b8;
  font-weight: 600;
}

.result-bar-track {
  height: 28px;
  background: #f1f5f9;
  border-radius: 6px;
  overflow: hidden;
}

.result-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #2563eb, #3b82f6);
  border-radius: 6px;
  transition: width 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  min-width: 4px;
}

.result-bar-fill.winner {
  background: linear-gradient(90deg, #16a34a, #22c55e);
}

@media (max-width: 640px) {
  .poll-dashboard { padding: 80px 16px 32px; }
  .poll-card { flex-direction: column; align-items: stretch; }
  .poll-card-actions { justify-content: flex-end; }
  .pd-header { flex-direction: column; gap: 12px; align-items: stretch; }
  .form-row { flex-direction: column; }
}
</style>
