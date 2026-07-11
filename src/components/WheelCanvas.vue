<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue'
import type { Participant, WheelTheme } from '@/types/wheel'
import { spinWheel } from '@/services/wheel'

const props = defineProps<{
  participants: Participant[]
  theme: WheelTheme
}>()

const emit = defineEmits<{
  spinComplete: [participant: Participant]
  spinError: [error: Error]
}>()

const size = 400
const center = size / 2
const radius = 180
const spinning = ref(false)
const rotation = ref(0)
const selected = ref<Participant | null>(null)
const error = ref<string | null>(null)

const sliceAngle = computed(() => (2 * Math.PI) / Math.max(props.participants.length, 1))
const sliceAngleDeg = computed(() => 360 / Math.max(props.participants.length, 1))

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const x1 = cx + r * Math.sin(startAngle)
  const y1 = cy - r * Math.cos(startAngle)
  const x2 = cx + r * Math.sin(endAngle)
  const y2 = cy - r * Math.cos(endAngle)
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`
}

function labelPosition(cx: number, cy: number, r: number, midAngle: number) {
  const x = cx + (r * 0.65) * Math.sin(midAngle)
  const y = cy - (r * 0.65) * Math.cos(midAngle)
  return { x, y }
}

const slices = computed(() => {
  return props.participants.map((_, i) => {
    const startAngle = i * sliceAngle.value
    const endAngle = (i + 1) * sliceAngle.value
    const midAngle = startAngle + sliceAngle.value / 2
    const pos = labelPosition(center, center, radius, midAngle)
    return {
      path: describeArc(center, center, radius, startAngle, endAngle),
      color: props.theme.colors[i % props.theme.colors.length],
      labelX: pos.x,
      labelY: pos.y,
      labelAngle: (midAngle * 180) / Math.PI,
    }
  })
})

async function spin() {
  if (spinning.value || props.participants.length === 0) return

  spinning.value = true
  error.value = null
  selected.value = null

  try {
    const result = await spinWheel(props.participants)
    selected.value = result

    const selectedIndex = props.participants.findIndex(
      (p) => p.id === result.id || p.name === result.name,
    )
    const midAngle = selectedIndex * sliceAngleDeg.value + sliceAngleDeg.value / 2
    const targetSliceAngle = ((360 - midAngle) % 360 + 360) % 360
    const extraRotations = 5 + Math.floor(Math.random() * 3)
    let delta = targetSliceAngle - (rotation.value % 360)
    if (delta < 0) delta += 360
    const targetRotation = rotation.value + extraRotations * 360 + delta

    const startRotation = rotation.value
    const duration = 3500
    const startTime = performance.now()

    function animate(timestamp: number) {
      const elapsed = timestamp - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easedProgress = easeOutCubic(progress)
      rotation.value = startRotation + (targetRotation - startRotation) * easedProgress

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        spinning.value = false
        emit('spinComplete', result)
      }
    }

    requestAnimationFrame(animate)
  } catch (err) {
    spinning.value = false
    const message = err instanceof Error ? err.message : 'Spin failed'
    error.value = message
    emit('spinError', err instanceof Error ? err : new Error(message))
  }
}

const pointerPoints = computed(() => {
  const tipX = center
  const tipY = center - radius + 10
  const baseWidth = 16
  const baseY = center - radius + 40
  return `${tipX},${tipY} ${tipX - baseWidth / 2},${baseY} ${tipX + baseWidth / 2},${baseY}`
})

onBeforeUnmount(() => {
  spinning.value = false
})
</script>

  <template>
    <div class="wheel-wrapper" :style="{ background: theme.backgroundColor }">
        <div class="wheel-container" @click="spin">
          <svg
            :viewBox="`0 0 ${size} ${size}`"
            class="wheel-svg"
            role="img"
            aria-label="Spinning wheel"
          >
          <circle :cx="center" :cy="center" :r="radius + 10" :fill="theme.wheelBackground" />
          <g :transform="`rotate(${rotation}, ${center}, ${center})`">
            <path
              v-for="(slice, i) in slices"
              :key="i"
              :d="slice.path"
              :fill="slice.color"
              :stroke="theme.sliceStroke"
              stroke-width="2"
            />
            <text
              v-for="(slice, i) in slices"
              :key="`label-${i}`"
              :x="slice.labelX"
              :y="slice.labelY"
              text-anchor="middle"
              dominant-baseline="central"
              :transform="`rotate(${slice.labelAngle}, ${slice.labelX}, ${slice.labelY})`"
              :fill="theme.textColor"
              font-size="14"
              font-weight="bold"
              class="slice-label"
            >
              {{ participants[i]?.name }}
            </text>
          </g>
          <polygon :points="pointerPoints" :fill="theme.pointerColor" :stroke="theme.pointerStroke" stroke-width="2" />
          <circle :cx="center" :cy="center" r="12" :fill="theme.centerColor" />
        </svg>
      </div>

      <div class="wheel-controls">
        <button
          class="spin-button"
          :disabled="spinning || participants.length === 0"
          :style="{
            background: `linear-gradient(135deg, ${theme.buttonGradient[0]}, ${theme.buttonGradient[1]})`,
            boxShadow: `0 4px 15px ${theme.buttonShadow}`,
          }"
          @click="spin"
        >
          {{ spinning ? 'Spinning...' : 'Spin the Wheel' }}
        </button>

        <div v-if="error" class="error-message" :style="{ color: theme.pointerColor }">
          {{ error }}
        </div>

        <div v-if="selected && !spinning" class="result-message" :style="{ background: theme.wheelBackground, border: `1px solid ${theme.sliceStroke}` }">
          <span class="result-label">Selected:</span>
          <span class="result-name" :style="{ color: theme.pointerColor }">{{ selected.name }}</span>
        </div>
      </div>
    </div>
  </template>

<style scoped>
.wheel-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  width: 100%;
  max-width: 520px;
  margin: 0 auto;
  padding: 24px;
}

.wheel-container {
  width: 100%;
  max-width: 400px;
  position: relative;
}

.wheel-svg {
  width: 100%;
  height: auto;
  display: block;
}

.slice-label {
  pointer-events: none;
  user-select: none;
}

.wheel-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  width: 100%;
}

.spin-button {
  padding: 14px 48px;
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #e94560, #c0392b);
  border: none;
  border-radius: 50px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 4px 15px rgba(233, 69, 96, 0.4);
}

.spin-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(233, 69, 96, 0.5);
}

.spin-button:active:not(:disabled) {
  transform: translateY(0);
}

.spin-button:disabled {
  background: #555;
  cursor: not-allowed;
  box-shadow: none;
}

.error-message {
  color: #e74c3c;
  font-size: 14px;
  text-align: center;
}

.result-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: #1a1a2e;
  border-radius: 12px;
  font-size: 18px;
  animation: fadeIn 0.4s ease;
}

.result-label {
  color: #aaa;
  font-weight: 500;
}

.result-name {
  color: #4ecdc4;
  font-weight: 700;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 480px) {
  .wheel-wrapper {
    padding: 16px;
    gap: 16px;
  }

  .spin-button {
    width: 100%;
    padding: 12px 24px;
    font-size: 16px;
  }

  .result-message {
    width: 100%;
    justify-content: center;
    font-size: 16px;
  }
}
</style>
