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
  background: #141428;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
}

.theme-picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.theme-picker-title {
  font-size: 14px;
  font-weight: 700;
  color: #ddd;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.theme-picker-selected {
  font-size: 12px;
  font-weight: 700;
  color: #4ecdc4;
  background: #1f1f38;
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
  border: 2px solid #2a2a45;
  background: #1a1a2e;
  color: #fff;
  cursor: pointer;
  transition: transform 0.15s, border-color 0.15s, box-shadow 0.15s;
  min-width: 0;
}

.theme-card:hover:not(:disabled) {
  transform: translateY(-2px);
  border-color: #3a3a5a;
  box-shadow: 0 8px 20px rgba(0,0,0,0.35);
}

.theme-card--active {
  border-color: #4ecdc4;
  box-shadow: 0 0 0 2px rgba(78, 205, 196, 0.3), 0 8px 24px rgba(78, 205, 196, 0.25);
  background: #1f1f3a;
}

.theme-name {
  font-size: 13px;
  font-weight: 700;
  text-align: center;
  color: #f5f5f5;
  letter-spacing: 0.02em;
}

.theme-swatch {
  width: 16px;
  height: 16px;
  border-radius: 5px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.2);
  transition: transform 0.15s;
}

.theme-card:hover .theme-swatch {
  transform: scale(1.08);
}
</style>
