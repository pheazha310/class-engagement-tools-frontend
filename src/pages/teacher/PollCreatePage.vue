<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { usePollStore } from '@/stores/poll'

const router = useRouter()
const pollStore = usePollStore()

const question = ref('')
const options = ref<string[]>(['', ''])
const optionsCorrect = ref<boolean[]>([])
const isMultipleChoice = ref(false)
const durationMinutes = ref<number | null>(null)
const isAnonymous = ref(false)
const isQuiz = ref(false)
const isOpenText = ref(false)
const maxPoints = ref<number | null>(null)
const error = ref<string | null>(null)

function addOption() {
  if (options.value.length < 10) {
    options.value.push('')
    optionsCorrect.value.push(false)
  }
}

function removeOption(index: number) {
  if (options.value.length > 2) {
    options.value.splice(index, 1)
    optionsCorrect.value.splice(index, 1)
  }
}

async function handleCreate() {
  error.value = null

  if (!question.value.trim()) {
    error.value = 'A poll question is required.'
    return
  }

  if (!isOpenText.value) {
    const validOptions = options.value.map(o => o.trim()).filter(Boolean)
    if (validOptions.length < 2) {
      error.value = 'At least 2 options are required.'
      return
    }

    const poll = await pollStore.createPoll({
      question: question.value.trim(),
      options: validOptions,
      is_multiple_choice: isMultipleChoice.value,
      duration_minutes: durationMinutes.value,
      is_anonymous: isAnonymous.value,
      is_quiz: isQuiz.value,
      is_open_text: isOpenText.value,
      max_points: maxPoints.value,
      options_correct: isQuiz.value ? optionsCorrect.value : undefined,
    })

    if (poll) {
      router.push({ name: 'teacher-polls', query: { tab: 'draft' } })
    }
  } else {
    const poll = await pollStore.createPoll({
      question: question.value.trim(),
      options: [],
      is_open_text: true,
      is_anonymous: isAnonymous.value,
      duration_minutes: durationMinutes.value,
    })

    if (poll) {
      router.push({ name: 'teacher-polls', query: { tab: 'draft' } })
    }
  }
}
</script>

<template>
  <div class="poll-create-page">
    <div class="pcp-card">
      <div class="pcp-header">
        <div>
          <h1 class="pcp-title">Create New Poll</h1>
          <p class="pcp-subtitle">Create a new poll for your class</p>
        </div>
        <router-link :to="{ name: 'teacher-polls' }" class="btn btn-ghost">Back</router-link>
      </div>

      <div v-if="error" class="alert alert-error">{{ error }}</div>
      <div v-if="pollStore.error" class="alert alert-error">{{ pollStore.error }}</div>

      <div class="pcp-form">
        <div class="form-group">
          <label class="form-label">Question</label>
          <input
            v-model="question"
            type="text"
            class="input"
            placeholder="e.g. What topic do you understand most?"
            maxlength="500"
          />
        </div>

        <!-- Poll Settings -->
        <div class="form-group">
          <label class="form-label">Poll Settings</label>
          <div class="form-row">
            <label class="form-group form-group-inline">
              <input v-model="isMultipleChoice" type="checkbox" class="checkbox" />
              <span class="form-label">Multiple choice</span>
            </label>
            <label class="form-group form-group-inline">
              <input v-model="isAnonymous" type="checkbox" class="checkbox" />
              <span class="form-label">Anonymous</span>
            </label>
            <label class="form-group form-group-inline">
              <input v-model="isQuiz" type="checkbox" class="checkbox" />
              <span class="form-label">Quiz mode</span>
            </label>
            <label class="form-group form-group-inline">
              <input v-model="isOpenText" type="checkbox" class="checkbox" />
              <span class="form-label">Open text</span>
            </label>
          </div>
          <div v-if="!isOpenText" class="form-row" style="margin-top:8px">
            <label class="form-group form-group-inline">
              <span class="form-label">Max points</span>
              <input v-model.number="maxPoints" type="number" class="input input-sm" min="1" max="100" placeholder="1" />
            </label>
            <label class="form-group form-group-inline">
              <span class="form-label">Duration (min)</span>
              <input v-model.number="durationMinutes" type="number" class="input input-sm" min="1" max="120" placeholder="Optional" />
            </label>
          </div>
        </div>

        <div v-if="!isOpenText" class="form-group">
          <label class="form-label">Options ({{ options.length }}/10)</label>
          <div v-for="(opt, i) in options" :key="i" class="option-row">
            <input v-model="options[i]" type="text" class="input" :placeholder="`Option ${i + 1}`" maxlength="255" />
            <button v-if="isQuiz" type="button" class="btn btn-sm" :class="optionsCorrect[i] ? 'btn-primary' : 'btn-ghost'" @click="optionsCorrect[i] = !optionsCorrect[i]">
              {{ optionsCorrect[i] ? '✓' : 'Mark' }}
            </button>
            <button v-if="options.length > 2" class="btn-icon btn-icon-remove" @click="removeOption(i)" title="Remove">✕</button>
          </div>
          <button v-if="options.length < 10" class="btn btn-sm btn-ghost" @click="addOption">+ Add option</button>
        </div>

        <div v-if="isOpenText" class="alert" style="background:#f0f9ff;color:#0369a1;border:1px solid #bae6fd">
          Open text mode enabled. Students submit free-text responses.
        </div>

        <button
          class="btn btn-primary btn-full"
          :disabled="pollStore.loading"
          @click="handleCreate"
        >
          {{ pollStore.loading ? 'Creating...' : 'Create Poll' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.poll-create-page {
  min-height: 100vh;
  padding: 88px 24px 40px;
  background: #f8fafc;
  display: flex;
  justify-content: center;
}

.pcp-card {
  width: 100%;
  max-width: 640px;
}

.pcp-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
}

.pcp-title {
  font-size: 28px;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
}

.pcp-subtitle {
  font-size: 14px;
  color: #64748b;
  margin: 4px 0 0;
}

.pcp-form {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group-inline {
  flex-direction: row;
  align-items: center;
  gap: 8px;
}

.form-row {
  display: flex;
  gap: 16px;
  align-items: flex-end;
  flex-wrap: wrap;
}

.form-label {
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.input {
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
  background: #fff;
  color: #0f172a;
  font-family: inherit;
}

.input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.input-sm {
  width: 100px;
}

.option-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.option-row .input {
  flex: 1;
}

.checkbox {
  width: 18px;
  height: 18px;
  accent-color: #2563eb;
  cursor: pointer;
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

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  font-family: inherit;
}

.btn-sm {
  padding: 6px 14px;
  font-size: 13px;
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

.btn-ghost {
  background: transparent;
  color: #64748b;
}

.btn-ghost:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s;
  flex-shrink: 0;
}

.btn-icon-remove {
  background: #fef2f2;
  color: #ef4444;
}

.btn-icon-remove:hover {
  background: #fee2e2;
}

@media (max-width: 640px) {
  .poll-create-page {
    padding: 80px 16px 32px;
  }

  .pcp-header {
    flex-direction: column;
    gap: 12px;
  }

  .form-row {
    flex-direction: column;
  }
}
</style>
