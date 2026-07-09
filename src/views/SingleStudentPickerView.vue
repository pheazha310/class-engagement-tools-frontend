<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

interface Student {
  id: number
  name: string
  initials: string
  color: string
}

const router = useRouter()

const COLORS = [
  '#6366f1', '#ec4899', '#f59e0b', '#14b8a6',
  '#22c55e', '#ef4444', '#8b5cf6', '#06b6d4',
]

function getColor(index: number): string {
  return COLORS[index % COLORS.length]!
}

function createStudent(name: string, index: number): Student {
  return {
    id: Date.now() + index,
    name,
    initials: name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2),
    color: getColor(index),
  }
}

const students = ref<Student[]>([])
const namesInput = ref('')
const pickedStudent = ref<Student | null>(null)
const isPicking = ref(false)
const showResult = ref(false)
const pickLog = ref<{ name: string; time: Date }[]>([])
const highlightId = ref<number | null>(null)
const inputFocused = ref(false)
let flashInterval: ReturnType<typeof setInterval> | null = null

onUnmounted(() => {
  if (flashInterval) {
    clearInterval(flashInterval)
  }
})

const totalPicks = computed(() => pickLog.value.length)
const isEmpty = computed(() => students.value.length === 0)

function addAllStudents() {
  const raw = namesInput.value.trim()
  if (!raw) return

  const names = raw
    .split(/[\n,]+/)
    .map(n => n.trim())
    .filter(n => n.length > 0)

  if (names.length === 0) return

  const startIndex = students.value.length
  const newStudents = names.map((name, i) => createStudent(name, startIndex + i))
  students.value.push(...newStudents)
  namesInput.value = ''
}

function clearAllStudents() {
  students.value = []
  pickedStudent.value = null
  showResult.value = false
}

function removeStudent(id: number) {
  students.value = students.value.filter(s => s.id !== id)
  if (pickedStudent.value?.id === id) {
    pickedStudent.value = null
    showResult.value = false
  }
}

async function pickRandom() {
  if (isPicking.value || isEmpty.value) return
  isPicking.value = true
  showResult.value = false
  pickedStudent.value = null

  // Flash through students
  const flashDuration = 1200
  const flashIntervalMs = 80
  const start = Date.now()

  await new Promise<void>((resolve) => {
    flashInterval = setInterval(() => {
      const elapsed = Date.now() - start
      if (elapsed >= flashDuration) {
        clearInterval(flashInterval!)
        flashInterval = null
        resolve()
        return
      }
      // Pick a random student to flash
      const randomIdx = Math.floor(Math.random() * students.value.length)
      const student = students.value[randomIdx]
      if (student) {
        highlightId.value = student.id
      }
    }, flashIntervalMs)
  })

  // Pick the final student
  const finalIdx = Math.floor(Math.random() * students.value.length)
  const finalStudent = students.value[finalIdx]
  if (!finalStudent) {
    isPicking.value = false
    return
  }
  pickedStudent.value = finalStudent
  highlightId.value = finalStudent.id
  showResult.value = true

  pickLog.value.unshift({ name: finalStudent.name, time: new Date() })

  isPicking.value = false

  // Clear highlight after a moment
  setTimeout(() => {
    highlightId.value = null
  }, 2000)
}

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function goBack() {
  router.push('/')
}
</script>

<template>
  <div class="picker-page">
    <!-- Header with back button -->
    <header class="picker-header">
      <div class="picker-header__inner">
        <button class="picker-header__back" @click="goBack">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back
        </button>
        <div class="picker-header__info">
          <h1 class="picker-header__title">Single Student Picker</h1>
          <p class="picker-header__subtitle">Pick one student at random from the class list</p>
        </div>
        <div class="picker-header__stats">
          <div class="stat">
            <span class="stat__value">{{ students.length }}</span>
            <span class="stat__label">Students</span>
          </div>
          <div class="stat">
            <span class="stat__value">{{ totalPicks }}</span>
            <span class="stat__label">Picks</span>
          </div>
        </div>
      </div>
    </header>

    <div class="picker-content">
      <div class="picker-layout">
        <!-- Left Column: Student Pool -->
        <section class="pool-section">
          <div class="section-header">
            <h2 class="section-header__title">Student Pool</h2>
            <span class="section-header__count">{{ students.length }} enrolled</span>
          </div>

          <!-- Bulk add students -->
          <div class="bulk-form" :class="{ 'bulk-form--focused': inputFocused }">
            <textarea
              v-model="namesInput"
              class="bulk-form__textarea"
              placeholder="Enter student names, one per line&#10;e.g.:&#10;Alice&#10;Bob&#10;Charlie"
              @focus="inputFocused = true"
              @blur="inputFocused = false"
              rows="4"
            ></textarea>
            <div class="bulk-form__actions">
              <button
                class="bulk-form__btn"
                :disabled="!namesInput.trim()"
                @click="addAllStudents"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add All
              </button>
              <button
                v-if="students.length > 0"
                class="bulk-form__btn bulk-form__btn--clear"
                @click="clearAllStudents"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                Clear All
              </button>
            </div>
          </div>

          <!-- Student grid -->
          <div v-if="!isEmpty" class="student-grid">
            <TransitionGroup name="list">
              <div
                v-for="student in students"
                :key="student.id"
                class="student-chip"
                :class="{
                  'student-chip--highlighted': highlightId === student.id,
                  'student-chip--picked': pickedStudent?.id === student.id && showResult,
                }"
                :style="{
                  '--chip-color': student.color,
                  '--chip-glow': student.color + '40',
                }"
              >
                <div class="student-chip__avatar" :style="{ background: student.color }">
                  {{ student.initials }}
                </div>
                <span class="student-chip__name">{{ student.name }}</span>
                <button
                  class="student-chip__remove"
                  title="Remove student"
                  @click="removeStudent(student.id)"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </TransitionGroup>
          </div>

          <!-- Empty state -->
          <div v-else class="empty-state">
            <div class="empty-state__icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
            </div>
            <p class="empty-state__text">No students yet</p>
            <p class="empty-state__hint">Type or paste student names above, one per line, then click "Add All"</p>
          </div>
        </section>

        <!-- Right Column: Picker & Result -->
        <section class="picker-section">
          <!-- Main pick area -->
          <div class="pick-area">
            <div class="pick-area__label">Pick a Student</div>

            <!-- Result display -->
            <div class="result-card" :class="{ 'result-card--visible': showResult && pickedStudent }">
              <Transition name="reveal" mode="out-in">
                <div v-if="showResult && pickedStudent" :key="pickedStudent.id" class="result-card__inner" :style="{ '--chip-color': pickedStudent.color }">
                  <div
                    class="result-card__avatar"
                    :style="{ background: pickedStudent.color }"
                  >
                    {{ pickedStudent.initials }}
                  </div>
                  <div class="result-card__name">{{ pickedStudent.name }}</div>
                  <div class="result-card__badge">Selected!</div>
                </div>
                <div v-else class="result-card__placeholder">
                  <div class="result-card__placeholder-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 6v6l4 2" />
                    </svg>
                  </div>
                  <p class="result-card__placeholder-text">
                    {{ isEmpty ? 'Add students to the pool first' : 'Click the button to pick randomly' }}
                  </p>
                </div>
              </Transition>
            </div>

            <!-- Pick button -->
            <button
              class="pick-btn"
              :class="{ 'pick-btn--picking': isPicking }"
              :disabled="isPicking || isEmpty"
              @click="pickRandom"
            >
              <span v-if="isPicking" class="pick-btn__content">
                <span class="pick-btn__spinner"></span>
                Picking...
              </span>
              <span v-else class="pick-btn__content">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                Pick Random Student
              </span>
            </button>
          </div>

          <!-- Pick History -->
          <div class="history-section" v-if="pickLog.length > 0">
            <div class="section-header">
              <h2 class="section-header__title">Pick History</h2>
              <span class="section-header__count">Last {{ pickLog.length }}</span>
            </div>
            <div class="history-list">
              <TransitionGroup name="history">
                <div
                  v-for="(entry, index) in pickLog"
                  :key="entry.time.getTime() + entry.name"
                  class="history-item"
                >
                  <span class="history-item__index">#{{ pickLog.length - index }}</span>
                  <span class="history-item__name">{{ entry.name }}</span>
                  <span class="history-item__time">{{ formatTime(entry.time) }}</span>
                </div>
              </TransitionGroup>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.picker-page {
  min-height: 100vh;
  background: #f8fafc;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* ── Header ── */
.picker-header {
  background: white;
  border-bottom: 1px solid #e2e8f0;
  position: sticky;
  top: 0;
  z-index: 10;
}

.picker-header__inner {
  max-width: 80rem;
  margin: 0 auto;
  padding: 1.25rem 2rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.picker-header__back {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: none;
  border: none;
  color: #64748b;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.4rem 0.75rem;
  border-radius: 0.5rem;
  transition: all 0.2s;
  flex-shrink: 0;
}

.picker-header__back:hover {
  background: #f1f5f9;
  color: #334155;
}

.picker-header__info {
  flex: 1;
  min-width: 0;
}

.picker-header__title {
  font-size: 1.35rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
  line-height: 1.3;
}

.picker-header__subtitle {
  margin: 0.15rem 0 0;
  color: #64748b;
  font-size: 0.85rem;
}

.picker-header__stats {
  display: flex;
  gap: 1.25rem;
  flex-shrink: 0;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat__value {
  font-size: 1.25rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1;
}

.stat__label {
  font-size: 0.7rem;
  color: #94a3b8;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-top: 0.2rem;
}

/* ── Content ── */
.picker-content {
  max-width: 80rem;
  margin: 0 auto;
  padding: 1.5rem 2rem;
}

.picker-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  align-items: start;
}

/* ── Section Header ── */
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.section-header__title {
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.section-header__count {
  font-size: 0.75rem;
  color: #94a3b8;
  font-weight: 500;
}

/* ── Pool Section ── */
.pool-section {
  background: white;
  border-radius: 1rem;
  border: 1px solid #e2e8f0;
  padding: 1.25rem;
}

/* Bulk add form */
.bulk-form {
  margin-bottom: 1rem;
  border-radius: 0.75rem;
  border: 2px solid #e2e8f0;
  padding: 0.3rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.bulk-form--focused {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.bulk-form__textarea {
  width: 100%;
  border: none;
  outline: none;
  padding: 0.5rem 0.75rem;
  font-size: 0.9rem;
  font-family: inherit;
  color: #0f172a;
  background: transparent;
  resize: vertical;
  min-height: 3.5rem;
  line-height: 1.5;
}

.bulk-form__textarea::placeholder {
  color: #94a3b8;
  white-space: pre-line;
}

.bulk-form__actions {
  display: flex;
  gap: 0.5rem;
  padding: 0.3rem 0.5rem 0.5rem;
}

.bulk-form__btn {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  border: none;
  border-radius: 0.6rem;
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.bulk-form__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.bulk-form__btn:not(:disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);
}

.bulk-form__btn:not(:disabled):active {
  transform: translateY(0);
}

.bulk-form__btn--clear {
  background: white;
  color: #ef4444;
  border: 1.5px solid #fca5a5;
  box-shadow: none;
}

.bulk-form__btn--clear:not(:disabled):hover {
  background: #fef2f2;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.2);
  border-color: #ef4444;
}

.bulk-form__btn--clear:not(:disabled):active {
  transform: translateY(0);
}

/* Student grid */
.student-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.student-chip {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 0.6rem;
  padding: 0.3rem 0.5rem 0.3rem 0.3rem;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.student-chip:hover {
  border-color: #cbd5e1;
  background: #f1f5f9;
}

.student-chip--highlighted {
  border-color: var(--chip-color);
  background: color-mix(in srgb, var(--chip-color) 8%, white);
  box-shadow: 0 0 12px var(--chip-glow);
  transform: scale(1.05);
}

.student-chip--picked {
  border-color: var(--chip-color);
  background: color-mix(in srgb, var(--chip-color) 12%, white);
  box-shadow: 0 0 20px var(--chip-glow);
}

.student-chip__avatar {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.6rem;
  font-weight: 700;
  flex-shrink: 0;
}

.student-chip__name {
  font-size: 0.8rem;
  font-weight: 600;
  color: #334155;
  white-space: nowrap;
}

.student-chip__remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.2rem;
  height: 1.2rem;
  background: transparent;
  border: none;
  border-radius: 50%;
  color: #94a3b8;
  cursor: pointer;
  opacity: 0;
  transition: all 0.15s;
  flex-shrink: 0;
  padding: 0;
}

.student-chip:hover .student-chip__remove {
  opacity: 1;
}

.student-chip__remove:hover {
  background: #fee2e2;
  color: #ef4444;
}

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2.5rem 1rem;
}

.empty-state__icon {
  margin-bottom: 0.75rem;
  opacity: 0.6;
}

.empty-state__text {
  font-size: 0.95rem;
  font-weight: 700;
  color: #64748b;
  margin: 0;
}

.empty-state__hint {
  font-size: 0.8rem;
  color: #94a3b8;
  margin: 0.25rem 0 0;
}

/* ── Picker Section ── */
.picker-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.pick-area {
  background: white;
  border-radius: 1rem;
  border: 1px solid #e2e8f0;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
}

.pick-area__label {
  font-size: 0.7rem;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

/* Result card */
.result-card {
  width: 100%;
  max-width: 18rem;
  min-height: 12rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 1rem;
  background: #f8fafc;
  border: 2px dashed #e2e8f0;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.result-card--visible {
  border-style: solid;
  border-color: #cbd5e1;
  background: white;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}

.result-card__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 2rem;
  text-align: center;
}

.result-card__avatar {
  width: 5rem;
  height: 5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
  font-weight: 800;
  box-shadow: 0 8px 24px color-mix(in srgb, var(--chip-color, #6366f1) 35%, transparent);
  animation: result-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes result-pop {
  0% { transform: scale(0); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.result-card__name {
  font-size: 1.35rem;
  font-weight: 800;
  color: #0f172a;
}

.result-card__badge {
  font-size: 0.65rem;
  font-weight: 700;
  color: #6366f1;
  background: #eef2ff;
  padding: 0.3rem 0.8rem;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.result-card__placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 2rem;
  text-align: center;
}

.result-card__placeholder-icon {
  opacity: 0.5;
}

.result-card__placeholder-text {
  font-size: 0.85rem;
  color: #94a3b8;
  margin: 0;
}

/* Pick button */
.pick-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  border: none;
  border-radius: 999px;
  padding: 0.85rem 2.5rem;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
  width: 100%;
  max-width: 20rem;
}

.pick-btn:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.5);
}

.pick-btn:not(:disabled):active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
}

.pick-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pick-btn--picking {
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
}

.pick-btn__content {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.pick-btn__spinner {
  width: 1.1rem;
  height: 1.1rem;
  border: 2.5px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ── History Section ── */
.history-section {
  background: white;
  border-radius: 1rem;
  border: 1px solid #e2e8f0;
  padding: 1.25rem;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.55rem 0.75rem;
  border-radius: 0.5rem;
  background: #f8fafc;
  transition: background 0.15s;
}

.history-item:hover {
  background: #f1f5f9;
}

.history-item__index {
  font-size: 0.7rem;
  font-weight: 700;
  color: #94a3b8;
  min-width: 1.8rem;
}

.history-item__name {
  flex: 1;
  font-size: 0.85rem;
  font-weight: 600;
  color: #334155;
}

.history-item__time {
  font-size: 0.7rem;
  color: #94a3b8;
  font-weight: 500;
}

/* ── Transitions ── */
.list-enter-active,
.list-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.list-enter-from {
  opacity: 0;
  transform: scale(0.8);
}

.list-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

.list-move {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.reveal-enter-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.reveal-leave-active {
  transition: all 0.2s ease;
}

.reveal-enter-from {
  opacity: 0;
  transform: scale(0.7) translateY(10px);
}

.reveal-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(-5px);
}

.history-enter-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.history-leave-active {
  transition: all 0.2s ease;
}

.history-enter-from {
  opacity: 0;
  transform: translateX(-10px);
}

.history-leave-to {
  opacity: 0;
  transform: translateX(10px);
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .picker-layout {
    grid-template-columns: 1fr;
  }

  .picker-header__inner {
    padding: 1rem;
    flex-wrap: wrap;
  }

  .picker-header__stats {
    width: 100%;
    justify-content: flex-end;
    padding-top: 0.5rem;
    border-top: 1px solid #f1f5f9;
  }

  .picker-content {
    padding: 1rem;
  }

  .pick-btn {
    padding: 0.75rem 1.5rem;
    font-size: 0.9rem;
  }

  .result-card__avatar {
    width: 4rem;
    height: 4rem;
    font-size: 1.25rem;
  }
}
</style>
