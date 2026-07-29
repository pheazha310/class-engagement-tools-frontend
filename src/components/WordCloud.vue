<script setup lang="ts">
import { computed } from 'vue'
import type { OpenTextResponse } from '@/types/poll'

const props = defineProps<{
  responses: OpenTextResponse[]
  isAnonymous: boolean
}>()

interface WordItem {
  text: string
  count: number
  fontSize: number
}

const wordItems = computed<WordItem[]>(() => {
  const wordMap = new Map<string, number>()

  for (const r of props.responses) {
    const words = r.text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2)

    for (const word of words) {
      wordMap.set(word, (wordMap.get(word) || 0) + 1)
    }
  }

  const items = Array.from(wordMap.entries())
    .map(([text, count]) => ({ text, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 50)

  const maxCount = items.length > 0 ? items[0]!.count : 1
  const minCount = items.length > 0 ? items[items.length - 1]!.count : 1

  return items.map((item) => ({
    text: item.text,
    count: item.count,
    fontSize: 12 + ((item.count - minCount) / Math.max(maxCount - minCount, 1)) * 28,
  }))
})

const colors = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#f97316', '#eab308',
  '#22c55e', '#06b6d4', '#2563eb', '#7c3aed',
]
</script>

<template>
  <div class="wc-card">
    <h3 class="wc-title">Word Cloud</h3>

    <div v-if="wordItems.length === 0" class="wc-empty">
      <div class="wc-empty-visual">
        <svg viewBox="0 0 120 120" fill="none">
          <defs>
            <linearGradient id="wcCloudGrad" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
              <stop stop-color="#a78bfa" />
              <stop offset="1" stop-color="#6366f1" />
            </linearGradient>
          </defs>
          <circle cx="42" cy="62" r="22" fill="#ede9fe" />
          <circle cx="72" cy="48" r="32" fill="url(#wcCloudGrad)" opacity="0.18" />
          <circle cx="62" cy="78" r="18" fill="#ddd6fe" opacity="0.6" />
          <path d="M48 76c6 8 14 10 22 6" stroke="#7c3aed" stroke-width="3" stroke-linecap="round" opacity="0.25" />
        </svg>
        <div class="wc-empty-text">
          <h4>No Data Yet</h4>
          <p>Add responses to generate a word cloud visualization.</p>
        </div>
      </div>
    </div>

    <div v-else class="wc-cloud">
      <span
        v-for="(word, i) in wordItems"
        :key="word.text"
        class="wc-word"
        :style="{
          fontSize: `${word.fontSize}px`,
          color: colors[i % colors.length],
          backgroundColor: `${colors[i % colors.length]}18`,
          animationDelay: `${i * 30}ms`,
        }"
        :title="`${word.text}: ${word.count} ${word.count === 1 ? 'mention' : 'mentions'}`"
      >
        {{ word.text }}
      </span>
    </div>

    <div v-if="!isAnonymous && responses.length > 0" class="wc-responses">
      <h4 class="wc-responses-title">Individual Responses</h4>
      <div class="wc-responses-list">
        <div
          v-for="(r, i) in responses"
          :key="i"
          class="wc-response-item"
        >
          <p class="wc-response-text">{{ r.text }}</p>
          <p v-if="r.student_name" class="wc-response-author">— {{ r.student_name }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wc-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 10px 30px rgba(0,0,0,.04);
}
.wc-title {
  font-size: 14px;
  font-weight: 700;
  color: #475569;
  margin-bottom: 16px;
  text-transform: uppercase;
  letter-spacing: 0.6px;
}

.wc-empty {
  padding: 48px 20px;
  text-align: center;
}
.wc-empty-visual {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}
.wc-empty-visual svg {
  width: 120px;
  height: 120px;
  opacity: .85;
  animation: wc-float 3s ease-in-out infinite;
}
@keyframes wc-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
.wc-empty-text h4 {
  font-size: 18px;
  font-weight: 700;
  color: #475569;
  margin-bottom: 4px;
}
.wc-empty-text p {
  font-size: 13px;
  color: #94a3b8;
  max-width: 240px;
  line-height: 1.5;
}

.wc-cloud {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 20px 8px;
  position: relative;
  min-height: 200px;
}
.wc-cloud::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: .3;
  background-image: radial-gradient(circle at 1px 1px, rgba(148,163,184,.18) 1px, transparent 0);
  background-size: 26px 26px;
  mask-image: linear-gradient(180deg, rgba(0,0,0,0.3), transparent 75%);
  -webkit-mask-image: linear-gradient(180deg, rgba(0,0,0,0.3), transparent 75%);
}
.wc-word {
  display: inline-block;
  border-radius: 999px;
  padding: 5px 18px;
  font-weight: 700;
  line-height: 1.4;
  transition: all .25s cubic-bezier(.4,0,.2,1);
  cursor: default;
  border: 1px solid transparent;
  position: relative;
  animation: wc-appear .4s ease-out both;
}
@keyframes wc-appear {
  from { opacity: 0; transform: scale(.7); }
  to { opacity: 1; transform: scale(1); }
}
.wc-word:hover {
  transform: scale(1.12);
  border-color: currentColor;
  box-shadow: 0 10px 28px rgba(0,0,0,.1);
  z-index: 2;
}

.wc-responses {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #f1f5f9;
}
.wc-responses-title {
  font-size: 12px;
  font-weight: 700;
  color: #475569;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.wc-responses-list {
  max-height: 240px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-right: 4px;
}
.wc-responses-list::-webkit-scrollbar { width: 5px; }
.wc-responses-list::-webkit-scrollbar-track { background: transparent; }
.wc-responses-list::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 999px; }
.wc-response-item {
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border: 1px solid #f1f5f9;
  border-radius: 12px;
  padding: 12px 16px;
  transition: all .2s;
}
.wc-response-item:hover {
  border-color: #e2e8f0;
  box-shadow: 0 4px 12px rgba(0,0,0,.04);
}
.wc-response-text {
  font-size: 14px;
  color: #0f172a;
  line-height: 1.5;
  margin: 0;
}
.wc-response-author {
  margin: 5px 0 0;
  font-size: 12px;
  color: #94a3b8;
  font-weight: 500;
}
</style>