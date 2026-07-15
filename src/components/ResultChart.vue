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
let pieChart: Chart<'doughnut'> | null = null

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
        borderRadius: 10,
        barThickness: 18,
        maxBarThickness: 24,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 500 },
      indexAxis: 'y',
      layout: {
        padding: {
          top: 8,
          right: 8,
          bottom: 8,
          left: 8,
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label(context) {
              return ` ${context.raw} vote${context.raw === 1 ? '' : 's'}`
            },
          },
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
            color: '#64748b',
          },
          grid: {
            color: 'rgba(148, 163, 184, 0.16)',
          },
        },
        y: {
          ticks: {
            color: '#0f172a',
            font: {
              size: 12,
              weight: 600,
            },
          },
          grid: {
            display: false,
          },
        },
      },
    },
  })

  pieChart = new Chart(pieCanvas.value, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: colors.slice(0, values.length),
        borderColor: '#ffffff',
        borderWidth: 3,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 500 },
      cutout: '62%',
      layout: {
        padding: 12,
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#475569',
            padding: 16,
            boxWidth: 12,
            boxHeight: 12,
            usePointStyle: true,
            font: { size: 12, weight: 600 },
          },
        },
        tooltip: {
          callbacks: {
            label(context) {
              return ` ${context.label}: ${context.raw} vote${context.raw === 1 ? '' : 's'}`
            },
          },
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
    <div class="rounded-[24px] border border-slate-200 bg-slate-950 p-5 text-white shadow-[0_14px_40px_rgba(15,23,42,0.16)]">
      <div class="mb-4 flex items-center justify-between">
        <h4 class="text-sm font-semibold uppercase tracking-[0.24em] text-slate-300">Bar chart</h4>
        <span class="text-xs text-slate-400">Votes by option</span>
      </div>
      <div class="h-[320px]">
        <canvas ref="barCanvas" />
      </div>
    </div>
    <div class="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.08)]">
      <div class="mb-4 flex items-center justify-between">
        <h4 class="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Distribution</h4>
        <span class="text-xs text-slate-400">Relative share</span>
      </div>
      <div class="h-[320px]">
        <canvas ref="pieCanvas" />
      </div>
    </div>
  </div>
</template>
