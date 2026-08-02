<script setup lang="ts">
import type { WheelTheme } from '@/types/wheel'

defineProps<{
  modelValue: WheelTheme
  themes: WheelTheme[]
}>()

const emit = defineEmits<{
  'update:modelValue': [theme: WheelTheme]
}>()

function select(theme: WheelTheme) {
  emit('update:modelValue', theme)
}
</script>

<template>
  <div class="theme-picker">
    <div class="theme-picker-header">
      <span class="theme-picker-title">Theme</span>
      <span class="theme-picker-selected">{{ modelValue.name }}</span>
    </div>

    <div class="theme-grid">
      <button
        v-for="theme in themes"
        :key="theme.id"
        type="button"
        class="theme-card"
        :class="{ 'theme-card--active': theme.id === modelValue.id }"
        :aria-pressed="theme.id === modelValue.id"
        @click="select(theme)"
      >
        <span class="theme-name">{{ theme.name }}</span>
        <span class="theme-swatches" :aria-hidden="true">
          <span
            v-for="(color, index) in theme.colors"
            :key="index"
            class="theme-swatch"
            :style="{ backgroundColor: color }"
          />
        </span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.theme-picker {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 420px;
  margin: 0 auto;
  padding: 18px;
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
}

.theme-picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.theme-picker-title {
  font-size: 14px;
  font-weight: 700;
  color: #334155;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.theme-picker-selected {
  font-size: 12px;
  font-weight: 700;
  color: #4f46e5;
  background: #eef2ff;
  padding: 3px 10px;
  border-radius: 999px;
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
}

.theme-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  border-radius: 14px;
  border: 2px solid #e2e8f0;
  background: #f8fafc;
  color: #0f172a;
  cursor: pointer;
  transition: transform 0.15s, border-color 0.15s, box-shadow 0.15s;
  min-width: 0;
}

.theme-card:hover:not(:disabled) {
  transform: translateY(-2px);
  border-color: #cbd5e1;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.theme-card--active {
  border-color: #4f46e5;
  box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2), 0 4px 12px rgba(79, 70, 229, 0.12);
  background: #eef2ff;
}

.theme-name {
  font-size: 13px;
  font-weight: 700;
  text-align: center;
  color: #1e293b;
  letter-spacing: 0.02em;
}

.theme-swatch {
  width: 16px;
  height: 16px;
  border-radius: 5px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
  transition: transform 0.15s;
}

.theme-card:hover .theme-swatch {
  transform: scale(1.08);
}
</style>
