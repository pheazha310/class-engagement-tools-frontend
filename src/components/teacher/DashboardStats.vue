<script setup lang="ts">
interface Stats {
  totalClasses: number
  totalStudents: number
  activePolls: number
  scheduledSessions: number
  liveSessions: number
  engagementMetric: number
  engagementIncrease: number
}

defineProps<{
  stats: Stats
}>()
</script>

<template>
  <div class="stats-container">
    <div class="stat-card">
      <div class="stat-header">
        <span class="stat-label">TOTAL CLASSES</span>
      </div>
      <div class="stat-value">{{ stats.totalClasses }}</div>
    </div>

    <div class="stat-card">
      <div class="stat-header">
        <span class="stat-label">STUDENTS</span>
      </div>
      <div class="stat-value">{{ stats.totalStudents }}</div>
    </div>

    <div class="stat-card">
      <div class="stat-header">
        <span class="stat-label">ACTIVE POLLS</span>
      </div>
      <div class="stat-value">{{ stats.activePolls }}</div>
      <div class="stat-meta">Ongoing</div>
    </div>

    <div class="stat-card">
      <div class="stat-header">
        <span class="stat-label">SCHEDULED</span>
      </div>
      <div class="stat-value">{{ stats.scheduledSessions }}</div>
    </div>

    <div class="stat-card">
      <div class="stat-header">
        <span class="stat-label">LIVE</span>
      </div>
      <div class="stat-value">{{ stats.liveSessions }}</div>
    </div>

    <div class="stat-card total-metric">
      <div class="stat-header">
        <span class="stat-label">TOTAL</span>
      </div>
      <div class="stat-value">{{ stats.engagementMetric }}</div>
    </div>
  </div>
</template>

<style scoped>
.stats-container {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
  margin-bottom: 32px;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  border: 1px solid #e2e8f0;
  transition: all 0.2s;
}

.stat-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.stat-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.stat-label {
  font-size: 12px;
  font-weight: 700;
  color: #718096;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #1a202c;
}

.stat-meta {
  font-size: 13px;
  color: #a0aec0;
  margin-top: 8px;
}

.total-metric .stat-value {
  color: #667eea;
}

@media (max-width: 1400px) {
  .stats-container {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .stats-container {
    grid-template-columns: repeat(2, 1fr);
  }

  .stat-card {
    padding: 16px;
  }

  .stat-value {
    font-size: 24px;
  }
}

@media (max-width: 480px) {
  .stats-container {
    grid-template-columns: 1fr;
  }
}
</style>
