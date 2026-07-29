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
  gap: 14px;
  width: 100%;
  max-width: 420px;
  margin: 0 auto;
  padding: 22px;
  background: linear-gradient(135deg, #141428 0%, #1a1a3e 100%);
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255,255,255,0.06);
}

.add-row {
  display: flex;
  gap: 10px;
  padding-bottom: 4px;
}

.add-row input[type='text'] {
  flex: 1;
  padding: 12px 16px;
  border-radius: 12px;
  border: 2px solid rgba(255,255,255,0.08);
  background: rgba(15, 15, 30, 0.8);
  color: #f5f5f5;
  font-size: 15px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
  min-height: 46px;
  font-family: inherit;
  backdrop-filter: blur(8px);
}

.add-row input[type='text']:focus {
  border-color: rgba(78, 205, 196, 0.5);
  background: rgba(15, 15, 30, 1);
  box-shadow: 0 0 0 3px rgba(78, 205, 196, 0.15);
}

.add-row input[type='text']::placeholder {
  color: #6b7280;
}

.bulk-row {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.bulk-input {
  flex: 1;
  padding: 12px 16px;
  border-radius: 12px;
  border: 2px solid rgba(255,255,255,0.08);
  background: rgba(15, 15, 30, 0.8);
  color: #f5f5f5;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
  min-height: 80px;
  resize: vertical;
  font-family: inherit;
  backdrop-filter: blur(8px);
}

.bulk-input:focus {
  border-color: rgba(78, 205, 196, 0.5);
  background: rgba(15, 15, 30, 1);
  box-shadow: 0 0 0 3px rgba(78, 205, 196, 0.15);
}

.bulk-input::placeholder {
  color: #6b7280;
}

.btn {
  padding: 12px 20px;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  color: #0f172a;
  transition: transform 0.15s cubic-bezier(.4,0,.2,1), box-shadow 0.15s;
  min-height: 46px;
  font-family: inherit;
  white-space: nowrap;
}

.btn:hover:not(:disabled) {
  transform: translateY(-2px);
}

.btn:active:not(:disabled) {
  transform: translateY(0);
}

.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
}

.btn-add {
  background: linear-gradient(135deg, #4ecdc4, #2fa89e);
  box-shadow: 0 4px 16px rgba(78, 205, 196, 0.35);
  letter-spacing: 0.02em;
}

.btn-add:hover:not(:disabled) {
  box-shadow: 0 8px 24px rgba(78, 205, 196, 0.45);
}

.btn-import {
  background: linear-gradient(135deg, #45b7d1, #2d8aac);
  box-shadow: 0 4px 16px rgba(69, 183, 209, 0.35);
  letter-spacing: 0.02em;
}

.btn-import:hover:not(:disabled) {
  box-shadow: 0 8px 24px rgba(69, 183, 209, 0.45);
}

.btn-bulk {
  background: linear-gradient(135deg, #f39c12, #d68910);
  box-shadow: 0 4px 16px rgba(243, 156, 18, 0.35);
  letter-spacing: 0.02em;
}

.btn-bulk:hover:not(:disabled) {
  box-shadow: 0 8px 24px rgba(243, 156, 18, 0.45);
}

.file-input {
  display: none;
}

.warning {
  color: #fbbf24;
  font-size: 12px;
  line-height: 1.4;
  padding: 8px 12px;
  background: rgba(251, 191, 36, 0.08);
  border-radius: 8px;
  border: 1px solid rgba(251, 191, 36, 0.15);
}

.success {
  color: #4ecdc4;
  font-size: 12px;
  line-height: 1.4;
  padding: 8px 12px;
  background: rgba(78, 205, 196, 0.08);
  border-radius: 8px;
  border: 1px solid rgba(78, 205, 196, 0.15);
}

.error {
  color: #f87171;
  font-size: 12px;
  line-height: 1.4;
  padding: 8px 12px;
  background: rgba(248, 113, 113, 0.08);
  border-radius: 8px;
  border: 1px solid rgba(248, 113, 113, 0.15);
}

.preview {
  border-top: 1px solid rgba(255,255,255,0.08);
  padding-top: 16px;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.preview-title {
  font-size: 13px;
  font-weight: 700;
  color: #bbb;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.preview-count {
  background: rgba(78, 205, 196, 0.12);
  color: #4ecdc4;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 999px;
  border: 1px solid rgba(78, 205, 196, 0.2);
}

.participant-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 320px;
  overflow-y: auto;
}

.participant-list::-webkit-scrollbar { width: 4px; }
.participant-list::-webkit-scrollbar-track { background: transparent; }
.participant-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 999px; }

.participant-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  background: rgba(255,255,255,0.03);
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.06);
  transition: background 0.2s, border-color 0.2s, transform 0.15s;
  animation: participant-in 0.3s ease-out both;
}

@keyframes participant-in {
  from { opacity: 0; transform: translateX(-8px); }
  to { opacity: 1; transform: translateX(0); }
}

.participant-list li:hover {
  background: rgba(255,255,255,0.06);
  border-color: rgba(255,255,255,0.12);
}

.participant-name {
  color: #e0e0e0;
  font-size: 14px;
  font-weight: 500;
  word-break: break-word;
}

.btn-remove {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: 1px solid rgba(255, 107, 107, 0.2);
  background: rgba(255, 50, 50, 0.08);
  color: #ff6b6b;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.btn-remove:hover {
  background: rgba(255, 107, 107, 0.18);
  color: #ff4c4c;
  border-color: rgba(255, 107, 107, 0.4);
  box-shadow: 0 0 12px rgba(255, 107, 107, 0.2);
  transform: scale(1.1);
}

.empty {
  color: #7777aa;
  font-size: 13px;
  margin: 0;
  text-align: center;
  padding: 24px 0;
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
  color: #ccc;
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  outline: none;
  padding: 0;
  width: auto;
  max-width: 180px;
  cursor: text;
  font-family: inherit;
}

.list-title-input:focus {
  border-bottom: 1px solid rgba(78, 205, 196, 0.5);
}
</style>
