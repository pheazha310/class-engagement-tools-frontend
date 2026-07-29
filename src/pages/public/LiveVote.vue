<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { pollService } from '@/services/pollService'
import { useAuthStore } from '@/stores/auth'
import type { Poll, PollResultsData } from '@/types/poll'
import { showNotification } from '@/utils/notifications'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const loading = ref(true)
const voting = ref(false)
const hasVoted = ref(false)
const poll = ref<Poll | null>(null)
const results = ref<PollResultsData | null>(null)
const selectedOption = ref<string | null>(null)
const textResponse = ref('')
const error = ref('')

const isActive = computed(() => poll.value?.status === 'active')

async function loadPoll() {
  if (!auth.initialized) {
    try {
      await auth.fetchUser()
    } catch {
      // continue as guest
    }
  }

  if (auth.isAuthenticated && auth.user?.role === 'teacher') {
    router.replace('/teacher/live-polls')
    return
  }

  const token = route.params.token as string
  if (!token) {
    error.value = 'Invalid voting link.'
    loading.value = false
    return
  }
  try {
    const res = await pollService.getActivePoll()
    const p = (res as any).poll || (res as any).data
    if (p) {
      poll.value = p as Poll
    } else {
      error.value = 'Poll not found or has ended.'
    }
  } catch {
    error.value = 'Unable to load poll. It may have ended or the link is invalid.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadPoll()
})

async function submitVote() {
  if (!poll.value || !isActive.value) return
  if (!poll.value.is_open_text && !selectedOption.value) {
    showNotification('Please select an option.', 'error')
    return
  }
  if (poll.value.is_open_text && !textResponse.value.trim()) {
    showNotification('Please enter your response.', 'error')
    return
  }
  voting.value = true
  try {
    const res = await pollService.vote(
      poll.value.id,
      selectedOption.value,
      undefined,
      poll.value.is_open_text ? textResponse.value.trim() : undefined,
    )
    results.value = res
    hasVoted.value = true
  } catch {
    showNotification('Failed to submit vote.', 'error')
  } finally {
    voting.value = false
  }
}
</script>

<template>
  <div class="vote-page">
    <div v-if="loading" class="vote-loading">
      <div class="spinner"></div>
      <p>Loading poll...</p>
    </div>

    <div v-else-if="error" class="vote-error">
      <div class="error-card">
        <h2>Poll Unavailable</h2>
        <p>{{ error }}</p>
      </div>
    </div>

    <div v-else-if="hasVoted && results" class="vote-success">
      <div class="result-card">
        <h2>Your vote has been recorded!</h2>
        <p class="result-question">{{ results.question }}</p>
        <div v-if="results.is_open_text" class="open-text-result">
          <p class="result-text">{{ textResponse }}</p>
        </div>
        <div v-else class="result-stats">
          <div class="total-votes">Total votes: <strong>{{ results.totalVotes }}</strong></div>
        </div>
      </div>
    </div>

    <div v-else-if="poll" class="vote-card">
      <div class="vote-header">
        <h1 class="vote-question">{{ poll.question }}</h1>
        <p v-if="poll.is_anonymous" class="vote-note">This vote is anonymous.</p>
      </div>

      <div v-if="poll.is_open_text" class="open-text-area">
        <textarea v-model="textResponse" class="vote-textarea" rows="4" placeholder="Type your response..." :disabled="voting"></textarea>
      </div>

      <div v-else class="options-area">
        <button
          v-for="(opt, idx) in poll.options"
          :key="opt.id"
          class="option-btn"
          :class="{ selected: selectedOption === opt.id }"
          :disabled="voting"
          @click="selectedOption = opt.id"
        >
          <span class="option-letter">{{ String.fromCharCode(65 + idx) }}</span>
          <span class="option-text">{{ opt.option_text }}</span>
        </button>
      </div>

      <button
        class="submit-btn"
        :disabled="voting || !isActive"
        @click="submitVote"
      >
        {{ voting ? 'Submitting...' : isActive ? 'Submit Vote' : 'Poll has ended' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.vote-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
.vote-loading, .vote-error { text-align: center; color: #fff; }
.vote-loading .spinner { width: 40px; height: 40px; border: 4px solid rgba(255,255,255,.3); border-top-color: #fff; border-radius: 50%; animation: spin .6s linear infinite; margin: 0 auto 16px; }
@keyframes spin { to { transform: rotate(360deg); } }
.error-card, .result-card, .vote-card { background: #fff; border-radius: 16px; padding: 32px; max-width: 520px; width: 100%; box-shadow: 0 20px 60px rgba(0,0,0,.15); }
.error-card h2, .result-card h2 { margin: 0 0 12px; font-size: 20px; }
.result-card h2 { color: #16a34a; }
.error-card p { margin: 0; color: #64748b; }
.result-question { font-size: 18px; font-weight: 700; color: var(--ink, #1e293b); margin: 16px 0; }
.result-text { padding: 12px; background: #f8faff; border-radius: 8px; font-size: 15px; }
.total-votes { font-size: 14px; color: #64748b; }
.vote-header { margin-bottom: 24px; }
.vote-question { margin: 0; font-size: 22px; font-weight: 800; color: #1e293b; line-height: 1.3; }
.vote-note { margin: 8px 0 0; font-size: 13px; color: #94a3b8; }
.options-area { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
.option-btn { display: flex; align-items: center; gap: 14px; width: 100%; padding: 14px 18px; border: 2px solid #e2e8f0; border-radius: 12px; background: #fff; cursor: pointer; transition: all .2s; font-size: 15px; text-align: left; }
.option-btn:hover { border-color: #667eea; background: #f8faff; }
.option-btn.selected { border-color: #667eea; background: #eef2ff; }
.option-btn:disabled { opacity: .5; cursor: not-allowed; }
.option-letter { width: 32px; height: 32px; display: grid; place-items: center; border-radius: 50%; background: #f1f5f9; color: #64748b; font-weight: 800; font-size: 14px; flex-shrink: 0; }
.option-btn.selected .option-letter { background: #667eea; color: #fff; }
.option-text { font-weight: 600; color: #1e293b; }
.open-text-area { margin-bottom: 20px; }
.vote-textarea { width: 100%; padding: 14px; border: 2px solid #e2e8f0; border-radius: 12px; font-size: 15px; font-family: inherit; resize: vertical; transition: border-color .2s; }
.vote-textarea:focus { outline: none; border-color: #667eea; }
.submit-btn { width: 100%; padding: 14px; border: 0; border-radius: 12px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; font-size: 16px; font-weight: 700; cursor: pointer; transition: opacity .2s; }
.submit-btn:hover { opacity: .9; }
.submit-btn:disabled { opacity: .5; cursor: not-allowed; }
</style>
