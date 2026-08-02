<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface TrendData {
  day: string
  value: number
}

const trendData = ref<TrendData[]>([
  { day: 'Mon', value: 45 },
  { day: 'Tue', value: 62 },
  { day: 'Wed', value: 58 },
  { day: 'Thu', value: 72 },
  { day: 'Fri', value: 68 },
  { day: 'Sat', value: 55 },
  { day: 'Sun', value: 41 }
])

const maxValue = 100
const getBarHeight = (value: number) => {
  return (value / maxValue) * 100
}
</script>

<template>
  <div class="participation-trends">
    <div class="trends-header">
      <h3 class="trends-title">Student Participation Trends</h3>
      <span class="trends-period">Last 7 Days</span>
    </div>

    <div class="chart-container">
      <div class="chart">
        <div v-for="data in trendData" :key="data.day" class="bar-group">
          <div class="bar-wrapper">
            <div
              class="bar"
              :style="{ height: getBarHeight(data.value) + '%' }"
            >
              <span class="bar-value">{{ data.value }}</span>
            </div>
          </div>
          <div class="bar-label">{{ data.day }}</div>
        </div>
      </div>
    </div>

    <div class="trends-stats">
      <div class="stat">
        <span class="stat-label">Average</span>
        <span class="stat-value">57.3%</span>
      </div>
      <div class="stat">
        <span class="stat-label">Peak</span>
        <span class="stat-value">72%</span>
      </div>
      <div class="stat">
        <span class="stat-label">Trend</span>
        <span class="stat-value trend-up">↑ 8%</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.participation-trends {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  border: 1px solid #e2e8f0;
}

.trends-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.trends-title {
  font-size: 16px;
  font-weight: 700;
  color: #1a202c;
  margin: 0;
}

.trends-period {
  font-size: 13px;
  color: #718096;
  font-weight: 500;
}

.chart-container {
  margin-bottom: 24px;
}

.chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  height: 200px;
  gap: 12px;
}

.bar-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  gap: 8px;
}

.bar-wrapper {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  height: 160px;
  width: 100%;
  flex-direction: column;
}

.bar {
  width: 100%;
  background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px 8px 0 0;
  min-height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  position: relative;
}

.bar:hover {
  filter: brightness(1.1);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.bar-value {
  color: white;
  font-size: 12px;
  font-weight: 700;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.bar:hover .bar-value {
  opacity: 1;
}

.bar-label {
  font-size: 12px;
  color: #718096;
  font-weight: 600;
}

.trends-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  color: #718096;
  font-weight: 500;
}

.stat-value {
  font-size: 16px;
  font-weight: 700;
  color: #667eea;
}

.trend-up {
  color: #48bb78;
}

@media (max-width: 768px) {
  .participation-trends {
    padding: 16px;
  }

  .chart {
    height: 150px;
  }

  .bar-wrapper {
    height: 120px;
  }

  .trends-stats {
    grid-template-columns: 1fr;
  }
}
</style>
