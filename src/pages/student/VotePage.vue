<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePollStore } from '@/stores/poll'

const route = useRoute()
const router = useRouter()
const pollStore = usePollStore()

const roomCode = ref('')
const selectedOptionId = ref<number | null>(null)
const selectedOptionIds = ref<number[]>([])
const showJoinForm = ref(true)

const isMulti = computed(() => pollStore.currentPoll?.is_multiple_choice ?? false)

function joinRoom() {
  if (!roomCode.value.trim() || roomCode.value.trim().length !== 6) return
  pollStore.fetchPollByRoomCode(roomCode.value.trim())
  showJoinForm.value = false
}

function toggleOption(id: number) {
  if (isMulti.value) {
    const idx = selectedOptionIds.value.indexOf(id)
    if (idx === -1) selectedOptionIds.value.push(id)
    else selectedOptionIds.value.splice(idx, 1)
  } else {
    selectedOptionId.value = id
  }
}

async function castVote() {
  if (!pollStore.currentPoll) return
  const ids = isMulti.value ? selectedOptionIds.value : (selectedOptionId.value != null ? [selectedOptionId.value] : [])
  if (ids.length === 0) return
  if (isMulti.value) {
    for (const id of ids) {
      await pollStore.submitVote(id)
    }
  } else {
    const optId = ids[0]
    if (optId != null) await pollStore.submitVote(optId)
  }
  if (!pollStore.error) {
    pollStore.startPolling(pollStore.currentPoll.id)
  }
}

function backToJoin() {
  pollStore.reset()
  showJoinForm.value = true
  roomCode.value = ''
  selectedOptionId.value = null
  selectedOptionIds.value = []
}

const winner = computed(() => {
  if (!pollStore.results || pollStore.results.results.length === 0) return null
  const max = Math.max(...pollStore.results.results.map(r => r.votes))
  if (max === 0) return null
  return pollStore.results.results.filter(r => r.votes === max)
})

onMounted(() => {
  const code = route.params.roomCode as string
  if (code && code.length === 6) {
    roomCode.value = code.toUpperCase()
    pollStore.fetchPollByRoomCode(code)
    showJoinForm.value = false
  }
})

onUnmounted(() => {
  pollStore.stopPolling()
})
</script>

<template>
  <div class="vote-page">
    <!-- Join Form -->
    <div v-if="showJoinForm || !pollStore.currentPoll" class="join-card">
      <div class="join-icon">📊</div>
      <h1 class="join-title">Join Live Vote</h1>
      <p class="join-subtitle">Enter the 6-character room code provided by your teacher.</p>

      <div v-if="pollStore.error" class="alert alert-error">{{ pollStore.error }}</div>

      <div class="join-input-wrap">
        <input
          v-model="roomCode"
          type="text"
          class="join-input"
          placeholder="e.g. XK4M9P"
          maxlength="6"
          @keyup.enter="joinRoom"
          @input="roomCode = roomCode.toUpperCase().replace(/[^A-Z0-9]/g, '')"
          autofocus
        />
      </div>

      <button class="btn btn-primary btn--full" :disabled="roomCode.length !== 6 || pollStore.loading" @click="joinRoom">
        {{ pollStore.loading ? 'Joining...' : 'Join Room' }}
      </button>
    </div>

    <!-- Vote / Results -->
    <div v-else class="vote-card">
      <div class="vc-header">
        <div class="vc-code-badge">Room: <strong>{{ pollStore.currentPoll.room_code }}</strong></div>
        <button class="btn btn-sm btn-ghost" @click="backToJoin">Leave</button>
      </div>

      <h1 class="vc-question">{{ pollStore.currentPoll.question }}</h1>

      <div v-if="pollStore.error" class="alert alert-error">{{ pollStore.error }}</div>

      <!-- Voting Phase -->
      <div v-if="!pollStore.hasVoted && pollStore.currentPoll.status === 'active'" class="vote-options">
        <p class="vc-hint">{{ isMulti ? 'Select one or more options' : 'Select one option' }}</p>
        <button
          v-for="opt in pollStore.currentPoll.options"
          :key="opt.id"
          :class="['vote-option', {
            selected: isMulti
              ? selectedOptionIds.includes(opt.id)
              : selectedOptionId === opt.id,
          }]"
          @click="toggleOption(opt.id)"
        >
          <span class="vote-option-text">{{ opt.option_text }}</span>
          <span v-if="isMulti" class="vote-check">{{ selectedOptionIds.includes(opt.id) ? '✓' : '' }}</span>
          <span v-else class="vote-radio">{{ selectedOptionId === opt.id ? '●' : '○' }}</span>
        </button>

        <button
          class="btn btn-primary btn--full"
          :disabled="pollStore.loading || (isMulti ? selectedOptionIds.length === 0 : selectedOptionId == null)"
          @click="castVote"
        >
          {{ pollStore.loading ? 'Submitting...' : 'Submit Vote' }}
        </button>
      </div>

      <!-- Results Phase -->
      <div v-else-if="pollStore.results" class="vote-results">
        <div class="vote-status">
          <span v-if="pollStore.currentPoll.status === 'active'" class="status-live">
            <span class="status-dot"></span> Live — {{ pollStore.results.totalVotes }} vote{{ pollStore.results.totalVotes !== 1 ? 's' : '' }}
          </span>
          <span v-else class="status-ended">Poll ended — {{ pollStore.results.totalVotes }} total votes</span>
          <span v-if="pollStore.hasVoted" class="voted-badge">✓ You voted</span>
        </div>

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

        <div v-if="winner && pollStore.currentPoll.status === 'ended'" class="winner-announce">
          🏆 <strong>{{ winner.length === 1 && winner[0] ? winner[0].option : winner.map(w => w.option).join(', ') }}</strong>
          {{ winner.length === 1 ? 'wins' : 'tie' }} with {{ winner[0]?.votes ?? 0 }} vote{{ (winner[0]?.votes ?? 0) !== 1 ? 's' : '' }}!
        </div>
      </div>

      <!-- Waiting for results -->
      <div v-else-if="pollStore.hasVoted && pollStore.currentPoll.status === 'active'" class="waiting">
        <div class="waiting-spinner"></div>
        <p>Waiting for results...</p>
      </div>

      <!-- Poll ended, no results loaded -->
      <div v-else-if="pollStore.currentPoll.status === 'ended'" class="waiting">
        <p>This poll has ended. Results are no longer available.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.vote-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: #f8fafc;
}

.join-card, .vote-card {
  width: 100%;
  max-width: 520px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 40px 32px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
}

.join-icon { text-align: center; font-size: 48px; margin-bottom: 8px; }
.join-title { text-align: center; font-size: 24px; font-weight: 800; color: #0f172a; margin: 0 0 8px; }
.join-subtitle { text-align: center; font-size: 14px; color: #64748b; margin: 0 0 24px; }

.join-input-wrap { margin-bottom: 16px; }

.join-input {
  width: 100%;
  padding: 16px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 28px;
  font-weight: 700;
  font-family: monospace;
  text-align: center;
  letter-spacing: 0.3em;
  outline: none;
  transition: border-color 0.2s;
  background: #f8fafc;
  color: #0f172a;
  text-transform: uppercase;
}

.join-input:focus { border-color: #2563eb; box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1); }

.vc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.vc-code-badge {
  font-size: 13px;
  color: #64748b;
}

.vc-code-badge strong {
  color: #2563eb;
  font-family: monospace;
  font-size: 15px;
  letter-spacing: 0.1em;
}

.vc-question {
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 24px;
  line-height: 1.3;
}

.vc-hint {
  font-size: 13px;
  color: #94a3b8;
  margin: 0 0 12px;
}

.vote-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.vote-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  text-align: left;
  width: 100%;
  font-size: 15px;
}

.vote-option:hover { border-color: #93c5fd; background: #f0f7ff; }
.vote-option.selected { border-color: #2563eb; background: #eff6ff; }
.vote-option-text { color: #1e293b; font-weight: 500; flex: 1; }
.vote-check { color: #2563eb; font-weight: 700; font-size: 18px; margin-left: 10px; }
.vote-radio { color: #2563eb; font-weight: 700; font-size: 18px; margin-left: 10px; }

.vote-results { margin-top: 8px; }

.vote-status {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  font-size: 14px;
  flex-wrap: wrap;
}

.status-live {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #16a34a;
  font-weight: 600;
}

.status-dot {
  width: 8px;
  height: 8px;
  background: #16a34a;
  border-radius: 50%;
  animation: pulse 1.5s infinite;
}

.status-ended { color: #64748b; }

.voted-badge {
  background: #dcfce7;
  color: #16a34a;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 20px;
}

.result-bar-wrap { display: flex; flex-direction: column; gap: 6px; }

.result-bar-label {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.result-bar-text { font-weight: 500; color: #1e293b; }
.result-bar-stats { color: #94a3b8; font-weight: 600; }

.result-bar-track {
  height: 32px;
  background: #f1f5f9;
  border-radius: 8px;
  overflow: hidden;
}

.result-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #2563eb, #3b82f6);
  border-radius: 8px;
  transition: width 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  min-width: 4px;
}

.result-bar-fill.winner { background: linear-gradient(90deg, #16a34a, #22c55e); }

.winner-announce {
  text-align: center;
  padding: 16px;
  background: #fefce8;
  border: 1px solid #fde68a;
  border-radius: 12px;
  font-size: 16px;
  color: #92400e;
  margin-top: 8px;
}

.waiting {
  text-align: center;
  padding: 40px 20px;
  color: #94a3b8;
}

.waiting-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e2e8f0;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 12px;
}

@keyframes spin { to { transform: rotate(360deg); } }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }

.alert { padding: 10px 14px; border-radius: 8px; font-size: 14px; font-weight: 500; margin-bottom: 16px; }
.alert-error { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 20px;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  text-decoration: none;
}

.btn-sm { padding: 8px 16px; font-size: 13px; }
.btn--full { width: 100%; }
.btn-primary { background: #2563eb; color: white; }
.btn-primary:hover { background: #1d4ed8; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-ghost { background: transparent; color: #64748b; }
.btn-ghost:hover { background: #f1f5f9; color: #0f172a; }

@media (max-width: 640px) {
  .join-card, .vote-card { padding: 28px 20px; }
  .join-input { font-size: 24px; padding: 14px; }
  .vc-question { font-size: 18px; }
}
</style>
