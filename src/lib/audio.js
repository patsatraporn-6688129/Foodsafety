// ---------------------------------------------------------------------------
// Lightweight Web Audio sound engine for Fridge Master.
// Every sound (background music + SFX) is synthesized on the fly with
// oscillators, so the game needs no external .mp3/.wav files and stays
// fully offline-friendly.
//
// Hooked up to the existing Settings screen: settings.music / settings.sfx
// (0–100 sliders) drive setMusicVolume() / setSfxVolume().
// ---------------------------------------------------------------------------

let ctx = null
let musicGain = null
let sfxGain = null
let musicPlaying = false
let musicMuted = false
let lookaheadTimer = null
let nextStepTime = 0
let musicStep = 0

function getCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
    musicGain = ctx.createGain()
    sfxGain = ctx.createGain()
    musicGain.gain.value = 0.35
    sfxGain.gain.value = 0.6
    musicGain.connect(ctx.destination)
    sfxGain.connect(ctx.destination)
  }
  return ctx
}

// Call from a real user gesture (click/tap) — browsers block audio otherwise.
export function unlockAudio() {
  const c = getCtx()
  if (c && c.state === 'suspended') c.resume()
}

export function setMusicVolume(v) {
  if (!getCtx()) return
  const level = Math.max(0, Math.min(100, v)) / 100
  musicMuted = level <= 0
  musicGain.gain.setTargetAtTime(level * 0.4, ctx.currentTime, 0.05)
}

export function setSfxVolume(v) {
  if (!getCtx()) return
  const level = Math.max(0, Math.min(100, v)) / 100
  sfxGain.gain.setTargetAtTime(level, ctx.currentTime, 0.02)
}

// ---------------------------------------------------------------------------
// SFX — short synthesized blips
// ---------------------------------------------------------------------------
function tone({ freq, duration = 0.15, type = 'sine', gain = 0.5, delay = 0, slideTo = null }) {
  const c = getCtx()
  if (!c) return
  const t0 = c.currentTime + delay
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t0 + duration)
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.linearRampToValueAtTime(gain, t0 + 0.012)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)
  osc.connect(g)
  g.connect(sfxGain)
  osc.start(t0)
  osc.stop(t0 + duration + 0.05)
}

// Picked an item up (drag start / select)
export function sfxPickup() {
  tone({ freq: 520, duration: 0.07, type: 'triangle', gain: 0.35 })
}

// Any item dropped onto a shelf/slot (neutral "thunk", doesn't spoil the answer)
export function sfxPlace() {
  tone({ freq: 300, duration: 0.09, type: 'triangle', gain: 0.4 })
  tone({ freq: 240, duration: 0.1, type: 'sine', gain: 0.3, delay: 0.03 })
}

// Item returned to the tray
export function sfxReturn() {
  tone({ freq: 380, duration: 0.08, type: 'sine', gain: 0.3, slideTo: 320 })
}

// Item thrown in the trash
export function sfxTrash() {
  tone({ freq: 260, duration: 0.14, type: 'square', gain: 0.28, slideTo: 90 })
}

// A shelf just became fully/correctly sorted
export function sfxShelfComplete() {
  tone({ freq: 659.25, duration: 0.12, type: 'sine', gain: 0.45 })
  tone({ freq: 880.0, duration: 0.16, type: 'sine', gain: 0.4, delay: 0.08 })
}

export function sfxHint() {
  tone({ freq: 880, duration: 0.09, type: 'sine', gain: 0.35 })
  tone({ freq: 1174.66, duration: 0.12, type: 'sine', gain: 0.3, delay: 0.07 })
}

export function sfxClick() {
  tone({ freq: 640, duration: 0.05, type: 'triangle', gain: 0.25 })
}

export function sfxWin() {
  ;[523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
    tone({ freq: f, duration: 0.28, type: 'sine', gain: 0.5, delay: i * 0.13 })
  )
}

export function sfxLose() {
  ;[392.0, 349.23, 293.66].forEach((f, i) =>
    tone({ freq: f, duration: 0.32, type: 'sine', gain: 0.4, delay: i * 0.16 })
  )
}

// ---------------------------------------------------------------------------
// Background music — a gentle looping 8-step melody + soft bass, scheduled
// with lookahead so it stays perfectly in time even if the tab throttles.
// ---------------------------------------------------------------------------
const MELODY = [261.63, 329.63, 392.0, 329.63, 293.66, 349.23, 440.0, 392.0]
const BASS = [130.81, 0, 146.83, 0, 130.81, 0, 174.61, 0]
const STEP_DUR = 0.42

function scheduleStep() {
  const c = getCtx()
  if (!c) return
  while (nextStepTime < c.currentTime + 0.2) {
    const i = musicStep % MELODY.length
    const freq = MELODY[i]
    const bass = BASS[i]

    if (freq) {
      const osc = c.createOscillator()
      const g = c.createGain()
      osc.type = 'triangle'
      osc.frequency.value = freq
      g.gain.setValueAtTime(0.0001, nextStepTime)
      g.gain.linearRampToValueAtTime(0.6, nextStepTime + 0.03)
      g.gain.exponentialRampToValueAtTime(0.0001, nextStepTime + STEP_DUR * 0.9)
      osc.connect(g)
      g.connect(musicGain)
      osc.start(nextStepTime)
      osc.stop(nextStepTime + STEP_DUR)
    }
    if (bass) {
      const osc = c.createOscillator()
      const g = c.createGain()
      osc.type = 'sine'
      osc.frequency.value = bass
      g.gain.setValueAtTime(0.0001, nextStepTime)
      g.gain.linearRampToValueAtTime(0.5, nextStepTime + 0.03)
      g.gain.exponentialRampToValueAtTime(0.0001, nextStepTime + STEP_DUR * 0.95)
      osc.connect(g)
      g.connect(musicGain)
      osc.start(nextStepTime)
      osc.stop(nextStepTime + STEP_DUR)
    }

    nextStepTime += STEP_DUR
    musicStep++
  }
}

export function startMusic() {
  const c = getCtx()
  if (!c || musicPlaying) return
  if (c.state === 'suspended') c.resume()
  musicPlaying = true
  musicStep = 0
  nextStepTime = c.currentTime + 0.05
  scheduleStep()
  lookaheadTimer = setInterval(scheduleStep, 100)
}

export function stopMusic() {
  musicPlaying = false
  if (lookaheadTimer) clearInterval(lookaheadTimer)
  lookaheadTimer = null
}

export function isMusicPlaying() {
  return musicPlaying
}

export function isMusicMuted() {
  return musicMuted
}
