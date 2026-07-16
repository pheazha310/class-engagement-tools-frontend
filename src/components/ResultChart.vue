<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { Chart, registerables } from 'chart.js'
import type { PollResultsData } from '@/types/poll'

Chart.register(...registerables)

const props = defineProps<{
  data: PollResultsData | null
}>()

const barCanvas = ref<HTMLCanvasElement | null>(null)
const pieCanvas = ref<HTMLCanvasElement | null>(null)
let barChart: Chart<'bar'> | null = null
let pieChart: Chart<'pie'> | null = null

function createCharts() {
  if (!props.data || !barCanvas.value || !pieCanvas.value) return

  const labels = props.data.results.map((r) => r.option)
  const values = props.data.results.map((r) => r.votes)
  const colors = [
    '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
    '#ec4899', '#f43f5e', '#f97316', '#eab308',
    '#22c55e', '#06b6d4',
  ]

  if (barChart) barChart.destroy()
  if (pieChart) pieChart.destroy()

  barChart = new Chart(barCanvas.value, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Votes',
        data: values,
        backgroundColor: colors.slice(0, values.length),
        borderRadius: 6,
      }],
    },
    options: {
      responsive: true,
      animation: { duration: 400 },
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1 },
        },
      },
    },
  })

  pieChart = new Chart(pieCanvas.value, {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: colors.slice(0, values.length),
      }],
    },
    options: {
      responsive: true,
      animation: { duration: 400 },
      plugins: {
        legend: {
          position: 'bottom',
          labels: { font: { size: 12 } },
        },
      },
    },
  })
}

watch(() => props.data, createCharts, { deep: true })

onMounted(createCharts)
onUnmounted(() => {
  barChart?.destroy()
  pieChart?.destroy()
})
</script>

<template>
  <div v-if="data" class="grid gap-6 lg:grid-cols-2">
    <div class="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <h4 class="mb-3 text-sm font-semibold text-gray-600 dark:text-gray-400">Bar Chart</h4>
      <canvas ref="barCanvas" />
    </div>
    <div class="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <h4 class="mb-3 text-sm font-semibold text-gray-600 dark:text-gray-400">Pie Chart</h4>
      <canvas ref="pieCanvas" />
    </div>
  </div>
</template>
