<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import QRCode from 'qrcode'

const props = defineProps<{
  show: boolean
  joinUrl: string
  roomCode: string
}>()

const emit = defineEmits<{
  close: []
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const qrDataUrl = ref('')

async function generateQR() {
  if (!props.joinUrl || !canvasRef.value) return
  try {
    qrDataUrl.value = await QRCode.toDataURL(props.joinUrl, {
      width: 256,
      margin: 2,
      color: { dark: '#1e293b', light: '#ffffff' },
    })
  } catch {
    // QR generation failed
  }
}

async function downloadQR() {
  if (!qrDataUrl.value) return
  const link = document.createElement('a')
  link.download = `poll-${props.roomCode}-qr.png`
  link.href = qrDataUrl.value
  link.click()
}

onMounted(() => {
  if (props.show) generateQR()
})

watch(() => props.show, (val) => {
  if (val) generateQR()
})
</script>

<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    @click.self="emit('close')"
  >
    <div class="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800">
      <div class="mb-4 flex items-center justify-between">
        <h3 class="text-lg font-bold text-gray-900 dark:text-white">Join Poll</h3>
        <button
          class="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
          @click="emit('close')"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="flex justify-center">
        <canvas ref="canvasRef" class="hidden" />
        <img v-if="qrDataUrl" :src="qrDataUrl" alt="QR Code" class="h-64 w-64" />
      </div>

      <div class="mt-4 text-center">
        <p class="text-sm text-gray-500 dark:text-gray-400">Scan to join</p>
        <p class="mt-1 font-mono text-2xl font-bold tracking-widest text-indigo-600">{{ roomCode }}</p>
      </div>

      <div class="mt-4 flex gap-2">
        <button
          class="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
          @click="downloadQR"
        >
          Download
        </button>
        <button
          class="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          @click="emit('close')"
        >
          Close
        </button>
      </div>
    </div>
  </div>
</template>
