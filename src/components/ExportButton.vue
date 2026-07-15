<script setup lang="ts">
defineProps<{
  exporting?: boolean
  format: 'pdf' | 'excel'
}>()

const emit = defineEmits<{
  export: [format: 'pdf' | 'excel']
}>()

const labels = {
  pdf: 'Export PDF',
  excel: 'Export Excel',
}

const icons = {
  pdf: '📄',
  excel: '📊',
}
</script>

<template>
  <button
    class="export-btn"
    :class="`export-btn--${format}`"
    :disabled="exporting"
    @click="emit('export', format)"
  >
    <span v-if="exporting" class="export-btn-spinner"></span>
    <span v-else class="export-btn-icon">{{ icons[format] }}</span>
    <span>{{ exporting ? 'Exporting...' : labels[format] }}</span>
  </button>
</template>

<style scoped>
.export-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1.25rem;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 600;
  font-family: inherit;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.export-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.export-btn--pdf {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.export-btn--pdf:hover:not(:disabled) {
  background: #fee2e2;
  border-color: #fca5a5;
  transform: translateY(-1px);
}

.export-btn--excel {
  background: #f0fdf4;
  color: #065f46;
  border: 1px solid #bbf7d0;
}

.export-btn--excel:hover:not(:disabled) {
  background: #d1fae5;
  border-color: #86efac;
  transform: translateY(-1px);
}

.export-btn-icon {
  font-size: 1.1rem;
}

.export-btn-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .export-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
