<script setup lang="ts">
import { computed, h, type PropType } from 'vue'

const props = defineProps({ name: { type: String as PropType<string>, required: true }, size: { type: [Number, String], default: 24 } })

const paths: Record<string, string[]> = {
  wheel: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z', 'M12 3v9l6.4 6.4', 'M12 3l4.5 7.8L21 12', 'M12 12l-7.8 4.5L3 12', 'M12 12l-4.5-7.8'],
  cards: ['M7 4h11a2 2 0 0 1 2 2v11', 'M5 8h11a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2z', 'M10.5 12.5l1.5-1.5 1.5 1.5c0 1.8-1.5 3-1.5 3s-1.5-1.2-1.5-3z'],
  target: ['M12 3a9 9 0 1 0 9 9', 'M12 7a5 5 0 1 0 5 5', 'M12 11a1 1 0 1 0 0 2 1 1 0 0 0 0-2z', 'M15 9l6-6', 'M16 3h5v5'],
  users: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8', 'M22 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75'],
  quiz: ['M9 9a3 3 0 1 1 5.5 1.7c-.7.7-1.7 1.1-2.5 1.8V14', 'M12 18h.01', 'M4 4h16v16H4z'],
  sparkles: ['M12 3l1.2 4.8L18 9l-4.8 1.2L12 15l-1.2-4.8L6 9l4.8-1.2L12 3z', 'M19 15l.6 2.4L22 18l-2.4.6L19 21l-.6-2.4L16 18l2.4-.6L19 15z'],
  smile: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z', 'M8 10h.01', 'M16 10h.01', 'M8 14s1.5 2 4 2 4-2 4-2'],
  cloud: ['M7 18h10a4 4 0 0 0 .7-7.94A6 6 0 0 0 6.2 8.3 4.8 4.8 0 0 0 7 18z'],
  timer: ['M10 2h4', 'M12 14V8', 'M12 22a8 8 0 1 0 0-16 8 8 0 0 0 0 16z'],
  stopwatch: ['M9 2h6', 'M12 6v6l3 2', 'M12 22a8 8 0 1 0 0-16 8 8 0 0 0 0 16z', 'M19 5l1.5-1.5'],
  audio: ['M4 14h4l5 4V6L8 10H4v4z', 'M16 9a4 4 0 0 1 0 6', 'M19 6a8 8 0 0 1 0 12'],
  calculator: ['M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z', 'M7 7h10v4H7z', 'M8 15h.01', 'M12 15h.01', 'M16 15h.01', 'M8 18h.01', 'M12 18h.01', 'M16 18h.01'],
  book: ['M4 19.5A2.5 2.5 0 0 1 6.5 17H20', 'M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z'],
  swords: ['M14.5 4.5l5 5L7 22l-5-5L14.5 4.5z', 'M6 4l14 14', 'M3 7l4-4', 'M17 21l4-4'],
  brain: ['M9.5 5.2A3.5 3.5 0 0 0 4 8v.2A3.7 3.7 0 0 0 3 15a3.8 3.8 0 0 0 4 6h2.5', 'M14.5 5.2A3.5 3.5 0 0 1 20 8v.2A3.7 3.7 0 0 1 21 15a3.8 3.8 0 0 1-4 6h-2.5', 'M12 4v16', 'M7 11h2', 'M15 11h2'],
  gamepad: ['M7 10h10a5 5 0 0 1 4.8 6.4l-1 3.2a2 2 0 0 1-3.2.9l-2.5-2H9l-2.5 2a2 2 0 0 1-3.2-.9l-1-3.2A5 5 0 0 1 7 10z', 'M7 14h4', 'M9 12v4', 'M17 14h.01', 'M19 16h.01'],
}
const palettes: Record<string, [string, string]> = {
  wheel: ['#7c3aed', '#ec4899'], cards: ['#2563eb', '#06b6d4'], target: ['#f97316', '#ef4444'], users: ['#8b5cf6', '#ec4899'],
  quiz: ['#2563eb', '#8b5cf6'], sparkles: ['#f59e0b', '#ec4899'], smile: ['#f97316', '#eab308'], cloud: ['#0ea5e9', '#6366f1'],
  timer: ['#ef4444', '#f97316'], stopwatch: ['#2563eb', '#06b6d4'], audio: ['#8b5cf6', '#ec4899'], calculator: ['#0ea5e9', '#2563eb'],
  book: ['#10b981', '#0ea5e9'], swords: ['#ef4444', '#f97316'], brain: ['#8b5cf6', '#ec4899'], gamepad: ['#6366f1', '#8b5cf6'],
}
const palette = computed(() => palettes[props.name] ?? palettes.quiz ?? ['#2563eb', '#8b5cf6'])
const gradientId = computed(() => `tool-icon-gradient-${props.name}`)
const renderIcon = () => h('svg', { width: props.size, height: props.size, viewBox: '0 0 24 24', fill: 'none', stroke: `url(#${gradientId.value})`, 'stroke-width': 2.15, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true', focusable: 'false' }, [
  h('defs', [h('linearGradient', { id: gradientId.value, x1: '2', y1: '2', x2: '22', y2: '22', gradientUnits: 'userSpaceOnUse' }, [h('stop', { 'stop-color': palette.value[0] }), h('stop', { offset: '1', 'stop-color': palette.value[1] })])]),
  ...(paths[props.name] ?? paths.quiz ?? []).map(d => h('path', { d })),
])
</script>
<template><span class="tool-icon" :class="`tool-icon--${name}`"><renderIcon /><i aria-hidden="true" /></span></template>

<style scoped>
.tool-icon { display: inline-grid; place-items: center; position: relative; line-height: 0; }
.tool-icon svg { filter: drop-shadow(0 3px 4px rgba(79, 70, 229, .16)); transition: transform .32s cubic-bezier(.16, 1, .3, 1), filter .32s ease; }
.tool-icon i { position: absolute; width: 4px; height: 4px; border-radius: 50%; right: 0; top: 1px; opacity: .7; background: #f59e0b; box-shadow: 0 0 0 3px rgba(245, 158, 11, .12); }
.tool-icon--wheel svg { animation: wheel-turn 12s linear infinite; }
.tool-icon--sparkles svg, .tool-icon--smile svg { animation: icon-pop 2.8s ease-in-out infinite; }
.tool-icon--cloud svg { animation: icon-float 3.6s ease-in-out infinite; }
.tool-icon--timer svg, .tool-icon--stopwatch svg { animation: icon-tick 3s ease-in-out infinite; }
.tool-icon--audio svg { animation: icon-pulse 2.1s ease-in-out infinite; }
.tool-icon--gamepad svg, .tool-icon--brain svg { animation: icon-float 3s ease-in-out infinite; }
:global(.category-tool-link:hover) .tool-icon svg, :global(.tool-card:hover) .tool-icon svg { transform: scale(1.14) rotate(-5deg); filter: drop-shadow(0 6px 6px rgba(79, 70, 229, .25)); }
@keyframes wheel-turn { to { transform: rotate(360deg); } }
@keyframes icon-float { 50% { transform: translateY(-2px); } }
@keyframes icon-pop { 50% { transform: scale(1.08); } }
@keyframes icon-tick { 50% { transform: rotate(8deg); } }
@keyframes icon-pulse { 50% { transform: scale(1.1); } }
@media (prefers-reduced-motion: reduce) { .tool-icon svg { animation: none !important; } }
</style>
