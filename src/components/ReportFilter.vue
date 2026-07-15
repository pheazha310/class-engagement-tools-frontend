<script setup lang="ts">
import { reactive, watch } from 'vue'
import type { ReportFilters } from '@/types/report'

const emit = defineEmits<{
  update: [filters: ReportFilters]
  reset: []
}>()

const filters = reactive<ReportFilters>({
  class_name: '',
  date_from: '',
  date_to: '',
  student_name: '',
  status: '',
})

watch(
  filters,
  () => {
    emit('update', { ...filters })
  },
  { deep: true },
)

function resetFilters() {
  filters.class_name = ''
  filters.date_from = ''
  filters.date_to = ''
  filters.student_name = ''
  filters.status = ''
  emit('reset')
}
</script>

<template>
  <div class="report-filters">
    <div class="report-filters-grid">
      <!-- By class -->
      <div class="filter-field">
        <label for="filter_class" class="filter-label">Class</label>
        <div class="filter-input-wrapper">
          <svg class="filter-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
          </svg>
          <input
            id="filter_class"
            v-model="filters.class_name"
            type="text"
            placeholder="e.g. Grade 10A"
            class="filter-input"
          />
        </div>
      </div>

      <!-- Date range -->
      <div class="filter-field">
        <label for="filter_date_from" class="filter-label">Date From</label>
        <div class="filter-input-wrapper">
          <svg class="filter-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <input
            id="filter_date_from"
            v-model="filters.date_from"
            type="date"
            class="filter-input"
          />
        </div>
      </div>

      <div class="filter-field">
        <label for="filter_date_to" class="filter-label">Date To</label>
        <div class="filter-input-wrapper">
          <svg class="filter-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <input
            id="filter_date_to"
            v-model="filters.date_to"
            type="date"
            class="filter-input"
          />
        </div>
      </div>

      <!-- By student -->
      <div class="filter-field">
        <label for="filter_student" class="filter-label">Student</label>
        <div class="filter-input-wrapper">
          <svg class="filter-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
          </svg>
          <input
            id="filter_student"
            v-model="filters.student_name"
            type="text"
            placeholder="Student name..."
            class="filter-input"
          />
        </div>
      </div>

      <!-- By status -->
      <div class="filter-field">
        <label class="filter-label">Status</label>
        <div class="filter-btn-group">
          <button
            class="filter-status-btn"
            :class="{ 'filter-status-btn--active filter-status-btn--all': filters.status === '' }"
            @click="filters.status = ''"
          >
            All
          </button>
          <button
            class="filter-status-btn"
            :class="{ 'filter-status-btn--active filter-status-btn--pass': filters.status === 'pass' }"
            @click="filters.status = 'pass'"
          >
            Pass
          </button>
          <button
            class="filter-status-btn"
            :class="{ 'filter-status-btn--active filter-status-btn--fail': filters.status === 'fail' }"
            @click="filters.status = 'fail'"
          >
            Fail
          </button>
        </div>
      </div>
    </div>

    <div class="report-filters-actions">
      <button class="btn btn-reset" @click="resetFilters">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="btn-icon-sm" aria-hidden="true">
          <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </svg>
        Reset Filters
      </button>
    </div>
  </div>
</template>

<style scoped>
.report-filters {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.report-filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 0.85rem;
}

.filter-field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.filter-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #475569;
  letter-spacing: 0.01em;
}

.filter-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.filter-input-icon {
  position: absolute;
  left: 11px;
  width: 16px;
  height: 16px;
  color: #94a3b8;
  pointer-events: none;
}

.filter-input {
  width: 100%;
  padding: 0.55rem 0.75rem 0.55rem 2.25rem;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 9px;
  color: #1e293b;
  font-size: 0.85rem;
  font-family: inherit;
  outline: none;
  transition: all 0.2s ease;
}

.filter-input::placeholder {
  color: #94a3b8;
}

.filter-input:hover {
  border-color: #94a3b8;
}

.filter-input:focus {
  border-color: #14b8a6;
  box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
}

/* Date input specific */
.filter-input[type="date"]::-webkit-calendar-picker-indicator {
  opacity: 0.6;
  cursor: pointer;
}

.filter-input[type="date"]::-webkit-calendar-picker-indicator:hover {
  opacity: 1;
}

/* Status filter buttons */
.filter-btn-group {
  display: flex;
  gap: 0.3rem;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 9px;
  padding: 0.25rem;
}

.filter-status-btn {
  flex: 1;
  padding: 0.35rem 0.5rem;
  border: none;
  border-radius: 7px;
  background: transparent;
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-status-btn:hover {
  color: #475569;
}

.filter-status-btn--active {
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
}

.filter-status-btn--all.filter-status-btn--active {
  background: #ffffff;
  color: #1e293b;
}

.filter-status-btn--pass.filter-status-btn--active {
  background: #d1fae5;
  color: #065f46;
}

.filter-status-btn--fail.filter-status-btn--active {
  background: #fee2e2;
  color: #991b1b;
}

/* Actions */
.report-filters-actions {
  display: flex;
  justify-content: flex-end;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 1.1rem;
  border-radius: 9px;
  font-size: 0.85rem;
  font-weight: 500;
  font-family: inherit;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.btn-reset {
  background: transparent;
  color: #64748b;
  border: 1px solid #cbd5e1;
}

.btn-reset:hover {
  background: #f8fafc;
  color: #475569;
  border-color: #94a3b8;
}

.btn-icon-sm {
  width: 16px;
  height: 16px;
}

@media (max-width: 768px) {
  .report-filters-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 480px) {
  .report-filters-grid {
    grid-template-columns: 1fr;
  }
}
</style>
