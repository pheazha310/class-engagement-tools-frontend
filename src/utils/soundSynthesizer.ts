/**
 * Web Audio API sound synthesizer for the Classroom Soundboard.
 * Generates all 15 sound effects programmatically — no audio files needed.
 * Supports play, stop, replay, and volume control.
 */

let audioCtx: AudioContext | null = null
let masterGain: GainNode | null = null
const activeNodes = new Set<AudioNode>()

function getContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
    masterGain = audioCtx.createGain()
    masterGain.gain.value = 0.5
    masterGain.connect(audioCtx.destination)
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {})
  }
  return audioCtx
}

function getMasterGain(): GainNode {
  getContext() // ensure ctx exists
  return masterGain!
}

function track<T extends AudioNode>(node: T): T {
  activeNodes.add(node)
  if ('onended' in node) {
    const orig = (node as any).onended
    ;(node as any).onended = () => {
      activeNodes.delete(node)
      if (typeof orig === 'function') orig.call(node)
    }
  }
  return node
}

function gain(ctx: AudioContext, volume = 0.3): GainNode {
  const g = ctx.createGain()
  g.gain.value = volume
  g.connect(getMasterGain())
  return track(g)
}

function noise(ctx: AudioContext, duration: number, volume = 0.15): AudioBufferSourceNode {
  const sr = ctx.sampleRate
  const len = sr * duration
  const buf = ctx.createBuffer(1, len, sr)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.max(0, 1 - i / len)
  }
  const src = ctx.createBufferSource()
  src.buffer = buf
  const g = gain(ctx, volume)
  src.connect(g)
  return track(src)
}

function tone(
  ctx: AudioContext,
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.2,
  startTime = 0,
): OscillatorNode {
  const osc = ctx.createOscillator()
  osc.type = type
  osc.frequency.value = freq
  const env = ctx.createGain()
  env.gain.setValueAtTime(0, startTime)
  env.gain.linearRampToValueAtTime(volume, startTime + 0.01)
  env.gain.exponentialRampToValueAtTime(0.001, startTime + duration)
  osc.connect(env)
  env.connect(getMasterGain())
  track(env)
  track(osc)
  osc.start(startTime)
  osc.stop(startTime + duration)
  return osc
}

function sweep(
  ctx: AudioContext,
  fromFreq: number,
  toFreq: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.15,
): OscillatorNode {
  const osc = ctx.createOscillator()
  osc.type = type
  osc.frequency.setValueAtTime(fromFreq, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(toFreq, ctx.currentTime + duration)
  const env = ctx.createGain()
  env.gain.setValueAtTime(volume, ctx.currentTime)
  env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
  osc.connect(env)
  env.connect(getMasterGain())
  track(env)
  track(osc)
  osc.start()
  osc.stop(ctx.currentTime + duration)
  return osc
}

function playTargetNote(
  ctx: AudioContext,
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.2,
): void {
  const osc = ctx.createOscillator()
  osc.type = type
  osc.frequency.value = freq

  const gGain = ctx.createGain()
  gGain.gain.setValueAtTime(0, ctx.currentTime)
  gGain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.005)
  gGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)

  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = freq * 2.5

  osc.connect(gGain)
  gGain.connect(filter)
  filter.connect(getMasterGain())
  track(osc)
  track(gGain)
  track(filter)
  osc.start()
  osc.stop(ctx.currentTime + duration)
}

// ─── Sound Generators ───

function playApplause(): void {
  const ctx = getContext()
  const totalDuration = 2.5
  for (let i = 0; i < 40; i++) {
    const delay = Math.random() * totalDuration * 0.9
    const dur = 0.03 + Math.random() * 0.08
    const vol = 0.04 + Math.random() * 0.08
    const src = noise(ctx, dur, vol)
    src.start(ctx.currentTime + delay)
  }
}

function playCorrect(): void {
  const ctx = getContext()
  const t = ctx.currentTime
  tone(ctx, 523.25, 0.15, 'sine', 0.2, t)
  tone(ctx, 659.25, 0.15, 'sine', 0.2, t + 0.12)
  tone(ctx, 783.99, 0.3, 'sine', 0.25, t + 0.24)
}

function playWrong(): void {
  const ctx = getContext()
  const t = ctx.currentTime
  tone(ctx, 300, 0.15, 'square', 0.12, t)
  tone(ctx, 250, 0.35, 'square', 0.1, t + 0.1)
}

function playDrumRoll(): void {
  const ctx = getContext()
  const totalDuration = 2.5
  for (let i = 0; i < 30; i++) {
    const delay = (i / 30) * totalDuration * 0.7
    const speed = 0.04 + (i / 30) * 0.015
    const osc = ctx.createOscillator()
    osc.type = 'triangle'
    osc.frequency.value = 80 + Math.random() * 40
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.2, ctx.currentTime + delay)
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + speed)
    osc.connect(g)
    g.connect(getMasterGain())
    track(osc)
    track(g)
    osc.start(ctx.currentTime + delay)
    osc.stop(ctx.currentTime + delay + speed)
  }
  tone(ctx, 120, 0.4, 'triangle', 0.3, ctx.currentTime + totalDuration * 0.85)
}

function playFanfare(): void {
  const ctx = getContext()
  const t = ctx.currentTime
  const notes = [392, 466.16, 523.25, 622.25, 783.99]
  notes.forEach((freq, i) => {
    tone(ctx, freq, 0.3, 'sine', 0.18, t + i * 0.12)
  })
  tone(ctx, 783.99, 0.6, 'sine', 0.22, t + 0.6)
  tone(ctx, 622.25, 0.5, 'sine', 0.15, t + 0.6)
  tone(ctx, 1046.5, 0.6, 'sine', 0.2, t + 0.6)
}

function playBell(): void {
  const ctx = getContext()
  playTargetNote(ctx, 880, 1.5, 'sine', 0.25)
  setTimeout(() => {
    const c = getContext()
    playTargetNote(c, 1320, 1.0, 'sine', 0.08)
    playTargetNote(c, 1760, 0.7, 'sine', 0.04)
  }, 10)
}

function playTimer(): void {
  const ctx = getContext()
  const t = ctx.currentTime
  for (let i = 0; i < 4; i++) {
    tone(ctx, 880, 0.1, 'square', 0.15, t + i * 0.35)
  }
}

function playTickTock(): void {
  const ctx = getContext()
  const t = ctx.currentTime
  for (let i = 0; i < 8; i++) {
    const freq = i % 2 === 0 ? 800 : 600
    tone(ctx, freq, 0.04, 'sine', 0.1, t + i * 0.5)
  }
}

function playCelebration(): void {
  const ctx = getContext()
  const t = ctx.currentTime
  const notes = [523.25, 587.33, 659.25, 698.46, 783.99, 880, 987.77, 1046.5]
  notes.forEach((freq, i) => {
    tone(ctx, freq, 0.15, 'sine', 0.18, t + i * 0.1)
  })
  tone(ctx, 1046.5, 0.5, 'sine', 0.25, t + 0.9)
  tone(ctx, 1318.5, 0.4, 'sine', 0.15, t + 0.9)
}

function playWhoosh(): void {
  const ctx = getContext()
  sweep(ctx, 200, 3000, 0.5, 'sawtooth', 0.08)
}

function playGameShow(): void {
  const ctx = getContext()
  const t = ctx.currentTime
  ;[392, 440, 523.25, 587.33, 659.25, 523.25, 783.99, 659.25].forEach((freq, i) => {
    tone(ctx, freq, 0.12, 'sine', 0.15, t + i * 0.1)
  })
}

function playChime(): void {
  const ctx = getContext()
  playTargetNote(ctx, 523.25, 0.8, 'sine', 0.2)
  setTimeout(() => {
    const c = getContext()
    playTargetNote(c, 659.25, 0.6, 'sine', 0.15)
    playTargetNote(c, 783.99, 0.5, 'sine', 0.1)
  }, 200)
}

function playLaughter(): void {
  const ctx = getContext()
  const t = ctx.currentTime
  for (let i = 0; i < 6; i++) {
    const freq = 300 + Math.random() * 400
    const dur = 0.08 + Math.random() * 0.1
    tone(ctx, freq, dur, 'sine', 0.1, t + i * 0.12)
  }
}

function playBoing(): void {
  const ctx = getContext()
  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(600, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.3)
  osc.frequency.setValueAtTime(200, ctx.currentTime + 0.3)
  osc.frequency.exponentialRampToValueAtTime(350, ctx.currentTime + 0.35)
  osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.5)

  const g = ctx.createGain()
  g.gain.setValueAtTime(0.2, ctx.currentTime)
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)

  osc.connect(g)
  g.connect(getMasterGain())
  track(osc)
  track(g)
  osc.start()
  osc.stop(ctx.currentTime + 0.6)
}

function playHighScore(): void {
  const ctx = getContext()
  const t = ctx.currentTime
  ;[523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
    tone(ctx, freq, 0.2, 'sine', 0.2, t + i * 0.12)
  })
  ;[783.99, 1046.5, 1318.5].forEach((freq) => {
    tone(ctx, freq, 0.5, 'sine', 0.18, t + 0.5)
  })
}

// ─── Registry ───

export type SoundName =
  | 'Applause'
  | 'Correct Answer'
  | 'Wrong Answer'
  | 'Drum Roll'
  | 'Fanfare'
  | 'Bell Ring'
  | 'Timer Alert'
  | 'Ticking Clock'
  | 'Celebration'
  | 'Transition Whoosh'
  | 'Game Show'
  | 'Classroom Chime'
  | 'Laughter'
  | 'Boing'
  | 'High Score'

const soundMap: Record<SoundName, () => void> = {
  'Applause': playApplause,
  'Correct Answer': playCorrect,
  'Wrong Answer': playWrong,
  'Drum Roll': playDrumRoll,
  'Fanfare': playFanfare,
  'Bell Ring': playBell,
  'Timer Alert': playTimer,
  'Ticking Clock': playTickTock,
  'Celebration': playCelebration,
  'Transition Whoosh': playWhoosh,
  'Game Show': playGameShow,
  'Classroom Chime': playChime,
  'Laughter': playLaughter,
  'Boing': playBoing,
  'High Score': playHighScore,
}

const durationMap: Record<SoundName, number> = {
  'Applause': 2500,
  'Correct Answer': 600,
  'Wrong Answer': 500,
  'Drum Roll': 3000,
  'Fanfare': 1200,
  'Bell Ring': 1500,
  'Timer Alert': 1500,
  'Ticking Clock': 4000,
  'Celebration': 1200,
  'Transition Whoosh': 600,
  'Game Show': 1000,
  'Classroom Chime': 1000,
  'Laughter': 800,
  'Boing': 600,
  'High Score': 1200,
}

// ─── Public API ───

export interface PlayHandle {
  /** Duration of the sound in milliseconds. */
  duration: number
}

/**
 * Play a synthesized sound effect by name.
 * Returns duration info so callers can sync UI animations.
 */
export function playSynthSound(name: string): PlayHandle {
  const ctx = getContext()
  ctx.resume().catch(() => {})

  // Stop any currently playing sound
  stopAll()

  const fn = soundMap[name as SoundName]
  if (fn) {
    fn()
  } else {
    tone(ctx, 440, 0.3, 'sine', 0.15)
  }

  return { duration: durationMap[name as SoundName] || 1000 }
}

/**
 * Immediately stop all currently playing sounds.
 */
export function stopAll(): void {
  for (const node of activeNodes) {
    try {
      if (node instanceof OscillatorNode || node instanceof AudioBufferSourceNode) {
        node.stop()
      }
      node.disconnect()
    } catch {
      // Already stopped — ignore
    }
  }
  activeNodes.clear()
}

/**
 * Set the master volume.
 * @param value 0 (silent) to 1 (maximum)
 */
export function setVolume(value: number): void {
  const clamped = Math.max(0, Math.min(1, value))
  getMasterGain().gain.value = clamped
}

/**
 * Get the current master volume level.
 */
export function getVolume(): number {
  return getMasterGain().gain.value
}
