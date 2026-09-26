import { useCallback, useEffect, useRef, useState } from 'react'
import { GAME_DURATION_MS, START_LIVES } from './config'
import { createRushState, resizeRush, startCountdown, step, timeLeftMs, type Input, type RushState } from './engine'
import { render } from './render'

export interface RushResult {
  won: boolean
  score: number
  stars: number
  survivedMs: number
}

interface Hud {
  lives: number
  score: number
  seconds: number
  countdown: number
}

interface Props {
  muted: boolean
  onToggleMute: () => void
  play: (sound: string) => void
  onFinish: (result: RushResult) => void
}

const FINISH_DELAY = { won: 450, lost: 1100 }

function Heart({ full }: { full: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-6 w-6 transition ${full ? 'scale-100' : 'scale-90 opacity-40'}`} aria-hidden="true">
      <path
        d="M12 21s-7.5-4.6-9.5-9.2C1 8.3 3.3 4.5 7 4.5c2.1 0 3.6 1.1 5 2.9 1.4-1.8 2.9-2.9 5-2.9 3.7 0 6 3.8 4.5 7.3C19.5 16.4 12 21 12 21z"
        fill={full ? '#01E576' : 'none'}
        stroke={full ? '#01E576' : '#ffffff'}
        strokeWidth="2"
      />
    </svg>
  )
}

function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />
      {muted ? <path d="M17 9l5 6M22 9l-5 6" /> : <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" />}
    </svg>
  )
}

export default function RushGame({ muted, onToggleMute, play, onFinish }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<RushState | null>(null)
  const inputRef = useRef<Input>({ dir: 0, dragDx: 0 })
  const keysRef = useRef({ left: false, right: false })
  const pausedRef = useRef(false)
  const playRef = useRef(play)
  const finishRef = useRef(onFinish)
  playRef.current = play
  finishRef.current = onFinish

  const [hud, setHud] = useState<Hud>({ lives: START_LIVES, score: 0, seconds: GAME_DURATION_MS / 1000, countdown: 3 })
  const [paused, setPaused] = useState(false)
  const [hitFlash, setHitFlash] = useState(0)

  const pause = useCallback(() => {
    const s = stateRef.current
    if (!s || s.status !== 'playing' || pausedRef.current) return
    pausedRef.current = true
    setPaused(true)
  }, [])

  const resume = useCallback(() => {
    const s = stateRef.current
    if (!s) return
    startCountdown(s)
    keysRef.current = { left: false, right: false }
    pausedRef.current = false
    setPaused(false)
  }, [])

  useEffect(() => {
    const container = containerRef.current!
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d', { alpha: false })!
    let dpr = Math.min(window.devicePixelRatio || 1, 2)

    const fit = () => {
      const w = Math.max(1, container.clientWidth)
      const h = Math.max(1, container.clientHeight)
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      if (!stateRef.current) stateRef.current = createRushState(w, h)
      else resizeRush(stateRef.current, w, h)
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(container)

    // --- Controles: arrastre (táctil o mouse) y teclado ---
    let pointerId: number | null = null
    let lastX = 0
    const onDown = (e: PointerEvent) => {
      if (pointerId !== null) return
      pointerId = e.pointerId
      lastX = e.clientX
      container.setPointerCapture(e.pointerId)
    }
    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return
      inputRef.current.dragDx += e.clientX - lastX
      lastX = e.clientX
    }
    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return
      pointerId = null
    }
    container.addEventListener('pointerdown', onDown)
    container.addEventListener('pointermove', onMove)
    container.addEventListener('pointerup', onUp)
    container.addEventListener('pointercancel', onUp)

    const LEFT = ['ArrowLeft', 'a', 'A']
    const RIGHT = ['ArrowRight', 'd', 'D']
    const onKey = (e: KeyboardEvent) => {
      const down = e.type === 'keydown'
      if (LEFT.includes(e.key)) keysRef.current.left = down
      else if (RIGHT.includes(e.key)) keysRef.current.right = down
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKey)

    // --- Pausa automática al cambiar de pestaña o salir de la app ---
    const onVisibility = () => document.hidden && pause()
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('blur', pause)

    // --- Bucle principal ---
    let raf = 0
    let last = performance.now()
    let finishTimer = 0
    const seen = { stars: 0, hits: 0, countdown: 3, lives: START_LIVES, score: 0, seconds: GAME_DURATION_MS / 1000 }

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      const s = stateRef.current!
      const dt = now - last
      last = now

      const { left, right } = keysRef.current
      inputRef.current.dir = left === right ? 0 : left ? -1 : 1
      if (pausedRef.current) {
        inputRef.current.dragDx = 0
      } else {
        const wasPlaying = s.status === 'playing'
        step(s, dt, inputRef.current)
        inputRef.current.dragDx = 0

        // Sonidos y HUD: solo cuando algo cambia.
        if (s.events.stars !== seen.stars) {
          seen.stars = s.events.stars
          playRef.current('star')
        }
        if (s.events.hits !== seen.hits) {
          seen.hits = s.events.hits
          playRef.current('hit')
          if (s.status === 'playing') setHitFlash((n) => n + 1)
        }
        const countdown = Math.ceil(s.countdown / 1000)
        const seconds = Math.ceil(timeLeftMs(s) / 1000)
        if (countdown !== seen.countdown || seconds !== seen.seconds || s.lives !== seen.lives || s.score !== seen.score) {
          if (countdown !== seen.countdown) playRef.current(countdown > 0 ? 'beep' : 'go')
          Object.assign(seen, { countdown, seconds, lives: s.lives, score: s.score })
          setHud({ lives: s.lives, score: s.score, seconds, countdown })
        }

        if (wasPlaying && s.status !== 'playing') {
          playRef.current(s.status === 'won' ? 'win' : 'lose')
          const result: RushResult = {
            won: s.status === 'won',
            score: s.score,
            stars: s.starsCollected,
            survivedMs: s.elapsed,
          }
          finishTimer = window.setTimeout(() => finishRef.current(result), FINISH_DELAY[s.status])
        }
      }
      render(ctx, s, dpr)
    }
    raf = requestAnimationFrame(frame)
    playRef.current('beep')

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(finishTimer)
      ro.disconnect()
      container.removeEventListener('pointerdown', onDown)
      container.removeEventListener('pointermove', onMove)
      container.removeEventListener('pointerup', onUp)
      container.removeEventListener('pointercancel', onUp)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('keyup', onKey)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('blur', pause)
    }
  }, [pause])

  const danger = hud.seconds <= 5 && hud.countdown === 0
  const mm = String(Math.floor(hud.seconds / 60)).padStart(2, '0')
  const ss = String(hud.seconds % 60).padStart(2, '0')

  return (
    <div className="rush-screen fixed inset-0 z-20 bg-ink select-none">
      <div ref={containerRef} className="rush-canvas absolute inset-0" aria-label="Zona de juego: deslizá para mover el cohete">
        <canvas ref={canvasRef} className="block" />
      </div>

      {/* HUD */}
      <div className="rush-hud pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 px-4">
        <div className="flex gap-1" role="img" aria-label={`${hud.lives} vidas`}>
          {Array.from({ length: START_LIVES }, (_, i) => (
            <Heart key={i} full={i < hud.lives} />
          ))}
        </div>
        <div
          role="timer"
          aria-label={`Tiempo restante: ${hud.seconds} segundos`}
          className={`font-display rounded-full border-2 px-4 py-1.5 text-2xl tabular-nums transition-colors ${
            danger ? 'animate-danger border-neon bg-neon text-ink' : 'border-zeek bg-ink/60 text-white'
          }`}
        >
          {mm}:{ss}
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          <span className="font-display flex items-center gap-1 text-xl tabular-nums" aria-label={`${hud.score} puntos`}>
            <span className="text-neon" aria-hidden="true">
              ★
            </span>
            {hud.score}
          </span>
          <button
            type="button"
            onClick={onToggleMute}
            aria-pressed={muted}
            aria-label={muted ? 'Activar sonido' : 'Silenciar sonido'}
            className="grid h-10 w-10 place-items-center rounded-full border-2 border-zeek/70 bg-ink/70 text-white active:scale-90"
          >
            <SpeakerIcon muted={muted} />
          </button>
        </div>
      </div>

      {hitFlash > 0 && <div key={hitFlash} className="rush-hit-flash pointer-events-none absolute inset-0" aria-hidden="true" />}

      {hud.countdown > 0 && !paused && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center" aria-live="assertive">
          <span key={hud.countdown} className="rush-count font-display text-[clamp(5rem,30vw,10rem)] text-neon">
            {hud.countdown}
          </span>
        </div>
      )}
      {hud.countdown === 0 && hud.seconds >= GAME_DURATION_MS / 1000 - 1 && !paused && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <span className="rush-go font-display text-[clamp(4rem,22vw,8rem)] text-white">¡YA!</span>
        </div>
      )}

      {paused && (
        <div className="absolute inset-0 z-10 grid place-items-center bg-ink/80 p-6 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-5 text-center">
            <p className="font-display text-5xl text-neon">Pausa</p>
            <p className="text-white/80">El juego se pausó. Al continuar hay una cuenta regresiva.</p>
            <button
              type="button"
              onClick={resume}
              className="font-display animate-glow rounded-full bg-neon px-10 py-4 text-xl text-ink active:scale-95"
            >
              Continuar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
