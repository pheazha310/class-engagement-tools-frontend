<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  modelValue: {
    latitude: number | null
    longitude: number | null
    address: string
    name: string
  }
  height?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: typeof props.modelValue]
  placeSelected: [place: { name: string; address: string; latitude: number; longitude: number }]
}>()

const mapContainer = ref<HTMLDivElement>()
const searchInput = ref<HTMLInputElement>()
const mapError = ref<string | null>(null)
const mapLoading = ref(true)

let map: google.maps.Map | null = null
let marker: google.maps.Marker | null = null
let infoWindow: google.maps.InfoWindow | null = null
let autocomplete: google.maps.places.Autocomplete | null = null
let geocoder: google.maps.Geocoder | null = null

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

const mapStyles: google.maps.MapTypeStyle[] = [
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  {
    featureType: 'administrative',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#e5e7eb' }, { weight: 1.5 }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#f3f4f6' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#e5e7eb' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#dbeafe' }],
  },
  {
    featureType: 'landscape.natural',
    elementType: 'geometry',
    stylers: [{ color: '#f0fdf4' }],
  },
]

function initMap() {
  if (!mapContainer.value || !window.google) return

  const defaultCenter = props.modelValue.latitude && props.modelValue.longitude
    ? { lat: Number(props.modelValue.latitude), lng: Number(props.modelValue.longitude) }
    : { lat: 11.565, lng: 104.912 }

  map = new google.maps.Map(mapContainer.value, {
    center: defaultCenter,
    zoom: 15,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true,
    fullscreenControlOptions: { position: google.maps.ControlPosition.RIGHT_BOTTOM },
    zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_BOTTOM },
    styles: mapStyles,
    gestureHandling: 'greedy',
  })

  geocoder = new google.maps.Geocoder()
  infoWindow = new google.maps.InfoWindow({
    pixelOffset: new google.maps.Size(0, -40),
  })

  if (props.modelValue.latitude && props.modelValue.longitude) {
    addMarker(defaultCenter, props.modelValue.name)
  }

  map.addListener('click', (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      placeMarker(e.latLng)
      reverseGeocode(e.latLng)
    }
  })

  initAutocomplete()
  mapLoading.value = false
}

function initAutocomplete() {
  if (!searchInput.value || !map) return

  autocomplete = new google.maps.places.Autocomplete(searchInput.value, {
    types: ['establishment', 'geocode'],
    fields: ['name', 'formatted_address', 'geometry', 'place_id'],
  })

  autocomplete.bindTo('bounds', map)

  autocomplete.addListener('place_changed', () => {
    const place = autocomplete!.getPlace()
    if (!place.geometry?.location) return

    placeMarker(place.geometry.location)
    map!.setCenter(place.geometry.location)
    map!.setZoom(18)

    const name = place.name || ''
    const address = place.formatted_address || ''
    const lat = place.geometry.location.lat()
    const lng = place.geometry.location.lng()

    emit('placeSelected', { name, address, latitude: lat, longitude: lng })
    showInfoWindow(place.geometry.location, name || address)
  })
}

function addMarker(location: google.maps.LatLngLiteral, title?: string) {
  if (marker) marker.setMap(null)
  marker = new google.maps.Marker({
    position: location,
    map,
    title: title || 'Selected location',
    animation: google.maps.Animation.DROP,
    draggable: true,
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 10,
      fillColor: '#2563eb',
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 3,
    },
  })

  marker.addListener('dragend', () => {
    const pos = marker!.getPosition()
    if (pos) {
      reverseGeocode(pos)
      map?.setCenter(pos)
    }
  })
}

function placeMarker(location: google.maps.LatLng | google.maps.LatLngLiteral) {
  const latlng = 'lat' in location ? { lat: location.lat(), lng: location.lng() } : location
  addMarker(latlng)
  emit('update:modelValue', {
    ...props.modelValue,
    latitude: latlng.lat,
    longitude: latlng.lng,
  })
}

function showInfoWindow(location: google.maps.LatLng | google.maps.LatLngLiteral, content: string) {
  if (!infoWindow || !map) return
  infoWindow.setContent(`
    <div style="font-family: system-ui, sans-serif; padding: 4px 0;">
      <p style="margin: 0; font-size: 13px; font-weight: 600; color: #111827;">${content}</p>
    </div>
  `)
  infoWindow.open(map, marker || undefined)
}

function reverseGeocode(latlng: google.maps.LatLng | google.maps.LatLngLiteral) {
  if (!geocoder) return
  const loc = 'lat' in latlng ? latlng : new google.maps.LatLng(latlng.lat, latlng.lng)
  geocoder.geocode({ location: loc }, (results, status) => {
    if (status === 'OK' && results?.[0]) {
      const address = results[0].formatted_address
      emit('update:modelValue', {
        ...props.modelValue,
        latitude: 'lat' in latlng ? latlng.lat() : latlng.lat,
        longitude: 'lng' in latlng ? latlng.lng() : latlng.lng,
        address,
      })
      showInfoWindow(loc, address)
    }
  })
}

function loadGoogleMapsApi(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.maps) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&loading=async`
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => {
      mapError.value = 'Failed to load Google Maps. Please check your API key.'
      reject()
    }
    document.head.appendChild(script)
  })
}

watch(
  () => props.modelValue.latitude,
  (lat) => {
    if (lat && props.modelValue.longitude && map) {
      const pos = { lat: Number(lat), lng: Number(props.modelValue.longitude) }
      map.setCenter(pos)
      addMarker(pos, props.modelValue.name)
      if (props.modelValue.address) {
        showInfoWindow(pos, props.modelValue.name || props.modelValue.address)
      }
    }
  },
)

onMounted(async () => {
  if (!GOOGLE_MAPS_API_KEY) {
    mapError.value = 'Google Maps API key is not configured.'
    mapLoading.value = false
    return
  }
  try {
    await loadGoogleMapsApi()
    initMap()
  } catch {
    mapLoading.value = false
  }
})

onUnmounted(() => {
  map = null
  marker = null
  infoWindow = null
  autocomplete = null
  geocoder = null
})
</script>

<template>
  <div>
    <div v-if="mapError" class="rounded-xl bg-amber-50 border border-amber-100 p-4">
      <div class="flex items-start gap-3">
        <svg class="h-5 w-5 flex-shrink-0 text-amber-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
        <p class="text-sm text-amber-700">{{ mapError }}</p>
      </div>
    </div>
    <div v-else>
      <div class="relative mb-3">
        <svg class="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          ref="searchInput"
          type="text"
          placeholder="Search for a place or address..."
          class="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm transition-all duration-200 hover:border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <div class="relative rounded-xl overflow-hidden border border-gray-200" :style="{ height: height || '300px' }">
        <div
          v-if="mapLoading"
          class="absolute inset-0 flex items-center justify-center bg-gray-50 z-10"
        >
          <div class="text-center">
            <svg class="mx-auto h-8 w-8 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p class="mt-2 text-sm text-gray-400">Loading map...</p>
          </div>
        </div>
        <div ref="mapContainer" class="w-full h-full" />
      </div>

      <Transition
        enter-active-class="transition-all duration-300"
        leave-active-class="transition-all duration-200"
        enter-from-class="translate-y-1 opacity-0"
        leave-to-class="translate-y-1 opacity-0"
      >
        <div
          v-if="modelValue.address"
          class="mt-3 flex items-start gap-2.5 rounded-xl bg-gray-50 border border-gray-100 px-4 py-3"
        >
          <svg class="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <div class="flex-1 min-w-0">
            <p v-if="modelValue.name" class="text-sm font-medium text-gray-900 truncate">{{ modelValue.name }}</p>
            <p class="text-xs text-gray-500 truncate">{{ modelValue.address }}</p>
          </div>
          <div class="flex gap-1 text-xs text-gray-400 flex-shrink-0">
            <span v-if="modelValue.latitude">{{ modelValue.latitude.toFixed(4) }}</span>
            <span v-if="modelValue.latitude && modelValue.longitude">, </span>
            <span v-if="modelValue.longitude">{{ modelValue.longitude.toFixed(4) }}</span>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>
