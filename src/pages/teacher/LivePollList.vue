<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useLivePollStore } from '@/stores/livePollStore'
import { useAuthStore } from '@/stores/auth'
import PollCard from '@/components/live/PollCard.vue'
import EmptyState from '@/components/EmptyState.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import ConfirmationDialog from '@/components/ConfirmationDialog.vue'
import ToastNotification from '@/components/ToastNotification.vue'
import type { PollStatus } from '@/types/livePoll'

const router = useRouter()
const store = useLivePollStore()
const auth = useAuthStore()

const search = ref('')
const statusFilter = ref<PollStatus | 'all'>('all')
const currentPage = ref(1)
const showDeleteDialog = ref(false)
const deletingId = ref<string | null>(null)
const deletingTitle = ref('')

onMounted(async () => {
  await auth.fetchUser()
  await loadPolls()
})

async function loadPolls() {
  const params: Record<string, string | number> = { page: currentPage.value }
  if (search.value.trim()) params.search = search.value.trim()
  if (statusFilter.value !== 'all') params.status = statusFilter.value
  try {
    await store.fetchPolls(params)
  } catch {
    // error is set in store
  }
}

let searchTimeout: ReturnType<typeof setTimeout> | null = null
function onSearchInput() {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    loadPolls()
  }, 400)
}

watch(statusFilter, () => {
  currentPage.value = 1
  loadPolls()
})

function viewResults(id: string) {
  router.push({ name: 'live-poll-results', params: { id } })
}

function editPoll(id: string) {
  router.push({ name: 'live-poll-edit', params: { id } })
}

async function handleStart(id: string) {
  const poll = store.polls.find((p) => p.id === id)
  if (!poll) return
  try {
    await store.startPoll(id)
  } catch {
    // error is set in store
  }
}

async function handleEnd(id: string) {
  try {
    await store.endPoll(id)
  } catch {
    // error is set in store
  }
}

function confirmDelete(id: string) {
  const poll = store.polls.find((p) => p.id === id)
  if (!poll) return
  deletingId.value = id
  deletingTitle.value = poll.question
  showDeleteDialog.value = true
}

async function handleDelete() {
  if (!deletingId.value) return
  try {
    await store.deletePoll(deletingId.value)
  } catch {
    // error is set in store
  }
  showDeleteDialog.value = false
  deletingId.value = null
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 px-4 pb-12 pt-24 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-5xl">
      <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-3xl font-bold tracking-tight text-gray-900">Live Polls</h1>
          <p class="mt-1 text-sm text-gray-500">Create and manage real-time polls for your classroom</p>
        </div>
        <router-link
          :to="{ name: 'live-poll-create' }"
          class="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          New Poll
        </router-link>
      </div>

      <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div class="relative flex-1">
          <svg class="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            v-model="search"
            type="text"
            placeholder="Search polls..."
            class="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            @input="onSearchInput"
          />
        </div>
        <div class="flex gap-1 rounded-xl bg-gray-100 p-1">
          <button
            v-for="opt in (['all', 'draft', 'active', 'closed'] as const)"
            :key="opt"
            class="rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-wider transition"
            :class="statusFilter === opt ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
            @click="statusFilter = opt"
          >
            {{ opt === 'all' ? 'All' : opt }}
          </button>
        </div>
      </div>

      <ToastNotification
        :message="store.error"
        type="error"
        @close="store.clearError()"
      />
      <ToastNotification
        :message="store.successMessage"
        type="success"
        @close="store.clearSuccess()"
      />

      <div v-if="store.loading && !store.polls.length" class="py-20">
        <LoadingSpinner size="lg" />
      </div>

      <div v-else-if="!store.polls.length" class="py-12">
        <EmptyState title="No polls found" description="Create your first poll to get started.">
          <router-link
            :to="{ name: 'live-poll-create' }"
            class="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Create Poll
          </router-link>
        </EmptyState>
      </div>

      <div v-else class="space-y-4">
        <PollCard
          v-for="poll in store.polls"
          :key="poll.id"
          :poll="poll"
          @results="viewResults"
          @edit="editPoll"
          @start="handleStart"
          @end="handleEnd"
          @delete="confirmDelete"
        />
      </div>

      <div v-if="store.meta && store.meta.last_page > 1" class="mt-8 flex items-center justify-center gap-2">
        <button
          class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-40"
          :disabled="currentPage <= 1"
          @click="currentPage--; loadPolls()"
        >
          Previous
        </button>
        <span class="px-3 text-sm text-gray-500">
          Page {{ store.meta.current_page }} of {{ store.meta.last_page }}
        </span>
        <button
          class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-40"
          :disabled="currentPage >= (store.meta?.last_page || 1)"
          @click="currentPage++; loadPolls()"
        >
          Next
        </button>
      </div>
    </div>

    <ConfirmationDialog
      :show="showDeleteDialog"
      title="Delete Poll"
      :message="`Are you sure you want to delete &ldquo;${deletingTitle}&rdquo;? This cannot be undone.`"
      variant="danger"
      confirm-text="Delete"
      @confirm="handleDelete"
      @cancel="showDeleteDialog = false"
    />
  </div>
</template>
