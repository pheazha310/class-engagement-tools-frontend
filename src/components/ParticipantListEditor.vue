<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Participant } from '@/types/wheel'

const props = defineProps<{
  participants: Participant[]
}>()

const emit = defineEmits<{
  'update:participants': [value: Participant[]]
}>()

const newName = ref('')
const importError = ref<string | null>(null)
const duplicateWarning = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

const trimmedName = computed(() => newName.value.trim())

function generateId(): string | number {
  return Date.now() + Math.random()
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

    <div v-if="duplicateWarning" class="warning">
      {{ duplicateWarning }}
    </div>
    <div v-if="importError" class="error">
      {{ importError }}
    </div>

    <div class="preview">
      <div class="preview-header">
        <span class="preview-title">Participants</span>
        <span class="preview-count">{{ participants.length }}</span>
      </div>

      <ul v-if="participants.length" class="participant-list">
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
  background: #141428;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
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
  border: 2px solid #2a2a45;
  background: #0f0f1e;
  color: #f5f5f5;
  font-size: 15px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  min-height: 44px;
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
  background: linear-gradient(135deg, #4ecdc4, #2fa89e);
  color: #0f172a;
  font-weight: 800;
  box-shadow: 0 4px 12px rgba(78, 205, 196, 0.4);
  letter-spacing: 0.02em;
}

.btn-add:hover:not(:disabled) {
  background: linear-gradient(135deg, #5de0d7, #36b8ad);
  box-shadow: 0 6px 18px rgba(78, 205, 196, 0.5);
}

.btn-import {
  background: linear-gradient(135deg, #45b7d1, #2d8aac);
  color: #0f172a;
  font-weight: 800;
  box-shadow: 0 4px 12px rgba(69, 183, 209, 0.4);
  letter-spacing: 0.02em;
}

.btn-import:hover:not(:disabled) {
  background: linear-gradient(135deg, #56c8df, #379cbf);
  box-shadow: 0 6px 18px rgba(69, 183, 209, 0.5);
}

.file-input {
  display: none;
}

.warning {
  color: #f39c12;
  font-size: 13px;
  line-height: 1.4;
}

.error {
  color: #e74c3c;
  font-size: 13px;
  line-height: 1.4;
}

.preview {
  border-top: 1px solid #2a2a45;
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
  color: #ddd;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.preview-count {
  background: #1f1f38;
  color: #4ecdc4;
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
  max-height: 260px;
  overflow-y: auto;
}

.participant-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  background: #1a1a2e;
  border-radius: 12px;
  border: 1px solid #2a2a45;
  transition: background 0.2s, border-color 0.2s;
}

.participant-list li:hover {
  background: #22223a;
  border-color: #3a3a5a;
}

.participant-name {
  color: #f5f5f5;
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
  border: 1px solid #ff6b6b44;
  background: #2a1010;
  color: #ff6b6b;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-remove:hover {
  background: #ff6b6b22;
  color: #ff4c4c;
  border-color: #ff6b6b;
  box-shadow: 0 0 10px rgba(255, 107, 107, 0.3);
}

.empty {
  color: #9999bb;
  font-size: 14px;
  margin: 0;
  text-align: center;
  padding: 20px 0;
}
</style>
