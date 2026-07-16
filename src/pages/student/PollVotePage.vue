<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePollStore, type Poll } from '@/stores/poll'
import LivePollChart from '@/components/LivePollChart.vue'

const route = useRoute()
const router = useRouter()
const pollStore = usePollStore()

const selectedOptionId = ref<number | null>(null)
const selectedOptionIds = ref<number[]>([])
const selectedPoints = ref<number>(1)
const textResponse = ref('')
const loading = ref(false)
const localError = ref<string | null>(null)

const pollId = computed(() => Number(route.params.id))

const isMulti = computed(() => pollStore.currentPoll?.is_multiple_choice ?? false)
const isWeighted = computed(() => (pollStore.currentPoll?.max_points ?? 0) > 0)
const isOpenText = computed(() => !!pollStore.currentPoll?.is_open_text)

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
  loading.value = true
  localError.value = null

  if (isOpenText.value) {
    if (!textResponse.value.trim()) {
      loading.value = false
      return
    }
    await pollStore.submitVote(null, undefined, textResponse.value.trim())
  } else {
    const ids = isMulti.value ? selectedOptionIds.value : (selectedOptionId.value != null ? [selectedOptionId.value] : [])
    if (ids.length === 0) {
      loading.value = false
      return
    }

    if (isMulti.value) {
      for (const id of ids) {
        await pollStore.submitVote(id, isWeighted.value ? selectedPoints.value : undefined)
      }
    } else {
      const optId = ids[0]
      if (optId != null) await pollStore.submitVote(optId, isWeighted.value ? selectedPoints.value : undefined)
    }
  }

  loading.value = false

  if (!pollStore.error) {
    pollStore.startPolling(pollStore.currentPoll.id)
  }
}

const winner = computed(() => {
  if (!pollStore.results || pollStore.results.results.length === 0) return null
  const max = Math.max(...pollStore.results.results.map((r: any) => r.votes))
  if (max === 0) return null
  return pollStore.results.results.filter((r: any) => r.votes === max)
})

onMounted(async () => {
  try {
    const data = await pollStore.apiCall<{ data: Poll }>(`/api/polls/${pollId.value}`)
    pollStore.currentPoll = data.data
  } catch (err) {
    localError.value = 'Failed to load poll.'
  }
})

onUnmounted(() => {
  pollStore.stopPolling()
})
</script>

<template>
  <div class="poll-vote-page">
    <div v-if="localError" class="error-state">
      <p>{{ localError }}</p>
      <button class="btn btn-primary" @click="router.push({ name: 'teacher-polls' })">
        Back to polls
      </button>
    </div>

    <div v-else-if="!pollStore.currentPoll" class="loading-state">
      <div class="spinner"></div>
      <p>Loading poll...</p>
    </div>

    <div v-else class="vote-card">
      <div class="vc-header">
        <h1 class="vc-question">{{ pollStore.currentPoll.question }}</h1>
        <span :class="['badge', `badge-${pollStore.currentPoll.status}`]">
          {{ pollStore.currentPoll.status }}
        </span>
      </div>

      <div v-if="pollStore.error" class="alert alert-error">{{ pollStore.error }}</div>

      <!-- Voting phase -->
      <div v-if="!pollStore.hasVoted && pollStore.currentPoll.status === 'active'" class="vote-section">
        <!-- Open Text Mode -->
        <template v-if="isOpenText">
          <textarea
            v-model="textResponse"
            rows="4"
            class="block w-full rounded-lg border border-gray-300 px-4 py-3 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            placeholder="Type your response here..."
            maxlength="1000"
          ></textarea>
          <p class="text-xs text-gray-400">{{ textResponse.length }}/1000</p>
        </template>

        <!-- Standard Options -->
        <template v-else>
          <p class="vc-hint">{{ isMulti ? 'Select one or more options' : 'Select one option' }}</p>
          <div class="vote-options">
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
              <span v-if="opt.is_correct" class="text-xs text-green-600 font-medium ml-2">(Correct)</span>
              <span v-if="isMulti" class="vote-check">{{ selectedOptionIds.includes(opt.id) ? '✓' : '' }}</span>
              <span v-else class="vote-radio">{{ selectedOptionId === opt.id ? '●' : '○' }}</span>
            </button>
          </div>

          <!-- Weighted Points -->
          <div v-if="isWeighted" class="mt-2">
            <label class="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-400">
              Points: <strong class="text-indigo-600">{{ selectedPoints }}</strong> / {{ pollStore.currentPoll.max_points }}
            </label>
            <input v-model.number="selectedPoints" type="range" :min="1" :max="pollStore.currentPoll.max_points ?? 1" class="w-full accent-indigo-600" />
          </div>
        </template>

        <button
          class="btn btn-primary btn-full"
          :disabled="loading || (isOpenText ? !textResponse.trim() : (isMulti ? selectedOptionIds.length === 0 : selectedOptionId == null))"
          @click="castVote"
        >
          {{ loading ? 'Submitting...' : isWeighted && !isOpenText ? `Submit Vote (${selectedPoints} pts)` : 'Submit Vote' }}
        </button>
      </div>

      <!-- Results phase -->
      <div v-else-if="pollStore.results" class="results-section">
        <div v-if="pollStore.hasVoted" class="voted-banner">✓ You voted</div>

        <LivePollChart
          :results="pollStore.results.results as any"
          :totalVotes="pollStore.results.totalVotes"
          :status="pollStore.results.status"
          :animate="true"
        />

        <div v-if="winner && pollStore.currentPoll.status === 'ended'" class="winner-announce">
          🏆 <strong>{{ winner.length === 1 ? winner[0]?.option : winner.map(w => w.option).join(', ') }}</strong>
          {{ winner.length === 1 ? 'wins' : 'tie' }} with {{ winner[0]?.votes ?? 0 }} vote{{ (winner[0]?.votes ?? 0) !== 1 ? 's' : '' }}!
        </div>
      </div>

      <!-- Waiting for results -->
      <div v-else-if="pollStore.hasVoted && pollStore.currentPoll.status === 'active'" class="waiting-state">
        <div class="spinner"></div>
        <p>Waiting for results...</p>
      </div>

      <div v-else-if="pollStore.currentPoll.status === 'ended'" class="waiting-state">
        <p>This poll has ended.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.poll-vote-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: #f8fafc;
}

.vote-card {
  width: 100%;
  max-width: 560px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 40px 32px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
}

.vc-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 24px;
}

.vc-question {
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
  line-height: 1.3;
  flex: 1;
}

.vc-hint {
  font-size: 13px;
  color: #94a3b8;
  margin: 0 0 12px;
}

.vote-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
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

.vote-option:hover {
  border-color: #93c5fd;
  background: #f0f7ff;
}

.vote-option.selected {
  border-color: #2563eb;
  background: #eff6ff;
}

.vote-option-text {
  color: #1e293b;
  font-weight: 500;
  flex: 1;
}

.vote-check {
  color: #2563eb;
  font-weight: 700;
  font-size: 18px;
  margin-left: 10px;
}

.vote-radio {
  color: #2563eb;
  font-weight: 700;
  font-size: 18px;
  margin-left: 10px;
}

.results-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.voted-banner {
  text-align: center;
  background: #dcfce7;
  color: #16a34a;
  padding: 8px 16px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
}

.winner-announce {
  text-align: center;
  padding: 16px;
  background: #fefce8;
  border: 1px solid #fde68a;
  border-radius: 12px;
  font-size: 16px;
  color: #92400e;
}

.loading-state,
.waiting-state,
.error-state {
  text-align: center;
  padding: 60px 20px;
  color: #64748b;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e2e8f0;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.alert {
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
}

.alert-error {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
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
  flex-shrink: 0;
}

.badge-draft {
  background: #f1f5f9;
  color: #64748b;
}

.badge-active {
  background: #dcfce7;
  color: #16a34a;
}

.badge-ended {
  background: #fef3c7;
  color: #d97706;
}

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

.btn-full {
  width: 100%;
}

.btn-primary {
  background: #2563eb;
  color: white;
}

.btn-primary:hover {
  background: #1d4ed8;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .vote-card {
    padding: 28px 20px;
  }

  .vc-header {
    flex-direction: column;
  }

  .vc-question {
    font-size: 18px;
  }
}
</style>
