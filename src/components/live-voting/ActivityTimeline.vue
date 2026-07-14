<script setup lang="ts">
import BaseCard from './BaseCard.vue'

interface Activity {
  id: string
  type: 'join' | 'vote' | 'start' | 'close' | 'create'
  message: string
  timestamp: Date | string
}

defineProps<{
  activities: Activity[]
}>()

const iconMap: Record<Activity['type'], { dotColor: string }> = {
  join: { dotColor: 'lv-timeline-dot--join' },
  vote: { dotColor: 'lv-timeline-dot--vote' },
  start: { dotColor: 'lv-timeline-dot--start' },
  close: { dotColor: 'lv-timeline-dot--close' },
  create: { dotColor: 'lv-timeline-dot--create' },
}

function formatTime(timestamp: Date | string): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec < 10) return 'just now'
  if (diffSec < 60) return `${diffSec}s ago`
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  return date.toLocaleDateString()
}
</script>

<template>
  <BaseCard v-if="activities.length > 0" padding="lg" class="lv-activity-card" role="region" aria-label="Recent activity">
    <div class="lv-activity-header">
      <p class="lv-activity-label">Activity</p>
      <span class="lv-activity-count">{{ activities.length }} event{{ activities.length === 1 ? '' : 's' }}</span>
    </div>

    <div class="lv-timeline">
      <!-- Timeline line -->
      <div class="lv-timeline-line" aria-hidden="true" />

      <ul class="lv-timeline-list">
        <li
          v-for="activity in activities"
          :key="activity.id"
          class="lv-timeline-item"
        >
          <!-- Dot -->
          <div
            class="lv-timeline-dot"
            :class="iconMap[activity.type]?.dotColor ?? 'lv-timeline-dot--default'"
          />

          <!-- Content -->
          <div class="lv-timeline-content">
            <p class="lv-timeline-message">
              {{ activity.message }}
            </p>
            <p class="lv-timeline-time">
              {{ formatTime(activity.timestamp) }}
            </p>
          </div>
        </li>
      </ul>
    </div>
  </BaseCard>
</template>
