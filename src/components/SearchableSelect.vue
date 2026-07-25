<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'

const props = defineProps<{
  modelValue: any
  options: Record<string, any>[]
  label: string
  valueKey?: string
  labelKey?: string
  placeholder?: string
  loading?: boolean
  error?: string
  disabled?: boolean
  iconPath?: string
  searchPlaceholder?: string
  allowCreate?: boolean
  createLabel?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: any]
  change: [value: any]
  create: [value: string]
}>()

const triggerRef = ref<HTMLInputElement | null>(null)
const dropdownRef = ref<HTMLDivElement | null>(null)
const open = ref(false)
const activeIndex = ref(0)
const search = ref('')

const valueKey = computed(() => props.valueKey || 'id')
const labelKey = computed(() => props.labelKey || 'name')

watch(
  () => props.options,
  () => {
    activeIndex.value = 0
  },
)

watch(
  () => props.modelValue,
  () => {
    if (!open.value) search.value = ''
  },
)

const filteredOptions = computed(() => {
  if (!search.value) return props.options
  const q = search.value.toLowerCase()
  return props.options.filter((o) => {
    const label = o[labelKey.value]
    return typeof label === 'string' && label.toLowerCase().includes(q)
  })
})

const selectedLabel = computed(() => {
  if (!props.modelValue && props.modelValue !== 0) return ''
  const option = props.options.find((o) => o[valueKey.value] === props.modelValue)
  return option?.[labelKey.value] ?? ''
})

const showCreate = computed(() => {
  if (!props.allowCreate) return false
  if (props.modelValue && selectedLabel.value) return false
  const q = search.value.trim()
  if (q && filteredOptions.value.length === 0) return true
  if (!q && filteredOptions.value.length === 0) return true
  return false
})

const createLabelText = computed(() => {
  const raw = props.createLabel || ''
  if (raw) return raw
  const q = search.value.trim()
  return q ? `Add "${q}"` : 'Add new school'
})

function openDropdown() {
  if (props.disabled || props.loading) return
  if (!open.value) {
    search.value = selectedLabel.value
    open.value = true
    activeIndex.value = 0
    nextTick(() => triggerRef.value?.focus())
  } else {
    close()
  }
}

function select(option: Record<string, any>) {
  const value = option[valueKey.value]
  search.value = option[labelKey.value] ?? ''
  emit('update:modelValue', value)
  emit('change', value)
  close()
  triggerRef.value?.focus()
}

function createNew() {
  emit('create', search.value.trim())
  close()
  triggerRef.value?.focus()
}

function close() {
  open.value = false
  activeIndex.value = 0
  if (!props.modelValue && props.modelValue !== 0 && search.value) {
    search.value = ''
  }
}

function onTriggerFocus() {
  if (props.disabled || props.loading) return
  if (!open.value) {
    search.value = selectedLabel.value
    open.value = true
    activeIndex.value = 0
  }
}

function handlePointerDown(event: PointerEvent) {
  if (open.value && event.target instanceof HTMLElement && event.target.closest('.searchable-select__dropdown')) {
    event.preventDefault()
  }
}

function onTriggerBlur(event: FocusEvent) {
  if (open.value && event.relatedTarget instanceof Node) {
    const related = event.relatedTarget as Node
    const isInside =
      related.closest('.searchable-select__dropdown') ||
      related.closest('.searchable-select__wrap')
    if (isInside) {
      return
    }
  }
  close()
  search.value = selectedLabel.value
}

function onTriggerKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    if (!open.value) openDropdown()
    else {
      activeIndex.value = Math.min(activeIndex.value + 1, filteredOptions.value.length - 1)
      scrollToActive()
    }
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    activeIndex.value = Math.max(activeIndex.value - 1, 0)
    scrollToActive()
  } else if (event.key === 'Enter') {
    event.preventDefault()
    if (open.value && filteredOptions.value[activeIndex.value]) {
      select(filteredOptions.value[activeIndex.value])
    } else if (!open.value) {
      openDropdown()
    }
  } else if (event.key === 'Escape') {
    event.preventDefault()
    close()
  }
}

function onSearchInput(event: Event) {
  const target = event.target as HTMLInputElement
  search.value = target.value
  if (!open.value) {
    open.value = true
  }
  activeIndex.value = 0
}

function scrollToActive() {
  nextTick(() => {
    const activeEl = document.querySelector('.searchable-select__option.is-focused')
    activeEl?.scrollIntoView({ block: 'nearest' })
  })
}

function onClickOutside(e: MouseEvent) {
  if (!(e.target instanceof Node)) return
  const isInside = e.target.closest('.searchable-select__wrap')
  if (!isInside && open.value) {
    close()
  }
}

watch(open, (newOpen) => {
  if (newOpen) {
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('click', onClickOutside)
  } else {
    document.removeEventListener('pointerdown', handlePointerDown)
    document.removeEventListener('click', onClickOutside)
  }
})
</script>

<template>
  <div class="form-group searchable-select">
    <span class="form-label">{{ label }}</span>
    <div
      ref="dropdownRef"
      class="searchable-select__wrap"
      :class="{
        'is-open': open,
        'has-error': !!error,
        'is-disabled': disabled,
        'is-active': !!selectedLabel && !open,
      }"
    >
      <div class="searchable-select__trigger-wrap">
        <svg v-if="!loading" class="searchable-select__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <slot name="icon">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" x2="16.65" y1="21" y2="16.65" />
          </slot>
        </svg>
        <input
          ref="triggerRef"
          type="text"
          class="searchable-select__input"
          :disabled="disabled"
          :placeholder="placeholder || `Select ${label.toLowerCase()}`"
          :value="open ? search : (selectedLabel || '')"
          @focus="onTriggerFocus"
          @blur="onTriggerBlur"
          @keydown="onTriggerKeydown"
          @input="onSearchInput"
        />
        <span v-if="loading" class="searchable-select__loading">
          <svg class="input-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <circle cx="12" cy="12" r="10" stroke-dasharray="31.4 31.4" stroke-linecap="round" />
          </svg>
        </span>
        <svg class="searchable-select__chevron" :class="{ 'is-open': open }" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      <Transition name="searchable-select">
        <div v-if="open" class="searchable-select__dropdown">
          <div class="searchable-select__options">
            <div v-if="loading" class="searchable-select__empty">
              <svg class="searchable-select__spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <circle cx="12" cy="12" r="10" stroke-dasharray="31.4 31.4" stroke-linecap="round" />
              </svg>
              <span>Loading...</span>
            </div>
            <button
              v-for="(option, index) in filteredOptions"
              v-else
              :key="String(option[valueKey])"
              type="button"
              class="searchable-select__option"
              :class="{
                'is-active': modelValue === option[valueKey],
                'is-focused': index === activeIndex,
              }"
              @mousedown.prevent
              @click="select(option)"
              @mouseenter="activeIndex = index"
            >
              <span class="searchable-select__icon" v-if="modelValue === option[valueKey]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              <span class="searchable-select__dot" v-else />
              {{ option[labelKey] }}
            </button>
            <button
              v-if="showCreate"
              type="button"
              class="searchable-select__option searchable-select__create"
              @click="createNew"
              @mouseenter="activeIndex = 0"
            >
              <span class="searchable-select__create-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </span>
              {{ createLabelText }}
            </button>
            <div v-if="!loading && filteredOptions.length === 0 && !showCreate" class="searchable-select__empty">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span>No results found</span>
            </div>
          </div>
        </div>
      </Transition>
    </div>
    <p v-if="error" class="field-error">{{ error }}</p>
  </div>
</template>

<style scoped>
.searchable-select__wrap {
  position: relative;
}

.searchable-select__trigger-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.searchable-select__icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  pointer-events: none;
  z-index: 1;
  transition: color 0.2s ease;
}

.searchable-select__wrap.is-open .searchable-select__icon {
  color: var(--auth-primary);
}

.searchable-select__input {
  width: 100%;
  min-height: 50px;
  padding: 0 44px 0 44px;
  border: 1.5px solid var(--auth-border);
  border-radius: 13px;
  background: var(--auth-surface-soft);
  color: var(--auth-text);
  font: inherit;
  font-size: 14px;
  transition: border-color 0.2s ease, box-shadow 0.25s ease, background-color 0.2s ease;
  cursor: pointer;
}

.searchable-select__input::placeholder {
  color: #94a3b8;
}

.searchable-select__input:focus {
  border-color: var(--auth-primary);
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
  background: #ffffff;
  outline: none;
  cursor: text;
}

.searchable-select__input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: #f1f5f9;
  color: #94a3b8;
}

.searchable-select__wrap.is-open .searchable-select__input {
  border-color: var(--auth-primary);
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
  background: #ffffff;
  cursor: text;
}

.searchable-select__loading {
  position: absolute;
  right: 38px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  animation: auth-spin 0.9s linear infinite;
}

.searchable-select__chevron {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  pointer-events: none;
  transition: transform 0.2s ease;
}

.searchable-select__chevron.is-open {
  transform: translateY(-50%) rotate(180deg);
}

.searchable-select__dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  z-index: 50;
  background: var(--auth-surface-solid);
  border: 1.5px solid var(--auth-border);
  border-radius: 12px;
  box-shadow: 0 20px 48px rgba(15, 23, 42, 0.12), 0 4px 12px rgba(15, 23, 42, 0.06);
  overflow: hidden;
}

.searchable-select__options {
  max-height: 220px;
  overflow-y: auto;
  padding: 6px;
}

.searchable-select__option {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 10px;
  border: none;
  background: transparent;
  color: var(--auth-text);
  font: inherit;
  font-size: 14px;
  text-align: left;
  cursor: pointer;
  border-radius: 8px;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.searchable-select__option:hover,
.searchable-select__option.is-focused {
  background: var(--auth-primary-soft);
}

.searchable-select__option.is-active {
  background: rgba(37, 99, 235, 0.1);
  color: var(--auth-primary);
  font-weight: 600;
}

.searchable-select__icon {
  width: 14px;
  height: 14px;
  color: var(--auth-primary);
  flex-shrink: 0;
}

.searchable-select__dot {
  height: 8px;
  width: 8px;
  border-radius: 50%;
  border: 1.5px solid #cbd5e1;
  flex-shrink: 0;
  transition: all 0.15s ease;
}

.searchable-select__option.is-active .searchable-select__dot {
  background: var(--auth-primary);
  border-color: var(--auth-primary);
}

.searchable-select__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px;
  color: #94a3b8;
  font-size: 13px;
}

.searchable-select__create {
  color: var(--auth-primary);
  font-weight: 600;
  background: var(--auth-primary-soft);
  border: 1.5px dashed rgba(37, 99, 235, 0.35);
  margin: 6px;
}

.searchable-select__create:hover,
.searchable-select__create.is-focused {
  background: rgba(37, 99, 235, 0.18);
  border-style: solid;
}

.searchable-select__create-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.searchable-select__spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes auth-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.searchable-select-enter-active,
.searchable-select-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.searchable-select-enter-from,
.searchable-select-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.98);
}
</style>
