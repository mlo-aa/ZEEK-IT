import type { ReactNode, RefObject } from 'react'
import type { PlayState } from './usePlayState'

function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />
      {muted ? <path d="M17 9l5 6M22 9l-5 6" /> : <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" />}
    </svg>
  )
}

interface Props {
  hud: ReactNode
  /** Fila opcional debajo del HUD (barra de progreso, contador…). */
  subHud?: ReactNode
  children: ReactNode
  areaRef: RefObject<HTMLDivElement | null>
  areaLabel: string
  state: PlayState
  muted: boolean
  onToggleMute: () => void
  /** Elementos por encima del área (carteles, popups). */
  overlay?: ReactNode
}

/**
 * Pantalla de juego a pantalla completa, sin desplazamiento: HUD arriba (con
 * botón de sonido), área de juego amplia, cuenta regresiva y pausa.
 */
export default function PlayLayout({ hud, subHud, children, areaRef, areaLabel, state, muted, onToggleMute, overlay }: Props) {
  return (
    <div className="rush-screen fixed inset-0 z-20 flex flex-col bg-ink select-none">
      <div className="rush-hud relative z-10 flex flex-col gap-2 px-4 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex min-w-0 flex-1 items-center justify-between gap-2">{hud}</div>
          <button
            type="button"
            onClick={onToggleMute}
            aria-pressed={muted}
            aria-label={muted ? 'Activar sonido' : 'Silenciar sonido'}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 border-zeek/70 bg-ink/70 text-white active:scale-90"
          >
            <SpeakerIcon muted={muted} />
          </button>
        </div>
        {subHud}
      </div>

      <div ref={areaRef} className="rush-canvas relative min-h-0 flex-1 overflow-hidden" aria-label={areaLabel}>
        {children}
      </div>

      {overlay}

      {state.countdown > 0 && !state.paused && (
        <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center" aria-live="assertive">
          <span key={state.countdown} className="rush-count font-display text-[clamp(5rem,30vw,10rem)] text-neon">
            {state.countdown}
          </span>
        </div>
      )}
      {state.showGo && !state.paused && (
        <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center">
          <span className="rush-go font-display text-[clamp(4rem,22vw,8rem)] text-white">¡YA!</span>
        </div>
      )}

      {state.paused && (
        <div className="absolute inset-0 z-30 grid place-items-center bg-ink/80 p-6 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-5 text-center">
            <p className="font-display text-5xl text-neon">Pausa</p>
            <p className="text-white/80">El juego se pausó. Al continuar hay una cuenta regresiva.</p>
            <button
              type="button"
              onClick={state.resume}
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
