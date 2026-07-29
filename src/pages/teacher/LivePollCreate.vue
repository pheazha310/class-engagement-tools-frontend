<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import TeacherLayout from '@/components/teacher/TeacherLayout.vue'
import TeacherIcon from '@/components/teacher/TeacherIcon.vue'
import { pollService } from '@/services/pollService'
import type { PollFormData } from '@/types/poll'
import { showNotification } from '@/utils/notifications'

const router = useRouter()
const route = useRoute()

const isEdit = ref(false)
const pollId = ref<string | null>(null)
const loading = ref(false)
const submitting = ref(false)

const question = ref('')
const options = ref<string[]>(['', ''])
const durationMinutes = ref<number | null>(null)
const isMultipleChoice = ref(false)
const isAnonymous = ref(false)
const isQuiz = ref(false)
const isOpenText = ref(false)
const maxPoints = ref<number | null>(null)

onMounted(async () => {
  if (route.params.id) {
    isEdit.value = true
    pollId.value = route.params.id as string
    loading.value = true
    try {
      const poll = await pollService.getPoll(pollId.value)
      question.value = poll.question
      options.value = poll.options?.map((o) => o.option_text) || ['']
      durationMinutes.value = poll.duration_minutes || null
      isMultipleChoice.value = poll.is_multiple_choice || false
      isAnonymous.value = poll.is_anonymous || false
      isQuiz.value = poll.is_quiz || false
      isOpenText.value = poll.is_open_text || false
      maxPoints.value = poll.max_points || null
    } catch {
      showNotification('Failed to load poll for editing.', 'error')
      router.push('/teacher/live-polls')
    } finally {
      loading.value = false
    }
  }
})

function addOption() {
  options.value.push('')
}

function removeOption(index: number) {
  if (options.value.length > 2) {
    options.value.splice(index, 1)
  }
}

async function savePoll(startImmediately = false) {
  if (!question.value.trim()) {
    showNotification('Please enter a question.', 'error')
    return
  }
  if (!isOpenText.value) {
    const filled = options.value.filter((o) => o.trim())
    if (filled.length < 2) {
      showNotification('Please provide at least 2 options.', 'error')
      return
    }
  }

  const data: PollFormData = {
    question: question.value.trim(),
    options: isOpenText.value ? [] : options.value.filter((o) => o.trim()),
    is_multiple_choice: isMultipleChoice.value,
    duration_minutes: durationMinutes.value,
    is_anonymous: isAnonymous.value,
    is_quiz: isQuiz.value,
    is_open_text: isOpenText.value,
    max_points: maxPoints.value,
  }

  submitting.value = true
  try {
    let savedPoll: Awaited<ReturnType<typeof pollService.createPoll>> | null = null
    if (isEdit.value && pollId.value) {
      await pollService.updatePoll(pollId.value, data)
      if (startImmediately) {
        await pollService.startPoll(pollId.value)
        showNotification('Poll updated and is now live!', 'success')
      } else {
        showNotification('Poll updated successfully!', 'success')
      }
    } else {
      savedPoll = await pollService.createPoll(data)
      if (startImmediately && savedPoll) {
        await pollService.startPoll(savedPoll.id)
        showNotification('Poll created and is now live!', 'success')
      } else {
        showNotification('Poll created successfully!', 'success')
      }
    }
    router.push('/teacher/live-polls')
  } catch {
    const action = startImmediately ? 'start' : (isEdit.value ? 'update' : 'create')
    showNotification(`Failed to ${action} poll.`, 'error')
  } finally {
    submitting.value = false
  }
}

function submitForm() {
  return savePoll(false)
}

function startLiveVoting() {
  return savePoll(true)
}
</script>

<template>
  <TeacherLayout sidebar-active="live-polls" :page-title="isEdit ? 'Edit Poll' : 'Create Poll'" :page-subtitle="isEdit ? 'Update your live poll settings.' : 'Set up a new live poll for your class.'">
    <div v-if="loading" class="loading-state"><div class="spinner"></div><p>Loading poll...</p></div>
    <form v-else class="poll-form" @submit.prevent="submitForm">
      <div class="form-section">
        <h2 class="section-title">Question</h2>
        <div class="form-group">
          <textarea v-model="question" class="form-textarea" rows="3" placeholder="What would you like to ask?" required></textarea>
        </div>
      </div>

      <div v-if="!isOpenText" class="form-section">
        <div class="section-header">
          <h2 class="section-title">Options</h2>
          <button type="button" class="outline-button-sm" @click="addOption"><TeacherIcon icon="plus" :size="16" /><span>Add Option</span></button>
        </div>
        <div class="options-list">
          <div v-for="(opt, idx) in options" :key="idx" class="option-row">
            <span class="option-label">{{ String.fromCharCode(65 + idx) }}</span>
            <input v-model="options[idx]" type="text" class="form-input" :placeholder="`Option ${String.fromCharCode(65 + idx)}`" />
            <button v-if="options.length > 2" type="button" class="remove-option" @click="removeOption(idx)"><TeacherIcon icon="x" :size="18" /></button>
          </div>
        </div>
      </div>

      <div class="form-section">
        <h2 class="section-title">Settings</h2>
        <div class="settings-grid">
          <div class="checkbox-group">
            <label class="checkbox-label"><input v-model="isMultipleChoice" type="checkbox" :disabled="isOpenText" /><span>Allow multiple choice</span></label>
            <label class="checkbox-label"><input v-model="isAnonymous" type="checkbox" /><span>Anonymous responses</span></label>
            <label class="checkbox-label"><input v-model="isQuiz" type="checkbox" /><span>Quiz mode (assign points)</span></label>
            <label class="checkbox-label"><input v-model="isOpenText" type="checkbox" /><span>Open text response</span></label>
          </div>
          <div class="settings-fields">
            <div class="form-group">
              <label>Duration (minutes)</label>
              <input v-model.number="durationMinutes" type="number" min="0" class="form-input" placeholder="No limit" />
            </div>
            <div class="form-group" v-if="isQuiz">
              <label>Max Points</label>
              <input v-model.number="maxPoints" type="number" min="0" class="form-input" placeholder="e.g. 10" />
            </div>
          </div>
        </div>
      </div>

      <div class="form-actions">
        <button type="button" class="outline-button" @click="router.push('/teacher/live-polls')">Cancel</button>
        <button type="button" class="outline-button" :disabled="submitting" @click="submitForm">
          {{ submitting ? 'Saving...' : isEdit ? 'Update Poll' : 'Create Poll' }}
        </button>
        <button type="button" class="primary-button" :disabled="submitting" @click="startLiveVoting">
          {{ submitting ? 'Starting...' : isEdit ? 'Update & Live Voting' : 'Create & Live Voting' }}
        </button>
      </div>
    </form>
  </TeacherLayout>
</template>

<style scoped>
.poll-form { max-width: 720px; margin: 0 auto; padding: 0 0 40px; }
.form-section { background: #fff; border: 1px solid var(--line); border-radius: 12px; padding: 24px; margin-bottom: 20px; }
.section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.section-title { margin: 0 0 16px; font-size: 16px; font-weight: 700; color: var(--ink); }
.section-header .section-title { margin: 0; }
.form-group { margin-bottom: 12px; }
.form-group label { display: block; font-size: 13px; font-weight: 600; color: #3e465a; margin-bottom: 6px; }
.form-textarea { width: 100%; padding: 12px 14px; border: 1px solid #d0d5e0; border-radius: 8px; font-size: 15px; font-family: inherit; resize: vertical; transition: border-color .15s; background: #fafcff; }
.form-textarea:focus { outline: none; border-color: var(--primary); background: #fff; }
.form-input { width: 100%; padding: 10px 12px; border: 1px solid #d0d5e0; border-radius: 8px; font-size: 14px; font-family: inherit; transition: border-color .15s; background: #fafcff; }
.form-input:focus { outline: none; border-color: var(--primary); background: #fff; }
.options-list { display: flex; flex-direction: column; gap: 10px; }
.option-row { display: flex; align-items: center; gap: 10px; }
.option-label { width: 24px; height: 24px; display: grid; place-items: center; border-radius: 6px; background: var(--primary-soft); color: var(--primary); font-size: 12px; font-weight: 800; flex-shrink: 0; }
.option-row .form-input { flex: 1; }
.remove-option { display: inline-grid; width: 30px; height: 30px; place-items: center; border: 0; border-radius: 6px; background: transparent; color: #8a91a3; cursor: pointer; transition: all .15s; flex-shrink: 0; }
.remove-option:hover { background: var(--red-soft); color: var(--red); }
.settings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
.checkbox-group { display: flex; flex-direction: column; gap: 12px; }
.checkbox-label { display: flex; align-items: center; gap: 10px; font-size: 14px; color: var(--ink); cursor: pointer; }
.checkbox-label input[type="checkbox"] { width: 18px; height: 18px; accent-color: var(--primary); }
.settings-fields { display: flex; flex-direction: column; gap: 16px; }
.outline-button-sm { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border: 1px solid #d0d5e0; border-radius: 8px; background: #fff; color: var(--ink); font-size: 13px; font-weight: 600; cursor: pointer; transition: all .15s; }
.outline-button-sm:hover { border-color: var(--primary); color: var(--primary); }
.form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }
@media (max-width:720px) { .settings-grid { grid-template-columns: 1fr; } }
</style>
