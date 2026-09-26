// Efectos generados con Web Audio: sin archivos que descargar, funcionan offline.
let ctx = null

function getContext() {
  if (typeof window === 'undefined') return null
  const AudioCtx = window.AudioContext || window.webkitAudioContext
  if (!AudioCtx) return null
  if (!ctx) ctx = new AudioCtx()
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  return ctx
}

// Llamar desde un gesto del usuario (iOS solo habilita audio así).
export function unlockAudio() {
  getContext()
}

function tone(audio, { freq, start = 0, duration = 0.12, type = 'square', volume = 0.08, slideTo }) {
  const t0 = audio.currentTime + start
  const osc = audio.createOscillator()
  const gain = audio.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + duration)
  gain.gain.setValueAtTime(0.0001, t0)
  gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)
  osc.connect(gain).connect(audio.destination)
  osc.start(t0)
  osc.stop(t0 + duration + 0.02)
}

const SOUNDS = {
  flip: [{ freq: 520, slideTo: 780, duration: 0.07, type: 'triangle', volume: 0.1 }],
  match: [
    { freq: 660, duration: 0.09 },
    { freq: 990, start: 0.08, duration: 0.14 },
  ],
  miss: [{ freq: 220, slideTo: 140, duration: 0.2, type: 'sawtooth', volume: 0.05 }],
  tick: [{ freq: 1200, duration: 0.04, type: 'sine', volume: 0.06 }],
  win: [523, 659, 784, 1047].map((freq, i) => ({ freq, start: i * 0.1, duration: 0.18 })),
  lose: [392, 330, 262].map((freq, i) => ({
    freq,
    start: i * 0.16,
    duration: 0.22,
    type: 'triangle',
    volume: 0.1,
  })),
}

export function playSound(name) {
  const audio = getContext()
  if (!audio || !SOUNDS[name]) return
  try {
    SOUNDS[name].forEach((note) => tone(audio, note))
  } catch {
    // El audio nunca debe romper el juego.
  }
}
