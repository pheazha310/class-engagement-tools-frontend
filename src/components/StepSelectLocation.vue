<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRegistrationStore } from '@/stores/registrationStore'
import { locationService } from '@/services/locationService'
import SearchableSelect from '@/components/SearchableSelect.vue'
import type { Country, Province } from '@/types/location'

const store = useRegistrationStore()

const countries = ref<Country[]>([])
const provinces = ref<Province[]>([])

const loadingCountries = ref(false)
const loadingProvinces = ref(false)

const countryId = ref<number | null>(store.data.country_id)
const provinceId = ref<number | null>(store.data.province_id)

const locationLevels = [
  { key: 'country', label: 'Country', icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { key: 'province', label: 'Province', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' },
]

async function loadCountries() {
  loadingCountries.value = true
  try {
    countries.value = await locationService.getCountries()
  } finally {
    loadingCountries.value = false
  }
}

async function loadProvinces(id: number) {
  loadingProvinces.value = true
  provinceId.value = null
  try {
    provinces.value = await locationService.getProvinces(id)
  } catch (e) {
    console.error('Failed to load provinces:', e)
  } finally {
    loadingProvinces.value = false
  }
}

watch(countryId, (id) => {
  if (id) loadProvinces(id)
})

function handleSave() {
  store.updateLocation({
    country_id: countryId.value,
    province_id: provinceId.value,
  })
  store.nextStep()
}

function getSelectedLabel(key: string): string {
  switch (key) {
    case 'country': return countries.value.find((c) => c.id === countryId.value)?.name ?? ''
    case 'province': return provinces.value.find((p) => p.id === provinceId.value)?.name ?? ''
    default: return ''
  }
}

const loadingMap: Record<string, ReturnType<typeof ref>> = {
  country: loadingCountries,
  province: loadingProvinces,
}

const disabledMap: Record<string, () => boolean> = {
  country: () => false,
  province: () => !countryId.value,
}

const valueMap: Record<string, ReturnType<typeof ref>> = {
  country: countryId,
  province: provinceId,
}

const optionsMap: Record<string, ReturnType<typeof ref>> = {
  country: countries,
  province: provinces,
}

loadCountries()
</script>

<template>
  <div>
    <p class="mb-1 text-center text-sm text-slate-300">Select your location to find nearby schools</p>
    <p class="mb-6 text-center text-xs text-slate-500">Each selection filters the next level</p>

    <div class="space-y-3">
      <div
        v-for="(level, idx) in locationLevels"
        :key="level.key"
        class="flex items-start gap-3"
      >
        <div class="flex flex-col items-center pt-2.5">
          <div
            class="flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-300"
            :class="getSelectedLabel(level.key) ? 'bg-cyan-400/20 text-cyan-300' : 'bg-slate-800 text-slate-500'"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" :d="level.icon" />
            </svg>
          </div>
          <div v-if="idx < locationLevels.length - 1" class="mt-1 h-full w-px bg-slate-700 min-h-[2rem]" />
        </div>
        <div class="flex-1 pb-1">
          <SearchableSelect
            :model-value="(valueMap[level.key] as any).value"
            :options="(optionsMap[level.key] as any).value"
            :label="level.label"
            :placeholder="`Select ${level.label.toLowerCase()}`"
            :loading="(loadingMap[level.key] as any).value"
            :disabled="disabledMap[level.key]?.() ?? false"
            @update:model-value="(val: any) => { (valueMap[level.key] as any).value = val }"
          />
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
        :disabled="!provinceId"
        class="group relative flex-1 overflow-hidden rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-200/30 transition-all duration-200 hover:shadow-xl hover:shadow-cyan-300/40 hover:from-cyan-300 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none active:scale-[0.98]"
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
  </div>
</template>
