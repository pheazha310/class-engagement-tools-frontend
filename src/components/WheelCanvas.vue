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
  closeWinner: []
  removeWinner: [participant: Participant]
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
        midAngle,
      }
    })
  })

  const labels = computed(() => {
    return slices.value.map((slice, i) => {
      const startAngle = i * sliceAngle.value
      const endAngle = (i + 1) * sliceAngle.value
      const textRadius = radius * 0.78
      const x1 = center + textRadius * Math.sin(startAngle)
      const y1 = center - textRadius * Math.cos(startAngle)
      const x2 = center + textRadius * Math.sin(endAngle)
      const y2 = center - textRadius * Math.cos(endAngle)
      const largeArc = endAngle - startAngle > Math.PI ? 1 : 0
      const pathId = `slice-text-path-${i}-${props.participants.length}`
      return {
        path: `M ${x1} ${y1} A ${textRadius} ${textRadius} 0 ${largeArc} 1 ${x2} ${y2}`,
        pathId,
        name: props.participants[i]?.name ?? '',
      }
    })
  })

  function labelHref(label: { pathId: string }) {
    return `#${label.pathId}`
  }

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

function closePopup() {
  selected.value = null
  emit('closeWinner')
}

function confirmRemove() {
  if (selected.value) {
    emit('removeWinner', selected.value)
    selected.value = null
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
          <defs>
            <path
              v-for="(label, i) in labels"
              :key="`path-${i}`"
              :id="label.pathId"
              :d="label.path"
              fill="none"
            />
          </defs>
          <circle :cx="center" :cy="center" :r="radius + 10" :fill="theme.wheelBackground" />
          <circle :cx="center" :cy="center" :r="radius + 6" :fill="'none'" :stroke="'#000000'" stroke-width="6" opacity="0.85" />
          <g :transform="`rotate(${rotation}, ${center}, ${center})`">
            <path
              v-for="(slice, i) in slices"
              :key="i"
              :d="slice.path"
              :fill="slice.color"
              :stroke="theme.sliceStroke"
              stroke-width="3"
            />
            <text
              v-for="(label, i) in labels"
              :key="`label-${i}`"
              :fill="theme.textColor"
              font-size="13"
              font-weight="bold"
              class="slice-label"
            >
              <textPath :href="labelHref(label)" startOffset="50%" text-anchor="middle">
                {{ label.name }}
              </textPath>
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
          <span class="spin-button-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
              <path d="M10.5 7.5v9l8.5-5.25z" />
            </svg>
          </span>
          <span class="spin-button-text">{{ spinning ? 'Spinning...' : 'Spin the Wheel' }}</span>
        </button>

        <div v-if="error" class="error-message" :style="{ color: theme.pointerColor }">
          {{ error }}
        </div>
      </div>

      <transition name="popup">
        <div
          v-if="selected && !spinning"
          class="winner-popup"
          @click.self="closePopup"
        >
          <div class="winner-popup-card" :style="{ background: theme.wheelBackground, border: `1px solid ${theme.sliceStroke}` }">
            <div class="winner-popup-header" :style="{ background: theme.pointerColor }">
              <span class="winner-popup-title">We have a winner!</span>
              <button type="button" class="winner-popup-close" @click="closePopup" aria-label="Close">
                ×
              </button>
            </div>
            <div class="winner-popup-body">
              <div class="winner-popup-name" :style="{ color: theme.textColor }">{{ selected.name }}</div>
            </div>
            <div class="winner-popup-footer">
              <button type="button" class="winner-popup-close-text" @click="closePopup">Close</button>
              <button type="button" class="winner-popup-remove" @click="confirmRemove">Remove</button>
            </div>
          </div>
        </div>
      </transition>
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px 28px;
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

.spin-button-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
}

.spin-button-icon svg {
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.35));
  margin-left: 2px;
}

.spin-button-text {
  letter-spacing: 0.02em;
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

.winner-popup {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(3px);
  animation: fadeIn 0.25s ease;
}

.winner-popup-card {
  width: 100%;
  max-width: 420px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
  animation: scaleIn 0.3s ease;
}

.winner-popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: #e53935;
}

.winner-popup-title {
  color: #fff;
  font-size: 16px;
  font-weight: 800;
}

.winner-popup-close {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  transition: background 0.15s;
}

.winner-popup-close:hover {
  background: rgba(255, 255, 255, 0.3);
}

.winner-popup-body {
  padding: 28px 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.winner-popup-name {
  font-size: 32px;
  font-weight: 800;
  text-align: center;
  word-break: break-word;
}

.winner-popup-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 20px 18px;
}

.winner-popup-close-text {
  background: transparent;
  border: none;
  color: #ddd;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  padding: 8px 10px;
  border-radius: 8px;
  transition: background 0.15s;
}

.winner-popup-close-text:hover {
  background: #2a2a45;
}

.winner-popup-remove {
  padding: 10px 18px;
  border: none;
  border-radius: 10px;
  background: #3b82f6;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.35);
  transition: transform 0.15s, box-shadow 0.15s, background 0.15s;
}

.winner-popup-remove:hover {
  background: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.45);
}

.popup-enter-from,
.popup-leave-to {
  opacity: 0;
}
.popup-enter-active,
.popup-leave-active {
  transition: opacity 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.92); }
  to { opacity: 1; transform: scale(1); }
}

@media (max-width: 480px) {
  .winner-popup-card {
    max-width: 92vw;
  }

  .winner-popup-name {
    font-size: 26px;
  }
}
</style>
