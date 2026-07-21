<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Question } from '@/types/game'

const props = defineProps<{
  question: Question
  questionNumber: number
  totalQuestions: number
  disabled?: boolean
  submitted?: boolean
}>()

const emit = defineEmits<{
  submit: [answer: string]
}>()

const answer = ref('')
const textareaRef = ref<HTMLTextAreaElement | null>(null)

const selectedOptionId = computed(() => answer.value)

function selectOption(optionId: string) {
  if (props.disabled || props.submitted) return
  answer.value = optionId
}

function handleTextareaInput(event: Event) {
  if (props.disabled || props.submitted) return
  const target = event.target as HTMLTextAreaElement
  answer.value = target.value
}

function handleSubmit() {
  if (props.disabled || props.submitted || !answer.value.trim()) return
  emit('submit', answer.value.trim())
}

watch(
  () => props.question.id,
  () => {
    answer.value = ''
  }
)
</script>

<template>
  <div class="question-display">
    <div class="question-header">
      <div class="question-meta">
        <span class="question-badge">
          Question {{ questionNumber }} of {{ totalQuestions }}
        </span>
        <span v-if="question.points" class="question-points">
          {{ question.points }} pts
        </span>
      </div>
      <div class="question-type-tag">{{ question.type === 'multiple_choice' ? 'Multiple Choice' : 'Text Input' }}</div>
    </div>

    <div class="question-body">
      <h2 class="question-text">{{ question.text }}</h2>

      <div v-if="question.type === 'multiple_choice' && question.options" class="options-list">
        <button
          v-for="option in question.options"
          :key="option.id"
          type="button"
          class="option-btn"
          :class="{
            'option-btn--selected': selectedOptionId === option.id,
            'option-btn--disabled': disabled || submitted,
          }"
          :disabled="disabled || submitted"
          @click="selectOption(option.id)"
        >
          <span class="option-indicator">{{ selectedOptionId === option.id ? '●' : '○' }}</span>
          <span class="option-label">{{ option.label }}</span>
        </button>
      </div>

      <div v-else class="text-input-wrapper">
        <textarea
          ref="textareaRef"
          class="question-textarea"
          :placeholder="submitted ? 'Answer submitted' : 'Type your answer here...'"
          :disabled="disabled || submitted"
          :value="answer"
          @input="handleTextareaInput"
          rows="3"
        ></textarea>
      </div>
    </div>

    <div class="question-footer">
      <div class="answer-status">
        <span v-if="submitted" class="answer-submitted">✓ Answer submitted</span>
        <span v-else-if="!answer.trim()" class="answer-placeholder">Select or type an answer to continue</span>
        <span v-else class="answer-ready">Answer ready</span>
      </div>
      <button
        type="button"
        class="submit-btn"
        :disabled="disabled || submitted || !answer.trim()"
        @click="handleSubmit"
      >
        {{ submitted ? 'Submitted' : 'Submit Answer' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.question-display {
  background: #ffffff;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.07);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.question-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: linear-gradient(to bottom, #f8fafc, #ffffff);
  border-bottom: 1px solid #f1f5f9;
  gap: 12px;
  flex-wrap: wrap;
}

.question-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.question-badge {
  font-size: 13px;
  font-weight: 700;
  color: #6366f1;
  background: #eef2ff;
  padding: 4px 12px;
  border-radius: 999px;
  letter-spacing: 0.02em;
}

.question-points {
  font-size: 12px;
  font-weight: 700;
  color: #15803d;
  background: #f0fdf4;
  padding: 4px 12px;
  border-radius: 999px;
}

.question-type-tag {
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  background: #f1f5f9;
  padding: 4px 12px;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.question-body {
  padding: 28px 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.question-text {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.5;
  margin: 0;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option-btn {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 14px 18px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  background: #f8fafc;
  cursor: pointer;
  transition: all 0.15s ease;
  font-size: 15px;
  font-weight: 500;
  color: #334155;
  text-align: left;
}

.option-btn:hover:not(.option-btn--disabled) {
  border-color: #6366f1;
  background: #eef2ff;
  color: #6366f1;
}

.option-btn--selected {
  border-color: #6366f1;
  background: #eef2ff;
  color: #6366f1;
  font-weight: 700;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
}

.option-btn--disabled {
  opacity: 0.55;
  cursor: not-allowed;
  background: #f8fafc;
}

.option-indicator {
  font-size: 18px;
  line-height: 1;
  flex-shrink: 0;
  color: #cbd5e1;
}

.option-btn--selected .option-indicator {
  color: #6366f1;
}

.option-label {
  flex: 1;
}

.text-input-wrapper {
  width: 100%;
}

.question-textarea {
  width: 100%;
  padding: 14px 18px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 500;
  color: #0f172a;
  background: #f8fafc;
  outline: none;
  transition: all 0.15s ease;
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
  line-height: 1.6;
}

.question-textarea:focus:not(:disabled) {
  border-color: #6366f1;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
}

.question-textarea:disabled {
  background: #f1f5f9;
  color: #94a3b8;
  cursor: not-allowed;
}

.question-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 24px;
  border-top: 1px solid #f1f5f9;
  background: #fafbfc;
  flex-wrap: wrap;
}

.answer-status {
  font-size: 13px;
  font-weight: 600;
}

.answer-submitted {
  color: #15803d;
}

.answer-placeholder {
  color: #94a3b8;
}

.answer-ready {
  color: #6366f1;
}

.submit-btn {
  padding: 10px 22px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
  white-space: nowrap;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.45);
}

.submit-btn:active:not(:disabled) {
  transform: translateY(0);
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}

@media (max-width: 480px) {
  .question-header {
    padding: 12px 16px;
  }

  .question-body {
    padding: 20px 16px;
  }

  .question-text {
    font-size: 17px;
  }

  .question-footer {
    padding: 12px 16px;
    flex-direction: column;
    align-items: stretch;
  }

  .submit-btn {
    width: 100%;
    text-align: center;
  }

  .option-btn {
    padding: 12px 14px;
    font-size: 14px;
  }
}
</style>
