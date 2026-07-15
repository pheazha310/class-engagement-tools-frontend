<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Student, Group, GenerationMethod } from '@/types/groupGenerator'

// State
const students = ref<Student[]>([])
const method = ref<GenerationMethod>('random')
const target = ref<'groups' | 'size'>('groups')
const quantity = ref(4)
const generateTeamNames = ref(true)
const generatedGroups = ref<Group[]>([])
const isGenerating = ref(false)

// Team name adjectives and nouns
const adjectives = [
  'Quantum', 'Pixel', 'Nebula', 'Logic', 'Cosmic', 'Digital', 'Turbo', 'Mega',
  'Super', 'Hyper', 'Ultra', 'Neo', 'Alpha', 'Beta', 'Prime', 'Elite',
  'Rapid', 'Swift', 'Bright', 'Clever', 'Happy', 'Lucky', 'Fast', 'Bold'
]

const nouns = [
  'Quokkas', 'Pioneers', 'Knights', 'Lions', 'Tigers', 'Eagles', 'Wolves', 'Bears',
  'Hawks', 'Dragons', 'Falcons', 'Sharks', 'Panthers', 'Rangers', 'Warriors', 'Heroes',
  'Mavericks', 'Legends', 'Champions', 'Stars', 'Comets', 'Rockets', 'Blazers', 'Strikers'
]

const colorPalette = [
  { bg: 'bg-blue-600', text: 'text-white', ring: 'ring-blue-600' },
  { bg: 'bg-fuchsia-600', text: 'text-white', ring: 'ring-fuchsia-600' },
  { bg: 'bg-amber-700', text: 'text-white', ring: 'ring-amber-700' },
  { bg: 'bg-violet-600', text: 'text-white', ring: 'ring-violet-600' },
  { bg: 'bg-emerald-600', text: 'text-white', ring: 'ring-emerald-600' },
  { bg: 'bg-rose-600', text: 'text-white', ring: 'ring-rose-600' },
  { bg: 'bg-cyan-700', text: 'text-white', ring: 'ring-cyan-700' },
  { bg: 'bg-indigo-600', text: 'text-white', ring: 'ring-indigo-600' },
]

const groupCardColors = [
  '#1e40af',
  '#9333ea',
  '#b45309',
  '#7c3aed',
  '#047857',
  '#be123c',
  '#0e7490',
  '#3730a3',
]

// Computed
const isEmpty = computed(() => generatedGroups.value.length === 0)
const hasStudents = computed(() => students.value.length > 0)
const totalStudents = computed(() => students.value.length)
const totalGroups = computed(() => generatedGroups.value.length)

const studentText = computed({
  get: () => students.value.map(s => s.name).join('\n'),
  set: (val) => {
    const names = val.split('\n').filter(n => n.trim())
    students.value = names.map((name, idx) => ({
      id: `student-${idx}`,
      name: name.trim(),
      gender: undefined,
    }))
  }
})

// Methods
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function generateGroupName(index: number): string {
  const adj = adjectives[index % adjectives.length]
  const noun = nouns[index % nouns.length]
  return `${adj} ${noun}`
}

function shuffle<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function generateRandomGroups(): Group[] {
  const shuffled = shuffle(students.value)
  const groups: Group[] = []
  const groupCount = target.value === 'groups' ? quantity.value : Math.ceil(students.value.length / quantity.value)
  const size = target.value === 'size' ? quantity.value : Math.ceil(students.value.length / groupCount)

  for (let i = 0; i < groupCount; i++) {
    const start = i * size
    const groupStudents = shuffled.slice(start, start + size)
    if (groupStudents.length > 0) {
      groups.push({
        id: `group-${i}`,
        name: generateTeamNames.value ? generateGroupName(i) : `Group ${i + 1}`,
        students: groupStudents,
        color: colorPalette[i % colorPalette.length].bg,
      })
    }
  }

  return groups
}

function generateBalancedGroups(): Group[] {
  const shuffled = shuffle(students.value)
  const groupCount = target.value === 'groups' ? quantity.value : Math.ceil(students.value.length / quantity.value)
  const groups: Group[] = []

  // Distribute students round-robin for balanced distribution
  for (let i = 0; i < shuffled.length; i++) {
    const groupIndex = i % groupCount
    if (!groups[groupIndex]) {
      groups[groupIndex] = {
        id: `group-${groupIndex}`,
        name: generateTeamNames.value ? generateGroupName(groupIndex) : `Group ${groupIndex + 1}`,
        students: [],
        color: colorPalette[groupIndex % colorPalette.length].bg,
      }
    }
    groups[groupIndex].students.push(shuffled[i])
  }

  return groups.filter(g => g.students.length > 0)
}

function generateGenderBalancedGroups(): Group[] {
  const males = students.value.filter(s => s.gender === 'male')
  const others = students.value.filter(s => s.gender === 'other')
  const females = students.value.filter(s => s.gender === 'female' || !s.gender)

  const shuffledMales = shuffle(males)
  const shuffledFemales = shuffle(females)
  const shuffledOthers = shuffle(others)

  const groupCount = target.value === 'groups' ? quantity.value : Math.ceil(students.value.length / quantity.value)
  const groups: Group[] = []

  // Distribute each gender category round-robin
  const distribute = (pool: Student[], groupIndexOffset: number) => {
    pool.forEach((student, i) => {
      const groupIndex = (i + groupIndexOffset) % groupCount
      if (!groups[groupIndex]) {
        groups[groupIndex] = {
          id: `group-${groupIndex}`,
          name: generateTeamNames.value ? generateGroupName(groupIndex) : `Group ${groupIndex + 1}`,
          students: [],
          color: colorPalette[groupIndex % colorPalette.length].bg,
        }
      }
      groups[groupIndex].students.push(student)
    })
  }

  distribute(shuffledMales, 0)
  distribute(shuffledFemales, 0)
  distribute(shuffledOthers, 0)

  return groups.filter(g => g.students.length > 0)
}

function generateGroups() {
  if (!hasStudents.value) return

  isGenerating.value = true

  // Simulate brief generation delay for UX
  setTimeout(() => {
    switch (method.value) {
      case 'random':
        generatedGroups.value = generateRandomGroups()
        break
      case 'balanced':
        generatedGroups.value = generateBalancedGroups()
        break
      case 'gender':
        generatedGroups.value = generateGenderBalancedGroups()
        break
    }
    isGenerating.value = false
  }, 300)
}

function regenerate() {
  generateGroups()
}

function exportGroups() {
  if (generatedGroups.value.length === 0) return

  const exportData = {
    generatedAt: new Date().toISOString(),
    method: method.value,
    groups: generatedGroups.value.map(g => ({
      name: g.name,
      students: g.students.map(s => s.name),
    }))
  }

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'groups-export.json'
  a.click()
  URL.revokeObjectURL(url)
}

function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    const content = e.target?.result as string
    const names = content.split(/[\n,]/).filter(n => n.trim())
    students.value = names.map((name, idx) => ({
      id: `student-${idx}`,
      name: name.trim(),
      gender: undefined,
    }))
  }
  reader.readAsText(file)
}

function handleDragOver(e: DragEvent) {
  e.preventDefault()
}

function handleDrop(e: DragEvent) {
  e.preventDefault()
  const file = e.dataTransfer?.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (ev) => {
    const content = ev.target?.result as string
    const names = content.split(/[\n,]/).filter(n => n.trim())
    students.value = names.map((name, idx) => ({
      id: `student-${idx}`,
      name: name.trim(),
      gender: undefined,
    }))
  }
  reader.readAsText(file)
}
</script>

<template>
  <div class="group-generator">
    <!-- Header -->
    <header class="header">
      <div class="header__inner">
        <h1 class="header__title">Group Generator</h1>
        <p class="header__subtitle">Automatically organize students into balanced classroom groups.</p>
        <div class="header__actions">
          <button class="icon-btn" title="Help">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </button>
          <button class="icon-btn" title="Settings">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v6m0 6v6m4.22-10.22l4.24-4.24M6.34 6.34L2.1 2.1m17.8 17.8l-4.24-4.24M6.34 17.66l-4.24 4.24M23 12h-6m-6 0H1m20.07-4.93l-4.24 4.24M6.34 6.34l-4.24-4.24" />
            </svg>
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="main">
      <div class="layout">
        <!-- Left Panel -->
        <div class="left-panel">
          <!-- Step 1: Student List -->
          <section class="card">
            <div class="step-header">
              <div class="step-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1e40af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div>
                <h2 class="card__title">Student List</h2>
                <span class="step-badge">STEP 1</span>
              </div>
            </div>

            <div class="form">
              <textarea
                v-model="studentText"
                class="textarea"
                placeholder="Paste student names here, one per line..."
                rows="8"
              ></textarea>
              <span class="hint">Separate names with Enter</span>

              <div
                class="upload-zone"
                @dragover="handleDragOver"
                @drop="handleDrop"
              >
                <svg class="upload-icon" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <p class="upload-text">
                  Drag & drop or <label class="upload-link"><input type="file" accept=".csv,.txt,.xlsx" class="hidden" @change="handleFileUpload">upload file</label>
                </p>
                <p class="upload-hint">Supports .csv, .txt, .xlsx</p>
              </div>
            </div>
          </section>

          <!-- Step 2: Configuration -->
          <section class="card">
            <div class="step-header">
              <div class="step-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1e40af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="4" y1="21" x2="4" y2="14" />
                  <line x1="4" y1="10" x2="4" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12" y2="3" />
                  <line x1="20" y1="21" x2="20" y2="16" />
                  <line x1="20" y1="12" x2="20" y2="3" />
                  <line x1="1" y1="14" x2="7" y2="14" />
                  <line x1="9" y1="8" x2="15" y2="8" />
                  <line x1="17" y1="16" x2="23" y2="16" />
                </svg>
              </div>
              <div>
                <h2 class="card__title">Configuration</h2>
                <span class="step-badge">STEP 2</span>
              </div>
            </div>

            <div class="config">
              <label class="label">Generation Method</label>
              <div class="method-grid">
                <button
                  v-for="m in ['random', 'balanced', 'gender']"
                  :key="m"
                  class="method-btn"
                  :class="{ 'method-btn--active': method === m }"
                  @click="method = m as GenerationMethod"
                >
                  <svg v-if="m === 'random'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
                  </svg>
                  <svg v-else-if="m === 'balanced'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4" />
                  </svg>
                  <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <span class="method-label">{{ m.charAt(0).toUpperCase() + m.slice(1) }}</span>
                </button>
              </div>

              <div class="row">
                <div class="field">
                  <label class="label">Targeting</label>
                  <select v-model="target" class="select">
                    <option value="groups">Number of Groups</option>
                    <option value="size">Group Size</option>
                  </select>
                </div>

                <div class="field">
                  <label class="label">Quantity</label>
                  <div class="number-input">
                    <button class="num-btn" @click="quantity > 2 && quantity--">−</button>
                    <input type="number" v-model="quantity" class="num-field" min="2" />
                    <button class="num-btn" @click="quantity++">+</button>
                  </div>
                </div>
              </div>

              <div class="toggle-row">
                <label class="toggle-label">Generate Team Names</label>
                <button
                  class="toggle"
                  :class="{ 'toggle--on': generateTeamNames }"
                  @click="generateTeamNames = !generateTeamNames"
                >
                  <span class="toggle__thumb"></span>
                </button>
              </div>

              <button
                class="generate-btn"
                :disabled="!hasStudents || isGenerating"
                @click="generateGroups"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                </svg>
                {{ isGenerating ? 'Generating...' : 'Generate Groups' }}
              </button>
            </div>
          </section>
        </div>

        <!-- Right Panel: Results -->
        <div class="right-panel">
          <div v-if="isEmpty" class="empty-state">
            <div class="empty-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
              </svg>
            </div>
            <p class="empty-title">No groups generated yet</p>
            <p class="empty-desc">Configure the settings on the left and click Generate Groups to see the magic happen.</p>
          </div>

          <div v-else class="results">
            <div class="results-header">
              <div>
                <span class="badge">Total Groups: {{ totalGroups }}</span>
                <span class="text-sm text-slate-500 ml-3">Created for {{ totalStudents }} students</span>
              </div>
              <div class="actions">
                <button class="secondary-btn" @click="regenerate">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                    <path d="M21 3v5h-5" />
                  </svg>
                  Regenerate
                </button>
                <button class="primary-btn" @click="exportGroups">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Export
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
              </div>
            </div>

            <div class="groups-grid">
              <div
                v-for="(group, idx) in generatedGroups"
                :key="group.id"
                class="group-card"
                :style="{ background: groupCardColors[idx % groupCardColors.length] }"
              >
                <div class="group-card__header">
                  <h3 class="group-card__name">{{ group.name }}</h3>
                  <span class="group-card__count">{{ group.students.length }} Students</span>
                </div>

                <div class="group-card__list">
                  <div
                    v-for="student in group.students"
                    :key="student.id"
                    class="student-item"
                  >
                    <div class="student-avatar">
                      {{ getInitials(student.name) }}
                    </div>
                    <span class="student-name">{{ student.name }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.group-generator {
  min-height: 100vh;
  background: #f5f3ff;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  padding-top: 64px;
}

.header {
  background: white;
  border-bottom: 1px solid #e2e8f0;
}

.header__inner {
  max-width: 80rem;
  margin: 0 auto;
  padding: 1.5rem 2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header__title {
  font-size: 1.75rem;
  font-weight: 800;
  color: #1e40af;
  margin: 0;
}

.header__subtitle {
  color: #64748b;
  font-size: 0.9rem;
  margin: 0.25rem 0 0;
}

.header__actions {
  margin-left: auto;
  display: flex;
  gap: 0.5rem;
}

.icon-btn {
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  background: white;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
}

.icon-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.main {
  max-width: 80rem;
  margin: 0 auto;
  padding: 2rem;
}

.layout {
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 1.5rem;
  align-items: start;
}

.left-panel {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.card {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.step-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.step-icon {
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #dbeafe;
  border-radius: 0.5rem;
}

.card__title {
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.step-badge {
  display: block;
  font-size: 0.7rem;
  color: #94a3b8;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  font-family: inherit;
  font-size: 0.9rem;
  resize: vertical;
  outline: none;
  transition: border-color 0.2s;
}

.textarea:focus {
  border-color: #1e40af;
}

.hint {
  font-size: 0.75rem;
  color: #94a3b8;
}

.upload-zone {
  border: 2px dashed #cbd5e1;
  border-radius: 0.5rem;
  padding: 2rem 1rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.upload-zone:hover {
  border-color: #1e40af;
  background: #f8fafc;
}

.upload-icon {
  margin-bottom: 0.5rem;
  color: #64748b;
}

.upload-text {
  font-size: 0.9rem;
  color: #334155;
  margin: 0;
}

.upload-link {
  color: #1e40af;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
}

.upload-link input {
  display: none;
}

.upload-hint {
  font-size: 0.75rem;
  color: #94a3b8;
  margin: 0.25rem 0 0;
}

.label {
  display: block;
  font-size: 0.9rem;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 0.5rem;
}

.config {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.method-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
}

.method-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 0.5rem;
  border: 2px solid #e2e8f0;
  border-radius: 0.5rem;
  background: white;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
}

.method-btn:hover {
  border-color: #1e40af;
  color: #1e40af;
}

.method-btn--active {
  border-color: #1e40af;
  background: #dbeafe;
  color: #1e40af;
}

.method-label {
  font-size: 0.85rem;
  font-weight: 600;
}

.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
}

.select {
  padding: 0.6rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  font-family: inherit;
  font-size: 0.9rem;
  outline: none;
  cursor: pointer;
}

.number-input {
  display: flex;
  align-items: center;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  overflow: hidden;
}

.num-btn {
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: #f8fafc;
  color: #334155;
  font-size: 1.25rem;
  cursor: pointer;
  transition: background 0.2s;
}

.num-btn:hover {
  background: #f1f5f9;
}

.num-field {
  flex: 1;
  border: none;
  border-left: 1px solid #e2e8f0;
  border-right: 1px solid #e2e8f0;
  padding: 0.6rem;
  text-align: center;
  font-family: inherit;
  font-size: 0.9rem;
  outline: none;
}

.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.toggle-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #0f172a;
}

.toggle {
  width: 3rem;
  height: 1.75rem;
  border-radius: 999px;
  border: none;
  background: #cbd5e1;
  position: relative;
  cursor: pointer;
  transition: background 0.2s;
}

.toggle--on {
  background: #1e40af;
}

.toggle__thumb {
  position: absolute;
  top: 0.25rem;
  left: 0.25rem;
  width: 1.25rem;
  height: 1.25rem;
  background: white;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s;
}

.toggle--on .toggle__thumb {
  transform: translateX(1.25rem);
}

.generate-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.85rem;
  background: #1e40af;
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-family: inherit;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(30, 64, 175, 0.3);
}

.generate-btn:hover:not(:disabled) {
  background: #1e30a8;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(30, 64, 175, 0.4);
}

.generate-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Right Panel */
.right-panel {
  min-height: 500px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.empty-icon {
  color: #cbd5e1;
  margin-bottom: 1rem;
}

.empty-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #334155;
  margin: 0 0 0.5rem;
}

.empty-desc {
  font-size: 0.9rem;
  color: #64748b;
  margin: 0;
  max-width: 32rem;
}

.results {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.results-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.badge {
  display: inline-flex;
  padding: 0.35rem 0.75rem;
  background: #1e40af;
  color: white;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 600;
}

.actions {
  display: flex;
  gap: 0.75rem;
}

.secondary-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.6rem 1.25rem;
  background: white;
  color: #1e40af;
  border: 2px solid #1e40af;
  border-radius: 0.5rem;
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.secondary-btn:hover {
  background: #dbeafe;
}

.primary-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.6rem 1.25rem;
  background: #1e40af;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.primary-btn:hover {
  background: #1e30a8;
}

.groups-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.25rem;
}

.group-card {
  border-radius: 1rem;
  padding: 1.25rem;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.group-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.group-card__name {
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0;
}

.group-card__count {
  font-size: 0.75rem;
  background: rgba(255, 255, 255, 0.25);
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-weight: 600;
}

.group-card__list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.student-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.student-avatar {
  width: 2.25rem;
  height: 2.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.25);
  border-radius: 50%;
  font-size: 0.75rem;
  font-weight: 700;
  flex-shrink: 0;
}

.student-name {
  font-size: 0.9rem;
  font-weight: 500;
}

.text-sm {
  font-size: 0.875rem;
}

.text-slate-500 {
  color: #64748b;
}

.ml-3 {
  margin-left: 0.75rem;
}

@media (max-width: 1024px) {
  .layout {
    grid-template-columns: 1fr;
  }

  .left-panel {
    order: 2;
  }

  .right-panel {
    order: 1;
  }
}

@media (max-width: 640px) {
  .header__inner {
    padding: 1rem;
    flex-wrap: wrap;
  }

  .header__title {
    font-size: 1.25rem;
  }

  .main {
    padding: 1rem;
  }

  .results-header {
    flex-direction: column;
    gap: 0.75rem;
    align-items: stretch;
  }

  .actions {
    width: 100%;
  }

  .secondary-btn, .primary-btn {
    flex: 1;
  }

  .groups-grid {
    grid-template-columns: 1fr;
  }
}
</style>