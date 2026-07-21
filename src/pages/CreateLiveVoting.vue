<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { createPoll, updatePoll, getPollById } from '@/utils/pollStorage'
import { useAuthStore } from '@/stores/auth'
import ToastNotification from '@/components/ToastNotification.vue'
import type { LivePoll } from '@/utils/pollStorage'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

onMounted(() => {
  if (!auth.isAuthenticated || auth.user?.role !== 'teacher') {
    router.push('/live-voting')
  }
})

// ── Edit Mode ──
const isEditing = ref(false)
const editId = ref<string | null>(null)

// ── Form State ──
const title = ref('')
const description = ref('')
const question = ref('')
const pollType = ref<'multiple-choice' | 'yes-no' | 'rating-scale'>('multiple-choice')
const duration = ref(10)
const allowMultipleVotes = ref(false)
const anonymous = ref(true)

// Multiple Choice options
const mcOptions = ref<string[]>(['', ''])

// ── UI State ──
const isSaving = ref(false)
const isStarting = ref(false)
const errors = ref<Record<string, string>>({})
const toastMessage = ref<string | null>(null)
const toastType = ref<'success' | 'error'>('success')

// ── Duration Options ──
const durationOptions = [1, 5, 10, 30, 60]

// ── Poll Type Definitions ──
const pollTypes = [
  {
    id: 'multiple-choice' as const,
    label: 'Multiple Choice',
    description: 'Students select from custom options',
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    color: '#6366F1',
  },
  {
    id: 'yes-no' as const,
    label: 'Yes / No',
    description: 'Simple binary choice',
    icon: 'M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5',
    color: '#22C55E',
  },
  {
    id: 'rating-scale' as const,
    label: 'Rating Scale (1–5)',
    description: 'Rate on a 1 to 5 scale',
    icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
    color: '#F59E0B',
  },
]

// ── Computed Options ──
const computedOptions = computed(() => {
  if (pollType.value === 'yes-no') {
    return ['Yes', 'No']
  }
  if (pollType.value === 'rating-scale') {
    return ['1', '2', '3', '4', '5']
  }
  return mcOptions.value.filter((o) => o.trim())
})

const selectedTypeMeta = computed(() => pollTypes.find((t) => t.id === pollType.value))

// ── Multiple Choice Helpers ──
function addOption() {
  if (mcOptions.value.length < 15) {
    mcOptions.value.push('')
  }
}

function removeOption(index: number) {
  if (mcOptions.value.length > 2) {
    mcOptions.value.splice(index, 1)
  }
}

function clearError(field: string) {
  delete errors.value[field]
}

// ── Validation ──
function validate(): boolean {
  errors.value = {}

  if (!title.value.trim()) {
    errors.value.title = 'Voting title is required'
  }

  if (!question.value.trim()) {
    errors.value.question = 'Question is required'
  }

  if (pollType.value === 'multiple-choice') {
    const filled = mcOptions.value.filter((o) => o.trim())
    if (filled.length < 2) {
      errors.value.options = 'At least 2 options are required'
    }
  }

  return Object.keys(errors.value).length === 0
}

// ── Reset form to defaults ──
function resetForm() {
  isEditing.value = false
  editId.value = null
  title.value = ''
  description.value = ''
  question.value = ''
  pollType.value = 'multiple-choice'
  duration.value = 10
  allowMultipleVotes.value = false
  anonymous.value = true
  mcOptions.value = ['', '']
  errors.value = {}
}

// ── Load poll for editing or reset for create ──
watch(() => route.params.id, (pollId) => {
  resetForm()

  if (pollId && typeof pollId === 'string') {
    const poll = getPollById(pollId)
    if (poll && poll.status === 'draft') {
      isEditing.value = true
      editId.value = poll.id
      title.value = poll.title
      description.value = poll.description
      question.value = poll.question
      pollType.value = poll.type
      duration.value = poll.duration
      allowMultipleVotes.value = poll.allowMultipleVotes
      anonymous.value = poll.anonymous

      if (poll.type === 'multiple-choice') {
        mcOptions.value = poll.options.length >= 2 ? [...poll.options] : ['', '']
      }
    } else if (poll) {
      toastMessage.value = 'Only draft polls can be edited.'
      toastType.value = 'error'
      setTimeout(() => router.push('/live-voting'), 1500)
    } else {
      toastMessage.value = 'Poll not found.'
      toastType.value = 'error'
      setTimeout(() => router.push('/live-voting'), 1500)
    }
  }
}, { immediate: true })

// ── Reset errors on type change ──
watch(pollType, () => {
  errors.value = {}
})

// ── Build Poll Data ──
function buildPollData(status: 'draft' | 'active'): Omit<LivePoll, 'id' | 'createdAt' | 'updatedAt'> {
  let options: string[]
  if (pollType.value === 'yes-no') {
    options = ['Yes', 'No']
  } else if (pollType.value === 'rating-scale') {
    options = ['1', '2', '3', '4', '5']
  } else {
    options = mcOptions.value.filter((o) => o.trim())
  }

  return {
    title: title.value.trim(),
    description: description.value.trim(),
    question: question.value.trim(),
    type: pollType.value,
    options,
    duration: duration.value,
    allowMultipleVotes: allowMultipleVotes.value,
    anonymous: anonymous.value,
    status,
  }
}

// ── Actions ──
function handleCancel() {
  router.push('/live-voting')
}

function handleSaveDraft() {
  if (!validate()) return
  isSaving.value = true

  try {
    const data = buildPollData('draft')
    if (isEditing.value && editId.value) {
      updatePoll(editId.value, data)
      toastMessage.value = 'Poll draft updated!'
    } else {
      createPoll(data)
      toastMessage.value = 'Poll saved as draft!'
    }
    toastType.value = 'success'
    setTimeout(() => router.push('/live-voting'), 1000)
  } catch {
    toastMessage.value = 'Failed to save draft.'
    toastType.value = 'error'
  } finally {
    isSaving.value = false
  }
}

function handleCreateAndStart() {
  if (!validate()) return
  isStarting.value = true

  try {
    const data = buildPollData('active')
    if (isEditing.value && editId.value) {
      updatePoll(editId.value, data)
      toastMessage.value = 'Poll updated and is now live!'
    } else {
      createPoll(data)
      toastMessage.value = 'Poll is now live!'
    }
    toastType.value = 'success'
    setTimeout(() => router.push('/live-voting'), 1000)
  } catch {
    toastMessage.value = 'Failed to start poll.'
    toastType.value = 'error'
  } finally {
    isStarting.value = false
  }
}
</script>

<template>
  <div class="clv-page">
    <!-- Background decorations -->
    <div class="clv-bg-orb clv-bg-orb--1" aria-hidden="true" />
    <div class="clv-bg-orb clv-bg-orb--2" aria-hidden="true" />
    <div class="clv-bg-grid" aria-hidden="true" />

    <div class="clv-container">
      <!-- Header -->
      <header class="clv-header">
        <div class="clv-header-left">
          <div class="clv-header-badge">
            <svg class="clv-badge-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Live Voting</span>
          </div>
          <h1 class="clv-title">{{ isEditing ? 'Edit Live Voting' : 'Create Live Voting' }}</h1>
          <p class="clv-subtitle">{{ isEditing ? 'Update your draft poll settings and options.' : 'Design a live voting poll for your classroom. Configure options, set duration, and launch instantly.' }}</p>
        </div>
        <button class="clv-back-btn" @click="handleCancel">
          <svg class="clv-back-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>
      </header>

      <div class="clv-layout">
        <!-- ──── LEFT COLUMN — FORM ──── -->
        <div class="clv-form-col">
          <!-- Card: Basic Info -->
          <div class="clv-card">
            <div class="clv-card-header">
              <svg class="clv-card-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h2 class="clv-card-title">Basic Information</h2>
                <p class="clv-card-desc">Enter the details of your voting poll</p>
              </div>
            </div>

            <!-- Title -->
            <div class="clv-field">
              <label class="clv-label" for="voting-title">
                Voting Title
                <span class="clv-required">*</span>
              </label>
              <div class="clv-input-wrap" :class="{ 'clv-input-error': errors.title }">
                <svg class="clv-input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <input
                  id="voting-title"
                  v-model="title"
                  type="text"
                  class="clv-input"
                  placeholder="e.g. Friday Review Quiz"
                  maxlength="200"
                  @input="clearError('title')"
                />
              </div>
              <p v-if="errors.title" class="clv-error">{{ errors.title }}</p>
            </div>

            <!-- Description -->
            <div class="clv-field">
              <label class="clv-label" for="voting-desc">Description</label>
              <div class="clv-input-wrap">
                <textarea
                  id="voting-desc"
                  v-model="description"
                  class="clv-input clv-textarea"
                  placeholder="Optional — Provide context or instructions for your students..."
                  rows="3"
                  maxlength="500"
                />
              </div>
              <div class="clv-char-count">{{ description.length }}/500</div>
            </div>

            <!-- Question -->
            <div class="clv-field clv-field--last">
              <label class="clv-label" for="voting-question">
                Question
                <span class="clv-required">*</span>
              </label>
              <div class="clv-input-wrap" :class="{ 'clv-input-error': errors.question }">
                <svg class="clv-input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <input
                  id="voting-question"
                  v-model="question"
                  type="text"
                  class="clv-input"
                  placeholder="e.g. What is the capital of France?"
                  maxlength="500"
                  @input="clearError('question')"
                />
              </div>
              <p v-if="errors.question" class="clv-error">{{ errors.question }}</p>
            </div>
          </div>

          <!-- Card: Poll Type -->
          <div class="clv-card">
            <div class="clv-card-header">
              <svg class="clv-card-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <div>
                <h2 class="clv-card-title">Poll Type</h2>
                <p class="clv-card-desc">Choose how students will respond</p>
              </div>
            </div>

            <div class="clv-type-grid">
              <button
                v-for="pt in pollTypes"
                :key="pt.id"
                type="button"
                class="clv-type-card"
                :class="{ 'clv-type-card--active': pollType === pt.id }"
                :style="pollType === pt.id ? { borderColor: pt.color, '--type-accent': pt.color } as any : {}"
                @click="pollType = pt.id"
              >
                <div class="clv-type-icon" :style="{ background: `${pt.color}14`, color: pt.color }">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="pt.icon" />
                  </svg>
                </div>
                <div class="clv-type-info">
                  <span class="clv-type-label">{{ pt.label }}</span>
                  <span class="clv-type-desc">{{ pt.description }}</span>
                </div>
                <div class="clv-type-radio" :class="{ 'clv-type-radio--active': pollType === pt.id }" :style="pollType === pt.id ? { borderColor: pt.color, background: pt.color } : {}">
                  <div v-if="pollType === pt.id" class="clv-type-radio-dot" />
                </div>
              </button>
            </div>
          </div>

          <!-- Card: Options Configuration -->
          <div class="clv-card">
            <div class="clv-card-header">
              <svg class="clv-card-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              <div>
                <h2 class="clv-card-title">Options</h2>
                <p class="clv-card-desc">
                  <template v-if="pollType === 'multiple-choice'">Add and manage answer choices</template>
                  <template v-else-if="pollType === 'yes-no'">Standard Yes / No options</template>
                  <template v-else>1 to 5 rating scale</template>
                </p>
              </div>
            </div>

            <!-- Multiple Choice -->
            <div v-if="pollType === 'multiple-choice'" class="clv-options-section">
              <div class="clv-options-header">
                <span class="clv-options-count">{{ mcOptions.filter((o) => o.trim()).length }} option{{ mcOptions.filter((o) => o.trim()).length !== 1 ? 's' : '' }}</span>
                <span class="clv-options-max">Max 15</span>
              </div>
              <div class="clv-options-list">
                <div
                  v-for="(opt, index) in mcOptions"
                  :key="index"
                  class="clv-option-row"
                  :class="{ 'clv-option-row--empty': !opt.trim() }"
                >
                  <span class="clv-option-num">{{ index + 1 }}</span>
                  <input
                    v-model="mcOptions[index]"
                    type="text"
                    class="clv-option-input"
                    :placeholder="'Option ' + (index + 1)"
                    maxlength="255"
                    @input="clearError('options')"
                  />
                  <button
                    v-if="mcOptions.length > 2"
                    class="clv-option-remove"
                    title="Remove option"
                    @click="removeOption(index)"
                  >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <p v-if="errors.options" class="clv-error">{{ errors.options }}</p>
              <button
                v-if="mcOptions.length < 15"
                class="clv-add-option"
                @click="addOption"
              >
                <svg class="clv-add-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                Add Option
              </button>
            </div>

            <!-- Yes / No -->
            <div v-else-if="pollType === 'yes-no'" class="clv-options-section">
              <div class="clv-yn-grid">
                <div class="clv-yn-card clv-yn-card--yes">
                  <div class="clv-yn-icon-wrap clv-yn-icon-wrap--yes">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div class="clv-yn-text">
                    <span class="clv-yn-label">Yes</span>
                    <span class="clv-yn-desc">Affirmative response</span>
                  </div>
                </div>
                <div class="clv-yn-card clv-yn-card--no">
                  <div class="clv-yn-icon-wrap clv-yn-icon-wrap--no">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <div class="clv-yn-text">
                    <span class="clv-yn-label">No</span>
                    <span class="clv-yn-desc">Negative response</span>
                  </div>
                </div>
              </div>
              <div class="clv-yn-info">
                <svg class="clv-yn-info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Students select either Yes or No. Best for quick consensus checks.</span>
              </div>
            </div>

            <!-- Rating Scale -->
            <div v-else class="clv-options-section">
              <div class="clv-rating-display">
                <div class="clv-rating-header">
                  <span class="clv-rating-label-min">Low</span>
                  <span class="clv-rating-count">5 points</span>
                  <span class="clv-rating-label-max">High</span>
                </div>
                <div class="clv-rating-bar">
                  <div
                    v-for="n in 5"
                    :key="n"
                    class="clv-rating-step"
                    :style="{ animationDelay: `${n * 0.06}s` }"
                  >
                    <span class="clv-rating-value">{{ n }}</span>
                    <div class="clv-rating-fill" :style="{ opacity: 0.3 + n * 0.14 }"></div>
                  </div>
                </div>
                <div class="clv-rating-footer">
                  <span>Poor</span>
                  <span>Excellent</span>
                </div>
              </div>
              <div class="clv-rating-note">
                <svg class="clv-rating-note-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Students rate on a scale from 1 (lowest) to 5 (highest).</span>
              </div>
            </div>
          </div>

          <!-- Card: Settings -->
          <div class="clv-card">
            <div class="clv-card-header">
              <svg class="clv-card-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div>
                <h2 class="clv-card-title">Settings</h2>
                <p class="clv-card-desc">Configure duration and voting behavior</p>
              </div>
            </div>

            <!-- Duration -->
            <div class="clv-field">
              <label class="clv-label">Duration</label>
              <div class="clv-duration-grid">
                <button
                  v-for="d in durationOptions"
                  :key="d"
                  type="button"
                  class="clv-duration-btn"
                  :class="{ 'clv-duration-btn--active': duration === d }"
                  @click="duration = d"
                >
                  <svg class="clv-duration-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span>{{ d }} min</span>
                </button>
              </div>
            </div>

            <!-- Toggles -->
            <div class="clv-toggles">
              <div class="clv-toggle-row">
                <div class="clv-toggle-info">
                  <div class="clv-toggle-icon-wrap">
                    <svg class="clv-toggle-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <span class="clv-toggle-label">Allow Multiple Votes</span>
                    <span class="clv-toggle-desc">Students can vote more than once</span>
                  </div>
                </div>
                <button
                  type="button"
                  class="clv-switch"
                  :class="{ 'clv-switch--on': allowMultipleVotes }"
                  role="switch"
                  :aria-checked="allowMultipleVotes"
                  @click="allowMultipleVotes = !allowMultipleVotes"
                >
                  <span class="clv-switch-knob" :class="{ 'clv-switch-knob--on': allowMultipleVotes }" />
                </button>
              </div>

              <div class="clv-toggle-row">
                <div class="clv-toggle-info">
                  <div class="clv-toggle-icon-wrap">
                    <svg class="clv-toggle-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <span class="clv-toggle-label">Anonymous Voting</span>
                    <span class="clv-toggle-desc">Hide student identities in results</span>
                  </div>
                </div>
                <button
                  type="button"
                  class="clv-switch"
                  :class="{ 'clv-switch--on': anonymous }"
                  role="switch"
                  :aria-checked="anonymous"
                  @click="anonymous = !anonymous"
                >
                  <span class="clv-switch-knob" :class="{ 'clv-switch-knob--on': anonymous }" />
                </button>
              </div>
            </div>
          </div>

          <!-- ── Action Buttons ── -->
          <div class="clv-actions-card">
            <button
              type="button"
              class="clv-btn clv-btn--ghost"
              @click="handleCancel"
            >
              <svg class="clv-btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </button>

            <button
              type="button"
              class="clv-btn clv-btn--outline"
              :disabled="isSaving || isStarting"
              @click="handleSaveDraft"
            >
              <svg v-if="!isSaving" class="clv-btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              <svg v-else class="clv-spinner" fill="none" viewBox="0 0 24 24">
                <circle class="clv-spin-track" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="clv-spin-bar" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {{ isSaving ? 'Saving...' : 'Save Draft' }}
            </button>

            <button
              type="button"
              class="clv-btn clv-btn--primary"
              :disabled="isSaving || isStarting"
              @click="handleCreateAndStart"
            >
              <svg v-if="!isStarting" class="clv-btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <svg v-else class="clv-spinner" fill="none" viewBox="0 0 24 24">
                <circle class="clv-spin-track" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="clv-spin-bar" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {{ isStarting ? 'Starting...' : 'Create & Start Voting' }}
            </button>
          </div>
        </div>

        <!-- ──── RIGHT COLUMN — PREVIEW ──── -->
        <div class="clv-preview-col">
          <div class="clv-preview-sticky">
            <div class="clv-preview-header">
              <svg class="clv-preview-header-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>Live Preview</span>
              <span class="clv-preview-badge">Student View</span>
            </div>

            <div class="clv-preview-card">
              <!-- Type Badge -->
              <div class="clv-preview-type-badge">
                <span>{{ selectedTypeMeta?.label }}</span>
              </div>

              <!-- Title -->
              <h3 class="clv-preview-title">{{ title.trim() || 'Poll Title' }}</h3>

              <!-- Description -->
              <p v-if="description.trim()" class="clv-preview-desc">{{ description }}</p>

              <!-- Divider -->
              <div class="clv-preview-divider" />

              <!-- Question -->
              <p class="clv-preview-question">{{ question.trim() || 'Your question will appear here' }}</p>

              <!-- Options preview -->
              <div class="clv-preview-options">
                <!-- Multiple Choice Preview -->
                <template v-if="pollType === 'multiple-choice'">
                  <div
                    v-for="(opt, i) in computedOptions"
                    :key="i"
                    class="clv-preview-opt"
                  >
                    <div class="clv-preview-radio" />
                    <span class="clv-preview-opt-text">{{ opt }}</span>
                  </div>
                  <div v-if="computedOptions.length < 2" class="clv-preview-placeholder">
                    <span>Add at least 2 options</span>
                  </div>
                </template>

                <!-- Yes/No Preview -->
                <template v-else-if="pollType === 'yes-no'">
                  <div class="clv-preview-opt clv-preview-opt--yes">
                    <div class="clv-preview-radio clv-preview-radio--yes">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span class="clv-preview-opt-text">Yes</span>
                  </div>
                  <div class="clv-preview-opt clv-preview-opt--no">
                    <div class="clv-preview-radio clv-preview-radio--no">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <span class="clv-preview-opt-text">No</span>
                  </div>
                </template>

                <!-- Rating Preview -->
                <template v-else>
                  <div class="clv-preview-rating">
                    <div class="clv-preview-rating-bar">
                      <div
                        v-for="n in 5"
                        :key="n"
                        class="clv-preview-rating-step"
                      >
                        <span class="clv-preview-rating-num">{{ n }}</span>
                        <div
                          class="clv-preview-rating-dot"
                          :class="{ 'clv-preview-rating-dot--filled': n <= 3 }"
                        />
                      </div>
                    </div>
                    <div class="clv-preview-rating-labels">
                      <span>Poor</span>
                      <span>Excellent</span>
                    </div>
                  </div>
                </template>
              </div>

              <!-- Submit Button Placeholder -->
              <button class="clv-preview-submit" disabled>
                <svg class="clv-preview-submit-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Submit Vote
              </button>

              <!-- Footer -->
              <div class="clv-preview-footer">
                <svg class="clv-preview-footer-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>{{ anonymous ? 'Your response is anonymous' : 'Your name will be recorded' }}</span>
              </div>
            </div>

            <!-- Summary Stats -->
            <div class="clv-preview-stats">
              <div class="clv-preview-stat">
                <span class="clv-preview-stat-val">{{ computedOptions.length > 0 ? computedOptions.length : (pollType === 'rating-scale' ? 5 : '—') }}</span>
                <span class="clv-preview-stat-label">Options</span>
              </div>
              <div class="clv-preview-stat-divider" />
              <div class="clv-preview-stat">
                <span class="clv-preview-stat-val">{{ duration }} min</span>
                <span class="clv-preview-stat-label">Duration</span>
              </div>
              <div class="clv-preview-stat-divider" />
              <div class="clv-preview-stat">
                <span class="clv-preview-stat-val">{{ allowMultipleVotes ? 'Yes' : 'No' }}</span>
                <span class="clv-preview-stat-label">Multi Vote</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <ToastNotification :message="toastMessage" :type="toastType" @close="toastMessage = null" />
  </div>
</template>

<style scoped>
/* ── Page Layout ── */
.clv-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background: linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 50%, #EEF2FF 100%);
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  padding: 88px 24px 60px;
}

.clv-bg-orb {
  position: fixed;
  border-radius: 9999px;
  pointer-events: none;
  filter: blur(100px);
  opacity: 0.3;
  z-index: 0;
}

.clv-bg-orb--1 {
  top: -80px;
  left: -80px;
  width: 300px;
  height: 300px;
  background: rgba(99, 102, 241, 0.12);
}

.clv-bg-orb--2 {
  bottom: -120px;
  right: -80px;
  width: 350px;
  height: 350px;
  background: rgba(168, 85, 247, 0.1);
}

.clv-bg-grid {
  position: fixed;
  inset: 0;
  pointer-events: none;
  opacity: 0.15;
  background-image:
    linear-gradient(rgba(148, 163, 184, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148, 163, 184, 0.06) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.5), transparent 90%);
  -webkit-mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.5), transparent 90%);
  z-index: 0;
}

.clv-container {
  position: relative;
  max-width: 1280px;
  margin: 0 auto;
  z-index: 1;
}

/* ── Header ── */
.clv-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 32px;
  gap: 16px;
}

.clv-header-left {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.clv-header-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 9999px;
  background: linear-gradient(135deg, #EEF2FF, #E0E7FF);
  color: #4F46E5;
  font-size: 12px;
  font-weight: 600;
  width: fit-content;
}

.clv-badge-icon {
  width: 14px;
  height: 14px;
}

.clv-title {
  font-size: 32px;
  font-weight: 800;
  color: #0F172A;
  letter-spacing: -0.03em;
  line-height: 1.2;
  margin: 0;
}

.clv-subtitle {
  font-size: 15px;
  color: #64748B;
  line-height: 1.6;
  margin: 0;
  max-width: 560px;
}

.clv-back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid #E2E8F0;
  border-radius: 10px;
  background: white;
  color: #475569;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
  white-space: nowrap;
  flex-shrink: 0;
}

.clv-back-btn:hover {
  background: #F8FAFC;
  border-color: #CBD5E1;
  color: #0F172A;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.clv-back-icon {
  width: 16px;
  height: 16px;
}

/* ── Layout ── */
.clv-layout {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 32px;
  align-items: start;
}

.clv-form-col {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.clv-preview-col {
  position: relative;
}

.clv-preview-sticky {
  position: sticky;
  top: 104px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ── Card ── */
.clv-card {
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: box-shadow 0.2s ease;
}

.clv-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.clv-card-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #F1F5F9;
}

.clv-card-icon {
  width: 20px;
  height: 20px;
  color: #6366F1;
  flex-shrink: 0;
  margin-top: 2px;
}

.clv-card-title {
  font-size: 16px;
  font-weight: 700;
  color: #0F172A;
  margin: 0;
}

.clv-card-desc {
  font-size: 13px;
  color: #64748B;
  margin: 2px 0 0;
}

/* ── Form Fields ── */
.clv-field {
  margin-bottom: 20px;
}

.clv-field--last {
  margin-bottom: 0;
}

.clv-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #334155;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.clv-required {
  color: #EF4444;
  margin-left: 2px;
}

.clv-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
  border-radius: 10px;
  border: 1.5px solid #E2E8F0;
  background: #FAFBFC;
  transition: all 0.2s ease;
}

.clv-input-wrap:focus-within {
  border-color: #6366F1;
  background: white;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.08);
}

.clv-input-error {
  border-color: #EF4444 !important;
  box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.08) !important;
}

.clv-input-icon {
  width: 18px;
  height: 18px;
  color: #94A3B8;
  flex-shrink: 0;
  margin-left: 14px;
}

.clv-input {
  width: 100%;
  padding: 11px 14px;
  border: none;
  background: transparent;
  font-size: 14px;
  color: #0F172A;
  outline: none;
  font-family: inherit;
}

.clv-input::placeholder {
  color: #94A3B8;
}

.clv-textarea {
  resize: vertical;
  min-height: 72px;
  line-height: 1.5;
}

.clv-char-count {
  text-align: right;
  font-size: 11px;
  color: #94A3B8;
  margin-top: 4px;
  padding-right: 4px;
}

.clv-error {
  font-size: 12px;
  font-weight: 500;
  color: #EF4444;
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.clv-error::before {
  content: '';
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #EF4444;
  flex-shrink: 0;
}

/* ── Poll Type Selector ── */
.clv-type-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.clv-type-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border: 2px solid #E2E8F0;
  border-radius: 12px;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  font-family: inherit;
  width: 100%;
}

.clv-type-card:hover {
  border-color: #CBD5E1;
  background: #F8FAFC;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.clv-type-card--active {
  background: linear-gradient(135deg, #FAFBFF, #F5F3FF) !important;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.08) !important;
}

.clv-type-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.clv-type-icon svg {
  width: 20px;
  height: 20px;
}

.clv-type-card:hover .clv-type-icon {
  transform: scale(1.05);
}

.clv-type-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.clv-type-label {
  font-size: 14px;
  font-weight: 600;
  color: #0F172A;
}

.clv-type-desc {
  font-size: 12px;
  color: #64748B;
}

.clv-type-radio {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid #CBD5E1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.clv-type-radio--active {
  border-color: #6366F1;
  background: #6366F1;
}

.clv-type-radio-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: white;
  animation: clv-scale-in 0.2s ease-out;
}

@keyframes clv-scale-in {
  from {
    transform: scale(0);
  }
  to {
    transform: scale(1);
  }
}

/* ── Options Section ── */
.clv-options-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.clv-options-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
}

.clv-options-count {
  color: #64748B;
  font-weight: 500;
}

.clv-options-max {
  color: #94A3B8;
}

.clv-options-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.clv-option-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 10px;
  border: 1.5px solid #E2E8F0;
  background: #FAFBFC;
  transition: all 0.2s ease;
}

.clv-option-row:focus-within {
  border-color: #6366F1;
  background: white;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.06);
}

.clv-option-row--empty {
  border-style: dashed;
  border-color: #CBD5E1;
  opacity: 0.7;
}

.clv-option-num {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: #F1F5F9;
  font-size: 11px;
  font-weight: 700;
  color: #64748B;
  flex-shrink: 0;
}

.clv-option-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 14px;
  color: #0F172A;
  outline: none;
  font-family: inherit;
  padding: 4px 0;
}

.clv-option-input::placeholder {
  color: #94A3B8;
}

.clv-option-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  background: transparent;
  color: #FCA5A5;
}

.clv-option-remove svg {
  width: 14px;
  height: 14px;
}

.clv-option-remove:hover {
  background: #FEF2F2;
  color: #EF4444;
}

.clv-add-option {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border: 2px dashed #CBD5E1;
  border-radius: 10px;
  background: transparent;
  color: #64748B;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
  width: fit-content;
}

.clv-add-option:hover {
  border-color: #6366F1;
  color: #6366F1;
  background: #EEF2FF;
}

.clv-add-icon {
  width: 16px;
  height: 16px;
}

/* ── Yes/No ── */
.clv-yn-grid {
  display: flex;
  gap: 16px;
}

.clv-yn-card {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  border-radius: 12px;
  border: 2px solid #E2E8F0;
  background: #FAFBFC;
}

.clv-yn-card--yes {
  border-color: #BBF7D0;
  background: #F0FDF4;
}

.clv-yn-card--no {
  border-color: #FECDD3;
  background: #FFF1F2;
}

.clv-yn-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  flex-shrink: 0;
}

.clv-yn-icon-wrap svg {
  width: 18px;
  height: 18px;
}

.clv-yn-icon-wrap--yes {
  background: #DCFCE7;
  color: #16A34A;
}

.clv-yn-icon-wrap--no {
  background: #FEE2E2;
  color: #DC2626;
}

.clv-yn-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.clv-yn-label {
  font-size: 16px;
  font-weight: 700;
  color: #0F172A;
}

.clv-yn-desc {
  font-size: 12px;
  color: #64748B;
}

.clv-yn-info {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 10px;
  background: #EFF6FF;
  color: #2563EB;
  font-size: 13px;
  line-height: 1.5;
}

.clv-yn-info-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  margin-top: 1px;
}

/* ── Rating Scale Display ── */
.clv-rating-display {
  padding: 20px;
  border-radius: 12px;
  background: linear-gradient(135deg, #FFFBEB, #FFF7ED);
  border: 1px solid #FDE68A;
}

.clv-rating-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.clv-rating-label-min,
.clv-rating-label-max {
  font-size: 12px;
  font-weight: 600;
  color: #92400E;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.clv-rating-count {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 10px;
  border-radius: 9999px;
  background: #FDE68A;
  color: #92400E;
}

.clv-rating-bar {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.clv-rating-step {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  animation: clv-fade-in 0.4s ease-out backwards;
  max-width: 56px;
}

.clv-rating-value {
  font-size: 14px;
  font-weight: 700;
  color: #78350F;
}

.clv-rating-fill {
  width: 100%;
  height: 40px;
  border-radius: 8px;
  background: linear-gradient(135deg, #FBBF24, #F59E0B);
  transition: all 0.3s ease;
}

.clv-rating-fill:hover {
  transform: scaleY(1.08);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.clv-rating-footer {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 11px;
  color: #92400E;
  font-weight: 500;
}

.clv-rating-note {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 10px;
  background: #FFFBEB;
  color: #92400E;
  font-size: 13px;
  line-height: 1.5;
  border: 1px solid #FDE68A;
}

.clv-rating-note-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  margin-top: 1px;
}

@keyframes clv-fade-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ── Duration Selector ── */
.clv-duration-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

.clv-duration-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 8px;
  border: 1.5px solid #E2E8F0;
  border-radius: 10px;
  background: #FAFBFC;
  color: #64748B;
  font-size: 12px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ease;
}

.clv-duration-btn:hover {
  border-color: #CBD5E1;
  background: #F8FAFC;
  transform: translateY(-1px);
}

.clv-duration-btn--active {
  border-color: #6366F1;
  background: linear-gradient(135deg, #EEF2FF, #E0E7FF);
  color: #4F46E5;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.clv-duration-icon {
  width: 16px;
  height: 16px;
}

/* ── Toggle Switches ── */
.clv-toggles {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.clv-toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  transition: border-color 0.2s ease;
}

.clv-toggle-row:hover {
  border-color: #CBD5E1;
}

.clv-toggle-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.clv-toggle-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: white;
  flex-shrink: 0;
}

.clv-toggle-icon {
  width: 18px;
  height: 18px;
  color: #6366F1;
}

.clv-toggle-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #0F172A;
}

.clv-toggle-desc {
  display: block;
  font-size: 12px;
  color: #64748B;
  margin-top: 1px;
}

.clv-switch {
  position: relative;
  display: inline-flex;
  width: 46px;
  height: 26px;
  border-radius: 999px;
  border: none;
  background: #CBD5E1;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.25s ease;
  padding: 0;
}

.clv-switch:focus-visible {
  outline: 2px solid #6366F1;
  outline-offset: 2px;
}

.clv-switch--on {
  background: #6366F1;
}

.clv-switch-knob {
  display: block;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  margin: 3px;
}

.clv-switch-knob--on {
  transform: translateX(20px);
}

/* ── Action Buttons Card ── */
.clv-actions-card {
  display: flex;
  gap: 12px;
  padding: 20px 24px;
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.clv-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  white-space: nowrap;
}

.clv-btn:focus-visible {
  outline: 2px solid #6366F1;
  outline-offset: 2px;
}

.clv-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.clv-btn-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.clv-btn--ghost {
  background: transparent;
  color: #64748B;
  border: 1px solid #E2E8F0;
}

.clv-btn--ghost:hover:not(:disabled) {
  background: #F8FAFC;
  color: #475569;
  border-color: #CBD5E1;
}

.clv-btn--outline {
  background: transparent;
  color: #4F46E5;
  border: 1px solid #CBD5E1;
}

.clv-btn--outline:hover:not(:disabled) {
  background: #EEF2FF;
  border-color: #6366F1;
}

.clv-btn--primary {
  background: linear-gradient(135deg, #4F46E5, #6366F1);
  color: white;
  box-shadow: 0 4px 14px rgba(79, 70, 229, 0.3);
}

.clv-btn--primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(79, 70, 229, 0.45);
  background: linear-gradient(135deg, #4338CA, #4F46E5);
}

/* ── Spinner ── */
.clv-spinner {
  width: 18px;
  height: 18px;
  animation: clv-spin 1s linear infinite;
}

.clv-spin-track {
  opacity: 0.25;
}

.clv-spin-bar {
  opacity: 0.75;
}

@keyframes clv-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* ── PREVIEW SECTION ── */
.clv-preview-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  color: #475569;
}

.clv-preview-header-icon {
  width: 16px;
  height: 16px;
  color: #6366F1;
}

.clv-preview-badge {
  margin-left: auto;
  padding: 2px 8px;
  border-radius: 6px;
  background: #EEF2FF;
  color: #4F46E5;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.clv-preview-card {
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
}

.clv-preview-type-badge {
  display: inline-flex;
  padding: 3px 10px;
  border-radius: 6px;
  background: #EEF2FF;
  color: #4F46E5;
  font-size: 11px;
  font-weight: 600;
  margin-bottom: 12px;
}

.clv-preview-title {
  font-size: 18px;
  font-weight: 700;
  color: #0F172A;
  margin: 0 0 8px;
  line-height: 1.3;
}

.clv-preview-desc {
  font-size: 13px;
  color: #64748B;
  margin: 0 0 12px;
  line-height: 1.5;
}

.clv-preview-divider {
  height: 1px;
  background: #E2E8F0;
  margin: 12px 0;
}

.clv-preview-question {
  font-size: 14px;
  font-weight: 600;
  color: #0F172A;
  margin: 0 0 16px;
  line-height: 1.4;
}

.clv-preview-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.clv-preview-opt {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid #E2E8F0;
  background: #FAFBFC;
  transition: all 0.2s ease;
}

.clv-preview-opt:hover {
  border-color: #CBD5E1;
  background: #F8FAFC;
}

.clv-preview-opt--yes:hover {
  border-color: #86EFAC;
  background: #F0FDF4;
}

.clv-preview-opt--no:hover {
  border-color: #FECDD3;
  background: #FFF1F2;
}

.clv-preview-radio {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid #CBD5E1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.clv-preview-radio--yes {
  border-color: #22C55E;
  background: #22C55E;
}

.clv-preview-radio--yes svg {
  width: 10px;
  height: 10px;
  color: white;
}

.clv-preview-radio--no {
  border-color: #EF4444;
  background: #EF4444;
}

.clv-preview-radio--no svg {
  width: 10px;
  height: 10px;
  color: white;
}

.clv-preview-opt-text {
  font-size: 14px;
  color: #1E293B;
}

.clv-preview-placeholder {
  padding: 20px;
  text-align: center;
  border: 2px dashed #E2E8F0;
  border-radius: 10px;
  color: #94A3B8;
  font-size: 13px;
}

.clv-preview-rating {
  padding: 16px;
  border-radius: 12px;
  background: #FFFBEB;
  border: 1px solid #FDE68A;
}

.clv-preview-rating-bar {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-bottom: 8px;
}

.clv-preview-rating-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.clv-preview-rating-num {
  font-size: 13px;
  font-weight: 700;
  color: #78350F;
}

.clv-preview-rating-dot {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #FDE68A;
  border: 2px solid #FDE68A;
  transition: all 0.2s ease;
}

.clv-preview-rating-dot--filled {
  background: #F59E0B;
  border-color: #F59E0B;
}

.clv-preview-rating-labels {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: #92400E;
  font-weight: 500;
  padding: 0 4px;
}

.clv-preview-submit {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  border: none;
  border-radius: 10px;
  background: #F1F5F9;
  color: #94A3B8;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: not-allowed;
}

.clv-preview-submit-icon {
  width: 18px;
  height: 18px;
}

.clv-preview-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #F1F5F9;
  font-size: 12px;
  color: #94A3B8;
}

.clv-preview-footer-icon {
  width: 14px;
  height: 14px;
  color: #6366F1;
  flex-shrink: 0;
}

/* ── Preview Stats ── */
.clv-preview-stats {
  display: flex;
  align-items: center;
  padding: 16px;
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
}

.clv-preview-stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.clv-preview-stat-val {
  font-size: 14px;
  font-weight: 700;
  color: #0F172A;
}

.clv-preview-stat-label {
  font-size: 10px;
  font-weight: 600;
  color: #94A3B8;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.clv-preview-stat-divider {
  width: 1px;
  height: 32px;
  background: #E2E8F0;
}

/* ── Responsive ── */
@media (max-width: 1024px) {
  .clv-layout {
    grid-template-columns: 1fr;
  }

  .clv-preview-col {
    display: none;
  }
}

@media (max-width: 768px) {
  .clv-page {
    padding: 80px 16px 40px;
  }

  .clv-header {
    flex-direction: column;
  }

  .clv-title {
    font-size: 24px;
  }

  .clv-actions-card {
    flex-direction: column;
  }

  .clv-btn {
    justify-content: center;
    width: 100%;
  }

  .clv-duration-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .clv-yn-grid {
    flex-direction: column;
  }

  .clv-rating-bar {
    gap: 4px;
  }
}
</style>
