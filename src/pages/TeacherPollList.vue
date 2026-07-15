<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePollStore } from '@/stores/pollStore'
import PollCard from '@/components/PollCard.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import EmptyState from '@/components/EmptyState.vue'
import ConfirmationDialog from '@/components/ConfirmationDialog.vue'
import ToastNotification from '@/components/ToastNotification.vue'
import QRCodeModal from '@/components/QRCodeModal.vue'
import type { QrCodeData } from '@/types/poll'

const router = useRouter()
const store = usePollStore()

const searchQuery = ref('')
const showDeleteDialog = ref(false)
const pollToDelete = ref<number | null>(null)
const toastMessage = ref<string | null>(null)
const toastType = ref<'success' | 'error'>('success')
const qrCodeData = ref<QrCodeData | null>(null)
const showQrModal = ref(false)

const filteredPolls = computed(() => {
  if (!searchQuery.value.trim()) return store.polls
  const q = searchQuery.value.toLowerCase()
  return store.polls.filter(
    (p) =>
      p.question.toLowerCase().includes(q) ||
      p.status.toLowerCase().includes(q),
  )
})

onMounted(async () => {
  try {
    await store.fetchPolls()
  } catch {
    toastMessage.value = 'Failed to load polls.'
    toastType.value = 'error'
  }
})

function navigateToCreate() {
  router.push('/polls/create')
}

function editPoll(id: number) {
  router.push(`/polls/${id}/edit`)
}

function confirmDelete(id: number) {
  pollToDelete.value = id
  showDeleteDialog.value = true
}

async function executeDelete() {
  if (pollToDelete.value === null) return
  try {
    await store.deletePoll(pollToDelete.value)
    toastMessage.value = 'Poll deleted successfully.'
    toastType.value = 'success'
  } catch {
    toastMessage.value = 'Failed to delete poll.'
    toastType.value = 'error'
  } finally {
    showDeleteDialog.value = false
    pollToDelete.value = null
  }
}

async function startPoll(id: number) {
  try {
    await store.startPoll(id)
    toastMessage.value = 'Poll started successfully!'
    toastType.value = 'success'
    router.push(`/polls/${id}/results`)
  } catch (e: any) {
    toastMessage.value = e.response?.data?.message || 'Failed to start poll.'
    toastType.value = 'error'
  }
}

async function endPoll(id: number) {
  try {
    await store.endPoll(id)
    toastMessage.value = 'Poll ended.'
    toastType.value = 'success'
  } catch (e: any) {
    toastMessage.value = e.response?.data?.message || 'Failed to end poll.'
    toastType.value = 'error'
  }
}

function viewResults(id: number) {
  router.push(`/polls/${id}/results`)
}

async function showQrCode(id: number) {
  try {
    qrCodeData.value = await store.getQrCode(id)
    showQrModal.value = true
  } catch {
    toastMessage.value = 'Failed to generate QR code.'
    toastType.value = 'error'
  }
}
</script>

<template>
  <div class="mx-auto max-w-5xl px-4 py-8">
    <div class="mb-8 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white shadow-lg">
      <h1 class="text-2xl font-bold">My Polls</h1>
      <p class="mt-1 text-indigo-100">Create and manage your classroom polls</p>
    </div>

    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="relative max-w-xs">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search polls..."
          class="block w-full rounded-lg border border-gray-300 px-4 py-2 pl-10 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
        <svg class="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <button
        class="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
        @click="navigateToCreate"
      >
        + Create Poll
      </button>
    </div>

    <LoadingSpinner v-if="store.loading && store.polls.length === 0" />

    <EmptyState
      v-else-if="store.polls.length === 0"
      title="No polls yet"
      description="Create your first poll to engage with your students."
    >
      <button
        class="mt-4 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
        @click="navigateToCreate"
      >
        Create Poll
      </button>
    </EmptyState>

    <EmptyState
      v-else-if="filteredPolls.length === 0"
      title="No results"
      description="Try a different search term."
    />

    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <PollCard
        v-for="poll in filteredPolls"
        :key="poll.id"
        :poll="poll"
        @edit="editPoll"
        @delete="confirmDelete"
        @start="startPoll"
        @end="endPoll"
        @view="viewResults"
        @qr="showQrCode"
      />
    </div>

    <ConfirmationDialog
      :show="showDeleteDialog"
      title="Delete Poll"
      message="Are you sure you want to delete this poll? This action cannot be undone."
      confirm-text="Delete"
      variant="danger"
      @confirm="executeDelete"
      @cancel="showDeleteDialog = false"
    />

    <ToastNotification
      :message="toastMessage"
      :type="toastType"
      @close="toastMessage = null"
    />

    <QRCodeModal
      v-if="qrCodeData"
      :show="showQrModal"
      :join-url="qrCodeData.join_url"
      :room-code="qrCodeData.room_code"
      @close="showQrModal = false"
    />
  </div>
</template>
