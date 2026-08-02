<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Participant } from '@/types/wheel'

const props = defineProps<{
  participants: Participant[]
  futureListTitle?: string
}>()

const emit = defineEmits<{
  'update:participants': [value: Participant[]]
}>()

const newName = ref('')
const bulkNames = ref('')
const importError = ref<string | null>(null)
const duplicateWarning = ref<string | null>(null)
const bulkDuplicateWarning = ref<string | null>(null)
const bulkSuccess = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const futureListTitle = ref(props.futureListTitle ?? 'Future List')

const trimmedName = computed(() => newName.value.trim())

function generateId(): string | number {
  return Date.now() + Math.random()
}

function parseNames(raw: string): string[] {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split(/[\n,;]+/)
    .map((name) => name.trim())
    .filter((name) => name.length > 0)
}

function addParticipant(name: string) {
  const trimmed = name.trim()
  if (!trimmed) return

  const existing = props.participants.find(
    (p) => p.name.toLowerCase() === trimmed.toLowerCase(),
  )

  if (existing) {
    duplicateWarning.value = `"${trimmed}" is already in the list.`
    return
  }

  duplicateWarning.value = null
  const next = [...props.participants, { id: generateId(), name: trimmed }]
  emit('update:participants', next)
}

function handleAdd() {
  if (!trimmedName.value) return
  addParticipant(trimmedName.value)
  newName.value = ''
}

function handleBulkAdd() {
  const names = parseNames(bulkNames.value)
  if (names.length === 0) return

  const existingNames = new Set(
    props.participants.map((p) => p.name.toLowerCase()),
  )

  const newParticipants: Participant[] = []
  const duplicates: string[] = []

  for (const name of names) {
    const trimmed = name.trim()
    if (!trimmed) continue

    if (existingNames.has(trimmed.toLowerCase())) {
      duplicates.push(trimmed)
      continue
    }

    newParticipants.push({ id: generateId(), name: trimmed })
    existingNames.add(trimmed.toLowerCase())
  }

  if (duplicates.length > 0) {
    bulkDuplicateWarning.value = `Skipped duplicates: ${duplicates.slice(0, 5).join(', ')}${duplicates.length > 5 ? '...' : ''}`
  } else {
    bulkDuplicateWarning.value = null
  }

  if (newParticipants.length > 0) {
    emit('update:participants', [...props.participants, ...newParticipants])
    bulkSuccess.value = `Added ${newParticipants.length} participant${newParticipants.length === 1 ? '' : 's'}`
    bulkNames.value = ''
    setTimeout(() => {
      bulkSuccess.value = null
    }, 2000)
  }
}

function handleRemove(participant: Participant) {
  emit(
    'update:participants',
    props.participants.filter((p) => p.id !== participant.id),
  )
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    event.preventDefault()
    handleAdd()
  }
}

function triggerImport() {
  if (fileInput.value) {
    fileInput.value.value = ''
  }
  fileInput.value?.click()
}

function parseImportedText(text: string): string[] {
  const entries = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split(/[\n,]/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  const unique: string[] = []
  const seen = new Set<string>()
  for (const name of entries) {
    const lowered = name.toLowerCase()
    if (!seen.has(lowered)) {
      seen.add(lowered)
      unique.push(name)
    }
  }

  return unique
}

async function handleFileChange(event: Event) {
  importError.value = null
  duplicateWarning.value = null

  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const allowed = [
    'text/plain',
    'text/csv',
    'application/vnd.ms-excel',
    'application/json',
  ]
  if (!allowed.includes(file.type) && !file.name.match(/\.(txt|csv|json)$/i)) {
    importError.value = 'Unsupported file format. Use .txt or .csv'
    return
  }

  try {
    const text = await file.text()
    const names = parseImportedText(text)

    if (names.length === 0) {
      importError.value = 'No valid names found in file'
      return
    }

    const existingNames = new Set(
      props.participants.map((p) => p.name.toLowerCase()),
    )
    const duplicates = names.filter((n) => existingNames.has(n.toLowerCase()))

    if (duplicates.length > 0) {
      duplicateWarning.value = `Skipped duplicate: ${duplicates.slice(0, 5).join(', ')}${duplicates.length > 5 ? '...' : ''}`
    }

    const newParticipants = names
      .filter((n) => !existingNames.has(n.toLowerCase()))
      .map((name) => ({ id: generateId(), name }))

    if (newParticipants.length > 0) {
      emit('update:participants', [...props.participants, ...newParticipants])
    }
  } catch {
    importError.value = 'Failed to read file'
  }
}
</script>

<template>
  <div class="editor">
    <div class="add-row">
      <input
        v-model="newName"
        type="text"
        placeholder="Enter participant name"
        @keydown="handleKeydown"
      />
      <button class="btn btn-add" @click="handleAdd">Add</button>
      <button class="btn btn-import" @click="triggerImport">Import</button>
      <input
        ref="fileInput"
        type="file"
        accept=".txt,.csv,.json"
        class="file-input"
        @change="handleFileChange"
      />
    </div>

    <div class="bulk-row">
      <textarea
        v-model="bulkNames"
        class="bulk-input"
        placeholder="Paste multiple names here...&#10;Ali&#10;Bob&#10;Charlie"
        rows="4"
      />
      <button class="btn btn-bulk" @click="handleBulkAdd" :disabled="!bulkNames.trim()">
        Add All
      </button>
    </div>

    <div v-if="bulkSuccess" class="success">
      {{ bulkSuccess }}
    </div>
    <div v-if="bulkDuplicateWarning" class="warning">
      {{ bulkDuplicateWarning }}
    </div>
    <div v-if="duplicateWarning" class="warning">
      {{ duplicateWarning }}
    </div>
    <div v-if="importError" class="error">
      {{ importError }}
    </div>

    <div class="preview">
      <div v-if="participants.length" class="lists-row">
        <div class="list-panel">
          <div class="preview-header">
            <input
              v-model="futureListTitle"
              class="list-title-input"
              type="text"
              aria-label="Future list name"
            />
            <span class="preview-count">{{ participants.length }}</span>
          </div>
          <ul class="participant-list">
            <li v-for="participant in participants" :key="participant.id">
              <span class="participant-name">{{ participant.name }}</span>
              <button
                class="btn-remove"
                type="button"
                aria-label="Remove participant"
                @click="handleRemove(participant)"
              >
                ×
              </button>
            </li>
          </ul>
        </div>
      </div>
      <p v-else class="empty">No participants yet. Add names above or import a file.</p>
    </div>
  </div>
</template>

<style scoped>
.editor {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 420px;
  margin: 0 auto;
  padding: 20px;
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
}

.add-row {
  display: flex;
  gap: 10px;
  padding-bottom: 4px;
}

.add-row input[type='text'] {
  flex: 1;
  padding: 12px 14px;
  border-radius: 10px;
  border: 2px solid #cbd5e1;
  background: #ffffff;
  color: #1e293b;
  font-size: 15px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  min-height: 44px;
}

.add-row input[type='text']:focus {
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.12);
}

.bulk-row {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.bulk-input {
  flex: 1;
  padding: 12px 14px;
  border-radius: 10px;
  border: 2px solid #cbd5e1;
  background: #ffffff;
  color: #1e293b;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  min-height: 80px;
  resize: vertical;
  font-family: inherit;
}

.bulk-input:focus {
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.12);
}

.bulk-input::placeholder {
  color: #6b7280;
}

.bulk-input::placeholder {
  color: #94a3b8;
}

.btn {
  padding: 12px 20px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  color: #fff;
  transition: transform 0.15s, box-shadow 0.15s;
  min-height: 44px;
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
}

.btn:active:not(:disabled) {
  transform: translateY(0);
}

.btn-add {
  background: #4f46e5;
  color: #fff;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.25);
}

.btn-add:hover:not(:disabled) {
  background: #4338ca;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.35);
}

.btn-import {
  background: #6366f1;
  color: #fff;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.25);
}

.btn-import:hover:not(:disabled) {
  background: #4f46e5;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);
}

.btn-bulk {
  background: #4f46e5;
  color: #fff;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.25);
  white-space: nowrap;
}

.btn-bulk:hover:not(:disabled) {
  background: #4338ca;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.35);
}

.btn-bulk:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.file-input {
  display: none;
}

.warning {
  color: #c2950b;
  font-size: 13px;
  line-height: 1.4;
}

.success {
  color: #0e7c5e;
  font-size: 13px;
  line-height: 1.4;
}

.error {
  color: #c0392b;
  font-size: 13px;
  line-height: 1.4;
}

.preview {
  border-top: 1px solid #e2e8f0;
  padding-top: 14px;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.preview-title {
  font-size: 14px;
  font-weight: 700;
  color: #334155;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.preview-count {
  background: #eef2ff;
  color: #4f46e5;
  font-size: 12px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 999px;
}

.participant-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 320px;
  overflow-y: auto;
}

.participant-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  transition: background 0.2s, border-color 0.2s;
}

.participant-list li:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.participant-name {
  color: #1e293b;
  font-size: 14px;
  font-weight: 600;
  word-break: break-word;
}

.btn-remove {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: 1px solid #fecaca;
  background: #fef2f2;
  color: #dc2626;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-remove:hover {
  background: #fee2e2;
  color: #b91c1c;
  border-color: #fca5a5;
  box-shadow: 0 0 8px rgba(220, 38, 38, 0.2);
}

.empty {
  color: #94a3b8;
  font-size: 14px;
  margin: 0;
  text-align: center;
  padding: 20px 0;
}

.lists-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}

.list-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.list-title-input {
  background: transparent;
  border: none;
  color: #334155;
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  outline: none;
  padding: 0;
  width: auto;
  max-width: 180px;
  cursor: text;
}

.list-title-input:focus {
  border-bottom: 1px solid #4f46e5;
}
</style>
