<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import TeacherLayout from '@/components/teacher/TeacherLayout.vue'
import TeacherIcon from '@/components/teacher/TeacherIcon.vue'
import { pollService } from '@/services/pollService'
import type { Poll } from '@/types/poll'
import { showNotification } from '@/utils/notifications'

const router = useRouter()
const authStore = useAuthStore()

const polls = ref<Poll[]>([])
const loading = ref(false)
const searchQuery = ref('')
const statusFilter = ref<'all' | 'draft' | 'active' | 'ended'>('all')
const viewMode = ref<'grid' | 'table'>('grid')
const currentPage = ref(1)
const perPage = ref(12)
const showDeleteModal = ref(false)
const deletingId = ref<string | null>(null)
const deletingTitle = ref('')

const filteredPolls = computed(() => {
  let r = polls.value
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    r = r.filter((p) => p.question.toLowerCase().includes(q) || (p.title && p.title.toLowerCase().includes(q)))
  }
  if (statusFilter.value !== 'all') r = r.filter((p) => p.status === statusFilter.value)
  return r
})

const paginatedPolls = computed(() => {
  const s = (currentPage.value - 1) * perPage.value
  return filteredPolls.value.slice(s, s + perPage.value)
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredPolls.value.length / perPage.value)))

const statsSummary = computed(() => ({
  total: polls.value.length,
  active: polls.value.filter((p) => p.status === 'active').length,
  draft: polls.value.filter((p) => p.status === 'draft').length,
  ended: polls.value.filter((p) => p.status === 'ended').length,
}))

async function fetchPolls() {
  loading.value = true
  try {
    const response = await pollService.getPolls(100)
    const items = response.data || []
    polls.value = items
  } catch {
    showNotification('Failed to load polls.', 'error')
  } finally {
    loading.value = false
  }
}

function openCreate() {
  router.push('/teacher/live-polls/create')
}

function openEdit(id: string) {
  router.push(`/teacher/live-polls/${id}/edit`)
}

function openResults(id: string) {
  router.push(`/teacher/live-polls/${id}/results`)
}

function openLiveVoting(poll: Poll) {
  const token = poll.public_token
  const votingUrl = token ? `${window.location.origin}/vote/${token}` : `${window.location.origin}/polls/active`
  window.open(votingUrl, '_blank', 'noopener,noreferrer')
}

function confirmDelete(poll: Poll) {
  deletingId.value = poll.id
  deletingTitle.value = poll.question
  showDeleteModal.value = true
}

async function executeDelete() {
  if (!deletingId.value) return
  loading.value = true
  try {
    await pollService.deletePoll(deletingId.value)
    showNotification('Poll deleted successfully!', 'success')
    showDeleteModal.value = false
    await fetchPolls()
  } catch {
    polls.value = polls.value.filter((p) => p.id !== deletingId.value)
    showDeleteModal.value = false
  } finally {
    loading.value = false
    deletingId.value = null
    deletingTitle.value = ''
  }
}

async function startPoll(id: string) {
  try {
    await pollService.startPoll(id)
    showNotification('Poll started!', 'success')
    await fetchPolls()
  } catch {
    showNotification('Failed to start poll.', 'error')
  }
}

async function endPoll(id: string) {
  try {
    await pollService.endPoll(id)
    showNotification('Poll ended.', 'success')
    await fetchPolls()
  } catch {
    showNotification('Failed to end poll.', 'error')
  }
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function statusBadge(s: string) {
  return s === 'active' ? 'active' : s === 'draft' ? 'draft' : 'ended'
}

onMounted(() => fetchPolls())
</script>

<template>
  <TeacherLayout sidebar-active="live-polls" page-title="Live Polls" page-subtitle="Create, manage, and monitor live polls for your classes." v-model:search-value="searchQuery" search-placeholder="Search polls...">
    <template #actions>
      <div class="view-toggle">
        <button class="toggle-btn" :class="{ active: viewMode === 'grid' }" type="button" @click="viewMode = 'grid'" title="Grid view">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
        </button>
        <button class="toggle-btn" :class="{ active: viewMode === 'table' }" type="button" @click="viewMode = 'table'" title="Table view">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/></svg>
        </button>
      </div>
      <button class="primary-button" type="button" @click="openCreate"><TeacherIcon icon="plus" :size="18" /><span>New Poll</span></button>
    </template>

    <section class="stats-grid" aria-label="Polls summary">
      <article class="stat-card tone-blue"><div class="stat-label-row"><span>Total Polls</span><TeacherIcon icon="poll" :size="19" /></div><div class="stat-value-row"><strong>{{ statsSummary.total }}</strong><span>{{ statsSummary.active }} active</span></div></article>
      <article class="stat-card tone-green"><div class="stat-label-row"><span>Active</span><TeacherIcon icon="activity" :size="19" /></div><div class="stat-value-row"><strong>{{ statsSummary.active }}</strong><span>currently running</span></div></article>
      <article class="stat-card tone-orange"><div class="stat-label-row"><span>Drafts</span><TeacherIcon icon="edit" :size="19" /></div><div class="stat-value-row"><strong>{{ statsSummary.draft }}</strong><span>not yet started</span></div></article>
      <article class="stat-card tone-gray"><div class="stat-label-row"><span>Ended</span><TeacherIcon icon="check" :size="19" /></div><div class="stat-value-row"><strong>{{ statsSummary.ended }}</strong><span>completed</span></div></article>
    </section>

    <section class="filter-bar">
      <div class="filter-group">
        <label class="filter-label">Status</label>
        <div class="filter-chips">
          <button class="chip" :class="{ active: statusFilter === 'all' }" type="button" @click="statusFilter = 'all'; currentPage = 1">All Polls</button>
          <button class="chip chip-green" :class="{ active: statusFilter === 'active' }" type="button" @click="statusFilter = 'active'; currentPage = 1">Active</button>
          <button class="chip chip-orange" :class="{ active: statusFilter === 'draft' }" type="button" @click="statusFilter = 'draft'; currentPage = 1">Draft</button>
          <button class="chip chip-gray" :class="{ active: statusFilter === 'ended' }" type="button" @click="statusFilter = 'ended'; currentPage = 1">Ended</button>
        </div>
      </div>
      <div class="filter-info"><span class="result-count">{{ filteredPolls.length }} poll{{ filteredPolls.length !== 1 ? 's' : '' }}</span></div>
    </section>

    <div v-if="loading && polls.length === 0" class="loading-state"><div class="spinner"></div><p>Loading polls...</p></div>

    <section v-else-if="paginatedPolls.length === 0" class="empty-state">
      <div class="empty-icon"><TeacherIcon icon="poll" :size="56" /></div>
      <h3>No polls found</h3>
      <p>{{ searchQuery ? 'Try adjusting your search or filters.' : 'Get started by creating your first live poll.' }}</p>
      <button v-if="!searchQuery" class="primary-button" type="button" @click="openCreate"><TeacherIcon icon="plus" :size="18" /><span>Create Poll</span></button>
    </section>

    <section v-else-if="viewMode === 'grid'" class="polls-grid" aria-label="Polls">
      <div v-for="p in paginatedPolls" :key="p.id" class="poll-card" :class="{ 'poll-inactive': p.status === 'ended' || p.status === 'draft' }">
        <div class="card-accent" :class="statusBadge(p.status)"></div>
        <div class="card-header">
          <div class="card-title-row">
            <h3 class="card-title">{{ p.question }}</h3>
            <mark :class="statusBadge(p.status)">{{ p.status }}</mark>
          </div>
          <div class="card-meta-line" v-if="p.options && p.options.length">
            <span class="card-opt-count">{{ p.options.length }} option{{ p.options.length !== 1 ? 's' : '' }}</span>
            <span v-if="p.is_multiple_choice" class="card-tag">Multiple Choice</span>
            <span v-else-if="p.is_quiz" class="card-tag card-tag-quiz">Quiz</span>
            <span v-else-if="p.is_open_text" class="card-tag card-tag-text">Open Text</span>
          </div>
        </div>
        <div class="card-body">
          <div class="card-meta-grid">
            <div class="card-meta-item"><TeacherIcon icon="clock" :size="16" /><span>{{ p.duration_minutes ? p.duration_minutes + ' min' : 'No limit' }}</span></div>
            <div class="card-meta-item"><TeacherIcon icon="users" :size="16" /><span>{{ p.total_votes || 0 }} votes</span></div>
            <div class="card-meta-item" v-if="p.started_at"><TeacherIcon icon="calendar" :size="16" /><span>{{ formatDate(p.started_at) }}</span></div>
            <div class="card-meta-item" v-if="p.is_anonymous"><TeacherIcon icon="lock" :size="16" /><span>Anonymous</span></div>
          </div>
        </div>
        <div class="card-footer">
          <div class="card-date">{{ formatDate(p.created_at) }}</div>
          <div class="card-actions">
            <button v-if="p.status === 'draft'" class="card-action-btn start" type="button" title="Start Poll" @click.stop="startPoll(p.id)"><TeacherIcon icon="play" :size="16" /></button>
            <button v-if="p.status === 'active'" class="card-action-btn stop" type="button" title="End Poll" @click.stop="endPoll(p.id)"><TeacherIcon icon="stop" :size="16" /></button>
            <button v-if="p.status === 'active'" class="card-action-btn live" type="button" title="Live Voting" @click.stop="openLiveVoting(p)"><TeacherIcon icon="poll" :size="16" /></button>
            <button class="card-action-btn" type="button" title="Results" @click.stop="openResults(p.id)"><TeacherIcon icon="chart" :size="16" /></button>
            <button class="card-action-btn" type="button" title="Edit" @click.stop="openEdit(p.id)"><TeacherIcon icon="edit" :size="16" /></button>
            <button class="card-action-btn delete" type="button" title="Delete" @click.stop="confirmDelete(p)"><TeacherIcon icon="trash" :size="16" /></button>
          </div>
        </div>
      </div>
    </section>

    <section v-else class="table-wrapper">
      <div class="polls-table">
        <div class="table-row table-heading">
          <span class="tcol-question">Question</span><span class="tcol-status">Status</span><span class="tcol-type">Type</span><span class="tcol-options">Options</span><span class="tcol-votes">Votes</span><span class="tcol-duration">Duration</span><span class="tcol-date">Created</span><span class="tcol-actions">Actions</span>
        </div>
        <div v-for="p in paginatedPolls" :key="p.id" class="table-row" :class="{ 'table-row-inactive': p.status === 'ended' || p.status === 'draft' }">
          <span class="tcol-question"><strong>{{ p.question }}</strong></span>
          <span class="tcol-status"><mark :class="statusBadge(p.status)">{{ p.status }}</mark></span>
          <span class="tcol-type">{{ p.is_quiz ? 'Quiz' : p.is_open_text ? 'Open Text' : p.is_multiple_choice ? 'Multiple Choice' : 'Single Choice' }}</span>
          <span class="tcol-options">{{ p.options?.length || 0 }}</span>
          <span class="tcol-votes">{{ p.total_votes || 0 }}</span>
          <span class="tcol-duration">{{ p.duration_minutes ? p.duration_minutes + 'm' : '∞' }}</span>
          <span class="tcol-date">{{ formatDate(p.created_at) }}</span>
          <span class="tcol-actions"><div class="t-actions">
            <button v-if="p.status === 'draft'" class="t-action start" type="button" title="Start Poll" @click="startPoll(p.id)"><TeacherIcon icon="play" :size="16" /></button>
            <button v-if="p.status === 'active'" class="t-action stop" type="button" title="End Poll" @click="endPoll(p.id)"><TeacherIcon icon="stop" :size="16" /></button>
            <button v-if="p.status === 'active'" class="t-action live" type="button" title="Live Voting" @click="openLiveVoting(p)"><TeacherIcon icon="poll" :size="16" /></button>
            <button class="t-action" type="button" title="Results" @click="openResults(p.id)"><TeacherIcon icon="chart" :size="16" /></button>
            <button class="t-action" type="button" title="Edit" @click="openEdit(p.id)"><TeacherIcon icon="edit" :size="16" /></button>
            <button class="t-action delete" type="button" title="Delete" @click="confirmDelete(p)"><TeacherIcon icon="trash" :size="16" /></button>
          </div></span>
        </div>
      </div>
    </section>

    <div v-if="filteredPolls.length > perPage" class="pagination-bar">
      <div class="pagination-info">Showing {{ ((currentPage - 1) * perPage) + 1 }}-{{ Math.min(currentPage * perPage, filteredPolls.length) }} of {{ filteredPolls.length }}</div>
      <div class="pagination-controls"><button class="page-btn" :disabled="currentPage <= 1" @click="currentPage--"><TeacherIcon icon="chevronLeft" :size="16" /></button><span class="page-indicator">{{ currentPage }} / {{ totalPages }}</span><button class="page-btn" :disabled="currentPage >= totalPages" @click="currentPage++"><TeacherIcon icon="chevronRight" :size="16" /></button></div>
    </div>

    <Teleport to="body">
      <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
        <div class="modal-container modal-sm">
          <div class="modal-header"><h2>Delete Poll</h2><button class="modal-close" type="button" @click="showDeleteModal = false"><TeacherIcon icon="x" :size="24" /></button></div>
          <div class="modal-body">
            <div class="delete-content"><div class="delete-icon"><TeacherIcon icon="trash" :size="32" /></div><p>Are you sure you want to delete <strong>{{ deletingTitle }}</strong>?</p><p class="delete-warning">This action cannot be undone. All votes and responses will be permanently removed.</p></div>
            <div class="modal-actions"><button type="button" class="outline-button" @click="showDeleteModal = false">Cancel</button><button type="button" class="danger-button" @click="executeDelete" :disabled="loading">{{ loading ? 'Deleting...' : 'Delete Poll' }}</button></div>
          </div>
        </div>
      </div>
    </Teleport>
  </TeacherLayout>
</template>

<style scoped>
.polls-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
.poll-card { display: flex; flex-direction: column; border-radius: 12px; background: #fff; border: 1px solid var(--line); overflow: hidden; box-shadow: 0 2px 8px rgba(21,33,72,.04); transition: all .25s cubic-bezier(.16,1,.3,1); }
.poll-card:hover { box-shadow: 0 12px 32px rgba(21,33,72,.1); transform: translateY(-3px); border-color: #b0b8d0; }
.poll-inactive { opacity: .7; }
.poll-inactive:hover { opacity: .85; }
.card-accent { height: 5px; flex-shrink: 0; }
.card-accent.active { background: var(--green, #22c55e); }
.card-accent.draft { background: var(--orange, #f59e0b); }
.card-accent.ended { background: var(--muted, #94a3b8); }
.card-header { padding: 20px 22px 12px; }
.card-title-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
.card-title { margin: 0; font-size: 16px; font-weight: 700; color: var(--ink); line-height: 1.3; flex: 1; }
.card-title-row mark { font-size: 11px; padding: 3px 8px; border-radius: 5px; font-weight: 700; text-transform: uppercase; white-space: nowrap; }
.card-title-row mark.active { background: #dcfce7; color: #16a34a; }
.card-title-row mark.draft { background: #fef3c7; color: #d97706; }
.card-title-row mark.ended { background: #f1f5f9; color: #64748b; }
.card-meta-line { display: flex; align-items: center; gap: 8px; margin-top: 8px; font-size: 12px; color: var(--muted); }
.card-opt-count { font-weight: 600; }
.card-tag { background: #eef3ff; padding: 2px 7px; border-radius: 4px; font-size: 10px; font-weight: 700; color: var(--primary); }
.card-tag-quiz { background: #fef3c7; color: #d97706; }
.card-tag-text { background: #e0f2fe; color: #0369a1; }
.card-body { padding: 12px 22px; flex: 1; }
.card-meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.card-meta-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #3e465a; }
.card-meta-item svg { color: var(--muted); flex-shrink: 0; }
.card-footer { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 22px; border-top: 1px solid #e6eaf3; background: #fafcff; }
.card-date { font-size: 11px; color: var(--muted); }
.card-actions { display: flex; gap: 4px; }
.card-action-btn { display: inline-grid; width: 30px; height: 30px; place-items: center; border: 0; border-radius: 6px; background: transparent; color: #6e7687; cursor: pointer; transition: all .15s; }
.card-action-btn:hover { background: var(--primary-soft); color: var(--primary); }
.card-action-btn.delete:hover { background: var(--red-soft); color: var(--red); }
.card-action-btn.start:hover { background: var(--green-soft); color: var(--green); }
.card-action-btn.stop:hover { background: #fff0f0; color: var(--red); }
.card-action-btn.live:hover { background: #eef2ff; color: var(--primary); }
.table-row { display: grid; grid-template-columns: minmax(200px,2.5fr) minmax(80px,0.7fr) minmax(110px,1fr) 60px 60px 70px 90px 90px; align-items: center; min-height: 64px; border-top: 1px solid #e0e4ef; padding: 0 20px; gap: 10px; transition: background .15s; }
.table-row:hover { background: #f8faff; }
.table-heading { min-height: 46px; background: #eef3ff; color: #596072; font-size: 11px; font-weight: 800; text-transform: uppercase; }
.table-heading:hover { background: #eef3ff; }
.table-row-inactive { opacity: .6; }
.tcol-question { font-size: 14px; }
.tcol-question strong { color: var(--primary); }
.tcol-status mark { font-size: 11px; padding: 2px 7px; border-radius: 4px; font-weight: 700; }
.tcol-status mark.active { background: #dcfce7; color: #16a34a; }
.tcol-status mark.draft { background: #fef3c7; color: #d97706; }
.tcol-status mark.ended { background: #f1f5f9; color: #64748b; }
.t-actions { display: flex; gap: 4px; }
.t-action { display: inline-grid; width: 30px; height: 30px; place-items: center; border: 0; border-radius: 6px; background: transparent; color: #6e7687; cursor: pointer; transition: all .15s; }
.t-action:hover { background: var(--primary-soft); color: var(--primary); }
.t-action.delete:hover { background: var(--red-soft); color: var(--red); }
.t-action.start:hover { background: var(--green-soft); color: var(--green); }
.t-action.stop:hover { background: #fff0f0; color: var(--red); }
.t-action.live:hover { background: #eef2ff; color: var(--primary); }
.delete-content { text-align: center; padding: 8px 0 16px; }
.delete-icon { color: var(--red); margin-bottom: 12px; }
.delete-content p { margin: 8px 0; font-size: 15px; color: var(--ink); }
.delete-warning { font-size: 13px !important; color: var(--muted) !important; }
@media (max-width:1280px) { .table-row { grid-template-columns: minmax(160px,2fr) minmax(60px,0.6fr) minmax(90px,0.8fr) 50px 50px 60px 70px 70px; } }
@media (max-width:980px) { .polls-grid { grid-template-columns: repeat(auto-fill, minmax(280px,1fr)); } }
@media (max-width:720px) { .polls-grid { grid-template-columns: 1fr; } .card-meta-grid { grid-template-columns: 1fr; } }
</style>
