<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'

interface Student {
  id: number
  name: string
  initials: string
  studentId: string
}

const AVATAR_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#06B6D4', '#F97316', '#6366F1', '#14B8A6',
  '#22C55E', '#D946EF', '#0EA5E9', '#84CC16', '#E11D48',
  '#7C3AED', '#0891B2', '#DB2777', '#CA8A04', '#059669',
]

const classes = [
  'Grade 10 - A',
  'Grade 10 - B',
  'Grade 11 - A',
  'Grade 11 - B',
  'Grade 12 - A',
]

const students = ref<Student[]>(
  [
    'Alice Johnson', 'Bob Smith', 'Carol Williams', 'David Brown',
    'Eve Davis', 'Frank Miller', 'Grace Wilson', 'Henry Moore',
    'Ivy Taylor', 'Jack Anderson', 'Kate Thomas', 'Leo Jackson',
    'Mia White', 'Noah Harris', 'Olivia Martin', 'Peter Garcia',
    'Quinn Robinson', 'Rachel Clark', 'Sam Lewis', 'Tina Walker',
    'Uma Hall', 'Victor Young', 'Wendy King', 'Xander Wright',
    'Yara Lopez', 'Zachary Scott', 'Amelia Hill', 'Benjamin Green',
    'Chloe Adams', 'Daniel Baker',
  ].map((name, i) => ({
    id: i + 1,
    name,
    initials: name.split(' ').map(w => w[0]).join(''),
    studentId: `STU-${String(i + 1).padStart(3, '0')}`,
  }))
)

const selectedIds = ref<Set<number>>(new Set())
const searchQuery = ref('')
const selectedClass = ref(classes[0])
const isPicking = ref(false)
const isPickingGroup = ref(false)
const pickedId = ref<number | null>(null)
const pickedGroupIds = ref<Set<number>>(new Set())
const lastPickedIds = ref<Set<number>>(new Set())
const groupSize = ref(2)
let pickTimeout: ReturnType<typeof setTimeout> | null = null
let groupTimeouts: ReturnType<typeof setTimeout>[] = []
let pickSoundContext: AudioContext | null = null
let pickSoundOscillator: OscillatorNode | null = null
let pickSoundGain: GainNode | null = null

const filteredStudents = computed(() => {
  let list = students.value
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(s => s.name.toLowerCase().includes(q) || s.studentId.toLowerCase().includes(q))
  }
  return list
})

const selectedCount = computed(() => selectedIds.value.size)
const classDropdownOpen = ref(false)
const groupSizeOpen = ref(false)

const maxGroupSize = computed(() => Math.min(filteredStudents.value.length, 10))
const groupSizeOptions = computed(() => {
  const max = maxGroupSize.value
  const options: number[] = []
  for (let i = 2; i <= max; i++) {
    options.push(i)
  }
  return options
})

function toggleCard(id: number) {
  const set = new Set(selectedIds.value)
  if (set.has(id)) {
    set.delete(id)
  } else {
    set.add(id)
  }
  selectedIds.value = set
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const a = shuffled[i]!
    const b = shuffled[j]!
    shuffled[i] = b
    shuffled[j] = a
  }
  return shuffled
}

function stopPickSound() {
  if (!pickSoundContext || !pickSoundGain || !pickSoundOscillator) return
  const now = pickSoundContext.currentTime
  pickSoundGain.gain.cancelScheduledValues(now)
  pickSoundGain.gain.setValueAtTime(Math.max(pickSoundGain.gain.value, 0.0001), now)
  pickSoundGain.gain.exponentialRampToValueAtTime(0.00001, now + 0.06)
  pickSoundOscillator.stop(now + 0.08)
  pickSoundContext.close().catch(() => {})
  pickSoundContext = null
  pickSoundOscillator = null
  pickSoundGain = null
}

function startPickSound(frequency: number) {
  // Long pick sound removed per request.
  return
}

function playEndSound(frequency: number, duration = 180) {
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext
  if (!AudioContext) return

  const ctx = new AudioContext()
  const tone = ctx.createOscillator()
  const bell = ctx.createOscillator()
  const toneGain = ctx.createGain()
  const bellGain = ctx.createGain()
  const master = ctx.createGain()

  tone.type = 'sine'
  tone.frequency.value = frequency * 0.9
  tone.frequency.exponentialRampToValueAtTime(frequency * 1.2, ctx.currentTime + 0.08)

  bell.type = 'triangle'
  bell.frequency.value = frequency * 1.6
  bellGain.gain.setValueAtTime(0.0005, ctx.currentTime)
  bellGain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.12)

  toneGain.gain.setValueAtTime(0.001, ctx.currentTime)
  toneGain.gain.linearRampToValueAtTime(0.14, ctx.currentTime + 0.03)
  toneGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration / 1000)

  master.gain.setValueAtTime(0.5, ctx.currentTime)

  tone.connect(toneGain)
  bell.connect(bellGain)
  toneGain.connect(master)
  bellGain.connect(master)
  master.connect(ctx.destination)

  tone.start()
  bell.start()
  bell.stop(ctx.currentTime + 0.12)
  tone.stop(ctx.currentTime + duration / 1000 + 0.05)

  tone.onended = () => {
    ctx.close().catch(() => {})
  }
}

async function pickRandom() {
  if (isPicking.value || filteredStudents.value.length === 0) return
  isPicking.value = true
  pickedId.value = null
  lastPickedIds.value = new Set()
  pickedGroupIds.value = new Set()

  selectedIds.value = new Set()

  const flashDuration = 900
  const start = Date.now()
  startPickSound(720)

  await new Promise<void>((resolve) => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - start
      if (elapsed >= flashDuration) {
        clearInterval(interval)
        resolve()
        return
      }
      const list = filteredStudents.value
      const randomIdx = Math.floor(Math.random() * list.length)
      const student = list[randomIdx]!
      pickedId.value = student.id
    }, 60)
  })

  stopPickSound()
  const finalStudent = filteredStudents.value[Math.floor(Math.random() * filteredStudents.value.length)]!
  pickedId.value = finalStudent.id
  const set = new Set(selectedIds.value)
  set.add(finalStudent.id)
  selectedIds.value = set

  isPicking.value = false
  if (pickTimeout) clearTimeout(pickTimeout)
  pickTimeout = setTimeout(() => { pickedId.value = null }, 2000)
  lastPickedIds.value = new Set([finalStudent.id])
  playEndSound(1080, 190)
}

async function pickGroup() {
  if (isPickingGroup.value || filteredStudents.value.length < groupSize.value) return

  // Cancel any pending timeouts from previous group picks
  groupTimeouts.forEach(t => clearTimeout(t))
  groupTimeouts = []

  isPickingGroup.value = true
  pickedGroupIds.value = new Set()
  lastPickedIds.value = new Set()

  selectedIds.value = new Set()

  const shuffled = shuffleArray(filteredStudents.value)
  const picked = shuffled.slice(0, groupSize.value)

  const flashDuration = 600
  const start = Date.now()
  startPickSound(560)

  await new Promise<void>((resolve) => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - start
      if (elapsed >= flashDuration) {
        clearInterval(interval)
        resolve()
        return
      }
      const list = filteredStudents.value
      const previewSet = new Set<number>()
      for (let i = 0; i < groupSize.value; i++) {
        const randomIdx = Math.floor(Math.random() * list.length)
        const student = list[randomIdx]!
        previewSet.add(student.id)
      }
      pickedGroupIds.value = previewSet
    }, 80)
  })

  const revealDelay = 350
  for (let i = 0; i < picked.length; i++) {
    await new Promise<void>((resolve) => {
      const t = setTimeout(() => {
        const student = picked[i]!
        const newSet = new Set(selectedIds.value)
        newSet.add(student.id)
        selectedIds.value = newSet
        pickedGroupIds.value = new Set([student.id])
        resolve()
      }, i === 0 ? 0 : revealDelay)
      groupTimeouts.push(t)
    })
  }

  const finalSet = new Set(picked.map(s => s.id))
  pickedGroupIds.value = finalSet

  groupTimeouts.push(setTimeout(() => {
    stopPickSound()
    pickedGroupIds.value = new Set()
    isPickingGroup.value = false
    lastPickedIds.value = finalSet
    playEndSound(840, 260)
  }, 1500))
}

function setGroupSize(size: number) {
  groupSize.value = size
  groupSizeOpen.value = false
}

function deleteSelected() {
  if (selectedIds.value.size === 0) return
  students.value = students.value.filter(student => !selectedIds.value.has(student.id))
  selectedIds.value = new Set()
  pickedGroupIds.value = new Set()
  lastPickedIds.value = new Set()
  pickedId.value = null
}

function clearAll() {
  selectedIds.value = new Set()
  pickedGroupIds.value = new Set()
  lastPickedIds.value = new Set()
}

function clearSelection() {
  // Cancel any pending group animation timeouts
  groupTimeouts.forEach(t => clearTimeout(t))
  groupTimeouts = []

  const set = new Set(selectedIds.value)
  for (const id of lastPickedIds.value) {
    set.delete(id)
  }
  selectedIds.value = set
  lastPickedIds.value = new Set()
  pickedGroupIds.value = new Set()
  pickedId.value = null
}

function confirmSelection() {
  alert(`Selected ${selectedCount.value} student${selectedCount.value !== 1 ? 's' : ''}`)
}

onUnmounted(() => {
  if (pickTimeout) clearTimeout(pickTimeout)
  groupTimeouts.forEach(t => clearTimeout(t))
  groupTimeouts = []
})

function selectClass(cls: string) {
  selectedClass.value = cls
  classDropdownOpen.value = false
}

function getAvatarColor(id: number): string {
  return AVATAR_COLORS[(id - 1) % AVATAR_COLORS.length] ?? '#3B82F6'
}
</script>

<template>
  <div class="picker">
    <!-- ─── Header ─── -->
    <div class="header">
      <div class="header__inner">
        <div>
          <h1 class="header__title">Card Picker</h1>
          <p class="header__desc">Select one or more students by tapping their cards.</p>
        </div>
        <div class="header__actions">
          <div class="header__counter" v-if="selectedCount > 0">
            <span class="header__count">{{ selectedCount }}</span>
            <span class="header__count-label">selected</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ─── Toolbar ─── -->
    <div class="toolbar">
      <div class="toolbar__inner">
        <!-- Class -->
        <div class="toolbar__dropdown" @click="classDropdownOpen = !classDropdownOpen" @mouseleave="classDropdownOpen = false">
          <button class="toolbar__dropdown-btn" type="button">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
            <span>{{ selectedClass }}</span>
            <svg class="toolbar__chevron" :class="{ open: classDropdownOpen }" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          <Transition name="drop">
            <div v-if="classDropdownOpen" class="toolbar__menu">
              <button v-for="cls in classes" :key="cls" class="toolbar__menu-item" :class="{ active: cls === selectedClass }" @click="selectClass(cls)">{{ cls }}</button>
            </div>
          </Transition>
        </div>

        <!-- Search -->
        <div class="toolbar__search">
          <svg class="toolbar__search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input v-model="searchQuery" type="text" class="toolbar__input" placeholder="Search student..." aria-label="Search student" />
          <button v-if="searchQuery" class="toolbar__clear" @click="searchQuery = ''" aria-label="Clear search">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        <!-- Actions -->
        <div class="toolbar__actions">
          <button class="toolbar__btn toolbar__btn--blue" @click="pickRandom" :disabled="isPicking || isPickingGroup || filteredStudents.length === 0" aria-label="Pick random student">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
              <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
            </svg>
            <span>{{ isPicking ? 'Picking...' : 'Pick' }}</span>
          </button>

          <div class="toolbar__group" v-if="filteredStudents.length >= 2">
            <div class="toolbar__group-size" @click.stop="groupSizeOpen = !groupSizeOpen" @mouseleave="groupSizeOpen = false">
              <button class="toolbar__group-btn" type="button" :disabled="isPickingGroup" aria-label="Group size">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <span class="toolbar__group-val">{{ groupSize }}</span>
                <svg class="toolbar__chevron" :class="{ open: groupSizeOpen }" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              <Transition name="drop">
                <div v-if="groupSizeOpen" class="toolbar__menu toolbar__menu--right">
                  <button v-for="size in groupSizeOptions" :key="size" class="toolbar__menu-item" :class="{ active: size === groupSize }" @click="setGroupSize(size)">{{ size }} Students</button>
                </div>
              </Transition>
            </div>
            <button class="toolbar__btn toolbar__btn--outline" @click="pickGroup" :disabled="isPickingGroup || isPicking || filteredStudents.length < groupSize" aria-label="Pick group of students">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                <line x1="16" y1="8" x2="16" y2="14" />
                <line x1="19" y1="11" x2="13" y2="11" />
              </svg>
              <span>{{ isPickingGroup ? 'Picking...' : 'Group' }}</span>
            </button>
          </div>
          <button v-if="selectedCount > 0" class="toolbar__btn toolbar__btn--outline" @click="deleteSelected" aria-label="Delete selected students">
            Delete Selected
          </button>
        </div>
      </div>
    </div>

    <!-- ─── Grid ─── -->
    <main class="main">
      <TransitionGroup name="grid" tag="div" class="grid">
        <button
          v-for="student in filteredStudents"
          :key="student.id"
          class="card"
          :class="{
            'card--sel': selectedIds.has(student.id),
            'card--pick': pickedId === student.id,
            'card--group': pickedGroupIds.has(student.id),
          }"
          @click="toggleCard(student.id)"
          :aria-label="'Select ' + student.name"
          :aria-pressed="selectedIds.has(student.id)"
        >
          <div class="card__check" v-if="selectedIds.has(student.id)">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          </div>
          <div class="card__avatar" :style="{ background: getAvatarColor(student.id) }">
            <span class="card__initials">{{ student.initials }}</span>
          </div>
          <div class="card__info">
            <h3 class="card__name">{{ student.name }}</h3>
            <span class="card__id">{{ student.studentId }}</span>
          </div>
        </button>
      </TransitionGroup>

      <Transition name="fade">
        <div v-if="filteredStudents.length === 0" class="empty">
          <div class="empty__icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
          </div>
          <h3 class="empty__title">No students found</h3>
          <p class="empty__text">Try a different search term</p>
        </div>
      </Transition>
    </main>

  </div>
</template>

<style scoped>
/* ═══════════════════════════════════
   Root
   ═══════════════════════════════════ */
.picker {
  min-height: 100vh;
  padding-top: 64px;
  background: #F8FAFC;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

/* ═══════════════════════════════════
   Header
   ═══════════════════════════════════ */
.header {
  background: white;
  border-bottom: 1px solid #E5E7EB;
}

.header__inner {
  max-width: 80rem;
  margin: 0 auto;
  padding: 2rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.header__title {
  font-size: 1.35rem;
  font-weight: 700;
  color: #1F2937;
  margin: 0;
  letter-spacing: -0.02em;
}

.header__desc {
  margin: 0.25rem 0 0;
  color: #9CA3AF;
  font-size: 0.85rem;
}

.header__actions {
  flex-shrink: 0;
}

.header__counter {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.75rem;
  background: #EFF6FF;
  border: 1px solid #BFDBFE;
  border-radius: 999px;
}

.header__count {
  font-size: 0.85rem;
  font-weight: 700;
  color: #3B82F6;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.header__count-label {
  font-size: 0.78rem;
  font-weight: 500;
  color: #6B7280;
}

/* ═══════════════════════════════════
   Toolbar
   ═══════════════════════════════════ */
.toolbar {
  background: white;
  border-bottom: 1px solid #E5E7EB;
  position: sticky;
  top: 64px;
  z-index: 20;
}

.toolbar__inner {
  max-width: 80rem;
  margin: 0 auto;
  padding: 0.65rem 2rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

/* ── Dropdown ── */
.toolbar__dropdown {
  position: relative;
  flex-shrink: 0;
}

.toolbar__dropdown-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.75rem;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  background: white;
  color: #1F2937;
  font-size: 0.82rem;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: border-color 0.15s;
}

.toolbar__dropdown-btn:hover {
  border-color: #3B82F6;
}

.toolbar__chevron {
  transition: transform 0.2s;
  color: #9CA3AF;
}

.toolbar__chevron.open {
  transform: rotate(180deg);
}

.toolbar__menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  min-width: 100%;
  width: max-content;
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  padding: 4px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.08);
  z-index: 30;
}

.toolbar__menu--right {
  left: auto;
  right: 0;
}

.toolbar__menu-item {
  display: block;
  width: 100%;
  text-align: left;
  padding: 0.4rem 0.75rem;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #4B5563;
  font-size: 0.82rem;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.12s;
}

.toolbar__menu-item:hover {
  background: #F3F4F6;
}

.toolbar__menu-item.active {
  background: #EFF6FF;
  color: #3B82F6;
  font-weight: 600;
}

/* ── Search ── */
.toolbar__search {
  position: relative;
  flex: 1;
  max-width: 16rem;
}

.toolbar__search-icon {
  position: absolute;
  left: 0.65rem;
  top: 50%;
  transform: translateY(-50%);
  color: #9CA3AF;
  pointer-events: none;
}

.toolbar__input {
  width: 100%;
  padding: 0.4rem 1.8rem 0.4rem 2rem;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  font-size: 0.82rem;
  font-family: inherit;
  background: #F9FAFB;
  color: #1F2937;
  outline: none;
  transition: all 0.15s;
}

.toolbar__input::placeholder {
  color: #9CA3AF;
}

.toolbar__input:focus {
  border-color: #3B82F6;
  background: white;
  box-shadow: 0 0 0 3px rgba(59,130,246,0.08);
}

.toolbar__clear {
  position: absolute;
  right: 0.35rem;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.2rem;
  height: 1.2rem;
  border: none;
  background: #E5E7EB;
  border-radius: 50%;
  color: #6B7280;
  cursor: pointer;
  transition: background 0.12s;
}

.toolbar__clear:hover {
  background: #D1D5DB;
}

/* ── Actions ── */
.toolbar__actions {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin-left: auto;
  flex-shrink: 0;
}

.toolbar__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.75rem;
  border: none;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.toolbar__btn:active {
  transform: scale(0.97);
}

.toolbar__btn--blue {
  background: #3B82F6;
  color: white;
}

.toolbar__btn--blue:hover:not(:disabled) {
  background: #2563EB;
}

.toolbar__btn--blue:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.toolbar__btn--outline {
  background: white;
  color: #3B82F6;
  border: 1px solid #3B82F6;
  border-radius: 0 8px 8px 0;
}

.toolbar__btn--outline:hover:not(:disabled) {
  background: #EFF6FF;
  border-color: #2563EB;
  color: #2563EB;
  z-index: 1;
}

.toolbar__btn--outline:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/* ── Group size ── */
.toolbar__group {
  display: flex;
  align-items: center;
}

.toolbar__group-size {
  position: relative;
}

.toolbar__group-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.4rem 0.5rem;
  border: 1px solid #3B82F6;
  border-right: none;
  border-radius: 8px 0 0 8px;
  background: white;
  color: #1F2937;
  font-size: 0.82rem;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.12s;
}

.toolbar__group-btn:hover:not(:disabled) {
  background: #F8FAFC;
}

.toolbar__group-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.toolbar__group-val {
  min-width: 1.1rem;
  text-align: center;
  font-weight: 700;
  color: #3B82F6;
  font-variant-numeric: tabular-nums;
  font-size: 0.85rem;
}

/* ═══════════════════════════════════
   Grid
   ═══════════════════════════════════ */
.main {
  max-width: 80rem;
  margin: 0 auto;
  padding: 1.5rem 2rem 7rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 0.85rem;
}

@media (min-width: 1024px) {
  .grid { grid-template-columns: repeat(5, 1fr); }
}
@media (max-width: 1023px) and (min-width: 640px) {
  .grid { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 639px) {
  .grid { grid-template-columns: repeat(2, 1fr); gap: 0.65rem; }
}

/* ═══════════════════════════════════
   Card
   ═══════════════════════════════════ */
.card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.65rem;
  padding: 1.25rem 0.85rem 0.85rem;
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 14px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
  outline: none;
  text-align: center;
  min-height: 150px;
}

.card:hover {
  border-color: #D1D5DB;
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.06);
}

.card:active {
  transform: translateY(-1px) scale(0.98);
}

/* Selected */
.card--sel {
  border-color: #3B82F6;
  background: #EFF6FF;
  box-shadow: 0 0 0 1px rgba(59,130,246,0.12), 0 6px 16px rgba(59,130,246,0.08);
  transform: translateY(-3px);
}

.card--sel:hover {
  border-color: #2563EB;
  box-shadow: 0 0 0 2px rgba(59,130,246,0.15), 0 8px 20px rgba(59,130,246,0.1);
}

/* Picked (single) */
.card--pick {
  border-color: #3B82F6 !important;
  background: #DBEAFE !important;
  box-shadow: 0 0 0 3px rgba(59,130,246,0.2), 0 8px 24px rgba(59,130,246,0.15) !important;
  transform: translateY(-5px) scale(1.03) !important;
  animation: pop-in 0.45s cubic-bezier(0.34,1.56,0.64,1);
  will-change: transform;
}

@keyframes pop-in {
  0% { transform: translateY(-3px) scale(1); }
  40% { transform: translateY(-7px) scale(1.05); }
  100% { transform: translateY(-5px) scale(1.03); }
}

/* Picked (group) */
.card--group {
  border-color: #3B82F6 !important;
  background: #DBEAFE !important;
  box-shadow: 0 0 0 3px rgba(59,130,246,0.2), 0 8px 24px rgba(59,130,246,0.15) !important;
  transform: translateY(-5px) scale(1.03) !important;
  animation: group-pop 0.35s cubic-bezier(0.34,1.56,0.64,1);
  will-change: transform;
}

@keyframes group-pop {
  0% { transform: translateY(-3px) scale(1); opacity: 0.7; }
  50% { transform: translateY(-6px) scale(1.04); opacity: 1; }
  100% { transform: translateY(-5px) scale(1.03); opacity: 1; }
}

/* Check icon */
.card__check {
  position: absolute;
  top: 0.4rem;
  right: 0.4rem;
  width: 1.35rem;
  height: 1.35rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #22C55E;
  border-radius: 50%;
  animation: check-pop 0.25s cubic-bezier(0.34,1.56,0.64,1);
  z-index: 2;
  box-shadow: 0 2px 6px rgba(34,197,94,0.3);
}

@keyframes check-pop {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}

/* Avatar */
.card__avatar {
  width: 2.75rem;
  height: 2.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: transform 0.2s;
  flex-shrink: 0;
}

.card--sel .card__avatar,
.card--pick .card__avatar,
.card--group .card__avatar {
  transform: scale(1.08);
}

.card__initials {
  font-size: 0.8rem;
  font-weight: 700;
  color: white;
}

.card__info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
  min-width: 0;
  width: 100%;
}

.card__name {
  margin: 0;
  font-size: 0.82rem;
  font-weight: 600;
  color: #1F2937;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card--sel .card__name,
.card--pick .card__name,
.card--group .card__name {
  color: #1D4ED8;
}

.card__id {
  font-size: 0.65rem;
  font-weight: 500;
  color: #9CA3AF;
  font-variant-numeric: tabular-nums;
}

/* ═══════════════════════════════════
   Empty
   ═══════════════════════════════════ */
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.65rem;
  padding: 4rem 2rem;
  text-align: center;
}

.empty__icon {
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 12px;
  border: 1px solid #E5E7EB;
}

.empty__title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #4B5563;
  margin: 0;
}

.empty__text {
  font-size: 0.82rem;
  color: #9CA3AF;
  margin: 0;
}

/* ═══════════════════════════════════
   Bottom Bar
   ═══════════════════════════════════ */
.bar {
  position: fixed;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 50;
  max-width: 36rem;
  width: calc(100% - 2rem);
}

.bar__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 1.15rem;
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  box-shadow: 0 12px 40px rgba(0,0,0,0.08);
  animation: bar-in 0.3s cubic-bezier(0.34,1.56,0.64,1);
}

@keyframes bar-in {
  0% { opacity: 0; transform: scale(0.96) translateY(8px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}

.bar__left {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.bar__num {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #3B82F6;
  color: white;
  font-size: 0.85rem;
  font-weight: 700;
  border-radius: 8px;
  flex-shrink: 0;
}

.bar__label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #1F2937;
}

.bar__right {
  display: flex;
  gap: 0.4rem;
  flex-shrink: 0;
}

.bar__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.45rem 0.85rem;
  border: none;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.bar__btn:active {
  transform: scale(0.97);
}

.bar__btn--ghost {
  background: #F3F4F6;
  color: #4B5563;
}

.bar__btn--ghost:hover {
  background: #E5E7EB;
  color: #1F2937;
}

.bar__btn--warn {
  background: #FEF2F2;
  color: #DC2626;
  border: 1px solid #FECACA;
}

.bar__btn--warn:hover {
  background: #FEE2E2;
  border-color: #FCA5A5;
}

.bar__btn--solid {
  background: #3B82F6;
  color: white;
  box-shadow: 0 2px 6px rgba(59,130,246,0.25);
}

.bar__btn--solid:hover {
  background: #2563EB;
}

/* ═══════════════════════════════════
   Transitions
   ═══════════════════════════════════ */
.grid-move {
  transition: transform 0.3s;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.drop-enter-active,
.drop-leave-active {
  transition: all 0.12s;
}
.drop-enter-from,
.drop-leave-to {
  opacity: 0;
  transform: translateY(-3px);
}

.up-enter-active {
  transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1);
}
.up-leave-active {
  transition: all 0.15s;
}
.up-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(16px);
}
.up-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(8px);
}

/* ═══════════════════════════════════
   Responsive
   ═══════════════════════════════════ */
@media (max-width: 639px) {
  .header__inner {
    padding: 1.25rem 1rem;
  }
  .header__title {
    font-size: 1.15rem;
  }
  .header__desc {
    font-size: 0.8rem;
  }

  .toolbar__inner {
    padding: 0.55rem 1rem;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .toolbar__search {
    max-width: 100%;
    order: 1;
    flex-basis: 100%;
  }
  .toolbar__actions {
    margin-left: 0;
  }

  .main {
    padding: 0.75rem 1rem 6rem;
  }

  .card {
    min-height: 135px;
    padding: 1.1rem 0.65rem 0.75rem;
    border-radius: 12px;
  }
  .card__avatar {
    width: 2.5rem;
    height: 2.5rem;
  }
  .card__initials {
    font-size: 0.75rem;
  }
  .card__name {
    font-size: 0.78rem;
  }

  .bar {
    bottom: 1rem;
    width: calc(100% - 1.25rem);
  }
  .bar__inner {
    flex-direction: column;
    gap: 0.65rem;
    padding: 0.65rem 1rem;
  }
  .bar__right {
    width: 100%;
  }
  .bar__btn {
    flex: 1;
    justify-content: center;
  }
}

@media (max-width: 380px) {
  .grid {
    gap: 0.5rem;
  }
  .card {
    min-height: 125px;
    padding: 1rem 0.55rem 0.65rem;
  }
  .card__avatar {
    width: 2.25rem;
    height: 2.25rem;
  }
  .card__initials {
    font-size: 0.7rem;
  }
  .card__name {
    font-size: 0.75rem;
  }
}
</style>
