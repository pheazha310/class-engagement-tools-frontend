<script setup lang="ts">
import { RouterLink } from 'vue-router'

interface Props {
  to: string
  label?: string
  gradient?: string
  borderColor?: string
  shadowColor?: string
}

withDefaults(defineProps<Props>(), {
  label: 'Back',
  gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)',
  borderColor: 'rgba(99, 102, 241, 0.15)',
  shadowColor: 'rgba(99, 102, 241, 0.3)',
})
</script>

<template>
  <div
    class="sticky-bottom-nav"
    :style="{
      '--nav-border': borderColor,
    }"
  >
    <RouterLink
      :to="to"
      class="sticky-back-link"
      :style="{
        '--btn-gradient': gradient,
        '--btn-shadow': shadowColor,
      }"
    >
      <span class="sticky-back-arrow" aria-hidden="true">←</span>
      {{ label }}
    </RouterLink>
  </div>
</template>

<style scoped>
.sticky-bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-top: 1px solid var(--nav-border, rgba(99, 102, 241, 0.15));
  padding: 12px 24px;
  padding-bottom: calc(12px + env(safe-area-inset-bottom));
  display: flex;
  justify-content: center;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.08);
}

.sticky-back-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 28px;
  background: var(--btn-gradient, linear-gradient(135deg, #6366f1, #4f46e5));
  color: white;
  text-decoration: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px var(--btn-shadow, rgba(99, 102, 241, 0.3));
}

.sticky-back-link:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px var(--btn-shadow, rgba(99, 102, 241, 0.4));
}

.sticky-back-link:active {
  transform: translateY(0);
}

.sticky-back-arrow {
  font-size: 18px;
  transition: transform 0.3s ease;
}

.sticky-back-link:hover .sticky-back-arrow {
  transform: translateX(-4px);
}
</style>
