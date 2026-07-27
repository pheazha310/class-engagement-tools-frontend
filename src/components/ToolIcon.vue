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
  device: ['M5 3h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z', 'M8 21h8', 'M12 15v6'],
  lock: ['M6 11h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2zm2 0V7a4 4 0 0 1 8 0v4', 'M12 15v3'],
  bulb: ['M9 18h6', 'M10 22h4', 'M8 14a7 7 0 1 1 8 0c-1.1 1-1.6 2.2-1.8 4H9.8c-.2-1.8-.7-3-1.8-4z'],
  globe: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z', 'M3 12h18', 'M12 3c2.4 2.4 3.6 5.4 3.6 9S14.4 18.6 12 21c-2.4-2.4-3.6-5.4-3.6-9S9.6 5.4 12 3z'],
  cap: ['M3 10l9-5 9 5-9 5-9-5z', 'M7 12v4c2.5 2.4 7.5 2.4 10 0v-4', 'M21 10v5'],
  teacher: ['M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8', 'M4 21v-1a8 8 0 0 1 16 0v1', 'M18 5l1 1 2-2'],
  rocket: ['M14 4c3.5 0 5.5-1 6-2 1 4.5-1.5 8.5-5 11l-4 3-5-5 3-4c2.5-3.5 6.5-5 11-5z', 'M9 15l-4 4', 'M5 19l-2 2', 'M12 9h.01'],
  poll: ['M5 20V9', 'M12 20V4', 'M19 20v-7', 'M3 20h18'],
  chart: ['M4 19V5', 'M8 17v-5', 'M13 17V8', 'M18 17v-8', 'M22 19H3'],
  mail: ['M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z', 'M22 6l-10 7L2 6'],
  phone: ['M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.1 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .3 2 .7 3a2 2 0 0 1-.5 2.1L8 10.1a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c1 .4 2 .6 3 .7a2 2 0 0 1 1.6 1.9z'],
  pin: ['M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z', 'M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z'],
  facebook: ['M14 21v-8h3l.5-3H14V8.5c0-.9.3-1.5 1.6-1.5H18V4.3c-.4-.1-1.3-.2-2.4-.2-2.4 0-4.1 1.5-4.1 4.2V10H9v3h2.5v8H14z'],
  twitter: ['M21 6.2c-.7.3-1.4.5-2.2.6.8-.5 1.4-1.2 1.7-2.1-.7.5-1.6.8-2.5 1A3.9 3.9 0 0 0 11.2 9c0 .3 0 .6.1.9a11 11 0 0 1-8-4.1 3.8 3.8 0 0 0 1.2 5.2c-.6 0-1.2-.2-1.7-.5 0 1.9 1.4 3.6 3.4 4-.4.1-.8.2-1.1.2-.3 0-.5 0-.7-.1a3.9 3.9 0 0 0 3.7 2.7A7.9 7.9 0 0 1 3.2 19c-.3 0-.6 0-.9-.1A11.1 11.1 0 0 0 8.3 21c7.2 0 11.1-6 11.1-11.1v-.5c.8-.5 1.4-1.1 1.9-1.8z'],
  linkedin: ['M6 9v10', 'M6 5v.01', 'M10 19v-6a4 4 0 0 1 8 0v6', 'M10 13V9'],
  instagram: ['M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4z', 'M16 11.5a4 4 0 1 1-8 0 4 4 0 0 1 8 0z', 'M17.5 6.5h.01'],
  youtube: ['M21 8.5a2.7 2.7 0 0 0-1.9-1.9C17.5 6.2 12 6.2 12 6.2s-5.5 0-7.1.4A2.7 2.7 0 0 0 3 8.5 28 28 0 0 0 2.6 12 28 28 0 0 0 3 15.5a2.7 2.7 0 0 0 1.9 1.9c1.6.4 7.1.4 7.1.4s5.5 0 7.1-.4a2.7 2.7 0 0 0 1.9-1.9 28 28 0 0 0 .4-3.5 28 28 0 0 0-.4-3.5z', 'M10 15l5-3-5-3v6z'],
}
const palettes: Record<string, [string, string]> = {
  wheel: ['#7c3aed', '#ec4899'], cards: ['#2563eb', '#06b6d4'], target: ['#f97316', '#ef4444'], users: ['#8b5cf6', '#ec4899'],
  quiz: ['#2563eb', '#8b5cf6'], sparkles: ['#f59e0b', '#ec4899'], smile: ['#f97316', '#eab308'], cloud: ['#0ea5e9', '#6366f1'],
  timer: ['#ef4444', '#f97316'], stopwatch: ['#2563eb', '#06b6d4'], audio: ['#8b5cf6', '#ec4899'], calculator: ['#0ea5e9', '#2563eb'],
  book: ['#10b981', '#0ea5e9'], swords: ['#ef4444', '#f97316'], brain: ['#8b5cf6', '#ec4899'], gamepad: ['#6366f1', '#8b5cf6'],
  device: ['#2563eb', '#06b6d4'], lock: ['#10b981', '#14b8a6'], bulb: ['#f59e0b', '#f97316'], globe: ['#0ea5e9', '#8b5cf6'], cap: ['#6366f1', '#8b5cf6'], teacher: ['#ec4899', '#8b5cf6'],
  rocket: ['#f97316', '#ec4899'], poll: ['#8b5cf6', '#2563eb'], chart: ['#0ea5e9', '#2563eb'],
  mail: ['#2563eb', '#8b5cf6'], phone: ['#10b981', '#14b8a6'], pin: ['#f97316', '#ec4899'], facebook: ['#2563eb', '#6366f1'], twitter: ['#0ea5e9', '#2563eb'], linkedin: ['#0a66c2', '#0ea5e9'], instagram: ['#ec4899', '#f97316'], youtube: ['#ef4444', '#f97316'],
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
.tool-icon--bulb svg { animation: icon-pop 2.3s ease-in-out infinite; }
.tool-icon--globe svg { animation: wheel-turn 16s linear infinite; }
.tool-icon--rocket svg { animation: icon-float 2.4s ease-in-out infinite; }
:global(.category-tool-link:hover) .tool-icon svg, :global(.tool-card:hover) .tool-icon svg { transform: scale(1.14) rotate(-5deg); filter: drop-shadow(0 6px 6px rgba(79, 70, 229, .25)); }
@keyframes wheel-turn { to { transform: rotate(360deg); } }
@keyframes icon-float { 50% { transform: translateY(-2px); } }
@keyframes icon-pop { 50% { transform: scale(1.08); } }
@keyframes icon-tick { 50% { transform: rotate(8deg); } }
@keyframes icon-pulse { 50% { transform: scale(1.1); } }
@media (prefers-reduced-motion: reduce) { .tool-icon svg { animation: none !important; } }
</style>
