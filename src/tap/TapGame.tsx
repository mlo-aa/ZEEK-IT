import { useCallback, useEffect, useRef, useState } from 'react'
import { COMBO_FROM, GAME_DURATION_MS, GOAL } from './config'
import { createTapState, resizeTap, startCountdown, step, tap, timeLeftMs, type TapEvent, type TapState } from './engine'
import { render } from './render'

export interface TapResult {
  won: boolean
  score: number
  remainingMs: number
  goodHits: number
  bestStreak: number
}

interface Hud {
  score: number
  seconds: number
  countdown: number
  streak: number
}

interface Props {
  muted: boolean
  onToggleMute: () => void
  play: (sound: string) => void
  onFinish: (result: TapResult) => void
}

const FINISH_DELAY = { won: 600, lost: 700 }

function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />
      {muted ? <path d="M17 9l5 6M22 9l-5 6" /> : <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" />}
    </svg>
  )
}

export default function TapGame({ muted, onToggleMute, play, onFinish }: Props) {
  const areaRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<TapState | null>(null)
  const pausedRef = useRef(false)
  const playRef = useRef(play)
  const finishRef = useRef(onFinish)
  playRef.current = play
  finishRef.current = onFinish

  const [hud, setHud] = useState<Hud>({ score: 0, seconds: GAME_DURATION_MS / 1000, countdown: 3, streak: 0 })
  const [popups, setPopups] = useState<TapEvent[]>([])
  const [combo, setCombo] = useState<TapEvent | null>(null)
  const [shakeKey, setShakeKey] = useState(0)
  const [paused, setPaused] = useState(false)

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
    pausedRef.current = false
    setPaused(false)
  }, [])

  useEffect(() => {
    const area = areaRef.current!
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d', { alpha: false })!
    let dpr = Math.min(window.devicePixelRatio || 1, 2)

    const fit = () => {
      const w = Math.max(1, area.clientWidth)
      const h = Math.max(1, area.clientHeight)
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      if (!stateRef.current) stateRef.current = createTapState(w, h)
      else resizeTap(stateRef.current, w, h)
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(area)

    // Un pointerdown = un toque = como máximo un objetivo (lo garantiza el motor).
    const onDown = (e: PointerEvent) => {
      e.preventDefault()
      const s = stateRef.current
      if (!s || pausedRef.current) return
      const rect = area.getBoundingClientRect()
      tap(s, e.clientX - rect.left, e.clientY - rect.top)
    }
    area.addEventListener('pointerdown', onDown)

    const onVisibility = () => document.hidden && pause()
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('blur', pause)

    let raf = 0
    let last = performance.now()
    let finishTimer = 0
    let finished = false
    const seen = { score: 0, seconds: GAME_DURATION_MS / 1000, countdown: 3, streak: 0 }

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      const s = stateRef.current!
      const dt = now - last
      last = now

      if (!pausedRef.current) {
        step(s, dt)

        // Eventos de toques → sonidos, "+1/-2", combos y vibración.
        if (s.events.length) {
          const fresh = s.events.splice(0)
          for (const ev of fresh) {
            if (ev.type === 'good') playRef.current('pop')
            if (ev.type === 'bad') {
              playRef.current('buzz')
              setShakeKey((k) => k + 1)
              // Vibración visual breve del área (sin remontar el canvas).
              area.animate(
                [
                  { transform: 'translateX(0)' },
                  { transform: 'translateX(-10px)' },
                  { transform: 'translateX(8px)' },
                  { transform: 'translateX(-5px)' },
                  { transform: 'translateX(0)' },
                ],
                { duration: 280, easing: 'ease-out' },
              )
              navigator.vibrate?.(60)
            }
            if (ev.type === 'combo') {
              playRef.current('combo')
              setCombo(ev)
            }
          }
          const shown = fresh.filter((ev) => ev.type !== 'combo')
          if (shown.length) setPopups((p) => [...p.slice(-6), ...shown])
        }

        const countdown = Math.ceil(s.countdown / 1000)
        const seconds = Math.ceil(timeLeftMs(s) / 1000)
        if (countdown !== seen.countdown || seconds !== seen.seconds || s.score !== seen.score || s.streak !== seen.streak) {
          if (countdown !== seen.countdown) playRef.current(countdown > 0 ? 'beep' : 'go')
          Object.assign(seen, { countdown, seconds, score: s.score, streak: s.streak })
          setHud({ countdown, seconds, score: s.score, streak: s.streak })
        }

        // El final puede ocurrir en step() (tiempo) o en tap() (meta), entre frames.
        if (!finished && s.status !== 'playing') {
          finished = true
          playRef.current(s.status === 'won' ? 'win' : 'lose')
          const result: TapResult = {
            won: s.status === 'won',
            score: s.score,
            remainingMs: timeLeftMs(s),
            goodHits: s.goodHits,
            bestStreak: s.bestStreak,
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
      area.removeEventListener('pointerdown', onDown)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('blur', pause)
    }
  }, [pause])

  const progress = Math.min(1, hud.score / GOAL)
  const danger = hud.seconds <= 5 && hud.countdown === 0
  const onFire = hud.streak >= COMBO_FROM

  return (
    <div className="rush-screen fixed inset-0 z-20 flex flex-col bg-ink select-none">
      {/* HUD */}
      <div className="rush-hud relative z-10 flex flex-col gap-2 px-4 pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-[5.5rem]" aria-live="polite" aria-label={`${hud.score} de ${GOAL} puntos`}>
            <p className="text-[0.65rem] font-bold tracking-widest text-white/60 uppercase">Puntos</p>
            <p className="font-display text-3xl leading-none tabular-nums">
              <span key={hud.score} className={`tap-bump inline-block ${onFire ? 'text-neon' : 'text-white'}`}>
                {hud.score}
              </span>
              <span className="text-white/45">/{GOAL}</span>
            </p>
          </div>
          <div
            role="timer"
            aria-label={`Tiempo restante: ${hud.seconds} segundos`}
            className={`font-display rounded-full border-2 px-4 py-1.5 text-2xl tabular-nums transition-colors ${
              danger ? 'animate-danger border-neon bg-neon text-ink' : 'border-zeek bg-ink/60 text-white'
            }`}
          >
            00:{String(hud.seconds).padStart(2, '0')}
          </div>
          <div className="flex min-w-[5.5rem] justify-end">
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
        <div
          className="h-3 overflow-hidden rounded-full border border-white/15 bg-white/10"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={GOAL}
          aria-valuenow={hud.score}
          aria-label="Progreso hacia la meta"
        >
          <div
            className={`h-full rounded-full bg-neon transition-[width] duration-200 ${onFire ? 'tap-fire' : ''}`}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      {/* Área de juego */}
      <div
        ref={areaRef}
        className="rush-canvas relative min-h-0 flex-1 overflow-hidden"
        aria-label="Área de juego: tocá los objetivos verdes"
      >
        <canvas ref={canvasRef} className="block" />
        {popups.map((p) => (
          <span
            key={p.id}
            className={`tap-popup font-display pointer-events-none absolute text-3xl ${p.type === 'good' ? 'text-neon' : 'text-zeek-light'}`}
            style={{ left: p.x, top: p.y }}
            onAnimationEnd={() => setPopups((list) => list.filter((x) => x.id !== p.id))}
            aria-hidden="true"
          >
            {p.type === 'good' ? '+1' : '−2'}
          </span>
        ))}
        {shakeKey > 0 && <div key={`f${shakeKey}`} className="tap-bad-flash pointer-events-none absolute inset-0" aria-hidden="true" />}
      </div>

      {combo && (
        <div key={combo.id} className="pointer-events-none absolute inset-x-0 top-[18%] z-10 grid place-items-center" aria-live="polite">
          <span className="tap-combo font-display rounded-2xl bg-neon px-5 py-2 text-3xl text-ink">
            ¡Combo x{combo.streak}! ⚡
          </span>
        </div>
      )}

      {hud.countdown > 0 && !paused && (
        <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center" aria-live="assertive">
          <span key={hud.countdown} className="rush-count font-display text-[clamp(5rem,30vw,10rem)] text-neon">
            {hud.countdown}
          </span>
        </div>
      )}
      {hud.countdown === 0 && hud.seconds >= GAME_DURATION_MS / 1000 - 1 && !paused && (
        <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center">
          <span className="rush-go font-display text-[clamp(4rem,22vw,8rem)] text-white">¡YA!</span>
        </div>
      )}

      {paused && (
        <div className="absolute inset-0 z-30 grid place-items-center bg-ink/80 p-6 backdrop-blur-sm">
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
