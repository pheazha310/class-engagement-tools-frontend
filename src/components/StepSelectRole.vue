<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRegistrationStore } from '@/stores/registrationStore'

const store = useRegistrationStore()
const selectedRole = ref<string | null>(store.data.role)
const hoveredRole = ref<string | null>(null)

const roles = [
  {
    id: 'teacher',
    title: 'Teacher',
    description: 'Create classes, quizzes, attendance, and manage students.',
    features: ['Create & manage classes', 'Create quizzes', 'Track attendance', 'Manage students'],
    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    gradient: 'from-blue-500 to-indigo-600',
    lightBg: 'bg-blue-50',
    borderColor: 'border-blue-500',
    shadowColor: 'shadow-blue-200',
    checkBg: 'bg-blue-600',
  },
  {
    id: 'student',
    title: 'Student',
    description: 'Join classes, complete quizzes, view attendance, and view scores.',
    features: ['Join classes', 'Complete quizzes', 'View attendance', 'Track scores'],
    icon: 'M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z',
    gradient: 'from-emerald-500 to-teal-600',
    lightBg: 'bg-emerald-50',
    borderColor: 'border-emerald-500',
    shadowColor: 'shadow-emerald-200',
    checkBg: 'bg-emerald-600',
  },
]

function selectRole(roleId: string) {
  selectedRole.value = roleId
  store.updateRole(roleId as 'teacher' | 'student')
}

const isValid = computed(() => selectedRole.value !== null)
</script>

<template>
  <div>
    <p class="mb-2 text-center text-sm text-slate-300">Choose how you'll use the platform</p>
    <p class="mb-6 text-center text-xs text-slate-500">You can change this later in settings</p>

    <div class="grid gap-5 sm:grid-cols-2">
      <button
        v-for="role in roles"
        :key="role.id"
        type="button"
        class="group relative overflow-hidden rounded-2xl border-2 p-6 text-left transition-all duration-300"
        :class="[
          selectedRole === role.id
            ? `${role.borderColor} bg-slate-900 shadow-lg shadow-cyan-500/10 scale-[1.02]`
            : 'border-slate-700 bg-slate-950 hover:border-slate-500 hover:shadow-md hover:-translate-y-0.5',
        ]"
        @click="selectRole(role.id)"
        @mouseenter="hoveredRole = role.id"
        @mouseleave="hoveredRole = null"
      >
        <div
          v-if="selectedRole === role.id"
          class="absolute inset-0 opacity-5"
          :class="`bg-gradient-to-br ${role.gradient}`"
        />

        <div class="relative flex items-start justify-between mb-4">
          <div
            class="inline-flex rounded-xl p-3.5 transition-all duration-300"
            :class="selectedRole === role.id ? `bg-gradient-to-br ${role.gradient} text-white shadow-md` : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'"
          >
            <svg class="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" :d="role.icon" />
            </svg>
          </div>

          <div
            v-if="selectedRole === role.id"
            class="flex h-7 w-7 items-center justify-center rounded-full text-white shadow-sm animate-scale-check"
            :class="role.checkBg"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <h3
          class="mb-2 text-lg font-bold transition-colors"
          :class="selectedRole === role.id ? (role.id === 'teacher' ? 'text-cyan-200' : 'text-emerald-200') : 'text-slate-100 group-hover:text-white'"
        >
          {{ role.title }}
        </h3>
        <p class="mb-4 text-sm leading-relaxed text-slate-400">{{ role.description }}</p>

        <ul class="space-y-1.5">
          <li
            v-for="feature in role.features"
            :key="feature"
            class="flex items-center gap-2 text-xs"
            :class="selectedRole === role.id ? (role.id === 'teacher' ? 'text-cyan-300' : 'text-emerald-300') : 'text-slate-500'"
          >
            <svg class="h-3.5 w-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
            </svg>
            {{ feature }}
          </li>
        </ul>
      </button>
    </div>

    <div class="mt-8 flex gap-3">
      <button
        type="button"
        class="flex-1 rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition-all duration-200 hover:bg-slate-900 hover:border-slate-500 active:scale-[0.98]"
        @click="store.prevStep()"
      >
        <svg class="mr-1.5 inline h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>
      <button
        type="button"
        :disabled="!isValid"
        class="group relative flex-1 overflow-hidden rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-200/30 transition-all duration-200 hover:shadow-xl hover:shadow-cyan-300/40 hover:from-cyan-300 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none active:scale-[0.98]"
        @click="store.nextStep()"
      >
        <span class="flex items-center justify-center gap-2">
          Continue
          <svg class="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </button>
    </div>
  </div>
</template>
