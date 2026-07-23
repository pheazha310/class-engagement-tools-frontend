/**
 * Web Audio API sound synthesizer for the Classroom Soundboard.
 * Generates all 15 sound effects programmatically — no audio files needed.
 * Supports play, stop, replay, and volume control.
 */

let audioCtx: AudioContext | null = null
let masterGain: GainNode | null = null
let analyserNode: AnalyserNode | null = null
const activeNodes = new Set<AudioNode>()
const pendingTimeouts: number[] = []

let timeoutGuard: number | null = null // incrementing guard to discard stale setTimeout callbacks

// Volume system: userVolume * presetMultiplier * perSoundMultiplier = effective master gain
let baseVolume = 0.75     // The user's selected volume (0-1)
let presetMultiplier = 1.0 // Current sound's volume preset (0-1)
let perSoundMultiplier = 1.0 // Per-sound user-adjusted multiplier (0-1)

// Per-sound user volume settings (persisted in localStorage)
const STORAGE_KEY = 'soundboard_per_sound_volumes'
let perSoundVolumes: Record<string, number> = loadPerSoundVolumes()

function loadPerSoundVolumes(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return {}
}

function savePerSoundVolumes(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(perSoundVolumes))
  } catch { /* ignore */ }
}

function applyVolume(): void {
  if (masterGain) {
    masterGain.gain.value = baseVolume * presetMultiplier * perSoundMultiplier
  }
}

function getContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
    masterGain = audioCtx.createGain()
    masterGain.gain.value = baseVolume * presetMultiplier

    // Create an analyser node for volume metering
    analyserNode = audioCtx.createAnalyser()
    analyserNode.fftSize = 256
    masterGain.connect(analyserNode)
    analyserNode.connect(audioCtx.destination)
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
  startTime = 0,
): void {
  const t = ctx.currentTime + startTime
  const osc = ctx.createOscillator()
  osc.type = type
  osc.frequency.value = freq

  const gGain = ctx.createGain()
  gGain.gain.setValueAtTime(0, t)
  gGain.gain.linearRampToValueAtTime(volume, t + 0.005)
  gGain.gain.exponentialRampToValueAtTime(0.001, t + duration)

  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = freq * 2.5

  osc.connect(gGain)
  gGain.connect(filter)
  filter.connect(getMasterGain())
  track(osc)
  track(gGain)
  track(filter)
  osc.start(t)
  osc.stop(t + duration)
}

// ─── Sound Generators ───

function playApplause(): void {
  const ctx = getContext()
  const totalDuration = 10
  for (let i = 0; i < 160; i++) {
    const delay = Math.random() * totalDuration * 0.92
    const dur = 0.03 + Math.random() * 0.12
    const vol = 0.04 + Math.random() * 0.1
    const src = noise(ctx, dur, vol)
    src.start(ctx.currentTime + delay)
  }
}

function playCorrect(): void {
  const ctx = getContext()
  const t = ctx.currentTime
  // Ascending arpeggio with echo repeats
  const notes = [523.25, 659.25, 783.99, 1046.5]
  for (let repeat = 0; repeat < 4; repeat++) {
    const offset = repeat * 2.5
    notes.forEach((freq, i) => {
      tone(ctx, freq * (1 + repeat * 0.03), 0.25, 'sine', 0.18 - repeat * 0.03, t + offset + i * 0.15)
    })
  }
  // Final sustained chord
  tone(ctx, 1046.5, 1.5, 'sine', 0.25, t + 9.0)
  tone(ctx, 1318.5, 1.2, 'sine', 0.18, t + 9.0)
  tone(ctx, 1568.0, 1.0, 'sine', 0.12, t + 9.0)
}

function playWrong(): void {
  const ctx = getContext()
  const t = ctx.currentTime
  // Descending buzzes with increasing intensity
  for (let i = 0; i < 8; i++) {
    const freq = 350 - i * 20
    const vol = 0.08 + (i / 8) * 0.1
    tone(ctx, freq, 0.4 + i * 0.08, 'square', vol, t + i * 0.6)
  }
  // Final long low buzz
  tone(ctx, 150, 2.0, 'sawtooth', 0.15, t + 8.0)
  tone(ctx, 120, 1.5, 'square', 0.1, t + 8.5)
}

function playDrumRoll(): void {
  const ctx = getContext()
  const totalDuration = 10
  for (let i = 0; i < 140; i++) {
    const t = i / 140
    const delay = t * totalDuration * 0.82
    const speed = 0.02 + t * 0.03
    const osc = ctx.createOscillator()
    osc.type = 'triangle'
    osc.frequency.value = 60 + Math.random() * 50 + t * 30
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.15 + t * 0.2, ctx.currentTime + delay)
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + speed)
    osc.connect(g)
    g.connect(getMasterGain())
    track(osc)
    track(g)
    osc.start(ctx.currentTime + delay)
    osc.stop(ctx.currentTime + delay + speed)
  }
  tone(ctx, 120, 1.0, 'triangle', 0.4, ctx.currentTime + totalDuration * 0.85)
  tone(ctx, 150, 0.8, 'triangle', 0.35, ctx.currentTime + totalDuration * 0.87)
}

function playFanfare(): void {
  const ctx = getContext()
  const t = ctx.currentTime
  // Build up with ascending phrases
  const phrases = [
    [261.63, 329.63, 392, 523.25],
    [329.63, 392, 523.25, 659.25],
    [392, 523.25, 659.25, 783.99],
    [523.25, 659.25, 783.99, 1046.5],
  ]
  phrases.forEach((notes, phraseIdx) => {
    const offset = phraseIdx * 2.2
    notes.forEach((freq, i) => {
      tone(ctx, freq, 0.3, 'sine', 0.15 + phraseIdx * 0.03, t + offset + i * 0.18)
    })
  })
  // Grand final chord
  tone(ctx, 783.99, 2.0, 'sine', 0.25, t + 8.5)
  tone(ctx, 1046.5, 2.0, 'sine', 0.3, t + 8.5)
  tone(ctx, 1318.5, 1.8, 'sine', 0.22, t + 8.5)
  tone(ctx, 1568.0, 1.5, 'sine', 0.15, t + 8.5)
}

function playBell(): void {
  const ctx = getContext()
  const t = ctx.currentTime
  const guard = timeoutGuard
  // Slow, resonant bell with multiple harmonics over time
  playTargetNote(ctx, 440, 10.0, 'sine', 0.25, 0)
  playTargetNote(ctx, 660, 8.0, 'sine', 0.18, 0)
  playTargetNote(ctx, 880, 10.0, 'sine', 0.3, 0)
  playTargetNote(ctx, 1320, 7.0, 'sine', 0.12, 0)
  playTargetNote(ctx, 1760, 5.0, 'sine', 0.06, 0)
  // Strike again at midpoint for reverb effect
  const id = window.setTimeout(() => {
    if (timeoutGuard !== guard) return // cancelled
    const c = getContext()
    playTargetNote(c, 440, 6.0, 'sine', 0.12, 0)
    playTargetNote(c, 880, 6.0, 'sine', 0.15, 0)
    playTargetNote(c, 1320, 4.0, 'sine', 0.06, 0)
  }, 5000)
  pendingTimeouts.push(id)
}

function playTimer(): void {
  const ctx = getContext()
  const t = ctx.currentTime
  // Slow beeps accelerating, then final long alert
  for (let i = 0; i < 12; i++) {
    const spacing = 1.2 - (i / 12) * 0.7 // 1.2s → 0.5s
    const freq = i % 2 === 0 ? 880 : 660
    tone(ctx, freq, 0.12 + (i / 12) * 0.1, 'square', 0.12 + (i / 12) * 0.1, t + i * spacing)
  }
  // Final sustained alarm
  tone(ctx, 880, 1.5, 'square', 0.3, t + 8.5)
  tone(ctx, 1046.5, 1.0, 'square', 0.2, t + 9.0)
}

function playTickTock(): void {
  const ctx = getContext()
  const t = ctx.currentTime
  // Still 20s from previous extension - keep as is
  for (let i = 0; i < 40; i++) {
    const freq = i % 2 === 0 ? 800 : 600
    tone(ctx, freq, 0.04 + (i < 30 ? 0 : 0.02), 'sine', 0.12 + (i < 30 ? 0 : 0.04), t + i * 0.5)
  }
}

function playCelebration(): void {
  const ctx = getContext()
  const t = ctx.currentTime
  // Three ascending arpeggios building up
  const arpeggios = [
    [523.25, 587.33, 659.25, 698.46, 783.99],
    [659.25, 698.46, 783.99, 880, 987.77],
    [783.99, 880, 987.77, 1046.5, 1174.66],
  ]
  arpeggios.forEach((notes, idx) => {
    const offset = idx * 2.8
    notes.forEach((freq, i) => {
      tone(ctx, freq, 0.2 + idx * 0.05, 'sine', 0.15 + idx * 0.04, t + offset + i * 0.15)
    })
  })
  // Triumphant final chord with trill
  tone(ctx, 1046.5, 2.0, 'sine', 0.35, t + 8.0)
  tone(ctx, 1318.5, 1.8, 'sine', 0.25, t + 8.0)
  tone(ctx, 1568.0, 1.6, 'sine', 0.2, t + 8.0)
  tone(ctx, 1975.5, 1.2, 'sine', 0.12, t + 8.0)
}

function playWhoosh(): void {
  const ctx = getContext()
  const guard = timeoutGuard
  // Slow sweep up, pause, sweep down
  sweep(ctx, 150, 4000, 3.0, 'sawtooth', 0.15)
  // Add wind layer (delayed)
  let id = window.setTimeout(() => {
    if (timeoutGuard !== guard) return
    const c = getContext()
    sweep(c, 200, 2000, 8.0, 'sine', 0.06)
  }, 1000)
  pendingTimeouts.push(id)
  // Sweep down (delayed)
  id = window.setTimeout(() => {
    if (timeoutGuard !== guard) return
    const c = getContext()
    sweep(c, 4000, 150, 3.0, 'sawtooth', 0.1)
  }, 3200)
  pendingTimeouts.push(id)
}

function playGameShow(): void {
  const ctx = getContext()
  const t = ctx.currentTime
  // Extended game show pattern with multiple rounds
  const rounds = [
    [392, 440, 523.25, 587.33],
    [523.25, 587.33, 659.25, 783.99],
    [659.25, 783.99, 880, 1046.5],
    [392, 523.25, 659.25, 783.99, 1046.5],
    [783.99, 880, 1046.5, 1174.66, 1318.5],
  ]
  rounds.forEach((notes, idx) => {
    const offset = idx * 1.8
    notes.forEach((freq, i) => {
      tone(ctx, freq, 0.15 + idx * 0.03, 'sine', 0.12 + idx * 0.03, t + offset + i * 0.14)
    })
  })
  // Big win sound at the end
  tone(ctx, 1046.5, 1.0, 'sine', 0.3, t + 9.0)
  tone(ctx, 1318.5, 0.8, 'sine', 0.25, t + 9.0)
  tone(ctx, 1568.0, 0.6, 'sine', 0.15, t + 9.0)
}

function playChime(): void {
  const ctx = getContext()
  const t = ctx.currentTime
  const guard = timeoutGuard
  // Melodic chime pattern with repeats — properly timed via startTime
  const pattern = [523.25, 659.25, 783.99, 1046.5]
  for (let repeat = 0; repeat < 3; repeat++) {
    const offset = repeat * 3.0
    pattern.forEach((freq, i) => {
      const dur = 0.8 + repeat * 0.2
      const vol = 0.2 - repeat * 0.04
      playTargetNote(ctx, freq * (1 + repeat * 0.02), dur, 'sine', vol, offset + i * 0.25)
    })
  }
  // Soft sustained chord
  const id = window.setTimeout(() => {
    if (timeoutGuard !== guard) return // cancelled
    const c = getContext()
    playTargetNote(c, 523.25, 2.0, 'sine', 0.08, 0)
    playTargetNote(c, 783.99, 2.0, 'sine', 0.06, 0)
    playTargetNote(c, 1046.5, 2.0, 'sine', 0.05, 0)
  }, 8000)
  pendingTimeouts.push(id)
}

function playLaughter(): void {
  const ctx = getContext()
  const t = ctx.currentTime
  // Waves of laughter with increasing intensity
  for (let wave = 0; wave < 4; wave++) {
    const waveOffset = wave * 2.3
    const laughs = 6 + wave * 2
    for (let i = 0; i < laughs; i++) {
      const freq = 250 + Math.random() * 500 + wave * 30
      const dur = 0.08 + Math.random() * 0.12
      const vol = 0.08 + wave * 0.03 + Math.random() * 0.04
      tone(ctx, freq, dur, 'sine', vol, t + waveOffset + i * (0.15 - wave * 0.015))
    }
  }
  // Final giggle trail
  for (let i = 0; i < 4; i++) {
    tone(ctx, 400 + Math.random() * 300, 0.06, 'sine', 0.05, t + 9.2 + i * 0.08)
  }
}

function playBoing(): void {
  const ctx = getContext()
  const t = ctx.currentTime
  // Series of boings at different pitches — 16 boings for ~10s
  const boingFreqs = [600, 520, 680, 450, 720, 380, 800, 340, 850, 300, 880, 280, 920, 260, 950, 240]
  boingFreqs.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    const startTime = t + i * 0.62
    osc.frequency.setValueAtTime(freq, startTime)
    osc.frequency.exponentialRampToValueAtTime(freq * 0.4, startTime + 0.2)
    osc.frequency.setValueAtTime(freq * 0.4, startTime + 0.2)
    osc.frequency.exponentialRampToValueAtTime(freq * 0.6, startTime + 0.25)
    osc.frequency.exponentialRampToValueAtTime(freq * 0.25, startTime + 0.35)

    const g = ctx.createGain()
    g.gain.setValueAtTime(0.12 + (i / boingFreqs.length) * 0.08, startTime)
    g.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35)

    osc.connect(g)
    g.connect(getMasterGain())
    track(osc)
    track(g)
    osc.start(startTime)
    osc.stop(startTime + 0.4)
  })
}

function playHighScore(): void {
  const ctx = getContext()
  const t = ctx.currentTime
  // Repeated ascending fanfares getting higher
  const motifs = [
    [523.25, 659.25, 783.99],
    [659.25, 783.99, 1046.5],
    [783.99, 1046.5, 1318.5],
    [1046.5, 1318.5, 1568.0],
  ]
  motifs.forEach((notes, idx) => {
    const offset = idx * 2.2
    notes.forEach((freq, i) => {
      tone(ctx, freq, 0.25 + idx * 0.05, 'sine', 0.18 + idx * 0.03, t + offset + i * 0.14)
    })
  })
  // Victory flourish
  tone(ctx, 1046.5, 1.5, 'sine', 0.3, t + 8.5)
  tone(ctx, 1318.5, 1.3, 'sine', 0.25, t + 8.5)
  tone(ctx, 1568.0, 1.0, 'sine', 0.18, t + 8.5)
  tone(ctx, 1975.5, 0.8, 'sine', 0.12, t + 8.5)
}

function playExtendedApplause(): void {
  const ctx = getContext()
  const totalDuration = 12
  // Sustained clapping with waves of applause
  for (let wave = 0; wave < 3; wave++) {
    const waveStart = (totalDuration / 3) * wave
    const clapsInWave = 60 + Math.random() * 20
    for (let i = 0; i < clapsInWave; i++) {
      const delay = waveStart + Math.random() * (totalDuration / 3 - 0.5)
      const dur = 0.02 + Math.random() * 0.12
      const vol = (0.04 + Math.random() * 0.1) * (0.7 + wave * 0.15)
      const src = noise(ctx, dur, vol)
      src.start(ctx.currentTime + delay)
    }
  }
  // Final crescendo in last 2 seconds
  for (let i = 0; i < 40; i++) {
    const delay = totalDuration - 2 + Math.random() * 1.8
    const dur = 0.02 + Math.random() * 0.08
    const vol = 0.08 + Math.random() * 0.16
    const src = noise(ctx, dur, vol)
    src.start(ctx.currentTime + delay)
  }
}

function playExtendedDrumRoll(): void {
  const ctx = getContext()
  const totalDuration = 15
  // Slow build with increasing speed — two phases
  for (let i = 0; i < 200; i++) {
    const t = i / 200
    const delay = t * totalDuration * 0.8
    const speed = 0.02 + t * 0.04
    const osc = ctx.createOscillator()
    osc.type = 'triangle'
    osc.frequency.value = 40 + Math.random() * 60 + t * 40
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.1 + t * 0.25, ctx.currentTime + delay)
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + speed)
    osc.connect(g)
    g.connect(getMasterGain())
    track(osc)
    track(g)
    osc.start(ctx.currentTime + delay)
    osc.stop(ctx.currentTime + delay + speed)
  }
  // Dramatic big finish with multiple tones + crash
  tone(ctx, 80, 1.2, 'triangle', 0.45, ctx.currentTime + totalDuration * 0.82)
  tone(ctx, 100, 1.0, 'triangle', 0.4, ctx.currentTime + totalDuration * 0.84)
  tone(ctx, 120, 0.8, 'triangle', 0.35, ctx.currentTime + totalDuration * 0.86)
  tone(ctx, 150, 0.6, 'sawtooth', 0.3, ctx.currentTime + totalDuration * 0.88)
  // Final crash cymbal
  const crash = noise(ctx, 0.8, 0.3)
  crash.start(ctx.currentTime + totalDuration * 0.88)
}

function playCountdownTimer(): void {
  const ctx = getContext()
  const t = ctx.currentTime
  const totalBeeps = 20
  // Slow beeps at start, fast at end
  for (let i = 0; i < totalBeeps; i++) {
    const progress = i / totalBeeps
    const spacing = 1.3 - progress * 0.8 // 1.3s -> 0.5s spacing
    const startTime = t + i * spacing
    const freq = i < totalBeeps - 1 ? (i % 2 === 0 ? 880 : 660) : 1200
    const dur = 0.12 + progress * 0.12
    const vol = 0.1 + progress * 0.15
    tone(ctx, freq, dur, 'square', vol, startTime)
  }
  // Final alert tones
  tone(ctx, 1400, 0.8, 'square', 0.35, t + (totalBeeps - 1) * 0.5)
  tone(ctx, 1600, 0.6, 'square', 0.25, t + (totalBeeps - 1) * 0.5 + 0.15)
  tone(ctx, 1800, 0.4, 'square', 0.15, t + (totalBeeps - 1) * 0.5 + 0.3)
}

function playGentleRain(): void {
  const ctx = getContext()
  const totalDuration = 30
  const t = ctx.currentTime

  // Master envelope with slow fade in/out
  const masterEnv = ctx.createGain()
  masterEnv.gain.setValueAtTime(0, t)
  masterEnv.gain.linearRampToValueAtTime(0.7, t + 1.5)
  masterEnv.gain.setValueAtTime(0.7, t + totalDuration - 2)
  masterEnv.gain.linearRampToValueAtTime(0, t + totalDuration)
  masterEnv.connect(getMasterGain())
  track(masterEnv)

  // Layer 1: Steady rain noise (band-passed noise)
  const rainLen = totalDuration * ctx.sampleRate
  const rainBuf = ctx.createBuffer(1, rainLen, ctx.sampleRate)
  const rainData = rainBuf.getChannelData(0)
  for (let i = 0; i < rainLen; i++) {
    // Heavy-tailed noise for rain
    const v = (Math.random() * 2 - 1) + (Math.random() * 2 - 1) + (Math.random() * 2 - 1)
    rainData[i] = v / 3
  }
  const rainSrc = ctx.createBufferSource()
  rainSrc.buffer = rainBuf
  const rainFilter = ctx.createBiquadFilter()
  rainFilter.type = 'bandpass'
  rainFilter.frequency.value = 1200
  rainFilter.Q.value = 0.4
  const rainGain = ctx.createGain()
  rainGain.gain.value = 0.2
  rainSrc.connect(rainFilter)
  rainFilter.connect(rainGain)
  rainGain.connect(masterEnv)
  track(rainSrc)
  track(rainFilter)
  track(rainGain)
  rainSrc.start(t)
  rainSrc.stop(t + totalDuration)

  // Layer 2: Heavy rain (more intense)
  const heavyLen = totalDuration * ctx.sampleRate
  const heavyBuf = ctx.createBuffer(1, heavyLen, ctx.sampleRate)
  const heavyData = heavyBuf.getChannelData(0)
  for (let i = 0; i < heavyLen; i++) {
    heavyData[i] = (Math.random() * 2 - 1) * 0.5
  }
  const heavySrc = ctx.createBufferSource()
  heavySrc.buffer = heavyBuf
  const heavyFilter = ctx.createBiquadFilter()
  heavyFilter.type = 'lowpass'
  heavyFilter.frequency.value = 600
  heavyFilter.Q.value = 0.3
  const heavyGain = ctx.createGain()
  heavyGain.gain.value = 0.15
  heavySrc.connect(heavyFilter)
  heavyFilter.connect(heavyGain)
  heavyGain.connect(masterEnv)
  track(heavySrc)
  track(heavyFilter)
  track(heavyGain)
  heavySrc.start(t)
  heavySrc.stop(t + totalDuration)

  // Layer 3: Occasional thunder rumbles
  for (let i = 0; i < 6; i++) {
    const rumbleTime = t + 2 + i * 4.5 + Math.random() * 2
    const rumbleOsc = ctx.createOscillator()
    rumbleOsc.type = 'sine'
    rumbleOsc.frequency.value = 50 + Math.random() * 30
    const rumbleGain = ctx.createGain()
    rumbleGain.gain.setValueAtTime(0, rumbleTime)
    rumbleGain.gain.linearRampToValueAtTime(0.08 + Math.random() * 0.06, rumbleTime + 0.2)
    rumbleGain.gain.exponentialRampToValueAtTime(0.001, rumbleTime + 1.5 + Math.random() * 0.5)
    rumbleOsc.connect(rumbleGain)
    rumbleGain.connect(masterEnv)
    track(rumbleOsc)
    track(rumbleGain)
    rumbleOsc.start(rumbleTime)
    rumbleOsc.stop(rumbleTime + 2)
  }

  // Layer 4: Soft wind
  const windLen = totalDuration * ctx.sampleRate
  const windBuf = ctx.createBuffer(1, windLen, ctx.sampleRate)
  const windData = windBuf.getChannelData(0)
  for (let i = 0; i < windLen; i++) {
    windData[i] = (Math.random() * 2 - 1) * (0.3 + 0.2 * Math.sin(2 * Math.PI * i / (ctx.sampleRate * 6)))
  }
  const windSrc = ctx.createBufferSource()
  windSrc.buffer = windBuf
  const windFilter = ctx.createBiquadFilter()
  windFilter.type = 'lowpass'
  windFilter.frequency.value = 200
  windFilter.Q.value = 0.5
  const windGain = ctx.createGain()
  windGain.gain.value = 0.06
  windSrc.connect(windFilter)
  windFilter.connect(windGain)
  windGain.connect(masterEnv)
  track(windSrc)
  track(windFilter)
  track(windGain)
  windSrc.start(t)
  windSrc.stop(t + totalDuration)
}

function playClassroomAmbience(): void {
  const ctx = getContext()
  const totalDuration = 30
  const t = ctx.currentTime

  // Master gain for the ambience (quiet, background level)
  const masterEnv = ctx.createGain()
  masterEnv.gain.setValueAtTime(0, t)
  masterEnv.gain.linearRampToValueAtTime(0.55, t + 0.5) // fade in
  masterEnv.gain.setValueAtTime(0.55, t + totalDuration - 1)
  masterEnv.gain.linearRampToValueAtTime(0, t + totalDuration) // fade out
  masterEnv.connect(getMasterGain())
  track(masterEnv)

  // ── Layer 1: Deep low-frequency rumble (building HVAC / distant traffic) ──
  const lowNoiseDur = totalDuration
  const lowSr = ctx.sampleRate
  const lowLen = lowSr * lowNoiseDur
  const lowBuf = ctx.createBuffer(1, lowLen, lowSr)
  const lowData = lowBuf.getChannelData(0)
  for (let i = 0; i < lowLen; i++) {
    lowData[i] = (Math.random() * 2 - 1) * 0.3
  }
  const lowSrc = ctx.createBufferSource()
  lowSrc.buffer = lowBuf
  const lowFilter = ctx.createBiquadFilter()
  lowFilter.type = 'lowpass'
  lowFilter.frequency.value = 150
  lowFilter.Q.value = 1
  const lowGain = ctx.createGain()
  lowGain.gain.value = 0.2
  lowSrc.connect(lowFilter)
  lowFilter.connect(lowGain)
  lowGain.connect(masterEnv)
  track(lowSrc)
  track(lowFilter)
  track(lowGain)
  lowSrc.start(t)
  lowSrc.stop(t + totalDuration)

  // ── Layer 2: Mid-frequency room tone (people murmur, papers rustling) ──
  const midNoiseDur = totalDuration
  const midLen = midNoiseDur * ctx.sampleRate
  const midBuf = ctx.createBuffer(1, midLen, ctx.sampleRate)
  const midData = midBuf.getChannelData(0)
  for (let i = 0; i < midLen; i++) {
    midData[i] = (Math.random() * 2 - 1) * 0.15
  }
  const midSrc = ctx.createBufferSource()
  midSrc.buffer = midBuf
  const midFilter = ctx.createBiquadFilter()
  midFilter.type = 'bandpass'
  midFilter.frequency.value = 800
  midFilter.Q.value = 0.7
  const midGain = ctx.createGain()
  midGain.gain.value = 0.12
  midSrc.connect(midFilter)
  midFilter.connect(midGain)
  midGain.connect(masterEnv)
  track(midSrc)
  track(midFilter)
  track(midGain)
  midSrc.start(t)
  midSrc.stop(t + totalDuration)

  // ── Layer 3: High-frequency air (subtle presence) ──
  const highNoiseDur = totalDuration
  const highLen = highNoiseDur * ctx.sampleRate
  const highBuf = ctx.createBuffer(1, highLen, ctx.sampleRate)
  const highData = highBuf.getChannelData(0)
  for (let i = 0; i < highLen; i++) {
    highData[i] = (Math.random() * 2 - 1) * 0.08
  }
  const highSrc = ctx.createBufferSource()
  highSrc.buffer = highBuf
  const highFilter = ctx.createBiquadFilter()
  highFilter.type = 'highpass'
  highFilter.frequency.value = 4000
  highFilter.Q.value = 0.5
  const highGain = ctx.createGain()
  highGain.gain.value = 0.04
  highSrc.connect(highFilter)
  highFilter.connect(highGain)
  highGain.connect(masterEnv)
  track(highSrc)
  track(highFilter)
  track(highGain)
  highSrc.start(t)
  highSrc.stop(t + totalDuration)

  // ── Layer 4: Occasional soft bumps / movements ──
  for (let i = 0; i < 20; i++) {
    const bumpTime = t + 1 + Math.random() * (totalDuration - 3)
    const bumpFreq = 60 + Math.random() * 40
    const bumpOsc = ctx.createOscillator()
    bumpOsc.type = 'sine'
    bumpOsc.frequency.value = bumpFreq
    const bumpGain = ctx.createGain()
    bumpGain.gain.setValueAtTime(0, bumpTime)
    bumpGain.gain.linearRampToValueAtTime(0.04 + Math.random() * 0.04, bumpTime + 0.02)
    bumpGain.gain.exponentialRampToValueAtTime(0.001, bumpTime + 0.15)
    bumpOsc.connect(bumpGain)
    bumpGain.connect(masterEnv)
    track(bumpOsc)
    track(bumpGain)
    bumpOsc.start(bumpTime)
    bumpOsc.stop(bumpTime + 0.15)
  }

  // ── Layer 5: Distant soft chime / bell (school ambiance) ──
  const chimeTime = t + totalDuration - 3
  const chimeFreqs = [523.25, 659.25, 783.99]
  chimeFreqs.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = freq
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, chimeTime + i * 0.15)
    g.gain.linearRampToValueAtTime(0.015, chimeTime + i * 0.15 + 0.05)
    g.gain.exponentialRampToValueAtTime(0.001, chimeTime + i * 0.15 + 1.5)
    osc.connect(g)
    g.connect(masterEnv)
    track(osc)
    track(g)
    osc.start(chimeTime + i * 0.15)
    osc.stop(chimeTime + i * 0.15 + 1.5)
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
  | 'Classroom Ambience'
  | 'Extended Applause'
  | 'Extended Drum Roll'
  | 'Countdown Timer'
  | 'Gentle Rain'

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
  'Classroom Ambience': playClassroomAmbience,
  'Extended Applause': playExtendedApplause,
  'Extended Drum Roll': playExtendedDrumRoll,
  'Countdown Timer': playCountdownTimer,
  'Gentle Rain': playGentleRain,
}

/**
 * Volume presets per sound.
 * Ambient / continuous sounds play quieter by default.
 * Action / reward sounds play at full volume.
 */
const volumePresets: Record<SoundName, number> = {
  'Applause': 1.0,
  'Correct Answer': 1.0,
  'Wrong Answer': 0.9,
  'Drum Roll': 1.0,
  'Fanfare': 1.0,
  'Bell Ring': 0.95,
  'Timer Alert': 0.9,
  'Ticking Clock': 0.8,
  'Celebration': 1.0,
  'Transition Whoosh': 0.85,
  'Game Show': 1.0,
  'Classroom Chime': 0.9,
  'Laughter': 0.85,
  'Boing': 0.9,
  'High Score': 1.0,
  'Classroom Ambience': 0.75,
  'Extended Applause': 1.0,
  'Extended Drum Roll': 1.0,
  'Countdown Timer': 0.9,
  'Gentle Rain': 0.8,
}

const durationMap: Record<SoundName, number> = {
  'Applause': 10000,
  'Correct Answer': 10500,
  'Wrong Answer': 10000,
  'Drum Roll': 10000,
  'Fanfare': 10500,
  'Bell Ring': 10000,
  'Timer Alert': 10000,
  'Ticking Clock': 20000,
  'Celebration': 10000,
  'Transition Whoosh': 10000,
  'Game Show': 10000,
  'Classroom Chime': 10000,
  'Laughter': 10000,
  'Boing': 10000,
  'High Score': 10000,
  'Classroom Ambience': 30000,
  'Extended Applause': 12000,
  'Extended Drum Roll': 15000,
  'Countdown Timer': 20000,
  'Gentle Rain': 30000,
}

// ─── Public API ───

export interface PlayHandle {
  /** Duration of the sound in milliseconds. */
  duration: number
}

/**
 * Play a synthesized sound effect by name.
 * @param name - The name of the sound to play
 * @param fadeMs - Optional fade-out duration in ms (prevents abrupt cutoff when switching sounds)
 * Returns duration info so callers can sync UI animations.
 */
export async function playSynthSound(name: string, fadeMs = 0): Promise<PlayHandle> {
  const ctx = getContext()
  ctx.resume().catch(() => {})

  // If another sound is playing and a fade duration is specified, fade out first
  if (fadeMs > 0 && activeNodes.size > 0) {
    await fadeOutAndStop(fadeMs)
  } else {
    stopAll()
  }

  // Apply per-sound volume preset
  presetMultiplier = volumePresets[name as SoundName] ?? 1.0
  // Apply per-sound user-adjusted volume (default 1.0 if not set)
  perSoundMultiplier = perSoundVolumes[name] ?? 1.0
  applyVolume()

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

  // Clear all pending setTimeout callbacks
  for (const tid of pendingTimeouts) {
    clearTimeout(tid)
  }
  pendingTimeouts.length = 0
  timeoutGuard = Date.now() // invalidate any stale callbacks

  // Restore volume to user's base level
  presetMultiplier = 1.0
  perSoundMultiplier = 1.0
  applyVolume()
}

/**
 * Smoothly fade out the current master volume over `fadeMs` milliseconds,
 * then stop all active audio nodes, and restore the volume back.
 * Returns a promise that resolves when the fade-out + stop is complete.
 */
export function fadeOutAndStop(fadeMs: number): Promise<void> {
  return new Promise((resolve) => {
    const gain = getMasterGain()

    if (activeNodes.size === 0) {
      resolve()
      return
    }

    const ctx = getContext()
    const now = ctx.currentTime
    const fadeSec = fadeMs / 1000

    // Schedule gain ramp to near-zero
    gain.gain.cancelScheduledValues(now)
    gain.gain.setValueAtTime(gain.gain.value, now)
    gain.gain.linearRampToValueAtTime(0.001, now + fadeSec)

    setTimeout(() => {
      // Stop all active nodes
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

      // Clear all pending setTimeout callbacks
      for (const tid of pendingTimeouts) {
        clearTimeout(tid)
      }
      pendingTimeouts.length = 0
      timeoutGuard = Date.now() // invalidate any stale callbacks

      // Restore to user's base volume with smooth ramp (prevent click)
      presetMultiplier = 1.0
      perSoundMultiplier = 1.0
      const ctx2 = getContext()
      gain.gain.cancelScheduledValues(ctx2.currentTime)
      gain.gain.setValueAtTime(gain.gain.value, ctx2.currentTime)
      gain.gain.linearRampToValueAtTime(baseVolume, ctx2.currentTime + 0.03)

      resolve()
    }, fadeMs + 10) // +10ms buffer to ensure gain ramp completes
  })
}

/**
 * Get the current audio output level (RMS) from the analyser node.
 * Returns a value from 0 (silent) to ~1 (maximum).
 * Useful for visual volume meters / level indicators.
 */
export function getAnalyserLevel(): number {
  if (!analyserNode) return 0
  const data = new Uint8Array(analyserNode.frequencyBinCount)
  analyserNode.getByteTimeDomainData(data)

  // Compute RMS from the time-domain data
  // Values range 0-255, with 128 = zero crossing (silence)
  let sumSquares = 0
  for (let i = 0; i < data.length; i++) {
    const normalized = ((data[i] as number) - 128) / 128
    sumSquares += normalized * normalized
  }
  const rms = Math.sqrt(sumSquares / data.length)
  return Math.min(1, rms * 2.5) // scale up for better visual response
}

/**
 * Set the base (user) volume level.
 * The actual master gain = baseVolume * presetMultiplier.
 * @param value 0 (silent) to 1 (maximum)
 */
export function setVolume(value: number): void {
  baseVolume = Math.max(0, Math.min(1, value))
  applyVolume()
}

/**
 * Get the current user volume level (the base volume, not the effective gain).
 */
export function getVolume(): number {
  return baseVolume
}

/**
 * Set the per-sound user volume multiplier.
 * @param soundName - The name of the sound
 * @param value - Volume multiplier 0 (silent) to 1 (full)
 */
export function setPerSoundVolume(soundName: string, value: number): void {
  perSoundVolumes[soundName] = Math.max(0, Math.min(1, value))
  savePerSoundVolumes()

  // If this sound is currently playing, apply the change immediately
  // (perSoundMultiplier was last set when playSynthSound ran)
  // We update the master gain directly
  if (masterGain) {
    masterGain.gain.value = baseVolume * presetMultiplier * perSoundVolumes[soundName]
  }
}

/**
 * Get the per-sound user volume multiplier for a given sound.
 * Returns 1.0 (full) if no custom volume has been set.
 */
export function getPerSoundVolume(soundName: string): number {
  return perSoundVolumes[soundName] ?? 1.0
}

/**
 * Reset the per-sound volume for a given sound back to 1.0 (full).
 * Removes the custom entry from storage so it falls back to default.
 */
export function deletePerSoundVolume(soundName: string): void {
  delete perSoundVolumes[soundName]
  savePerSoundVolumes()

  // If this sound is currently playing, restore to full volume
  if (masterGain) {
    masterGain.gain.value = baseVolume * presetMultiplier * 1.0
  }
}
