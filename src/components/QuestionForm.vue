<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import type { Question, QuestionFormData, QuestionChoice } from '@/types/question'

const props = defineProps<{
  question?: Question | null
  loading?: boolean
}>()

const emit = defineEmits<{
  submit: [data: QuestionFormData]
  cancel: []
}>()

const form = reactive<QuestionFormData>({
  question_text: '',
  question_type: 'multiple_choice',
  points: 1,
  choices: [
    { choice_text: '', is_correct: false },
    { choice_text: '', is_correct: false },
  ],
  correct_answer: '',
})

const errors = ref<Record<string, string>>({})

const isEditing = computed(() => !!props.question)

const questionTypeOptions = [
  { value: 'multiple_choice', label: 'Multiple Choice', icon: '◉' },
  { value: 'true_false', label: 'True / False', icon: '✓✗' },
  { value: 'short_answer', label: 'Short Answer', icon: '✎' },
]

watch(() => props.question, (q) => {
  if (q) {
    form.question_text = q.question_text
    form.question_type = q.question_type
    form.points = q.points
    form.correct_answer = q.correct_answer
    if (q.choices && q.choices.length > 0) {
      form.choices = q.choices.map((c) => ({
        choice_text: c.choice_text,
        is_correct: c.is_correct,
      }))
    } else {
      form.choices = [
        { choice_text: '', is_correct: false },
        { choice_text: '', is_correct: false },
      ]
    }
  }
}, { immediate: true })

watch(() => form.question_type, (type) => {
  errors.value = {}
  if (type === 'true_false') {
    form.choices = [
      { choice_text: 'True', is_correct: false },
      { choice_text: 'False', is_correct: false },
    ]
    form.correct_answer = ''
  } else if (type === 'short_answer') {
    form.choices = []
    form.correct_answer = ''
  } else {
    if (form.choices.length < 2) {
      form.choices = [
        { choice_text: '', is_correct: false },
        { choice_text: '', is_correct: false },
      ]
    }
  }
})

function addChoice() {
  form.choices.push({ choice_text: '', is_correct: false })
}

function removeChoice(index: number) {
  if (form.choices.length > 2) {
    form.choices.splice(index, 1)
  }
}

function setCorrectChoice(index: number) {
  form.choices.forEach((c, i) => {
    c.is_correct = i === index
  })
  form.correct_answer = form.choices[index]?.choice_text || ''
}

function validate(): boolean {
  errors.value = {}

  if (!form.question_text.trim()) {
    errors.value.question_text = 'Question text is required.'
  }

  if (form.points < 1) {
    errors.value.points = 'Points must be at least 1.'
  }

  if (form.question_type === 'multiple_choice') {
    const validChoices = form.choices.filter((c) => c.choice_text.trim())
    if (validChoices.length < 2) {
      errors.value.choices = 'At least 2 choices are required.'
    }
    if (!form.choices.some((c) => c.is_correct && c.choice_text.trim())) {
      errors.value.correct_answer = 'Please select a correct answer.'
    }
  }

  if (form.question_type === 'true_false') {
    if (!form.choices.some((c) => c.is_correct)) {
      errors.value.correct_answer = 'Please select True or False as the correct answer.'
    }
  }

  if (form.question_type === 'short_answer') {
    if (!form.correct_answer.trim()) {
      errors.value.correct_answer = 'Correct answer is required for short answer questions.'
    }
  }

  return Object.keys(errors.value).length === 0
}

function handleSubmit() {
  if (!validate()) return

  const payload: QuestionFormData = {
    question_text: form.question_text,
    question_type: form.question_type,
    points: form.points,
    choices: form.question_type === 'short_answer' ? [] : form.choices,
    correct_answer:
      form.question_type === 'multiple_choice'
        ? form.choices.find((c) => c.is_correct)?.choice_text || ''
        : form.correct_answer,
  }

  emit('submit', payload)
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="question-form" novalidate>
    <!-- Question Text -->
    <div class="input-group" :class="{ 'input-group--error': errors.question_text }">
      <label for="question_text" class="input-label">
        Question <span class="required-star" aria-hidden="true">*</span>
      </label>
      <div class="input-wrapper input-wrapper--textarea">
        <textarea
          id="question_text"
          v-model="form.question_text"
          rows="3"
          placeholder="Enter your question here..."
          class="input-field input-field--textarea"
          aria-required="true"
          :aria-invalid="!!errors.question_text"
        ></textarea>
      </div>
      <p v-if="errors.question_text" class="input-error" role="alert">{{ errors.question_text }}</p>
    </div>

    <!-- Question Type -->
    <div class="input-group">
      <label class="input-label">Question Type <span class="required-star" aria-hidden="true">*</span></label>
      <div class="question-type-grid">
        <button
          v-for="opt in questionTypeOptions"
          :key="opt.value"
          type="button"
          class="type-btn"
          :class="{ 'type-btn--active': form.question_type === opt.value }"
          :data-type="opt.value"
          @click="form.question_type = opt.value as QuestionFormData['question_type']"
        >
          <span class="type-btn-icon">{{ opt.icon }}</span>
          <span class="type-btn-label">{{ opt.label }}</span>
        </button>
      </div>
    </div>

    <!-- Multiple Choice: Choices -->
    <div v-if="form.question_type === 'multiple_choice'" class="input-group">
      <div class="choices-header">
        <label class="input-label">Choices <span class="required-star" aria-hidden="true">*</span></label>
        <button type="button" class="btn btn-sm btn-outline" @click="addChoice">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="btn-sm-icon"><path d="M12 5v14" /><path d="M5 12h14" /></svg>
          Add Choice
        </button>
      </div>
      <div class="choices-list">
        <div
          v-for="(choice, index) in form.choices"
          :key="index"
          class="choice-row"
          :class="{ 'choice-row--correct': choice.is_correct }"
        >
          <div class="choice-radio-wrapper" @click="setCorrectChoice(index)">
            <div class="choice-radio" :class="{ 'choice-radio--selected': choice.is_correct }">
              <div v-if="choice.is_correct" class="choice-radio-dot"></div>
            </div>
          </div>
          <input
            v-model="choice.choice_text"
            type="text"
            :placeholder="`Choice ${index + 1}`"
            class="input-field choice-input"
          />
          <button
            v-if="form.choices.length > 2"
            type="button"
            class="choice-remove-btn"
            @click="removeChoice(index)"
            title="Remove choice"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
          <span v-if="choice.is_correct" class="choice-correct-badge">Correct</span>
        </div>
      </div>
      <p v-if="errors.choices" class="input-error" role="alert">{{ errors.choices }}</p>
      <p v-if="errors.correct_answer" class="input-error" role="alert">{{ errors.correct_answer }}</p>
    </div>

    <!-- True/False: Select correct -->
    <div v-if="form.question_type === 'true_false'" class="input-group">
      <label class="input-label">Correct Answer <span class="required-star" aria-hidden="true">*</span></label>
      <div class="tf-grid">
        <button
          v-for="(choice, index) in form.choices"
          :key="index"
          type="button"
          class="tf-btn"
          :class="{ 'tf-btn--true': index === 0, 'tf-btn--false': index === 1, 'tf-btn--active': choice.is_correct }"
          @click="setCorrectChoice(index)"
        >
          <span v-if="index === 0" class="tf-icon">✓</span>
          <span v-else class="tf-icon">✗</span>
          <span>{{ choice.choice_text }}</span>
        </button>
      </div>
      <p v-if="errors.correct_answer" class="input-error" role="alert">{{ errors.correct_answer }}</p>
    </div>

    <!-- Short Answer: Correct answer -->
    <div v-if="form.question_type === 'short_answer'" class="input-group">
      <label for="correct_answer" class="input-label">
        Correct Answer <span class="required-star" aria-hidden="true">*</span>
      </label>
      <div class="input-wrapper">
        <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
        <input
          id="correct_answer"
          v-model="form.correct_answer"
          type="text"
          placeholder="Enter the correct answer"
          class="input-field"
          aria-required="true"
          :aria-invalid="!!errors.correct_answer"
        />
      </div>
      <p v-if="errors.correct_answer" class="input-error" role="alert">{{ errors.correct_answer }}</p>
      <p v-else class="input-hint">Answer will be checked case-insensitively</p>
    </div>

    <!-- Points -->
    <div class="input-group" :class="{ 'input-group--error': errors.points }">
      <label for="points" class="input-label">
        Points <span class="required-star" aria-hidden="true">*</span>
      </label>
      <div class="input-wrapper" style="max-width: 160px;">
        <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
        <input
          id="points"
          v-model.number="form.points"
          type="number"
          min="1"
          max="999"
          placeholder="1"
          class="input-field"
          aria-required="true"
          :aria-invalid="!!errors.points"
        />
      </div>
      <p v-if="errors.points" class="input-error" role="alert">{{ errors.points }}</p>
      <p v-else class="input-hint">How many points this question is worth</p>
    </div>

    <!-- Actions -->
    <div class="form-actions">
      <button type="button" class="btn btn-cancel" @click="emit('cancel')">
        Cancel
      </button>
      <button type="submit" class="btn btn-submit" :disabled="loading">
        <svg class="btn-submit-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M12 5v14" /><path d="M5 12h14" />
        </svg>
        {{ isEditing ? 'Update Question' : 'Add Question' }}
      </button>
    </div>
  </form>
</template>

<style scoped>
/* ============================================================
   FORM CONTAINER
   ============================================================ */
.question-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* ============================================================
   INPUT GROUP
   ============================================================ */
.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.input-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #475569;
  letter-spacing: 0.01em;
}

.required-star {
  color: #f43f5e;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 13px;
  width: 18px;
  height: 18px;
  color: #64748b;
  pointer-events: none;
  flex-shrink: 0;
  transition: color 0.2s ease;
}

.input-field {
  width: 100%;
  padding: 0.7rem 0.85rem 0.7rem 2.5rem;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  color: #1e293b;
  font-size: 0.9rem;
  font-family: inherit;
  outline: none;
  transition: all 0.2s ease;
}

.input-field::placeholder {
  color: #94a3b8;
}

.input-field:hover {
  border-color: #94a3b8;
}

.input-field:focus {
  border-color: #14b8a6;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
}

.input-field--textarea {
  padding-left: 0.85rem;
  resize: vertical;
  min-height: 80px;
}

.input-wrapper--textarea .input-icon {
  display: none;
}

.input-error {
  font-size: 0.78rem;
  color: #fb7185;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 4px;
}

.input-error::before {
  content: '';
  display: inline-block;
  width: 14px;
  height: 14px;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23fb7185' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Cline x1='15' y1='9' x2='9' y2='15'/%3E%3Cline x1='9' y1='9' x2='15' y2='15'/%3E%3C/svg%3E") no-repeat center;
  background-size: contain;
  flex-shrink: 0;
}

.input-hint {
  font-size: 0.75rem;
  color: #64748b;
  margin: 0;
}

.input-group--error .input-field {
  border-color: #f43f5e;
  background: #fef2f2;
}

.input-group--error .input-field:focus {
  box-shadow: 0 0 0 3px rgba(244, 63, 94, 0.1);
  background: #fef2f2;
}

.input-group--error .input-icon {
  color: #f43f5e;
}

/* ============================================================
   QUESTION TYPE SELECTOR
   ============================================================ */
.question-type-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
}

.type-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  padding: 0.85rem 0.5rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.type-btn:hover {
  border-color: #94a3b8;
  transform: translateY(-1px);
}

.type-btn--active {
  border-color: #14b8a6;
  background: #f0fdfa;
  box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
}

.type-btn-icon {
  font-size: 1.25rem;
}

.type-btn-label {
  font-size: 0.8rem;
  font-weight: 500;
  color: #475569;
}

.type-btn--active .type-btn-label {
  color: #0d9488;
  font-weight: 600;
}

/* ============================================================
   CHOICES (Multiple Choice)
   ============================================================ */
.choices-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.choices-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.choice-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
}

.choice-row--correct {
  border-color: #86efac;
  background: #f0fdf4;
}

.choice-radio-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}

.choice-radio {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid #cbd5e1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.choice-radio--selected {
  border-color: #16a34a;
  background: #16a34a;
}

.choice-radio-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ffffff;
}

.choice-input {
  padding-left: 0.85rem;
  flex: 1;
  border: none;
  background: transparent;
  font-size: 0.875rem;
}

.choice-input:focus {
  box-shadow: none;
  border: none;
  background: transparent;
}

.choice-remove-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.choice-remove-btn svg {
  width: 16px;
  height: 16px;
}

.choice-remove-btn:hover {
  color: #ef4444;
  background: #fef2f2;
}

.choice-correct-badge {
  font-size: 0.65rem;
  font-weight: 600;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  background: #d1fae5;
  color: #065f46;
  white-space: nowrap;
  flex-shrink: 0;
}

/* ============================================================
   TRUE / FALSE
   ============================================================ */
.tf-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.tf-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  background: #ffffff;
  font-size: 0.95rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tf-btn:hover {
  border-color: #94a3b8;
  transform: translateY(-1px);
}

.tf-btn--true.tf-btn--active {
  border-color: #16a34a;
  background: #f0fdf4;
  color: #065f46;
}

.tf-btn--false.tf-btn--active {
  border-color: #ef4444;
  background: #fef2f2;
  color: #991b1b;
}

.tf-icon {
  font-size: 1.1rem;
}

/* ============================================================
   BUTTONS
   ============================================================ */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.7rem 1.5rem;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 600;
  font-family: inherit;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
}

.btn:focus-visible {
  outline: 2px solid #14b8a6;
  outline-offset: 2px;
}

.btn:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.btn-sm {
  padding: 0.4rem 0.85rem;
  font-size: 0.8rem;
  border-radius: 8px;
}

.btn-sm-icon {
  width: 14px;
  height: 14px;
}

.btn-outline {
  background: transparent;
  color: #0d9488;
  border: 1px solid #cbd5e1;
}

.btn-outline:hover {
  background: #f0fdfa;
  border-color: #14b8a6;
}

.btn-cancel {
  background: transparent;
  color: #64748b;
  border: 1px solid #cbd5e1;
}

.btn-cancel:hover {
  background: #f8fafc;
  color: #475569;
  border-color: #94a3b8;
}

.btn-submit {
  background: linear-gradient(135deg, #0d9488, #14b8a6);
  color: #ffffff;
  box-shadow: 0 4px 14px rgba(13, 148, 136, 0.25);
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(13, 148, 136, 0.4);
  background: linear-gradient(135deg, #0f766e, #0d9488);
}

.btn-submit-icon {
  width: 18px;
  height: 18px;
}

.form-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.85rem;
  margin-top: 0.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid #e2e8f0;
}

/* ============================================================
   RESPONSIVE
   ============================================================ */
@media (max-width: 768px) {
  .question-type-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .type-btn {
    padding: 0.7rem 0.4rem;
  }

  .type-btn-icon {
    font-size: 1.1rem;
  }

  .type-btn-label {
    font-size: 0.7rem;
  }

  .tf-grid {
    grid-template-columns: 1fr 1fr;
  }

  .tf-btn {
    padding: 0.85rem;
  }

  .form-actions {
    flex-direction: column-reverse;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }

  .choices-header {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
