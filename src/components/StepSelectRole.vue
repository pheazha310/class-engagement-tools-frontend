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
    <p class="mb-2 text-center text-sm text-gray-500">Choose how you'll use the platform</p>
    <p class="mb-6 text-center text-xs text-gray-400">You can change this later in settings</p>

    <div class="grid gap-5 sm:grid-cols-2">
      <button
        v-for="role in roles"
        :key="role.id"
        type="button"
        class="group relative overflow-hidden rounded-2xl border-2 p-6 text-left transition-all duration-300"
        :class="[
          selectedRole === role.id
            ? `${role.borderColor} ${role.lightBg} shadow-lg ${role.shadowColor} scale-[1.02]`
            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md hover:-translate-y-0.5',
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
            :class="selectedRole === role.id ? `bg-gradient-to-br ${role.gradient} text-white shadow-md` : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'"
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
          :class="selectedRole === role.id ? (role.id === 'teacher' ? 'text-blue-800' : 'text-emerald-800') : 'text-gray-900 group-hover:text-gray-800'"
        >
          {{ role.title }}
        </h3>
        <p class="mb-4 text-sm leading-relaxed text-gray-500">{{ role.description }}</p>

        <ul class="space-y-1.5">
          <li
            v-for="feature in role.features"
            :key="feature"
            class="flex items-center gap-2 text-xs"
            :class="selectedRole === role.id ? (role.id === 'teacher' ? 'text-blue-600' : 'text-emerald-600') : 'text-gray-400'"
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
        class="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition-all duration-200 hover:bg-gray-50 hover:border-gray-300 active:scale-[0.98]"
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
        class="group relative flex-1 overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition-all duration-200 hover:shadow-xl hover:shadow-blue-300 hover:from-blue-700 hover:to-blue-800 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none active:scale-[0.98]"
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
