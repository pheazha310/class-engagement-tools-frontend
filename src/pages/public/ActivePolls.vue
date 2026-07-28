<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { pollService } from '@/services/pollService'
import type { Poll } from '@/types/poll'

const router = useRouter()
const polls = ref<Poll[]>([])
const loading = ref(true)

async function fetchActivePolls() {
  try {
    const response = await pollService.getPolls(50)
    const items = (response.data || []).filter((p: Poll) => p.status === 'active')
    polls.value = items
  } catch {
    polls.value = []
  } finally {
    loading.value = false
  }
}

function vote(token: string) {
  router.push(`/vote/${token}`)
}

onMounted(() => fetchActivePolls())
</script>

<template>
  <div class="active-polls-page">
    <header class="page-header">
      <h1>Active Polls</h1>
      <p>Vote on currently running polls.</p>
    </header>
    <div v-if="loading" class="loading-state"><div class="spinner"></div><p>Loading active polls...</p></div>
    <div v-else-if="polls.length === 0" class="empty-state">
      <h3>No active polls</h3>
      <p>There are no polls currently running. Check back later!</p>
    </div>
    <div v-else class="polls-list">
      <div v-for="p in polls" :key="p.id" class="poll-card">
        <h3 class="poll-question">{{ p.question }}</h3>
        <p class="poll-meta" v-if="p.options">Options: {{ p.options.length }}</p>
        <button class="vote-btn" @click="vote(p.public_token || p.id)">Vote Now</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.active-polls-page { max-width: 640px; margin: 0 auto; padding: 40px 20px; }
.page-header { text-align: center; margin-bottom: 32px; }
.page-header h1 { margin: 0; font-size: 28px; font-weight: 800; color: #1e293b; }
.page-header p { margin: 8px 0 0; color: #64748b; }
.loading-state, .empty-state { text-align: center; padding: 60px 20px; }
.loading-state .spinner { width: 32px; height: 32px; border: 3px solid #e2e8f0; border-top-color: #667eea; border-radius: 50%; animation: spin .6s linear infinite; margin: 0 auto 12px; }
@keyframes spin { to { transform: rotate(360deg); } }
.empty-state h3 { margin: 0 0 8px; font-size: 18px; color: #1e293b; }
.empty-state p { margin: 0; color: #64748b; }
.polls-list { display: flex; flex-direction: column; gap: 16px; }
.poll-card { padding: 24px; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; }
.poll-question { margin: 0 0 8px; font-size: 18px; font-weight: 700; color: #1e293b; }
.poll-meta { margin: 0 0 16px; color: #64748b; font-size: 14px; }
.vote-btn { padding: 10px 24px; border: 0; border-radius: 8px; background: linear-gradient(135deg, #667eea, #764ba2); color: #fff; font-size: 14px; font-weight: 700; cursor: pointer; transition: opacity .2s; }
.vote-btn:hover { opacity: .9; }
</style>
