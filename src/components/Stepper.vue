<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  steps: string[]
  currentStep: number
}>()

const stepIcons = [
  'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  'M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0',
  'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z',
  'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
]

const progress = computed(() => {
  return ((props.currentStep - 1) / (props.steps.length - 1)) * 100
})
</script>

<template>
  <div class="relative">
    <div class="absolute top-5 left-0 right-0 h-0.5 rounded-full bg-slate-800">
      <div
        class="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600 transition-all duration-500 ease-out"
        :style="{ width: `${progress}%` }"
      />
    </div>

    <div class="relative flex items-center justify-between">
      <div
        v-for="(step, index) in steps"
        :key="index"
        class="flex flex-col items-center"
        :class="{ 'flex-1': true }"
      >
        <div
          class="relative flex h-10 w-10 items-center justify-center rounded-full transition-all duration-500"
          :class="
            index + 1 === currentStep
              ? 'bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-lg shadow-cyan-500/20 scale-110'
              : index + 1 < currentStep
                ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md'
                : 'border-2 border-slate-700 bg-slate-950 text-slate-500'
          "
        >
          <svg
            v-if="index + 1 < currentStep"
            class="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
          </svg>
          <svg
            v-else
            class="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" :d="stepIcons[index]" />
          </svg>

          <div
            v-if="index + 1 === currentStep"
            class="absolute -inset-1 rounded-full bg-blue-400/20 animate-pulse"
          />
        </div>

        <div class="mt-2.5 text-center">
          <span
            class="text-xs font-semibold tracking-wide transition-all duration-300"
            :class="
              index + 1 === currentStep
                ? 'text-cyan-300'
                : index + 1 < currentStep
                  ? 'text-sky-300'
                  : 'text-slate-500'
            "
          >
            {{ step }}
          </span>
        </div>

        <div v-if="index < steps.length - 1" class="hidden" />
      </div>
    </div>
  </div>
</template>
