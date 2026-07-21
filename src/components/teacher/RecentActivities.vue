<script setup lang="ts">
interface Activity {
  id: number
  name: string
  class: string
  status: 'Live' | 'Completed' | 'Scheduled'
  timeAgo: string
}

defineProps<{
  activities: Activity[]
}>()

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Live':
      return '#48bb78'
    case 'Completed':
      return '#a0aec0'
    case 'Scheduled':
      return '#f6ad55'
    default:
      return '#718096'
  }
}
</script>

<template>
  <div class="recent-activities">
    <div class="section-header">
      <h3 class="section-title">Recent Activities</h3>
      <a href="#" class="view-all">View All</a>
    </div>

    <div class="activities-list">
      <div v-for="activity in activities" :key="activity.id" class="activity-item">
        <div class="activity-content">
          <div class="activity-name">{{ activity.name }}</div>
          <div class="activity-class">{{ activity.class }}</div>
        </div>
        <div class="activity-meta">
          <span class="status-badge" :style="{ backgroundColor: getStatusColor(activity.status) }">
            {{ activity.status }}
          </span>
          <div class="activity-time">{{ activity.timeAgo }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.recent-activities {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  border: 1px solid #e2e8f0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: #1a202c;
  margin: 0;
}

.view-all {
  font-size: 13px;
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s;
}

.view-all:hover {
  color: #5a67d8;
}

.activities-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.activity-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  transition: all 0.2s;
}

.activity-item:hover {
  background: #edf2f7;
  border-color: #cbd5e0;
}

.activity-content {
  flex: 1;
}

.activity-name {
  font-size: 14px;
  font-weight: 600;
  color: #1a202c;
  margin-bottom: 4px;
}

.activity-class {
  font-size: 12px;
  color: #718096;
}

.activity-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  color: white;
  font-size: 12px;
  font-weight: 600;
}

.activity-time {
  font-size: 12px;
  color: #718096;
}

@media (max-width: 768px) {
  .recent-activities {
    padding: 16px;
  }

  .activity-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .activity-meta {
    width: 100%;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}
</style>
