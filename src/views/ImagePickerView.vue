<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

interface Student {
  id: number
  name: string
  image: string
}

const students = ref<Student[]>([
  { id: 1, name: 'Mary', image: new URL('@/assets/images/Mary.jpg', import.meta.url).href },
  { id: 2, name: 'Me', image: new URL('@/assets/images/Me.jpg', import.meta.url).href },
  { id: 3, name: 'Nita', image: new URL('@/assets/images/Nita.jpg', import.meta.url).href },
  { id: 4, name: 'Oun', image: new URL('@/assets/images/oun.jpg', import.meta.url).href },
  { id: 5, name: 'San', image: new URL('@/assets/images/San.jpg', import.meta.url).href },
  { id: 6, name: 'Sophea', image: new URL('@/assets/images/Sophea.jpg', import.meta.url).href },
  { id: 7, name: 'Vanna', image: new URL('@/assets/images/Vanna.jpg', import.meta.url).href },
])

const pickedStudent = ref<Student | null>(null)
const isPicking = ref(false)
const showResult = ref(false)
const highlightId = ref<number | null>(null)
const pickLog = ref<{ name: string; time: Date }[]>([])
let flashInterval: ReturnType<typeof setInterval> | null = null
let clearTimeout: ReturnType<typeof setTimeout> | null = null

onUnmounted(() => {
  if (flashInterval) clearInterval(flashInterval)
  if (clearTimeout) clearTimeout(clearTimeout)
})

const isEmpty = computed(() => students.value.length === 0)

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
      const randomIdx = Math.floor(Math.random() * students.value.length)
      const student = students.value[randomIdx]
      if (student) {
        highlightId.value = student.id
      }
    }, flashIntervalMs)
  })

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

  clearTimeout = setTimeout(() => {
    highlightId.value = null
  }, 2000)
}

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="picker-page">
    <div class="picker-content">
      <div class="picker-layout">
        <!-- Left Column: Student Images -->
        <section class="pool-section">
          <div class="section-header">
            <h2 class="section-header__title">Students</h2>
            <span class="section-header__count">{{ students.length }} total</span>
          </div>

          <div v-if="!isEmpty" class="image-grid">
            <TransitionGroup name="list">
              <div
                v-for="student in students"
                :key="student.id"
                class="image-card"
                :class="{
                  'image-card--highlighted': highlightId === student.id,
                  'image-card--picked': pickedStudent?.id === student.id && showResult,
                }"
              >
                <div class="image-card__wrap">
                  <img :src="student.image" :alt="student.name" class="image-card__img" />
                </div>
                <div class="image-card__footer">
                  <span class="image-card__name">{{ student.name }}</span>
                  <button
                    class="image-card__remove"
                    title="Remove"
                    @click="removeStudent(student.id)"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>
            </TransitionGroup>
          </div>

          <div v-else class="empty-state">
            <div class="empty-state__icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
              </svg>
            </div>
            <p class="empty-state__text">No students available</p>
          </div>
        </section>

        <!-- Right Column: Picker & Result -->
        <section class="picker-section">
          <div class="pick-area">
            <div class="pick-area__label">Pick a Student</div>

            <!-- Result display -->
            <div class="result-card" :class="{ 'result-card--visible': showResult && pickedStudent }">
              <Transition name="reveal" mode="out-in">
                <div v-if="showResult && pickedStudent" :key="pickedStudent.id" class="result-card__inner">
                  <div class="result-card__image-wrap">
                    <img :src="pickedStudent.image" :alt="pickedStudent.name" class="result-card__img" />
                  </div>
                  <div class="result-card__name">{{ pickedStudent.name }}</div>
                  <div class="result-card__badge">Selected!</div>
                </div>
                <div v-else class="result-card__placeholder">
                  <div class="result-card__placeholder-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                      <circle cx="9" cy="9" r="2" />
                      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                    </svg>
                  </div>
                  <p class="result-card__placeholder-text">
                    {{ isEmpty ? 'No students available' : 'Click the button to pick randomly' }}
                  </p>
                </div>
              </Transition>
            </div>

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
                  <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                  <circle cx="9" cy="9" r="2" />
                  <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                </svg>
                Pick Random Image
              </span>
            </button>
          </div>

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
  padding-top: 64px;
  background: #f8fafc;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

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

.pool-section {
  background: white;
  border-radius: 1rem;
  border: 1px solid #e2e8f0;
  padding: 1.25rem;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 1rem;
}

.image-card {
  background: #fff;
  border: 1.5px solid #e2e8f0;
  border-radius: 0.75rem;
  overflow: hidden;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.image-card:hover {
  border-color: #cbd5e1;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
}

.image-card--highlighted {
  border-color: #6366f1;
  background: color-mix(in srgb, #6366f1 6%, white);
  box-shadow: 0 0 14px rgba(99, 102, 241, 0.35);
  transform: scale(1.03);
}

.image-card--picked {
  border-color: #22c55e;
  background: color-mix(in srgb, #22c55e 8%, white);
  box-shadow: 0 0 20px rgba(34, 197, 94, 0.35);
}

.image-card__wrap {
  aspect-ratio: 1 / 1;
  background: #f1f5f9;
  overflow: hidden;
}

.image-card__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.image-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.6rem;
  gap: 0.4rem;
}

.image-card__name {
  font-size: 0.85rem;
  font-weight: 700;
  color: #0f172a;
}

.image-card__remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border: none;
  background: transparent;
  color: #94a3b8;
  border-radius: 50%;
  cursor: pointer;
  opacity: 0;
  transition: all 0.15s;
}

.image-card:hover .image-card__remove {
  opacity: 1;
}

.image-card__remove:hover {
  background: #fee2e2;
  color: #ef4444;
}

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

.result-card__image-wrap {
  width: 7rem;
  height: 7rem;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0,0,0,0.12);
  animation: result-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.result-card__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
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

@media (max-width: 768px) {
  .picker-layout {
    grid-template-columns: 1fr;
  }

  .picker-content {
    padding: 1rem;
  }

  .image-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 0.75rem;
  }

  .pick-btn {
    padding: 0.75rem 1.5rem;
    font-size: 0.9rem;
  }

  .result-card__image-wrap {
    width: 5rem;
    height: 5rem;
  }
}
</style>