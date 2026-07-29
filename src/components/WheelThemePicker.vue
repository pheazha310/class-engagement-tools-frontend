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

.theme-picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.theme-picker-title {
  font-size: 13px;
  font-weight: 700;
  color: #bbb;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.theme-picker-selected {
  font-size: 12px;
  font-weight: 700;
  color: #4ecdc4;
  background: rgba(78, 205, 196, 0.1);
  padding: 4px 12px;
  border-radius: 999px;
  border: 1px solid rgba(78, 205, 196, 0.2);
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 10px;
}

.theme-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px 12px;
  border-radius: 14px;
  border: 2px solid rgba(255,255,255,0.06);
  background: rgba(255,255,255,0.03);
  color: #fff;
  cursor: pointer;
  transition: transform 0.2s cubic-bezier(.4,0,.2,1), border-color 0.2s, box-shadow 0.2s, background 0.2s;
  min-width: 0;
  position: relative;
  overflow: hidden;
}

.theme-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 14px;
  opacity: 0;
  transition: opacity 0.2s;
  background: radial-gradient(circle at 50% 0%, rgba(255,255,255,0.06), transparent 70%);
}

.theme-card:hover:not(:disabled)::before {
  opacity: 1;
}

.theme-card:hover:not(:disabled) {
  transform: translateY(-3px) scale(1.02);
  border-color: rgba(255,255,255,0.15);
  box-shadow: 0 12px 28px rgba(0,0,0,0.4);
  background: rgba(255,255,255,0.06);
}

.theme-card--active {
  border-color: #4ecdc4;
  box-shadow: 0 0 0 2px rgba(78, 205, 196, 0.25), 0 8px 24px rgba(78, 205, 196, 0.2);
  background: rgba(78, 205, 196, 0.06);
}

.theme-card--active::before {
  opacity: 1;
  background: radial-gradient(circle at 50% 0%, rgba(78, 205, 196, 0.1), transparent 70%);
}

.theme-name {
  font-size: 12px;
  font-weight: 700;
  text-align: center;
  color: #e0e0e0;
  letter-spacing: 0.02em;
  position: relative;
}

.theme-swatches {
  display: flex;
  justify-content: center;
  gap: 5px;
  position: relative;
}

.theme-swatch {
  width: 18px;
  height: 18px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.3);
  transition: transform 0.2s, box-shadow 0.2s;
}

.theme-card:hover .theme-swatch {
  transform: scale(1.15);
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.3);
}
</style>
