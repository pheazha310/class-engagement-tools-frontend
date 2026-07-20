<script setup lang="ts">
defineProps<{
  title: string
  description?: string
  icon?: string
}>()
</script>

<template>
  <div class="empty-state-container">
    <div class="empty-state-content">
      <div class="empty-state-icon-circle">
        <svg v-if="icon === '🔍'" class="empty-state-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <span v-else class="empty-state-icon-emoji">{{ icon || '📋' }}</span>
      </div>
      <h3 class="empty-state-title">{{ title }}</h3>
      <p v-if="description" class="empty-state-description">{{ description }}</p>
      <slot />
    </div>
  </div>
</template>

<style scoped>
.empty-state-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
  border: 2px dashed #cbd5e1;
  border-radius: 16px;
  background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.empty-state-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  max-width: 400px;
}

.empty-state-icon-circle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  margin-bottom: 1.5rem;
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.empty-state-icon-svg {
  width: 40px;
  height: 40px;
  color: #2563eb;
}

.empty-state-icon-emoji {
  font-size: 2.5rem;
  line-height: 1;
}

.empty-state-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.75rem;
  letter-spacing: -0.02em;
}

.empty-state-description {
  font-size: 0.95rem;
  color: #64748b;
  margin: 0;
  line-height: 1.6;
  max-width: 320px;
}
</style>
