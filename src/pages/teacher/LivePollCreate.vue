<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLivePollStore } from '@/stores/livePollStore'
import ToastNotification from '@/components/ToastNotification.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import type { PollType, LivePollFormData } from '@/types/livePoll'

const route = useRoute()
const router = useRouter()
const store = useLivePollStore()

const isEdit = computed(() => !!route.params.id)
const pageTitle = computed(() => (isEdit.value ? 'Edit Poll' : 'Create Poll'))

const title = ref('')
const description = ref('')
const question = ref('')
const pollType = ref<PollType>('multiple_choice')
const options = ref<string[]>(['', ''])
const durationMinutes = ref<number | null>(null)
const allowMultipleVotes = ref(false)
const anonymous = ref(true)
const showResults = ref(true)
const validationError = ref<string | null>(null)
const initialized = ref(false)

onMounted(async () => {
  if (isEdit.value) {
    const id = route.params.id as string
    try {
      const poll = await store.fetchPoll(id)
      if (poll) {
        title.value = poll.title
        description.value = poll.description || ''
        question.value = poll.question
        pollType.value = poll.poll_type
        options.value = poll.options.map((o) => o.option_text)
        if (options.value.length < 2) options.value.push('')
        durationMinutes.value = poll.duration_minutes
        allowMultipleVotes.value = poll.allow_multiple_votes
        anonymous.value = poll.anonymous
        showResults.value = poll.show_results
      }
    } catch {
      router.push({ name: 'live-poll-list' })
      return
    }
  }
  initialized.value = true
})

function addOption() {
  if (options.value.length < 20) {
    options.value.push('')
  }
}

function removeOption(index: number) {
  if (options.value.length > 2) {
    options.value.splice(index, 1)
  }
}

function validate(): boolean {
  validationError.value = null
  if (!question.value.trim()) {
    validationError.value = 'Question is required.'
    return false
  }
  if (!title.value.trim()) {
    validationError.value = 'Title is required.'
    return false
  }
  const validOptions = options.value.map((o) => o.trim()).filter(Boolean)
  if (validOptions.length < 2) {
    validationError.value = 'At least 2 options are required.'
    return false
  }
  if (new Set(validOptions).size !== validOptions.length) {
    validationError.value = 'Duplicate options are not allowed.'
    return false
  }
  return true
}

async function handleSubmit() {
  if (!validate()) return

  const data: LivePollFormData = {
    title: title.value.trim(),
    description: description.value.trim() || undefined,
    question: question.value.trim(),
    poll_type: pollType.value,
    options: options.value.map((o) => o.trim()).filter(Boolean),
    duration_minutes: durationMinutes.value,
    allow_multiple_votes: allowMultipleVotes.value,
    anonymous: anonymous.value,
    show_results: showResults.value,
  }

  try {
    if (isEdit.value) {
      await store.updatePoll(route.params.id as string, data)
    } else {
      await store.createPoll(data)
    }
    router.push({ name: 'live-poll-list' })
  } catch {
    // error is set in store
  }
}

const typeOptions: { value: PollType; label: string }[] = [
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'yes_no', label: 'Yes / No' },
  { value: 'rating', label: 'Rating Scale' },
]

function setPollType(type: PollType) {
  pollType.value = type
  if (type === 'yes_no') {
    options.value = ['Yes', 'No']
  } else if (type === 'rating' && options.value.length < 3) {
    options.value = ['1', '2', '3', '4', '5']
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 px-4 pb-12 pt-24 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-3xl">
      <div class="mb-8 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold tracking-tight text-gray-900">{{ pageTitle }}</h1>
          <p class="mt-1 text-sm text-gray-500">{{ isEdit ? 'Update your poll details' : 'Create a new live poll for your classroom' }}</p>
        </div>
        <router-link
          :to="{ name: 'live-poll-list' }"
          class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          Back
        </router-link>
      </div>

      <div v-if="!initialized" class="py-20">
        <LoadingSpinner size="lg" />
      </div>

      <form v-else @submit.prevent="handleSubmit">
        <div class="space-y-6">
          <div class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 class="mb-4 text-lg font-semibold text-gray-900">Basic Information</h2>
            <div class="space-y-4">
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700">Title</label>
                <input
                  v-model="title"
                  type="text"
                  class="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="e.g. Week 10 Review Poll"
                  maxlength="255"
                />
              </div>
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700">Description <span class="text-gray-400">(optional)</span></label>
                <textarea
                  v-model="description"
                  class="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Brief description of this poll"
                  maxlength="2000"
                  rows="2"
                />
              </div>
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700">Question</label>
                <input
                  v-model="question"
                  type="text"
                  class="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="e.g. What is your favorite programming language?"
                  maxlength="1000"
                />
              </div>
            </div>
          </div>

          <div class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 class="mb-4 text-lg font-semibold text-gray-900">Poll Type & Options</h2>
            <div class="mb-5 flex gap-2">
              <button
                v-for="opt in typeOptions"
                :key="opt.value"
                type="button"
                class="rounded-lg px-4 py-2 text-sm font-medium transition"
                :class="pollType === opt.value ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
                @click="setPollType(opt.value)"
              >
                {{ opt.label }}
              </button>
            </div>

            <div v-if="pollType !== 'yes_no'" class="space-y-3">
              <label class="block text-sm font-medium text-gray-700">Options ({{ options.length }}/20)</label>
              <div v-for="(opt, i) in options" :key="i" class="flex items-center gap-2">
                <input
                  v-model="options[i]"
                  type="text"
                  class="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  :placeholder="`Option ${i + 1}`"
                  maxlength="255"
                />
                <button
                  v-if="options.length > 2"
                  type="button"
                  class="flex h-10 w-10 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                  @click="removeOption(i)"
                >
                  <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              <button
                v-if="options.length < 20"
                type="button"
                class="mt-2 flex items-center gap-2 text-sm font-medium text-indigo-600 transition hover:text-indigo-800"
                @click="addOption"
              >
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                Add option
              </button>
            </div>

            <p v-if="pollType === 'yes_no'" class="rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
              Yes/No poll type uses two fixed options: Yes and No.
            </p>
          </div>

          <div class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 class="mb-4 text-lg font-semibold text-gray-900">Settings</h2>
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700">Duration <span class="text-gray-400">(minutes, optional)</span></label>
                <input
                  v-model.number="durationMinutes"
                  type="number"
                  class="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="e.g. 5"
                  min="1"
                  max="1440"
                />
              </div>
            </div>
            <div class="mt-5 space-y-3">
              <label class="flex items-center gap-3">
                <input
                  v-model="anonymous"
                  type="checkbox"
                  class="h-5 w-5 rounded-lg border-gray-300 text-indigo-600 outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <span class="text-sm text-gray-700">Anonymous votes</span>
              </label>
              <label class="flex items-center gap-3">
                <input
                  v-model="allowMultipleVotes"
                  type="checkbox"
                  class="h-5 w-5 rounded-lg border-gray-300 text-indigo-600 outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <span class="text-sm text-gray-700">Allow multiple votes per person</span>
              </label>
              <label class="flex items-center gap-3">
                <input
                  v-model="showResults"
                  type="checkbox"
                  class="h-5 w-5 rounded-lg border-gray-300 text-indigo-600 outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <span class="text-sm text-gray-700">Show results to voters after voting</span>
              </label>
            </div>
          </div>

          <div v-if="validationError || store.error" class="rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {{ validationError || store.error }}
          </div>

          <div class="flex items-center justify-end gap-3">
            <router-link
              :to="{ name: 'live-poll-list' }"
              class="rounded-xl border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Cancel
            </router-link>
            <button
              type="submit"
              class="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
              :disabled="store.loading"
            >
              {{ store.loading ? 'Saving...' : isEdit ? 'Update Poll' : 'Create Poll' }}
            </button>
          </div>
        </div>
      </form>

      <ToastNotification
        :message="store.error"
        type="error"
        @close="store.clearError()"
      />
    </div>
  </div>
</template>
