<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useRegistrationStore } from '@/stores/registrationStore'
import { schoolService } from '@/services/schoolService'
import GoogleMap from '@/components/GoogleMap.vue'
import RequestSchoolModal from '@/components/RequestSchoolModal.vue'
import type { School } from '@/types/location'

const store = useRegistrationStore()

const schools = ref<School[]>([])
const selectedSchoolId = ref<number | null>(store.data.school_id)
const loading = ref(false)
const searchQuery = ref('')
const showRequestModal = ref(false)

const mapValue = ref({
  latitude: null as number | null,
  longitude: null as number | null,
  address: '',
  name: '',
})

const selectedSchool = computed(() =>
  schools.value.find((s) => s.id === selectedSchoolId.value) ?? null,
)

watch(selectedSchool, (school) => {
  if (school) {
    mapValue.value = {
      latitude: school.latitude ? Number(school.latitude) : null,
      longitude: school.longitude ? Number(school.longitude) : null,
      address: school.address ?? '',
      name: school.name,
    }
  }
})

let debounceTimer: ReturnType<typeof setTimeout>
watch(searchQuery, (q) => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(async () => {
    if (!store.data.province_id) return
    loading.value = true
    try {
      schools.value = await schoolService.getLocationSchools(store.data.province_id, q || undefined)
    } finally {
      loading.value = false
    }
  }, 300)
})

async function loadSchools() {
  if (!store.data.province_id) return
  loading.value = true
  try {
    schools.value = await schoolService.getLocationSchools(store.data.province_id)
  } finally {
    loading.value = false
  }
}

function selectSchool(id: number) {
  selectedSchoolId.value = id
  store.updateSchool(id)
}

function handleSave() {
  store.updateSchool(selectedSchoolId.value)
  store.nextStep()
}

function handlePlaceSelected(place: { name: string; address: string; latitude: number; longitude: number }) {
  mapValue.value = {
    latitude: place.latitude,
    longitude: place.longitude,
    address: place.address,
    name: place.name,
  }
}

function onRequestSubmitted() {
  showRequestModal.value = false
}

loadSchools()
</script>

<template>
  <div>
    <p class="mb-1 text-center text-sm text-gray-500">Select your school from the list or search on the map</p>
    <p class="mb-6 text-center text-xs text-gray-400">You can also request a new school if not listed</p>

    <div class="space-y-4">
      <div class="relative">
        <svg class="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search schools by name..."
          class="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm transition-all duration-200 hover:border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <div class="rounded-xl border border-gray-200 overflow-hidden">
        <div class="border-b border-gray-100 bg-gray-50/50 px-4 py-2">
          <span class="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Available Schools
            <span v-if="schools.length" class="ml-1 text-blue-500">({{ schools.length }})</span>
          </span>
        </div>
        <div class="max-h-44 overflow-y-auto divide-y divide-gray-50">
          <div v-if="loading" class="flex items-center justify-center py-8">
            <svg class="h-6 w-6 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
          <button
            v-for="school in schools"
            v-else
            :key="school.id"
            type="button"
            class="flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-all duration-150 hover:bg-blue-50"
            :class="selectedSchoolId === school.id ? 'bg-blue-50' : ''"
            @click="selectSchool(school.id)"
          >
            <div
              class="flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all duration-200 flex-shrink-0"
              :class="selectedSchoolId === school.id ? 'border-blue-600' : 'border-gray-300'"
            >
              <div
                v-if="selectedSchoolId === school.id"
                class="h-2.5 w-2.5 rounded-full bg-blue-600 animate-scale-check"
              />
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-gray-900 truncate">{{ school.name }}</div>
              <div v-if="school.address" class="mt-0.5 text-xs text-gray-400 truncate">{{ school.address }}</div>
            </div>
            <svg class="h-4 w-4 flex-shrink-0 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <div v-if="!loading && schools.length === 0" class="px-4 py-8 text-center">
            <svg class="mx-auto mb-2 h-8 w-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <p class="text-sm text-gray-400">No schools found in your selected province.</p>
          </div>
        </div>
      </div>

      <div class="rounded-xl border border-gray-200 overflow-hidden bg-white">
        <div class="border-b border-gray-100 bg-gray-50/50 px-4 py-2">
          <span class="text-xs font-medium text-gray-500 uppercase tracking-wider">School Location</span>
        </div>
        <div class="p-3">
          <GoogleMap v-model="mapValue" height="260px" @place-selected="handlePlaceSelected" />
        </div>
      </div>

      <div class="relative rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-5 text-center transition-all duration-200 hover:border-blue-200 hover:bg-blue-50/30">
        <p class="text-sm text-gray-500 mb-3">Can't find your school?</p>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-blue-700 shadow-sm border border-blue-200 transition-all duration-200 hover:bg-blue-50 hover:shadow-md active:scale-[0.98]"
          @click="showRequestModal = true"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Request New School
        </button>
      </div>
    </div>

    <div class="mt-6 flex gap-3">
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
        :disabled="!selectedSchoolId"
        class="group relative flex-1 overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition-all duration-200 hover:shadow-xl hover:shadow-blue-300 hover:from-blue-700 hover:to-blue-800 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none active:scale-[0.98]"
        @click="handleSave"
      >
        <span class="flex items-center justify-center gap-2">
          Continue
          <svg class="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </button>
    </div>

    <RequestSchoolModal
      v-if="showRequestModal"
      @close="showRequestModal = false"
      @submitted="onRequestSubmitted"
    />
  </div>
</template>
