<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { usePollStore } from '@/stores/pollStore'
import type { PollFormData } from '@/types/poll'
import ToastNotification from '@/components/ToastNotification.vue'

const router = useRouter()
const pollStore = usePollStore()

// ── Form State ──
const pollTitle = ref('')
const instructions = ref('')
const question = ref('')
const pollType = ref<'multiple-choice' | 'yes-no' | 'rating-scale'>('multiple-choice')
const mcOptions = ref<string[]>(['', ''])
const ratingMin = ref(1)
const ratingMax = ref(5)
const ratingMinLabel = ref('Poor')
const ratingMaxLabel = ref('Excellent')
const ratingStep = ref(1)

// Submitting state
const isSaving = ref(false)
const isStarting = ref(false)

// Validation
const errors = ref<Record<string, string>>({})

// ── Poll Type Options ──
const pollTypes = [
  {
    id: 'multiple-choice' as const,
    label: 'Multiple Choice',
    description: 'Students select one or more options',
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    color: '#4F46E5',
  },
  {
    id: 'yes-no' as const,
    label: 'Yes / No',
    description: 'Simple binary choice',
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    color: '#10B981',
  },
  {
    id: 'rating-scale' as const,
    label: 'Rating Scale',
    description: 'Rate on a configurable scale',
    icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
    color: '#F59E0B',
  },
]

// ── Preview Data ──
const previewOptions = computed(() => {
  if (pollType.value === 'yes-no') {
    return ['Yes', 'No']
  }
  if (pollType.value === 'rating-scale') {
    const options: string[] = []
    for (let i = ratingMin.value; i <= ratingMax.value; i += ratingStep.value) {
      let label = ''
      if (i === ratingMin.value && ratingMinLabel.value) {
        label = `${i} — ${ratingMinLabel.value}`
      } else if (i === ratingMax.value && ratingMaxLabel.value) {
        label = `${i} — ${ratingMaxLabel.value}`
      } else {
        label = `${i}`
      }
      options.push(label)
    }
    return options
  }
  return mcOptions.value.filter((o) => o.trim())
})

const previewTitle = computed(() => pollTitle.value.trim() || 'Poll Title')
const previewQuestion = computed(() => question.value.trim() || 'Your question will appear here')
const previewInstructions = computed(() => instructions.value.trim() || '')

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

function moveOptionUp(index: number) {
  if (index > 0) {
    const temp = mcOptions.value[index] as string
    mcOptions.value[index] = mcOptions.value[index - 1] as string
    mcOptions.value[index - 1] = temp
  }
}

function moveOptionDown(index: number) {
  if (index < mcOptions.value.length - 1) {
    const temp = mcOptions.value[index] as string
    mcOptions.value[index] = mcOptions.value[index + 1] as string
    mcOptions.value[index + 1] = temp
  }
}

// ── Validation ──
function validate(): boolean {
  errors.value = {}

  if (!pollTitle.value.trim()) {
    errors.value.title = 'Poll title is required'
  }

  if (!question.value.trim()) {
    errors.value.question = 'Question is required'
  }

  if (pollType.value === 'multiple-choice') {
    const filled = mcOptions.value.filter((o) => o.trim())
    if (filled.length < 2) {
      errors.value.options = 'At least 2 options are required'
    }
    const unique = new Set(filled.map((o) => o.trim().toLowerCase()))
    if (unique.size !== filled.length) {
      errors.value.options = 'Duplicate options are not allowed'
    }
  }

  if (pollType.value === 'rating-scale') {
    if (ratingMin.value >= ratingMax.value) {
      errors.value.rating = 'Maximum must be greater than minimum'
    }
    if (ratingMin.value < 0) {
      errors.value.rating = 'Minimum must be 0 or more'
    }
    if (ratingMax.value > 100) {
      errors.value.rating = 'Maximum cannot exceed 100'
    }
  }

  return Object.keys(errors.value).length === 0
}

function clearError(field: string) {
  delete errors.value[field]
}

// ── Toast State ──
const toastMessage = ref<string | null>(null)
const toastType = ref<'success' | 'error'>('success')

// ── Build API Payload ──
function buildFormData(): PollFormData {
  let options: string[] = []
  let isMultipleChoice = false

  if (pollType.value === 'multiple-choice') {
    options = mcOptions.value.filter((o) => o.trim())
    isMultipleChoice = true
  } else if (pollType.value === 'yes-no') {
    options = ['Yes', 'No']
  } else if (pollType.value === 'rating-scale') {
    for (let i = ratingMin.value; i <= ratingMax.value; i += ratingStep.value) {
      options.push(String(i))
    }
  }

  // Combine title and question (the backend only has a single `question` field)
  const fullQuestion = [
    pollTitle.value.trim(),
    question.value.trim(),
  ].filter(Boolean).join(' — ')

  // If instructions were provided, append them as context
  const instructionsText = instructions.value.trim()
  const questionWithContext = instructionsText
    ? `${fullQuestion}\n\n${instructionsText}`
    : fullQuestion

  return {
    question: questionWithContext,
    options,
    is_multiple_choice: isMultipleChoice,
    is_open_text: false,
    is_anonymous: false,
    is_quiz: false,
  }
}

// ── Actions ──
async function handleSaveDraft() {
  if (!validate()) return
  isSaving.value = true
  pollStore.clearError()

  try {
    const data = buildFormData()
    await pollStore.createPoll(data)
    toastMessage.value = 'Poll saved as draft!'
    toastType.value = 'success'
    setTimeout(() => router.push('/polls'), 1200)
  } catch (e: any) {
    const msg = e.response?.data?.message
      || e.response?.data?.error
      || (e.response?.data?.errors ? Object.values(e.response.data.errors).flat().join(', ') : null)
      || 'Failed to save poll.'
    toastMessage.value = msg
    toastType.value = 'error'
  } finally {
    isSaving.value = false
  }
}

async function handleStartPoll() {
  if (!validate()) return
  isStarting.value = true
  pollStore.clearError()

  try {
    const data = buildFormData()
    const poll = await pollStore.createPoll(data)
    await pollStore.startPoll(poll.id)
    toastMessage.value = 'Poll is now live!'
    toastType.value = 'success'
    setTimeout(() => router.push({ name: 'live-voting' }), 1200)
  } catch (e: any) {
    const msg = e.response?.data?.message
      || e.response?.data?.error
      || (e.response?.data?.errors ? Object.values(e.response.data.errors).flat().join(', ') : null)
      || 'Failed to start poll.'
    toastMessage.value = msg
    toastType.value = 'error'
  } finally {
    isStarting.value = false
  }
}

function handleCancel() {
  router.push('/polls')
}

// ── Reset errors when switching types ──
watch(pollType, () => {
  errors.value = {}
})
</script>

<template>
  <div class="cvp-page">
    <!-- Background Decor -->
    <div class="cvp-bg-orb cvp-bg-orb--1" aria-hidden="true" />
    <div class="cvp-bg-orb cvp-bg-orb--2" aria-hidden="true" />
    <div class="cvp-bg-grid" aria-hidden="true" />

    <div class="cvp-container">
      <!-- Header -->
      <header class="cvp-header">
        <div class="cvp-header-left">
          <div class="cvp-header-badge">
            <svg class="cvp-header-badge-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>New Voting Poll</span>
          </div>
          <h1 class="cvp-title">Create Voting Poll</h1>
          <p class="cvp-subtitle">Design a live polling session for your classroom. Configure options, choose the question type, and launch instantly.</p>
        </div>
        <button class="cvp-back-btn" @click="handleCancel">
          <svg class="cvp-back-btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>
      </header>

      <form class="cvp-layout" @submit.prevent="handleStartPoll">
        <!-- ── FORM SECTION ── -->
        <div class="cvp-form-col">
          <div class="cvp-card">
            <div class="cvp-card-header">
              <svg class="cvp-card-header-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <div>
                <h2 class="cvp-card-title">Poll Details</h2>
                <p class="cvp-card-desc">Basic information about your poll</p>
              </div>
            </div>

            <!-- Poll Title -->
            <div class="cvp-field">
              <label class="cvp-label" for="poll-title">
                Poll Title
                <span class="cvp-required">*</span>
              </label>
              <div class="cvp-input-wrapper" :class="{ 'cvp-input-error': errors.title }">
                <svg class="cvp-input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <input
                  id="poll-title"
                  v-model="pollTitle"
                  type="text"
                  class="cvp-input"
                  placeholder="e.g. Week 5 Review Quiz"
                  maxlength="200"
                  @input="clearError('title')"
                />
              </div>
              <p v-if="errors.title" class="cvp-error-msg">{{ errors.title }}</p>
            </div>

            <!-- Instructions -->
            <div class="cvp-field">
              <label class="cvp-label" for="poll-instructions">Instructions</label>
              <div class="cvp-input-wrapper">
                <svg class="cvp-input-icon cvp-input-icon--top" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                <textarea
                  id="poll-instructions"
                  v-model="instructions"
                  class="cvp-input cvp-textarea"
                  placeholder="Provide instructions for your students (optional)"
                  rows="3"
                  maxlength="500"
                />
              </div>
              <div class="cvp-char-count">{{ instructions.length }}/500</div>
            </div>

            <!-- Question -->
            <div class="cvp-field">
              <label class="cvp-label" for="poll-question">
                Question
                <span class="cvp-required">*</span>
              </label>
              <div class="cvp-input-wrapper" :class="{ 'cvp-input-error': errors.question }">
                <svg class="cvp-input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <input
                  id="poll-question"
                  v-model="question"
                  type="text"
                  class="cvp-input"
                  placeholder="e.g. What is the capital of France?"
                  maxlength="500"
                  @input="clearError('question')"
                />
              </div>
              <p v-if="errors.question" class="cvp-error-msg">{{ errors.question }}</p>
            </div>
          </div>

          <!-- ── POLL TYPE SELECTOR ── -->
          <div class="cvp-card">
            <div class="cvp-card-header">
              <svg class="cvp-card-header-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <div>
                <h2 class="cvp-card-title">Poll Type</h2>
                <p class="cvp-card-desc">Choose how students will respond</p>
              </div>
            </div>

            <div class="cvp-type-grid">
              <button
                v-for="pt in pollTypes"
                :key="pt.id"
                type="button"
                class="cvp-type-card"
                :class="{ 'cvp-type-card--active': pollType === pt.id }"
                :style="pollType === pt.id ? { borderColor: pt.color, '--type-accent': pt.color } as any : {}"
                @click="pollType = pt.id"
              >
                <div class="cvp-type-icon" :style="{ background: `${pt.color}14`, color: pt.color }">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="pt.icon" />
                  </svg>
                </div>
                <div class="cvp-type-info">
                  <span class="cvp-type-label">{{ pt.label }}</span>
                  <span class="cvp-type-desc">{{ pt.description }}</span>
                </div>
                <div class="cvp-type-radio" :class="{ 'cvp-type-radio--active': pollType === pt.id }" :style="pollType === pt.id ? { borderColor: pt.color, background: pt.color } : {}">
                  <div v-if="pollType === pt.id" class="cvp-type-radio-dot" />
                </div>
              </button>
            </div>
          </div>

          <!-- ── OPTIONS CONFIGURATION ── -->
          <div class="cvp-card">
            <div class="cvp-card-header">
              <svg class="cvp-card-header-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              <div>
                <h2 class="cvp-card-title">Options</h2>
                <p class="cvp-card-desc">
                  <template v-if="pollType === 'multiple-choice'">Add and arrange answer choices</template>
                  <template v-else-if="pollType === 'yes-no'">Standard Yes/No configuration</template>
                  <template v-else>Configure the rating scale</template>
                </p>
              </div>
            </div>

            <!-- Multiple Choice -->
            <div v-if="pollType === 'multiple-choice'" class="cvp-options-section">
              <div class="cvp-options-header">
                <span class="cvp-options-count">{{ mcOptions.filter((o) => o.trim()).length }}/{{ mcOptions.length }} filled</span>
                <span class="cvp-options-max">Max 15 options</span>
              </div>
              <div class="cvp-options-list">
                <div
                  v-for="(opt, index) in mcOptions"
                  :key="index"
                  class="cvp-option-row"
                  :class="{ 'cvp-option-row--empty': !opt.trim() && mcOptions.length > 2 }"
                >
                  <span class="cvp-option-number">{{ index + 1 }}</span>
                  <input
                    v-model="mcOptions[index]"
                    type="text"
                    class="cvp-option-input"
                    :placeholder="`Option ${index + 1}`"
                    maxlength="255"
                    @input="clearError('options')"
                  />
                  <div class="cvp-option-actions">
                    <button
                      v-if="index > 0"
                      class="cvp-option-btn cvp-option-btn--move"
                      title="Move up"
                      @click="moveOptionUp(index)"
                    >
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      v-if="index < mcOptions.length - 1"
                      class="cvp-option-btn cvp-option-btn--move"
                      title="Move down"
                      @click="moveOptionDown(index)"
                    >
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <button
                      v-if="mcOptions.length > 2"
                      class="cvp-option-btn cvp-option-btn--remove"
                      title="Remove option"
                      @click="removeOption(index)"
                    >
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              <p v-if="errors.options" class="cvp-error-msg">{{ errors.options }}</p>
              <button
                v-if="mcOptions.length < 15"
                class="cvp-add-option-btn"
                @click="addOption"
              >
                <svg class="cvp-add-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                Add Option
              </button>
            </div>

            <!-- Yes / No -->
            <div v-else-if="pollType === 'yes-no'" class="cvp-options-section">
              <div class="cvp-yn-options">
                <div class="cvp-yn-option cvp-yn-option--yes">
                  <svg class="cvp-yn-icon cvp-yn-icon--yes" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                  <div class="cvp-yn-text">
                    <span class="cvp-yn-label">Yes</span>
                    <span class="cvp-yn-desc">Affirmative response</span>
                  </div>
                </div>
                <div class="cvp-yn-divider" />
                <div class="cvp-yn-option cvp-yn-option--no">
                  <svg class="cvp-yn-icon cvp-yn-icon--no" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <div class="cvp-yn-text">
                    <span class="cvp-yn-label">No</span>
                    <span class="cvp-yn-desc">Negative response</span>
                  </div>
                </div>
              </div>
              <div class="cvp-yn-info">
                <svg class="cvp-yn-info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Students can only select one option. This type works best for quick consensus checks.</span>
              </div>
            </div>

            <!-- Rating Scale -->
            <div v-else class="cvp-options-section">
              <div class="cvp-rating-config">
                <div class="cvp-rating-row">
                  <div class="cvp-rating-field">
                    <label class="cvp-rating-label">Minimum Value</label>
                    <div class="cvp-rating-input-group">
                      <button class="cvp-rating-stepper" @click="ratingMin > 0 ? ratingMin-- : null" :disabled="ratingMin <= 0">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
                        </svg>
                      </button>
                      <input
                        v-model.number="ratingMin"
                        type="number"
                        class="cvp-rating-input"
                        min="0"
                        :max="ratingMax - 1"
                        @input="clearError('rating')"
                      />
                      <button class="cvp-rating-stepper" @click="ratingMin < ratingMax - 1 ? ratingMin++ : null" :disabled="ratingMin >= ratingMax - 1">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div class="cvp-rating-field">
                    <label class="cvp-rating-label">Maximum Value</label>
                    <div class="cvp-rating-input-group">
                      <button class="cvp-rating-stepper" @click="ratingMax > ratingMin + 1 ? ratingMax-- : null" :disabled="ratingMax <= ratingMin + 1">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
                        </svg>
                      </button>
                      <input
                        v-model.number="ratingMax"
                        type="number"
                        class="cvp-rating-input"
                        :min="ratingMin + 1"
                        max="100"
                        @input="clearError('rating')"
                      />
                      <button class="cvp-rating-stepper" @click="ratingMax < 100 ? ratingMax++ : null" :disabled="ratingMax >= 100">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div class="cvp-rating-field">
                    <label class="cvp-rating-label">Step Size</label>
                    <select v-model.number="ratingStep" class="cvp-rating-select">
                      <option :value="1">1</option>
                      <option :value="2">2</option>
                      <option :value="5">5</option>
                      <option :value="10">10</option>
                    </select>
                  </div>
                </div>
                <div class="cvp-rating-labels">
                  <div class="cvp-rating-field cvp-rating-field--wide">
                    <label class="cvp-rating-label">Low-end Label</label>
                    <input
                      v-model="ratingMinLabel"
                      type="text"
                      class="cvp-rating-label-input"
                      placeholder="e.g. Poor"
                      maxlength="50"
                    />
                  </div>
                  <div class="cvp-rating-field cvp-rating-field--wide">
                    <label class="cvp-rating-label">High-end Label</label>
                    <input
                      v-model="ratingMaxLabel"
                      type="text"
                      class="cvp-rating-label-input"
                      placeholder="e.g. Excellent"
                      maxlength="50"
                    />
                  </div>
                </div>
                <div v-if="errors.rating" class="cvp-error-msg">{{ errors.rating }}</div>

                <!-- Rating Scale Visual -->
                <div class="cvp-rating-visual">
                  <div class="cvp-rating-visual-header">
                    <span class="cvp-rating-visual-label">{{ ratingMinLabel || 'Low' }}</span>
                    <span class="cvp-rating-visual-count">{{ ratingMax - ratingMin + 1 }} points</span>
                    <span class="cvp-rating-visual-label">{{ ratingMaxLabel || 'High' }}</span>
                  </div>
                  <div class="cvp-rating-bar">
                    <div
                      v-for="n in Math.min(ratingMax - ratingMin + 1, 10)"
                      :key="n"
                      class="cvp-rating-bar-segment"
                      :class="{ 'cvp-rating-bar-segment--active': n <= Math.min(ratingMax - ratingMin + 1, 10) }"
                      :style="{ animationDelay: `${n * 0.05}s` }"
                    >
                      <span class="cvp-rating-bar-value">{{ ratingMin + (n - 1) * ratingStep }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ── ACTION BUTTONS ── -->
          <div class="cvp-actions">
            <button type="button" class="cvp-btn cvp-btn--ghost" @click="handleCancel">
              <svg class="cvp-btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </button>
            <button
              type="button"
              class="cvp-btn cvp-btn--outline"
              :disabled="isSaving || pollStore.loading"
              @click="handleSaveDraft"
            >
              <svg v-if="!isSaving && !pollStore.loading" class="cvp-btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              <svg v-else class="cvp-btn-spinner" fill="none" viewBox="0 0 24 24">
                <circle class="cvp-spinner-track" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="cvp-spinner-indicator" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {{ isSaving || pollStore.loading ? 'Saving...' : 'Save Draft' }}
            </button>
            <button
              type="button"
              class="cvp-btn cvp-btn--primary"
              :disabled="isStarting || pollStore.loading"
              @click="handleStartPoll"
            >
              <svg v-if="!isStarting && !pollStore.loading" class="cvp-btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <svg v-else class="cvp-btn-spinner" fill="none" viewBox="0 0 24 24">
                <circle class="cvp-spinner-track" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="cvp-spinner-indicator" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {{ isStarting || pollStore.loading ? 'Starting...' : 'Start Poll' }}
            </button>
          </div>
        </div>

        <!-- ── PREVIEW SECTION ── -->
        <div class="cvp-preview-col">
          <div class="cvp-preview-sticky">
            <div class="cvp-preview-header">
              <svg class="cvp-preview-header-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>Live Preview</span>
              <span class="cvp-preview-badge">Student View</span>
            </div>

            <div class="cvp-preview-card">
              <!-- Poll Type Badge -->
              <div class="cvp-preview-type-badge">
                <span>{{ pollTypes.find((pt) => pt.id === pollType)?.label }}</span>
              </div>

              <!-- Preview Title -->
              <h3 class="cvp-preview-title">{{ previewTitle }}</h3>

              <!-- Preview Instructions -->
              <p v-if="previewInstructions" class="cvp-preview-instructions">{{ previewInstructions }}</p>

              <!-- Divider -->
              <div class="cvp-preview-divider" />

              <!-- Preview Question -->
              <p class="cvp-preview-question">{{ previewQuestion }}</p>

              <!-- Preview Options -->
              <div class="cvp-preview-options">
                <template v-if="pollType === 'multiple-choice'">
                  <div
                    v-for="(opt, i) in previewOptions"
                    :key="i"
                    class="cvp-preview-option"
                  >
                    <div class="cvp-preview-radio">
                      <div class="cvp-preview-radio-inner" />
                    </div>
                    <span class="cvp-preview-option-text">{{ opt }}</span>
                  </div>
                </template>

                <template v-else-if="pollType === 'yes-no'">
                  <div
                    v-for="(opt, i) in previewOptions"
                    :key="i"
                    class="cvp-preview-option"
                    :class="i === 0 ? 'cvp-preview-option--yes' : 'cvp-preview-option--no'"
                  >
                    <div
                      class="cvp-preview-radio"
                      :class="i === 0 ? 'cvp-preview-radio--yes' : 'cvp-preview-radio--no'"
                    >
                      <svg v-if="i === 0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                      <svg v-else fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <span class="cvp-preview-option-text">{{ opt }}</span>
                  </div>
                </template>

                <template v-else>
                  <div class="cvp-preview-rating">
                    <div class="cvp-preview-rating-header">
                      <span>{{ ratingMinLabel || ratingMin }}</span>
                      <span class="cvp-preview-rating-divider" />
                      <span>{{ ratingMaxLabel || ratingMax }}</span>
                    </div>
                    <div class="cvp-preview-rating-bar">
                      <div
                        v-for="n in Math.min(previewOptions.length, 10)"
                        :key="n"
                        class="cvp-preview-rating-dot"
                        :class="{ 'cvp-preview-rating-dot--active': n <= 3 }"
                      >
                        <span class="cvp-preview-rating-num">{{ ratingMin + (n - 1) * ratingStep }}</span>
                      </div>
                    </div>
                    <p v-if="previewOptions.length > 10" class="cvp-preview-rating-truncate">
                      Showing first 10 of {{ previewOptions.length }} steps
                    </p>
                    <div class="cvp-preview-rating-footer">
                      <span class="cvp-preview-rating-label">{{ ratingMinLabel || 'Low' }}</span>
                      <span class="cvp-preview-rating-label">{{ ratingMaxLabel || 'High' }}</span>
                    </div>
                  </div>
                </template>
              </div>

              <!-- Preview Vote Button -->
              <button class="cvp-preview-submit" disabled>
                <svg class="cvp-preview-submit-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Submit Vote
              </button>

              <!-- Preview Footer -->
              <div class="cvp-preview-footer">
                <svg class="cvp-preview-footer-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Your response is secure and anonymous</span>
              </div>
            </div>

            <!-- Summary Stats -->
            <div class="cvp-preview-stats">
              <div class="cvp-preview-stat">
                <span class="cvp-preview-stat-value">{{ pollType === 'rating-scale' ? `${ratingMax - ratingMin + 1}` : previewOptions.length }}</span>
                <span class="cvp-preview-stat-label">Options</span>
              </div>
              <div class="cvp-preview-stat-divider" />
              <div class="cvp-preview-stat">
                <span class="cvp-preview-stat-value">{{ pollType === 'multiple-choice' ? 'Single/Multi' : pollType === 'yes-no' ? 'Binary' : 'Linear' }}</span>
                <span class="cvp-preview-stat-label">Response Type</span>
              </div>
              <div class="cvp-preview-stat-divider" />
              <div class="cvp-preview-stat">
                <span class="cvp-preview-stat-value">{{ pollTitle.trim() ? 'Ready' : 'Draft' }}</span>
                <span class="cvp-preview-stat-label">Status</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
    <!-- Toast Notification -->
    <ToastNotification
      :message="toastMessage"
      :type="toastType"
      @close="toastMessage = null"
    />
  </div>
</template>

<style scoped>
/* ── Page Layout ── */
.cvp-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background: linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 50%, #EEF2FF 100%);
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  padding: 88px 24px 40px;
}

.cvp-bg-orb {
  position: fixed;
  border-radius: 9999px;
  pointer-events: none;
  filter: blur(100px);
  opacity: 0.3;
  z-index: 0;
}
.cvp-bg-orb--1 {
  top: -80px;
  left: -80px;
  width: 300px;
  height: 300px;
  background: rgba(99, 102, 241, 0.12);
}
.cvp-bg-orb--2 {
  bottom: -120px;
  right: -80px;
  width: 350px;
  height: 350px;
  background: rgba(168, 85, 247, 0.1);
}

.cvp-bg-grid {
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

.cvp-container {
  position: relative;
  max-width: 1280px;
  margin: 0 auto;
  z-index: 1;
}

/* ── Header ── */
.cvp-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 32px;
  gap: 16px;
}

.cvp-header-left {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cvp-header-badge {
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

.cvp-header-badge-icon {
  width: 14px;
  height: 14px;
}

.cvp-title {
  font-size: 32px;
  font-weight: 800;
  color: #0F172A;
  letter-spacing: -0.03em;
  line-height: 1.2;
  margin: 0;
}

.cvp-subtitle {
  font-size: 15px;
  color: #64748B;
  line-height: 1.6;
  margin: 0;
  max-width: 560px;
}

.cvp-back-btn {
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

.cvp-back-btn:hover {
  background: #F8FAFC;
  border-color: #CBD5E1;
  color: #0F172A;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.cvp-back-btn-icon {
  width: 16px;
  height: 16px;
}

/* ── Layout ── */
.cvp-layout {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 32px;
  align-items: start;
}

.cvp-form-col {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.cvp-preview-col {
  position: relative;
}

.cvp-preview-sticky {
  position: sticky;
  top: 104px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ── Card ── */
.cvp-card {
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: box-shadow 0.2s ease;
}

.cvp-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.cvp-card-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #F1F5F9;
}

.cvp-card-header-icon {
  width: 20px;
  height: 20px;
  color: #4F46E5;
  flex-shrink: 0;
  margin-top: 2px;
}

.cvp-card-title {
  font-size: 16px;
  font-weight: 700;
  color: #0F172A;
  margin: 0;
}

.cvp-card-desc {
  font-size: 13px;
  color: #64748B;
  margin: 2px 0 0;
}

/* ── Form Fields ── */
.cvp-field {
  margin-bottom: 20px;
}

.cvp-field:last-child {
  margin-bottom: 0;
}

.cvp-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #334155;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.cvp-required {
  color: #EF4444;
  margin-left: 2px;
}

.cvp-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  border-radius: 10px;
  border: 1.5px solid #E2E8F0;
  background: #FAFBFC;
  transition: all 0.2s ease;
}

.cvp-input-wrapper:focus-within {
  border-color: #4F46E5;
  background: white;
  box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.08);
}

.cvp-input-error {
  border-color: #EF4444 !important;
  box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.08) !important;
}

.cvp-input-icon {
  width: 18px;
  height: 18px;
  color: #94A3B8;
  flex-shrink: 0;
  margin-left: 14px;
}

.cvp-input-icon--top {
  align-self: flex-start;
  margin-top: 14px;
}

.cvp-input {
  width: 100%;
  padding: 11px 14px;
  border: none;
  background: transparent;
  font-size: 14px;
  color: #0F172A;
  outline: none;
  font-family: inherit;
}

.cvp-input::placeholder {
  color: #94A3B8;
}

.cvp-textarea {
  resize: vertical;
  min-height: 72px;
  line-height: 1.5;
}

.cvp-char-count {
  text-align: right;
  font-size: 11px;
  color: #94A3B8;
  margin-top: 4px;
  padding-right: 4px;
}

.cvp-error-msg {
  font-size: 12px;
  font-weight: 500;
  color: #EF4444;
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.cvp-error-msg::before {
  content: '';
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #EF4444;
  flex-shrink: 0;
}

/* ── Poll Type Selector ── */
.cvp-type-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.cvp-type-card {
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

.cvp-type-card:hover {
  border-color: #CBD5E1;
  background: #F8FAFC;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.cvp-type-card--active {
  background: linear-gradient(135deg, #FAFBFF, #F5F3FF) !important;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.08) !important;
}

.cvp-type-card--active:hover {
  transform: none;
}

.cvp-type-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.cvp-type-icon svg {
  width: 20px;
  height: 20px;
}

.cvp-type-card:hover .cvp-type-icon {
  transform: scale(1.05);
}

.cvp-type-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.cvp-type-label {
  font-size: 14px;
  font-weight: 600;
  color: #0F172A;
}

.cvp-type-desc {
  font-size: 12px;
  color: #64748B;
}

.cvp-type-radio {
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

.cvp-type-radio--active {
  border-color: #4F46E5;
  background: #4F46E5;
}

.cvp-type-radio-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: white;
  animation: cvp-scale-in 0.2s ease-out;
}

@keyframes cvp-scale-in {
  from {
    transform: scale(0);
  }
  to {
    transform: scale(1);
  }
}

/* ── Options Section ── */
.cvp-options-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cvp-options-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
}

.cvp-options-count {
  color: #64748B;
  font-weight: 500;
}

.cvp-options-max {
  color: #94A3B8;
}

.cvp-options-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cvp-option-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 10px;
  border: 1.5px solid #E2E8F0;
  background: #FAFBFC;
  transition: all 0.2s ease;
}

.cvp-option-row:focus-within {
  border-color: #4F46E5;
  background: white;
  box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.06);
}

.cvp-option-row--empty {
  border-style: dashed;
  border-color: #CBD5E1;
  opacity: 0.7;
}

.cvp-option-number {
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

.cvp-option-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 14px;
  color: #0F172A;
  outline: none;
  font-family: inherit;
  padding: 4px 0;
}

.cvp-option-input::placeholder {
  color: #94A3B8;
}

.cvp-option-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.cvp-option-btn {
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
}

.cvp-option-btn svg {
  width: 14px;
  height: 14px;
}

.cvp-option-btn--move {
  color: #94A3B8;
}

.cvp-option-btn--move:hover {
  background: #F1F5F9;
  color: #475569;
}

.cvp-option-btn--remove {
  color: #FCA5A5;
}

.cvp-option-btn--remove:hover {
  background: #FEF2F2;
  color: #EF4444;
}

.cvp-add-option-btn {
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

.cvp-add-option-btn:hover {
  border-color: #4F46E5;
  color: #4F46E5;
  background: #EEF2FF;
}

.cvp-add-icon {
  width: 16px;
  height: 16px;
}

/* ── Yes/No Display ── */
.cvp-yn-options {
  display: flex;
  gap: 16px;
}

.cvp-yn-option {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  border-radius: 12px;
  border: 2px solid #E2E8F0;
  background: #FAFBFC;
}

.cvp-yn-option--yes {
  border-color: #BBF7D0;
  background: #F0FDF4;
}

.cvp-yn-option--no {
  border-color: #FECDD3;
  background: #FFF1F2;
}

.cvp-yn-icon {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
}

.cvp-yn-icon--yes {
  color: #16A34A;
}

.cvp-yn-icon--no {
  color: #DC2626;
}

.cvp-yn-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.cvp-yn-label {
  font-size: 16px;
  font-weight: 700;
  color: #0F172A;
}

.cvp-yn-desc {
  font-size: 12px;
  color: #64748B;
}

.cvp-yn-divider {
  width: 1px;
  background: #E2E8F0;
  align-self: stretch;
}

.cvp-yn-info {
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

.cvp-yn-info-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  margin-top: 1px;
}

/* ── Rating Scale ── */
.cvp-rating-config {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.cvp-rating-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.cvp-rating-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cvp-rating-field--wide {
  flex: 1;
}

.cvp-rating-label {
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.cvp-rating-input-group {
  display: flex;
  align-items: center;
  border: 1.5px solid #E2E8F0;
  border-radius: 10px;
  overflow: hidden;
  background: #FAFBFC;
}

.cvp-rating-input-group:focus-within {
  border-color: #4F46E5;
  box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.06);
}

.cvp-rating-stepper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  color: #94A3B8;
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.cvp-rating-stepper:hover:not(:disabled) {
  background: #F1F5F9;
  color: #4F46E5;
}

.cvp-rating-stepper:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.cvp-rating-stepper svg {
  width: 16px;
  height: 16px;
}

.cvp-rating-input {
  width: 100%;
  padding: 6px 4px;
  border: none;
  background: transparent;
  font-size: 14px;
  font-weight: 600;
  color: #0F172A;
  text-align: center;
  outline: none;
  font-family: inherit;
  -moz-appearance: textfield;
}

.cvp-rating-input::-webkit-outer-spin-button,
.cvp-rating-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.cvp-rating-select {
  padding: 8px 12px;
  border: 1.5px solid #E2E8F0;
  border-radius: 10px;
  background: #FAFBFC;
  font-size: 14px;
  font-weight: 600;
  color: #0F172A;
  outline: none;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cvp-rating-select:focus {
  border-color: #4F46E5;
  box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.06);
}

.cvp-rating-labels {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.cvp-rating-label-input {
  padding: 10px 14px;
  border: 1.5px solid #E2E8F0;
  border-radius: 10px;
  background: #FAFBFC;
  font-size: 14px;
  color: #0F172A;
  outline: none;
  font-family: inherit;
  transition: all 0.2s ease;
}

.cvp-rating-label-input:focus {
  border-color: #4F46E5;
  background: white;
  box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.06);
}

.cvp-rating-label-input::placeholder {
  color: #94A3B8;
}

/* Rating Visual */
.cvp-rating-visual {
  margin-top: 4px;
  padding: 20px;
  border-radius: 12px;
  background: linear-gradient(135deg, #FFFBEB, #FFF7ED);
  border: 1px solid #FDE68A;
}

.cvp-rating-visual-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.cvp-rating-visual-label {
  font-size: 12px;
  font-weight: 600;
  color: #92400E;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.cvp-rating-visual-count {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 10px;
  border-radius: 9999px;
  background: #FDE68A;
  color: #92400E;
}

.cvp-rating-bar {
  display: flex;
  gap: 6px;
  justify-content: center;
}

.cvp-rating-bar-segment {
  flex: 1;
  height: 48px;
  border-radius: 8px;
  background: #FDE68A;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  animation: cvp-fade-in 0.4s ease-out backwards;
  max-width: 60px;
}

.cvp-rating-bar-segment--active {
  background: linear-gradient(135deg, #FBBF24, #F59E0B);
}

.cvp-rating-bar-segment:hover {
  transform: scaleY(1.08);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.cvp-rating-bar-value {
  font-size: 13px;
  font-weight: 700;
  color: #78350F;
}

@keyframes cvp-fade-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ── Action Buttons ── */
.cvp-actions {
  display: flex;
  gap: 12px;
  padding: 20px 24px;
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.cvp-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
  white-space: nowrap;
}

.cvp-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cvp-btn-icon {
  width: 16px;
  height: 16px;
}

.cvp-btn--ghost {
  background: transparent;
  color: #64748B;
}

.cvp-btn--ghost:hover:not(:disabled) {
  background: #F1F5F9;
  color: #EF4444;
}

.cvp-btn--outline {
  flex: 1;
  border: 2px solid #E2E8F0;
  background: white;
  color: #475569;
}

.cvp-btn--outline:hover:not(:disabled) {
  border-color: #CBD5E1;
  background: #F8FAFC;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.cvp-btn--primary {
  flex: 1;
  background: linear-gradient(135deg, #4F46E5, #7C3AED);
  color: white;
  box-shadow: 0 4px 14px rgba(79, 70, 229, 0.25);
}

.cvp-btn--primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(79, 70, 229, 0.35);
}

.cvp-btn--primary:active:not(:disabled) {
  transform: translateY(0);
}

.cvp-btn-spinner {
  width: 16px;
  height: 16px;
  animation: cvp-spin 1s linear infinite;
}

.cvp-spinner-track {
  opacity: 0.25;
}

.cvp-spinner-indicator {
  opacity: 0.75;
}

@keyframes cvp-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ── Live Preview ── */
.cvp-preview-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 12px;
  background: linear-gradient(135deg, #EEF2FF, #E0E7FF);
  color: #4F46E5;
  font-size: 13px;
  font-weight: 700;
}

.cvp-preview-header-icon {
  width: 16px;
  height: 16px;
}

.cvp-preview-badge {
  margin-left: auto;
  padding: 2px 10px;
  border-radius: 9999px;
  background: white;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #4F46E5;
}

.cvp-preview-card {
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 16px;
  padding: 28px;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.04),
    0 8px 32px rgba(79, 70, 229, 0.06);
}

.cvp-preview-type-badge {
  display: inline-flex;
  padding: 4px 12px;
  border-radius: 9999px;
  background: linear-gradient(135deg, #EEF2FF, #E0E7FF);
  color: #4F46E5;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 16px;
}

.cvp-preview-title {
  font-size: 22px;
  font-weight: 800;
  color: #0F172A;
  line-height: 1.3;
  margin: 0 0 8px;
  letter-spacing: -0.02em;
}

.cvp-preview-instructions {
  font-size: 14px;
  color: #64748B;
  line-height: 1.6;
  margin: 0 0 12px;
  padding: 12px 16px;
  background: #F8FAFC;
  border-radius: 8px;
  border-left: 3px solid #4F46E5;
}

.cvp-preview-divider {
  height: 1px;
  background: linear-gradient(to right, #E2E8F0, transparent);
  margin: 16px 0;
}

.cvp-preview-question {
  font-size: 16px;
  font-weight: 600;
  color: #334155;
  line-height: 1.5;
  margin: 0 0 20px;
}

.cvp-preview-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 24px;
}

.cvp-preview-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 12px;
  border: 2px solid #E2E8F0;
  background: white;
  transition: all 0.2s ease;
}

.cvp-preview-option:hover {
  border-color: #4F46E5;
  background: #FAFBFF;
}

.cvp-preview-option--yes:hover {
  border-color: #16A34A;
  background: #F0FDF4;
}

.cvp-preview-option--no:hover {
  border-color: #DC2626;
  background: #FFF1F2;
}

.cvp-preview-radio {
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

.cvp-preview-option:hover .cvp-preview-radio {
  border-color: #4F46E5;
}

.cvp-preview-option--yes:hover .cvp-preview-radio,
.cvp-preview-radio--yes {
  border-color: #16A34A;
  background: #16A34A;
}

.cvp-preview-option--no:hover .cvp-preview-radio,
.cvp-preview-radio--no {
  border-color: #DC2626;
  background: #DC2626;
}

.cvp-preview-radio svg {
  width: 12px;
  height: 12px;
  color: white;
}

.cvp-preview-radio-inner {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #4F46E5;
  transform: scale(0);
  transition: transform 0.2s ease;
}

.cvp-preview-option:hover .cvp-preview-radio-inner {
  transform: scale(1);
}

.cvp-preview-option-text {
  font-size: 14px;
  font-weight: 500;
  color: #0F172A;
}

/* Preview Rating */
.cvp-preview-rating {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
  border-radius: 12px;
  background: linear-gradient(135deg, #FFFBEB, #FFF7ED);
  border: 2px solid #FDE68A;
}

.cvp-preview-rating-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 13px;
  font-weight: 600;
  color: #92400E;
}

.cvp-preview-rating-divider {
  width: 24px;
  height: 2px;
  background: #FDE68A;
  border-radius: 2px;
}

.cvp-preview-rating-bar {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.cvp-preview-rating-dot {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: #FEF3C7;
  border: 2px solid #FDE68A;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  cursor: default;
}

.cvp-preview-rating-dot--active {
  background: linear-gradient(135deg, #FBBF24, #F59E0B);
  border-color: #F59E0B;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
  animation: cvp-bounce-in 0.3s ease-out backwards;
}

.cvp-preview-rating-dot:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(245, 158, 11, 0.25);
}

.cvp-preview-rating-num {
  font-size: 14px;
  font-weight: 700;
  color: #78350F;
}

.cvp-preview-rating-footer {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  font-weight: 600;
  color: #92400E;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.cvp-preview-rating-label {
  opacity: 0.7;
}

.cvp-preview-rating-truncate {
  text-align: center;
  font-size: 11px;
  color: #92400E;
  opacity: 0.6;
  margin: 0;
}

@keyframes cvp-bounce-in {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.15);
  }
  100% {
    transform: scale(1);
  }
}

/* Preview Submit Button */
.cvp-preview-submit {
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 24px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #4F46E5, #7C3AED);
  color: white;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
  opacity: 0.6;
  margin-bottom: 16px;
}

.cvp-preview-submit-icon {
  width: 18px;
  height: 18px;
}

/* Preview Footer */
.cvp-preview-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 12px;
  color: #94A3B8;
}

.cvp-preview-footer-icon {
  width: 14px;
  height: 14px;
}

/* Preview Stats */
.cvp-preview-stats {
  display: flex;
  align-items: center;
  gap: 0;
  padding: 16px 20px;
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.cvp-preview-stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.cvp-preview-stat-value {
  font-size: 13px;
  font-weight: 700;
  color: #0F172A;
}

.cvp-preview-stat-label {
  font-size: 10px;
  font-weight: 600;
  color: #94A3B8;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.cvp-preview-stat-divider {
  width: 1px;
  height: 32px;
  background: #E2E8F0;
}

/* ── Responsive ── */
@media (max-width: 1024px) {
  .cvp-layout {
    grid-template-columns: 1fr;
  }

  .cvp-preview-col {
    order: -1;
  }

  .cvp-preview-sticky {
    position: static;
  }

  .cvp-preview-card {
    padding: 24px;
  }
}

@media (max-width: 640px) {
  .cvp-page {
    padding: 80px 12px 32px;
  }

  .cvp-header {
    flex-direction: column;
  }

  .cvp-title {
    font-size: 24px;
  }

  .cvp-card {
    padding: 16px;
  }

  .cvp-yn-options {
    flex-direction: column;
  }

  .cvp-rating-row {
    grid-template-columns: 1fr;
  }

  .cvp-rating-labels {
    grid-template-columns: 1fr;
  }

  .cvp-actions {
    flex-direction: column;
  }

  .cvp-btn--ghost {
    order: 3;
  }

  .cvp-preview-card {
    padding: 20px;
  }

  .cvp-preview-title {
    font-size: 18px;
  }

  .cvp-preview-rating-bar {
    flex-wrap: wrap;
    justify-content: center;
  }

  .cvp-preview-rating-dot {
    width: 38px;
    height: 38px;
  }

  .cvp-rating-bar {
    flex-wrap: wrap;
  }

  .cvp-preview-stats {
    flex-direction: column;
    gap: 8px;
  }

  .cvp-preview-stat-divider {
    width: 100%;
    height: 1px;
  }
}
</style>
