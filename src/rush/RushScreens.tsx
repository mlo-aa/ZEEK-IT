import Button from '../components/Button'
import Confetti from '../components/Confetti'
import { GAME_DURATION_MS, START_LIVES, STAR_POINTS } from './config'
import RocketSvg from './RocketSvg'
import type { RushResult } from './RushGame'

const SECONDS = GAME_DURATION_MS / 1000

function Title({ className = '' }: { className?: string }) {
  return (
    <h1 className={`font-display relative text-center select-none ${className}`}>
      <span className="block -rotate-2 text-[clamp(3.6rem,19vw,7rem)] text-neon drop-shadow-[0_6px_0_#6335ED]">ZEEK</span>
      <span className="mt-1 block rotate-1 text-[clamp(3.6rem,19vw,7rem)] text-white drop-shadow-[0_6px_0_#01E576]">
        RUSH
      </span>
    </h1>
  )
}

const INSTRUCTIONS = [
  { icon: '🚀', text: 'Mové tu cohete', hint: 'Deslizá el dedo · ← → o A D' },
  { icon: '⭐', text: 'Recolectá estrellas', hint: `+${STAR_POINTS} puntos cada una` },
  { icon: '☄️', text: 'Esquivá los asteroides', hint: 'Cada choque te quita una vida' },
]

export function RushWelcome({ onPlay }: { onPlay: () => void }) {
  return (
    <main className="relative z-10 flex flex-1 flex-col items-center justify-center gap-6 py-4 text-center lg:grid lg:grid-cols-2 lg:gap-x-16 lg:py-10">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-fade-up relative">
          <RocketSvg className="rush-float absolute -top-6 -right-10 h-24 w-20 rotate-12 sm:-right-14 sm:h-28" />
          <Title />
        </div>
        <div className="animate-fade-up max-w-sm space-y-2 md:max-w-md [animation-delay:120ms]">
          <h2 className="font-display text-2xl leading-tight sm:text-3xl">Esquivá. Recolectá. Sobreviví.</h2>
          <p className="leading-relaxed text-white/80">
            Pilotá tu cohete, esquivá los obstáculos y sobreviví {SECONDS} segundos para ganar tu premio.
          </p>
        </div>
      </div>

      <div className="flex w-full flex-col items-center gap-5 lg:rounded-3xl lg:border-2 lg:border-zeek/50 lg:bg-ink/60 lg:p-10 lg:backdrop-blur">
        <ul className="animate-fade-up grid w-full max-w-sm gap-2.5 md:max-w-md [animation-delay:200ms]">
          {INSTRUCTIONS.map((it) => (
            <li key={it.text} className="flex items-center gap-3 rounded-2xl border-2 border-zeek/60 bg-zeek/15 px-4 py-3 text-left">
              <span className="text-3xl" aria-hidden="true">
                {it.icon}
              </span>
              <span>
                <span className="block font-bold">{it.text}</span>
                <span className="block text-sm text-white/65">{it.hint}</span>
              </span>
            </li>
          ))}
        </ul>

        <p className="animate-fade-up flex items-center gap-2 font-bold [animation-delay:260ms]">
          Tenés {START_LIVES} vidas
          <span className="text-neon" aria-hidden="true">
            {'♥'.repeat(START_LIVES)}
          </span>
          · {SECONDS} segundos
        </p>

        <div className="animate-fade-up w-full max-w-sm md:max-w-md [animation-delay:320ms]">
          <Button onClick={onPlay}>¡Jugar!</Button>
        </div>
      </div>
    </main>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex-1 rounded-2xl border-2 border-zeek bg-zeek/20 px-3 py-3">
      <p className="text-[0.7rem] font-bold tracking-widest text-white/70 uppercase">{label}</p>
      <p className="font-display mt-1 text-3xl text-neon tabular-nums">{value}</p>
    </div>
  )
}

function Sparkles() {
  // Estrellitas que titilan alrededor del cohete en la victoria.
  const spots = [
    [8, 20],
    [85, 12],
    [15, 70],
    [90, 60],
    [50, 5],
    [70, 85],
  ]
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {spots.map(([x, y], i) => (
        <span
          key={i}
          className="rush-twinkle absolute text-2xl text-neon"
          style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${i * 0.25}s` }}
        >
          ✦
        </span>
      ))}
    </div>
  )
}

interface ResultProps {
  result: RushResult
  onReplay: () => void
  onHome: () => void
}

export function RushVictory({ result, onReplay, onHome }: ResultProps) {
  return (
    <main className="relative z-10 flex flex-1 flex-col items-center justify-center gap-5 py-4 text-center lg:grid lg:grid-cols-2 lg:gap-x-16 lg:py-10">
      <Confetti />
      <div className="flex flex-col items-center gap-4">
        <div className="relative grid h-44 w-44 place-items-center">
          <Sparkles />
          <RocketSvg className="rush-launch h-36 w-28" />
        </div>
        <h1 className="animate-fade-up font-display text-[clamp(2rem,8.5vw,3.6rem)] leading-[0.95] text-white [animation-delay:200ms]" aria-live="assertive">
          ¡Misión completada! 🚀
        </h1>
        <p className="animate-fade-up mx-auto max-w-sm leading-relaxed text-white/85 md:max-w-md [animation-delay:280ms]">
          Sobreviviste al ZEEK RUSH. Mostrá esta pantalla al equipo de ZEEK para escanear tu QR de premio.
        </p>
      </div>

      <div className="flex w-full flex-col items-center gap-5">
        <div className="animate-fade-up flex w-full max-w-sm gap-3 md:max-w-md [animation-delay:360ms]">
          <Stat label="Puntaje" value={result.score} />
          <Stat label="Estrellas" value={`★ ${result.stars}`} />
        </div>
        <div className="animate-fade-up w-full max-w-sm md:max-w-md [animation-delay:440ms]">
          <Button variant="purple" onClick={onReplay}>
            Jugar de nuevo
          </Button>
          <button type="button" onClick={onHome} className="mt-3 text-sm font-bold text-white/70 underline underline-offset-4">
            Volver a ZEEK ARCADE
          </button>
        </div>
      </div>
    </main>
  )
}

export function RushDefeat({ result, onReplay, onHome }: ResultProps) {
  const survived = (result.survivedMs / 1000).toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  return (
    <main className="relative z-10 mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-6 py-4 text-center">
      {/* El cohete pierde el control: gira, se aleja y deja humo. Sin violencia. */}
      <div className="relative grid h-44 w-44 place-items-center" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="rush-smoke absolute h-6 w-6 rounded-full bg-white/25" style={{ animationDelay: `${i * 0.35}s` }} />
        ))}
        <RocketSvg className="rush-spin h-28 w-24" flame={false} />
      </div>

      <div className="animate-fade-up space-y-3 [animation-delay:150ms]">
        <h1 className="font-display text-[clamp(2.4rem,11vw,4.2rem)] text-neon" aria-live="assertive">
          ¡Misión fallida!
        </h1>
        <p className="mx-auto max-w-xs text-lg leading-relaxed text-white/85">
          Tu cohete no llegó al destino. ¿Listo para intentarlo de nuevo?
        </p>
      </div>

      <div className="animate-fade-up flex w-full max-w-sm gap-3 [animation-delay:250ms]">
        <Stat label="Sobreviviste" value={`${survived} s`} />
        <Stat label="Puntaje" value={result.score} />
      </div>

      <div className="animate-fade-up w-full max-w-sm [animation-delay:330ms]">
        <Button onClick={onReplay}>Reintentar</Button>
        <button type="button" onClick={onHome} className="mt-3 text-sm font-bold text-white/70 underline underline-offset-4">
          Volver a ZEEK ARCADE
        </button>
      </div>
    </main>
  )
}
