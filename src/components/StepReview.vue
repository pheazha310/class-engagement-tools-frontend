<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRegistrationStore } from '@/stores/registrationStore'
import { useAuthStore } from '@/stores/authStore'
import { locationService } from '@/services/locationService'
import { schoolService } from '@/services/schoolService'
import GoogleMap from '@/components/GoogleMap.vue'

const store = useRegistrationStore()
const authStore = useAuthStore()

const loadingLabels = ref(false)
const labels = ref({
  country: '',
  province: '',
  school: '',
})

const mapValue = ref({
  latitude: null as number | null,
  longitude: null as number | null,
  address: '',
  name: '',
})

const summarySections = [
  {
    title: 'Account',
    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    fields: [
      { label: 'Full Name', value: store.data.name },
      { label: 'Email', value: store.data.email },
    ],
  },
  {
    title: 'Role',
    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    fields: [
      { label: 'Role', value: store.data.role === 'teacher' ? 'Teacher' : 'Student', badge: true },
    ],
  },
  {
    title: 'Location',
    icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z',
    fields: [
      { label: 'Country', value: labels.value.country },
      { label: 'Province', value: labels.value.province },
    ],
  },
  {
    title: 'School',
    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    fields: [
      { label: 'School', value: labels.value.school || 'Not selected' },
    ],
  },
]

async function loadLabels() {
  loadingLabels.value = true
  try {
    const [countries, provinces, schools] = await Promise.all([
      locationService.getCountries(),
      store.data.country_id ? locationService.getProvinces(store.data.country_id) : Promise.resolve([]),
      store.data.school_id && store.data.province_id ? schoolService.getLocationSchools(store.data.province_id) : Promise.resolve([]),
    ])

    labels.value = {
      country: countries.find((c) => c.id === store.data.country_id)?.name ?? '',
      province: provinces.find((p) => p.id === store.data.province_id)?.name ?? '',
      school: schools.find((s) => s.id === store.data.school_id)?.name ?? '',
    }

    const school = schools.find((s) => s.id === store.data.school_id)
    if (school) {
      mapValue.value = {
        latitude: school.latitude ? Number(school.latitude) : null,
        longitude: school.longitude ? Number(school.longitude) : null,
        address: school.address ?? '',
        name: school.name,
      }
    }
  } finally {
    loadingLabels.value = false
  }
}

async function handleFinish() {
  try {
    await store.submitRegistration()
    await authStore.fetchUser()
  } catch {
    // error handled in store
  }
}

onMounted(() => {
  loadLabels()
})
</script>

<template>
  <div>
    <p class="mb-1 text-center text-sm text-slate-300">Review your information before submitting</p>
    <p class="mb-6 text-center text-xs text-slate-500">Please check that everything is correct</p>

    <div v-if="loadingLabels" class="space-y-4">
        <div v-for="i in 4" :key="i" class="rounded-xl border border-slate-700 bg-slate-950 overflow-hidden">
        <div class="border-b border-slate-800 bg-slate-900/70 px-5 py-3">
          <div class="h-4 w-24 animate-pulse rounded bg-slate-700" />
        </div>
        <div class="p-5 space-y-3">
          <div v-for="j in 3" :key="j" class="h-5 animate-pulse rounded bg-slate-800" />
        </div>
      </div>
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="(section, idx) in summarySections"
        :key="section.title"
        class="rounded-xl border border-slate-700 bg-slate-950 overflow-hidden transition-all duration-200 hover:shadow-sm"
        :style="{ animationDelay: `${idx * 100}ms` }"
      >
        <div class="flex items-center gap-2.5 border-b border-slate-800 bg-slate-900/70 px-5 py-3">
          <div class="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-400/20 text-cyan-300">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" :d="section.icon" />
            </svg>
          </div>
          <span class="text-sm font-semibold text-slate-100">{{ section.title }}</span>
        </div>
        <div class="divide-y divide-gray-50">
          <div
            v-for="field in section.fields"
            :key="field.label"
            class="flex items-center justify-between px-5 py-3"
          >
            <span class="text-sm text-slate-400">{{ field.label }}</span>
            <span v-if="'badge' in field && field.badge" class="rounded-full px-3 py-0.5 text-xs font-semibold"
              :class="store.data.role === 'teacher' ? 'bg-cyan-400/15 text-cyan-200' : 'bg-emerald-400/15 text-emerald-200'"
            >
              {{ field.value }}
            </span>
            <span v-else class="text-sm font-medium text-slate-100 text-right max-w-[60%] truncate">{{ field.value || '\u2014' }}</span>
          </div>
        </div>
      </div>

      <div v-if="mapValue.latitude" class="rounded-xl border border-slate-700 overflow-hidden">
        <div class="border-b border-slate-800 bg-slate-900/70 px-5 py-3">
          <span class="text-sm font-semibold text-slate-100">School Location Preview</span>
        </div>
        <GoogleMap v-model="mapValue" height="200px" />
      </div>
    </div>

    <div v-if="store.error" class="mt-4 rounded-xl bg-red-500/10 border border-red-500/20 px-5 py-4">
      <div class="flex items-start gap-3">
        <svg class="h-5 w-5 flex-shrink-0 text-red-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
        </svg>
        <div>
          <p class="text-sm font-medium text-red-200">Registration Error</p>
          <p class="text-sm text-red-300 mt-0.5">{{ store.error }}</p>
        </div>
      </div>
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
        :disabled="store.loading"
        class="group relative flex-1 overflow-hidden rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-200/30 transition-all duration-200 hover:shadow-xl hover:shadow-cyan-300/40 hover:from-cyan-300 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none active:scale-[0.98]"
        @click="handleFinish"
      >
        <span v-if="store.loading" class="flex items-center justify-center gap-2">
          <svg class="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Creating Account...
        </span>
        <span v-else class="flex items-center justify-center gap-2">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Complete Registration
        </span>
      </button>
    </div>
  </div>
</template>
