<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLivePollStore } from '@/stores/livePollStore'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import EmptyState from '@/components/EmptyState.vue'

const router = useRouter()
const store = useLivePollStore()
const pageError = ref<string | null>(null)

onMounted(async () => {
  try {
    await store.fetchActivePolls()
  } catch {
    pageError.value = 'Failed to load active polls.'
  }
})

function vote(token: string) {
  router.push({ name: 'live-vote-public', params: { token } })
}

const typeLabels: Record<string, string> = {
  multiple_choice: 'Multiple Choice',
  yes_no: 'Yes / No',
  rating: 'Rating Scale',
}
</script>

<template>
  <div class="min-h-[100dvh] bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4 py-12 sm:px-6">
    <div class="mx-auto max-w-2xl">
      <div class="mb-8 text-center">
        <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100">
          <svg class="h-8 w-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 class="text-3xl font-bold text-gray-900">Active Polls</h1>
        <p class="mt-2 text-gray-500">Vote on live polls from your teachers</p>
      </div>

      <div v-if="store.loading && !store.activePolls.length" class="py-16">
        <LoadingSpinner size="lg" />
      </div>

      <div v-else-if="pageError" class="rounded-2xl bg-white p-8 text-center shadow-sm">
        <p class="text-red-600">{{ pageError }}</p>
      </div>

      <div v-else-if="!store.activePolls.length" class="py-8">
        <EmptyState title="No active polls" description="There are no active polls available right now. Check back later!">
          <div class="mt-4 text-sm text-gray-400">Polls appear here when teachers start them.</div>
        </EmptyState>
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="poll in store.activePolls"
          :key="poll.id"
          class="group cursor-pointer rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md"
          @click="vote(poll.public_token)"
        >
          <div class="mb-1 flex items-start justify-between gap-3">
            <div class="min-w-0 flex-1">
              <h3 class="text-lg font-semibold text-gray-900 group-hover:text-indigo-700">{{ poll.question }}</h3>
              <p v-if="poll.title" class="mt-0.5 text-sm text-gray-500">{{ poll.title }}</p>
            </div>
            <span class="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
              <span class="h-2 w-2 animate-pulse rounded-full bg-green-500" />
              Live
            </span>
          </div>

          <div class="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
            <span class="rounded-md bg-gray-100 px-2 py-1 font-medium">{{ typeLabels[poll.poll_type] || poll.poll_type }}</span>
            <span class="rounded-md bg-gray-100 px-2 py-1 font-medium">{{ poll.options_count }} option{{ poll.options_count !== 1 ? 's' : '' }}</span>
            <span v-if="poll.anonymous" class="rounded-md bg-purple-100 px-2 py-1 font-medium text-purple-700">Anonymous</span>
            <span v-if="poll.allow_multiple_votes" class="rounded-md bg-blue-100 px-2 py-1 font-medium text-blue-700">Multi-vote</span>
          </div>

          <div class="mt-4 flex items-center justify-end">
            <span class="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 group-hover:text-indigo-800">
              Vote now
              <svg class="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
