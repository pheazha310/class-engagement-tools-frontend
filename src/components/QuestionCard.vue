<script setup lang="ts">
import type { Question } from '@/types/question'

const props = defineProps<{
  question: Question
  index: number
}>()

const emit = defineEmits<{
  edit: [id: string]
  delete: [id: string]
}>()

function getTypeLabel(type: string) {
  switch (type) {
    case 'multiple_choice': return 'Multiple Choice'
    case 'true_false': return 'True / False'
    case 'short_answer': return 'Short Answer'
    default: return type
  }
}

function getTypeIcon(type: string) {
  switch (type) {
    case 'multiple_choice': return '◉'
    case 'true_false': return '✓✗'
    case 'short_answer': return '✎'
    default: return '?'
  }
}

function getTypeBadgeClass(type: string) {
  switch (type) {
    case 'multiple_choice': return 'badge badge--mc'
    case 'true_false': return 'badge badge--tf'
    case 'short_answer': return 'badge badge--sa'
    default: return 'badge'
  }
}
</script>

<template>
  <div class="question-card">
    <div class="question-card-top">
      <div class="question-card-header">
        <div class="question-number">Q{{ index + 1 }}</div>
        <span :class="getTypeBadgeClass(question.question_type)">
          {{ getTypeIcon(question.question_type) }} {{ getTypeLabel(question.question_type) }}
        </span>
        <div class="question-points-badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="points-icon">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          {{ question.points }} pt{{ question.points !== 1 ? 's' : '' }}
        </div>
      </div>

      <p class="question-text">{{ question.question_text }}</p>

      <div v-if="question.choices && question.choices.length > 0" class="question-choices">
        <div
          v-for="(choice, i) in question.choices"
          :key="i"
          class="question-choice-item"
          :class="{ 'question-choice-item--correct': choice.is_correct }"
        >
          <span v-if="choice.is_correct" class="choice-check-icon">✓</span>
          <span v-else class="choice-bullet">●</span>
          <span>{{ choice.choice_text }}</span>
          <span v-if="choice.is_correct" class="correct-label">Correct</span>
        </div>
      </div>

      <div v-if="question.question_type === 'short_answer' && question.correct_answer" class="short-answer-answer">
        <span class="answer-label">Answer:</span>
        <span class="answer-text">{{ question.correct_answer }}</span>
      </div>

      <div v-if="question.question_type === 'true_false' && question.correct_answer" class="true-false-answer">
        <span class="answer-label">Correct:</span>
        <span
          class="tf-answer-badge"
          :class="question.correct_answer === 'True' ? 'tf-answer-badge--true' : 'tf-answer-badge--false'"
        >
          {{ question.correct_answer }}
        </span>
      </div>
    </div>

    <div class="question-card-actions">
      <button
        class="card-action-btn card-action-btn--edit"
        title="Edit question"
        @click="emit('edit', question.id)"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
        Edit
      </button>
      <button
        class="card-action-btn card-action-btn--delete"
        title="Delete question"
        @click="emit('delete', question.id)"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
        Delete
      </button>
    </div>
  </div>
</template>

<style scoped>
.question-card {
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.25rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.question-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.question-card-top {
  flex: 1;
}

.question-card-header {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  margin-bottom: 0.85rem;
  flex-wrap: wrap;
}

.question-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, #0d9488, #14b8a6);
  color: #ffffff;
  font-size: 0.85rem;
  font-weight: 700;
  flex-shrink: 0;
}

/* Badges */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 600;
}

.badge--mc {
  background: #dbeafe;
  color: #1e40af;
}

.badge--tf {
  background: #fef3c7;
  color: #92400e;
}

.badge--sa {
  background: #e0e7ff;
  color: #3730a3;
}

.question-points-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  background: #f1f5f9;
  color: #64748b;
  font-size: 0.7rem;
  font-weight: 600;
  margin-left: auto;
}

.points-icon {
  width: 12px;
  height: 12px;
}

.question-text {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.75rem;
  line-height: 1.45;
}

/* Choices display */
.question-choices {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-bottom: 0.5rem;
}

.question-choice-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.75rem;
  border-radius: 8px;
  font-size: 0.85rem;
  color: #475569;
  background: #f8fafc;
}

.question-choice-item--correct {
  background: #f0fdf4;
  border: 1px solid #86efac;
  color: #065f46;
}

.choice-check-icon {
  color: #16a34a;
  font-weight: 700;
  font-size: 0.9rem;
}

.choice-bullet {
  color: #94a3b8;
  font-size: 0.5rem;
}

.correct-label {
  font-size: 0.6rem;
  font-weight: 600;
  padding: 0.1rem 0.4rem;
  border-radius: 999px;
  background: #d1fae5;
  color: #065f46;
  margin-left: auto;
}

/* Short answer display */
.short-answer-answer {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  background: #f8fafc;
  font-size: 0.85rem;
  margin-top: 0.5rem;
}

.answer-label {
  font-weight: 600;
  color: #64748b;
  font-size: 0.8rem;
}

.answer-text {
  color: #0d9488;
  font-weight: 500;
}

.true-false-answer {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  font-size: 0.85rem;
}

.tf-answer-badge {
  padding: 0.2rem 0.65rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.8rem;
}

.tf-answer-badge--true {
  background: #d1fae5;
  color: #065f46;
}

.tf-answer-badge--false {
  background: #fee2e2;
  color: #991b1b;
}

/* Actions */
.question-card-actions {
  display: flex;
  gap: 0.5rem;
  padding-top: 0.85rem;
  margin-top: 0.85rem;
  border-top: 1px solid #f1f5f9;
}

.card-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.85rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: transparent;
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ease;
}

.card-action-btn svg {
  width: 14px;
  height: 14px;
}

.card-action-btn:hover {
  background: #f8fafc;
}

.card-action-btn--edit:hover {
  border-color: #14b8a6;
  color: #0d9488;
}

.card-action-btn--delete:hover {
  border-color: #f43f5e;
  color: #e11d48;
  background: #fef2f2;
}

@media (max-width: 768px) {
  .question-card {
    padding: 1rem;
  }

  .question-number {
    width: 32px;
    height: 32px;
    font-size: 0.8rem;
  }

  .question-text {
    font-size: 0.95rem;
  }
}
</style>
