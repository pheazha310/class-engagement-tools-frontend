<script setup lang="ts">
import { reactive, watch } from 'vue'

const emit = defineEmits<{
  update: [filters: { search: string; class_name: string; status: string; sort_by: string }]
}>()

const filters = reactive({
  search: '',
  class_name: '',
  status: '',
  sort_by: 'highest_score',
})

watch(filters, () => {
  emit('update', { ...filters })
}, { deep: true })

function clearFilters() {
  filters.search = ''
  filters.class_name = ''
  filters.status = ''
  filters.sort_by = 'highest_score'
}
</script>

<template>
  <div class="ranking-filter-bar">
    <!-- Search -->
    <div class="filter-search-wrapper">
      <svg class="filter-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        v-model="filters.search"
        type="text"
        placeholder="Search students..."
        class="filter-search-input"
      />
    </div>

    <!-- Class filter -->
    <div class="filter-select-wrapper">
      <svg class="filter-select-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      </svg>
      <input
        v-model="filters.class_name"
        type="text"
        placeholder="Filter by class..."
        class="filter-select-input"
      />
    </div>

    <!-- Status filter -->
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

    <!-- Sort -->
    <div class="filter-select-wrapper" style="min-width: 140px;">
      <select v-model="filters.sort_by" class="filter-select">
        <option value="highest_score">Highest Score</option>
        <option value="lowest_score">Lowest Score</option>
      </select>
    </div>

    <!-- Reset -->
    <button class="btn btn-reset" @click="clearFilters">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="btn-reset-icon" aria-hidden="true">
        <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
      </svg>
      Reset
    </button>
  </div>
</template>

<style scoped>
.ranking-filter-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

/* Search */
.filter-search-wrapper {
  position: relative;
  flex: 1;
  min-width: 180px;
}

.filter-search-icon {
  position: absolute;
  left: 13px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  color: #94a3b8;
  pointer-events: none;
}

.filter-search-input {
  width: 100%;
  padding: 0.6rem 0.85rem 0.6rem 2.5rem;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  color: #1e293b;
  font-size: 0.875rem;
  font-family: inherit;
  outline: none;
  transition: all 0.2s ease;
}

.filter-search-input::placeholder {
  color: #94a3b8;
}

.filter-search-input:hover {
  border-color: #94a3b8;
}

.filter-search-input:focus {
  border-color: #14b8a6;
  box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
}

/* Select wrapper */
.filter-select-wrapper {
  position: relative;
}

.filter-select-icon {
  position: absolute;
  left: 13px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  color: #94a3b8;
  pointer-events: none;
}

.filter-select-input {
  width: 100%;
  padding: 0.6rem 0.85rem 0.6rem 2.5rem;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  color: #1e293b;
  font-size: 0.875rem;
  font-family: inherit;
  outline: none;
  transition: all 0.2s ease;
  min-width: 120px;
}

.filter-select-input::placeholder {
  color: #94a3b8;
}

.filter-select-input:hover {
  border-color: #94a3b8;
}

.filter-select-input:focus {
  border-color: #14b8a6;
  box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
}

.filter-select {
  width: 100%;
  padding: 0.6rem 0.85rem 0.6rem 0.85rem;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  color: #1e293b;
  font-size: 0.875rem;
  font-family: inherit;
  outline: none;
  cursor: pointer;
  transition: all 0.2s ease;
  appearance: auto;
}

.filter-select:hover {
  border-color: #94a3b8;
}

.filter-select:focus {
  border-color: #14b8a6;
  box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
}

/* Status filter buttons */
.filter-btn-group {
  display: flex;
  gap: 0.35rem;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.3rem;
}

.filter-status-btn {
  padding: 0.4rem 0.85rem;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #64748b;
  font-size: 0.8rem;
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

/* Reset button */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.6rem 1.1rem;
  border-radius: 10px;
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

.btn-reset-icon {
  width: 16px;
  height: 16px;
}

@media (max-width: 768px) {
  .ranking-filter-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-search-wrapper {
    min-width: 0;
  }

  .filter-select-wrapper {
    min-width: 0;
  }

  .filter-btn-group {
    align-self: stretch;
    justify-content: center;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
