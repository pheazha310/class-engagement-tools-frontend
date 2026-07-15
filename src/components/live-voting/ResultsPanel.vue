<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { Chart, registerables } from 'chart.js'
import BaseCard from './BaseCard.vue'
import BaseBadge from './BaseBadge.vue'
import WinnerCard from './WinnerCard.vue'
import type { PollResultsData } from '@/stores/poll'

Chart.register(...registerables)

const props = defineProps<{
  results: PollResultsData | null
}>()

const barCanvas = ref<HTMLCanvasElement | null>(null)
const donutCanvas = ref<HTMLCanvasElement | null>(null)
let barChart: Chart<'bar'> | null = null
let donutChart: Chart<'doughnut'> | null = null

const topOptions = computed(() => {
  if (!props.results?.results?.length) return []
  return [...props.results.results].sort((a, b) => b.votes - a.votes).slice(0, 3)
})

const maxVotes = computed(() => {
  if (!props.results?.results?.length) return 0
  return Math.max(...props.results.results.map((r) => r.votes))
})

const chartColors = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#f97316', '#eab308',
  '#22c55e', '#06b6d4',
]

function destroyCharts() {
  barChart?.destroy()
  barChart = null
  donutChart?.destroy()
  donutChart = null
}

function renderCharts() {
  if (!props.results?.results?.length || !barCanvas.value || !donutCanvas.value) return
  destroyCharts()

  const labels = props.results.results.map((r) => r.option)
  const values = props.results.results.map((r) => r.votes)
  const colors = chartColors.slice(0, values.length)

  barChart = new Chart(barCanvas.value, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Votes',
        data: values,
        backgroundColor: colors,
        borderRadius: 8,
        barThickness: 22,
        maxBarThickness: 28,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 600, easing: 'easeOutQuart' },
      indexAxis: 'y',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1e293b',
          titleFont: { weight: '600' },
          bodyFont: { size: 13 },
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label(ctx) {
              return ` ${ctx.raw} vote${ctx.raw === 1 ? '' : 's'}`
            },
          },
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: { stepSize: 1, color: '#94a3b8', font: { size: 11 } },
          grid: { color: 'rgba(148, 163, 184, 0.12)' },
        },
        y: {
          ticks: { color: '#334155', font: { size: 12, weight: '600' as const } },
          grid: { display: false },
        },
      },
    },
  })

  donutChart = new Chart(donutCanvas.value, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: colors,
        borderColor: '#ffffff',
        borderWidth: 3,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 600, easing: 'easeOutQuart' },
      cutout: '65%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#475569',
            padding: 14,
            boxWidth: 10,
            boxHeight: 10,
            usePointStyle: true,
            font: { size: 11, weight: '600' as const },
          },
        },
        tooltip: {
          backgroundColor: '#1e293b',
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label(ctx) {
              return ` ${ctx.label}: ${ctx.raw} vote${ctx.raw === 1 ? '' : 's'}`
            },
          },
        },
      },
    },
  })
}

watch(() => props.results, renderCharts, { deep: true })
onMounted(renderCharts)
onUnmounted(destroyCharts)
</script>

<template>
  <BaseCard v-if="results" padding="lg" class="lv-results-card" role="region" aria-label="Live results">
    <!-- Live indicator -->
    <div class="lv-results-header">
      <div class="lv-results-title-group">
        <p class="lv-results-label">Results</p>
        <h3 class="lv-results-title">Vote breakdown</h3>
      </div>
      <BaseBadge variant="live" dot>Live</BaseBadge>
    </div>

    <!-- Winner card -->
    <WinnerCard :results="results" />

    <!-- Top ranked options (mini leaderboard) -->
    <div v-if="topOptions.length > 0" class="lv-space-y-2">
      <p class="lv-toprank-title">Top Ranked</p>
      <div class="lv-toprank-list">
        <div
          v-for="(option, idx) in topOptions"
          :key="option.id"
          class="lv-toprank-item"
        >
          <span
            class="lv-toprank-num"
            :class="idx === 0 ? 'lv-toprank-num--gold' : 'lv-toprank-num--silver'"
          >
            {{ idx + 1 }}
          </span>
          <span class="lv-toprank-name">{{ option.option }}</span>
          <div class="lv-toprank-bar-group">
            <div
              class="lv-toprank-bar"
              :class="idx === 0 ? 'lv-toprank-bar--gold' : 'lv-toprank-bar--standard'"
              :style="{ width: `${maxVotes > 0 ? (option.votes / maxVotes) * 80 : 0}px` }"
            />
            <span class="lv-toprank-votes">{{ option.votes }}</span>
            <span class="lv-toprank-pct">{{ option.percentage }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Charts grid -->
    <div class="lv-charts-grid">
      <!-- Bar chart -->
      <div class="lv-chart-container">
        <div class="lv-chart-header">
          <p class="lv-chart-title">Bar chart</p>
          <span class="lv-chart-subtitle">Votes by option</span>
        </div>
        <div class="lv-chart-canvas">
          <canvas ref="barCanvas" aria-label="Bar chart showing votes per option" />
        </div>
      </div>

      <!-- Donut chart -->
      <div class="lv-chart-container">
        <div class="lv-chart-header">
          <p class="lv-chart-title">Distribution</p>
          <span class="lv-chart-subtitle">Relative share</span>
        </div>
        <div class="lv-chart-canvas">
          <canvas ref="donutCanvas" aria-label="Donut chart showing vote distribution" />
        </div>
      </div>
    </div>

    <!-- Vote count summary -->
    <div class="lv-total-votes">
      <span class="lv-total-votes-label">Total votes</span>
      <span class="lv-total-votes-count">{{ results.totalVotes }}</span>
    </div>
  </BaseCard>
</template>
