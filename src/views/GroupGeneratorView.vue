<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { Student, Group, GenerationMethod } from '@/types/groupGenerator'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'

// Close dropdown when clicking outside
function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (!target.closest('.dropdown')) {
    showDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// State
const students = ref<Student[]>([])
const method = ref<GenerationMethod>('random')
const target = ref<'groups' | 'size'>('groups')
const quantity = ref(3)
const generateTeamNames = ref(true)
const generatedGroups = ref<Group[]>([])
const isGenerating = ref(false)
const showConfigModal = ref(false)

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
const showDropdown = ref(false)

const studentText = computed({
  get: () => {
    return students.value.map(s => {
      // If gender is defined, show it with the name
      if (s.gender) {
        return `${s.name} (${s.gender})`
      }
      return s.name
    }).join('\n')
  },
  set: (val) => {
    const lines = val.split('\n').filter(n => n.trim())
    students.value = lines.map((line, idx) => {
      // Check if line contains gender in parentheses
      const genderMatch = line.match(/\(([^)]+)\)$/)
      let name = line.trim()
      let gender: 'male' | 'female' | 'other' | undefined = undefined
      
      if (genderMatch) {
        name = line.substring(0, genderMatch.index!).trim()
        const genderValue = genderMatch[1]!.toLowerCase().trim()
        if (genderValue === 'male' || genderValue === 'm') {
          gender = 'male'
        } else if (genderValue === 'female' || genderValue === 'f') {
          gender = 'female'
        } else {
          gender = 'other'
        }
      }
      
      return {
        id: `student-${idx}`,
        name: name,
        gender: gender,
      }
    })
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

function getStudentNumber(student: any, index: number): number {
  return index + 1
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
    [arr[i]!, arr[j]!] = [arr[j]!, arr[i]!]
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
      }
    }
    groups[groupIndex].students.push(shuffled[i]!)
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
    showConfigModal.value = false
  }, 300)
}

function regenerate() {
  generateGroups()
}

function clearGroups() {
  generatedGroups.value = []
}

function toggleDropdown() {
  showDropdown.value = !showDropdown.value
}

function closeDropdown() {
  showDropdown.value = false
}

function exportXLSX() {
  if (generatedGroups.value.length === 0) return

  // Prepare data for Excel
  const data: any[] = []

  generatedGroups.value.forEach((group, idx) => {
    // Group header row
    data.push({
      'Group': group.name,
      'Student Name': `(${group.students.length} Students)`,
      'Row': ''
    })

    // Student rows
    group.students.forEach((student, sIdx) => {
      data.push({
        'Group': '',
        'Student Name': student.name,
        'Row': sIdx + 1
      })
    })

    // Add blank row between groups
    if (idx < generatedGroups.value.length - 1) {
      data.push({ 'Group': '', 'Student Name': '', 'Row': '' })
    }
  })

  // Create workbook
  const ws = XLSX.utils.json_to_sheet(data)

  // Set column widths
  ws['!cols'] = [
    { wch: 20 },  // Group column
    { wch: 30 },  // Student Name column
    { wch: 10 }   // Row column
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Groups')

  // Generate Excel file
  XLSX.writeFile(wb, 'groups-export.xlsx')
}

function exportPDF() {
  if (generatedGroups.value.length === 0) return

  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  let yPosition = 20

  // Title
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 64, 175) // #1e40af
  doc.text('Group Generator Export', pageWidth / 2, yPosition, { align: 'center' })

  yPosition += 10

  // Metadata
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 116, 139) // #64748b
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, yPosition)
  yPosition += 6
  doc.text(`Method: ${method.value}`, 20, yPosition)
  yPosition += 6
  doc.text(`Total Groups: ${generatedGroups.value.length}`, 20, yPosition)
  yPosition += 6
  doc.text(`Total Students: ${totalStudents.value}`, 20, yPosition)

  yPosition += 15

  // Groups
  generatedGroups.value.forEach((group, idx) => {
    // Check if we need a new page
    if (yPosition > 250) {
      doc.addPage()
      yPosition = 20
    }

    // Group header with color
    const color = groupCardColors[idx % groupCardColors.length]!
    const rgb = hexToRgb(color)

    doc.setFillColor(rgb.r, rgb.g, rgb.b)
    doc.rect(15, yPosition, pageWidth - 30, 10, 'F')

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(255, 255, 255)
    doc.text(`${group.name} (${group.students.length} Students)`, 20, yPosition + 6.5)

    yPosition += 15

    // Students
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')

    group.students.forEach((student, sIdx) => {
      if (yPosition > 280) {
        doc.addPage()
        yPosition = 20
      }

      // Student number circle
      doc.setFillColor(30, 64, 175)
      doc.circle(22, yPosition - 1, 3, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text(`${sIdx + 1}`, 22, yPosition, { align: 'center' })

      // Student name
      doc.setFontSize(11)
      doc.setTextColor(0, 0, 0)
      doc.setFont('helvetica', 'normal')
      doc.text(student.name, 28, yPosition)

      yPosition += 7
    })

    yPosition += 8 // Space between groups
  })

  // Save the PDF
  doc.save('groups-export.pdf')
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1]!, 16),
    g: parseInt(result[2]!, 16),
    b: parseInt(result[3]!, 16)
  } : { r: 0, g: 0, b: 0 }
}

function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  processFile(file)
}

function handleDragOver(e: DragEvent) {
  e.preventDefault()
}

function handleDrop(e: DragEvent) {
  e.preventDefault()
  const file = e.dataTransfer?.files[0]
  if (!file) return

  processFile(file)
}

function processFile(file: File) {
  const fileExtension = file.name.split('.').pop()?.toLowerCase()
  
  if (fileExtension === 'xlsx' || fileExtension === 'xls') {
    // Handle Excel files
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]!]!
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][]
        
        // Process each row - look for Name and Gender columns
        const processedStudents: Student[] = []
        
        jsonData.forEach((row, idx) => {
          // Skip empty rows
          if (!row || row.length === 0) return
          
          // Try to find name and gender from the row
          // Common column order: No., Name, Gender or ID, Name, Gender
          let name = ''
          let gender: 'male' | 'female' | 'other' | undefined = undefined
          
          // Look for non-empty values
          const values = row.filter(cell => cell !== undefined && cell !== null && String(cell).trim() !== '')
          
          if (values.length >= 2) {
            // If we have at least 2 columns, assume second is name, third might be gender
            name = String(values[1] || values[0]).trim()
            
            // Check if there's a gender value (usually "Male" or "Female")
            if (values.length >= 3) {
              const genderValue = String(values[2]).toLowerCase().trim()
              if (genderValue === 'male' || genderValue === 'm') {
                gender = 'male'
              } else if (genderValue === 'female' || genderValue === 'f') {
                gender = 'female'
              } else if (genderValue && genderValue !== '') {
                gender = 'other'
              }
            }
          } else if (values.length === 1) {
            // Only one column, assume it's the name
            name = String(values[0]).trim()
          }
          
          if (name) {
            processedStudents.push({
              id: `student-${idx}`,
              name: name,
              gender: gender,
            })
          }
        })
        
        students.value = processedStudents
      } catch (error) {
        console.error('Error reading Excel file:', error)
        alert('Error reading Excel file. Please make sure it\'s a valid Excel file.')
      }
    }
    reader.readAsArrayBuffer(file)
  } else {
    // Handle text files (CSV, TXT)
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
}
</script>

<template>
  <div class="group-generator">
    <!-- Header -->
    <header class="header">
      <div class="header__inner">
        <button class="back-btn" @click="$router.back()">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          <span>Back</span>
        </button>
        <div class="header__content">
          <h1 class="header__title">Group Generator</h1>
          <p class="header__subtitle">Automatically organize students into balanced classroom groups.</p>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="main">

      <!-- Configuration Modal -->
      <div v-if="showConfigModal" class="modal-overlay" @click.self="showConfigModal = false">
        <div class="modal">
          <div class="modal__header">
            <h2 class="modal__title">Configure Groups</h2>
            <button class="modal__close" @click="showConfigModal = false">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div class="modal__body">
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
                  <h3 class="card__title">Student List</h3>
                  <span class="step-badge">STEP 1</span>
                </div>
              </div>

              <div class="form">
                <textarea
                  v-model="studentText"
                  class="textarea"
                  placeholder="Paste student names here, one per line..."
                  rows="5"
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
                  <p class="upload-hint">Supports .csv, .txt, .xlsx files (with columns: ID, Name, Gender)</p>
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
                  <h3 class="card__title">Configuration</h3>
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
                  <div class="field field--grow">
                    <label class="label">Targeting</label>
                    <select v-model="target" class="select">
                      <option value="groups">Number of Groups</option>
                      <option value="size">Group Size</option>
                    </select>
                  </div>

                  <div class="field field--quantity">
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
        </div>
      </div>

      <div class="layout">
        <!-- Right Panel: Results -->
        <div class="right-panel">
          <div v-if="isEmpty" class="welcome-card">
            <div class="welcome-card__content">
              <h3 class="welcome-card__title">Welcome to Group Generator</h3>
              <p class="welcome-card__desc">Automatically organize students into balanced classroom groups. Click the button below to get started.</p>
              <button class="start-btn" @click="showConfigModal = true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Create Group Generator
              </button>
            </div>
          </div>

          <div v-else class="results">
            <div class="results-header">
              <div>
                <span class="badge">Total Groups: {{ totalGroups }}</span>
                <span class="text-sm text-slate-500 ml-3">Created for {{ totalStudents }} students</span>
              </div>
              <div class="actions">
                <button class="secondary-btn" @click="showConfigModal = true" title="Configure">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Configure
                </button>
                <button class="secondary-btn" @click="regenerate">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                    <path d="M21 3v5h-5" />
                  </svg>
                  Regenerate
                </button>
                <button class="secondary-btn secondary-btn--clear" @click="clearGroups">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  Clear
                </button>
                <div class="dropdown">
                  <button class="primary-btn" @click="toggleDropdown">
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
                  <div v-if="showDropdown" class="dropdown-menu">
                    <button @click="exportXLSX" class="dropdown-item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      <span>Export as XLSX (CSV)</span>
                    </button>
                    <button @click="exportPDF" class="dropdown-item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                      </svg>
                      <span>Export as PDF</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="groups-grid">
              <div
                v-for="(group, idx) in generatedGroups"
                :key="group.id"
                class="group-card"
                :style="{ borderColor: groupCardColors[idx % groupCardColors.length] }"
              >
                <div class="group-card__header" :style="{ background: groupCardColors[idx % groupCardColors.length] }">
                  <div class="group-card__title-row">
                    <span class="group-card__number">{{ idx + 1 }}.</span>
                    <input
                      type="text"
                      v-model="group.name"
                      class="group-card__input"
                    />
                  </div>
                </div>

                <div class="group-card__list">
                  <div
                    v-for="(student, sIdx) in group.students"
                    :key="student.id"
                    class="student-item"
                  >
                    <div class="student-avatar">
                      {{ sIdx + 1 }}
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
  padding-top: 0;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-bottom: none;
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  z-index: 40;
  padding: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header__inner {
  max-width: 80rem;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.25rem 2rem;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
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
  white-space: nowrap;
  flex-shrink: 0;
}

.back-btn:hover {
  background: #dbeafe;
  transform: translateX(-2px);
}

.back-btn:active {
  transform: translateX(0);
}

.header__title {
  font-size: 1.875rem;
  font-weight: 800;
  color: white;
  margin: 0;
  line-height: 1.2;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header__subtitle {
  color: rgba(255, 255, 255, 0.95);
  font-size: 0.875rem;
  margin: 0.375rem 0 0;
  font-weight: 400;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
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
  grid-template-columns: 1fr;
  gap: 1.5rem;
  align-items: start;
}

.left-panel {
  display: none;
}

.left-panel::-webkit-scrollbar {
  width: 6px;
}

.left-panel::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.left-panel::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.left-panel::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.card {
  background: white;
  border-radius: 0.75rem;
  padding: 0.6rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
  border: 1px solid #f1f5f9;
}

.step-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.4rem;
}

.step-icon {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #dbeafe;
  border-radius: 0.375rem;
}

.card__title {
  font-size: 0.9rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.step-badge {
  display: block;
  font-size: 0.6rem;
  color: #94a3b8;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.textarea {
  width: 100%;
  padding: 0.4rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  font-family: inherit;
  font-size: 0.85rem;
  resize: none;
  outline: none;
  transition: border-color 0.2s;
}

.textarea:focus {
  border-color: #1e40af;
}

.hint {
  font-size: 0.65rem;
  color: #94a3b8;
}

.upload-zone {
  border: 2px dashed #cbd5e1;
  border-radius: 0.5rem;
  padding: 0.5rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.upload-zone:hover {
  border-color: #1e40af;
  background: #f8fafc;
}

.upload-icon {
  margin-bottom: 0.3rem;
  color: #64748b;
}

.upload-text {
  font-size: 0.75rem;
  color: #334155;
  margin: 0;
  line-height: 1.4;
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
  font-size: 0.65rem;
  color: #94a3b8;
  margin: 0.1rem 0 0;
}

.label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 0.4rem;
}

.config {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
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
  gap: 0.3rem;
  padding: 0.6rem 0.4rem;
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
  font-size: 0.75rem;
  font-weight: 600;
}

.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.field {
  display: flex;
  flex-direction: column;
}

.field--grow {
  flex: 1;
}

.field--quantity {
  width: 140px;
  flex-shrink: 0;
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
  background: white;
  transition: border-color 0.2s;
}

.number-input:focus-within {
  border-color: #1e40af;
  box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.1);
}

.num-btn {
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: #f8fafc;
  color: #1e40af;
  font-size: 1.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
}

.num-btn:hover {
  background: #dbeafe;
  color: #1e30a8;
}

.num-btn:active {
  background: #1e40af;
  color: white;
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
  font-weight: 600;
  color: #0f172a;
  outline: none;
  background: white;
  min-width: 3rem;
}

.num-field::-webkit-inner-spin-button,
.num-field::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.num-field[type="number"] {
  -moz-appearance: textfield;
}

.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.3rem 0;
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
  padding: 0.65rem;
  background: #1e40af;
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(30, 64, 175, 0.3);
  margin-top: 0.4rem;
}

.generate-btn:hover:not(:disabled) {
  background: #1e30a8;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(30, 64, 175, 0.4);
}

.generate-btn:active:not(:disabled) {
  transform: translateY(0);
}

.generate-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Right Panel */
.right-panel {
  min-height: calc(100vh - 106px);
  max-height: calc(100vh - 106px);
  overflow-y: auto;
  position: sticky;
  top: 86px;
  padding-right: 0.5rem;
}

.right-panel::-webkit-scrollbar {
  width: 8px;
}

.right-panel::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.right-panel::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.right-panel::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  min-height: 400px;
}

.empty-icon {
  color: #cbd5e1;
  margin-bottom: 1.25rem;
}

.empty-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.75rem;
}

.empty-desc {
  font-size: 0.95rem;
  color: #64748b;
  margin: 0 0 1.5rem;
  max-width: 32rem;
}

.start-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-family: inherit;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.start-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.5);
}

.start-btn:active {
  transform: translateY(0);
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
  padding: 1.5rem;
  background: white;
  border-radius: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 10;
  border: 2px solid #e2e8f0;
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

.secondary-btn--clear:hover {
  background: #fef2f2;
  border-color: #dc2626;
  color: #dc2626;
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

/* Dropdown */
.dropdown {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  border: 1px solid #e2e8f0;
  min-width: 220px;
  z-index: 100;
  overflow: hidden;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem 1rem;
  background: white;
  color: #1e40af;
  border: none;
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.dropdown-item:hover {
  background: #dbeafe;
}

.dropdown-item svg {
  flex-shrink: 0;
}

.groups-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.25rem;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
  overflow-y: auto;
}

.modal {
  background: #f5f3ff;
  border-radius: 1rem;
  max-width: 700px;
  width: 100%;
  max-height: 95vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  background: white;
  border-radius: 1rem 1rem 0 0;
  position: sticky;
  top: 0;
  z-index: 10;
}

.modal__title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.modal__close {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
  border: none;
  border-radius: 0.375rem;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
}

.modal__close:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.modal__body {
  padding: 0.75rem;
}

/* Welcome Card */
.welcome-card {
  background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
  border: 2px dashed #cbd5e1;
  border-radius: 1rem;
  padding: 3rem 2rem;
  text-align: center;
  min-height: calc(100vh - 106px - 4rem);
  display: flex;
  align-items: center;
  justify-content: center;
}

.welcome-card__content {
  max-width: 32rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.welcome-card__title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.welcome-card__desc {
  font-size: 0.95rem;
  color: #64748b;
  margin: 0;
  line-height: 1.5;
}

.group-card {
  border-radius: 1rem;
  border: 3px solid;
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.group-card__header {
  display: flex;
  align-items: center;
  padding: 1rem 1.25rem;
  color: white;
}

.group-card__title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.group-card__title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.group-card__number {
  font-size: 1.1rem;
  font-weight: 700;
  color: white;
  opacity: 0.9;
  flex-shrink: 0;
}

.group-card__input {
  font-size: 1.1rem;
  font-weight: 700;
  color: white;
  border: none;
  border-bottom: 2px solid rgba(255, 255, 255, 0.3);
  background: transparent;
  padding: 0.25rem 0;
  flex: 1;
  outline: none;
  transition: border-color 0.2s;
  min-width: 0;
}

.group-card__input:focus {
  border-bottom-color: white;
}

.group-card__input::placeholder {
  color: rgba(255, 255, 255, 0.6);
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
