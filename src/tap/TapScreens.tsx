import Button from '../components/Button'
import Confetti from '../components/Confetti'
import { BAD_POINTS, GAME_DURATION_MS, GOAL, GOOD_POINTS } from './config'
import type { TapResult } from './TapGame'

const SECONDS = GAME_DURATION_MS / 1000
const fmtSeconds = (ms: number) => (ms / 1000).toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

export function GoodTarget({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <circle cx="50" cy="50" r="44" fill="none" stroke="#01E576" strokeOpacity="0.3" strokeWidth="10" />
      <circle cx="50" cy="50" r="40" fill="#01E576" />
      <path d="M54 26 L36 53 L49 53 L45 74 L64 46 L51 46 Z" fill="#000" />
    </svg>
  )
}

export function BadTarget({ className = '' }: { className?: string }) {
  const pts = Array.from({ length: 20 }, (_, i) => {
    const r = i % 2 === 0 ? 42 : 34
    const a = (i * Math.PI) / 10
    return `${50 + Math.cos(a) * r},${50 + Math.sin(a) * r}`
  }).join(' ')
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <polygon points={pts} fill="#6335ED" />
      <path d="M36 36 L64 64 M64 36 L36 64" stroke="#fff" strokeWidth="8" strokeLinecap="round" />
    </svg>
  )
}

function Title() {
  return (
    <h1 className="font-display text-center select-none">
      <span className="block -rotate-2 text-[clamp(3.6rem,19vw,7rem)] text-neon drop-shadow-[0_6px_0_#6335ED]">ZEEK</span>
      <span className="mt-1 block rotate-1 text-[clamp(3.6rem,19vw,7rem)] text-white drop-shadow-[0_6px_0_#01E576]">
        TAP <span className="tap-bolt inline-block">⚡</span>
      </span>
    </h1>
  )
}

export function TapWelcome({ onPlay }: { onPlay: () => void }) {
  const rules = [
    { icon: <GoodTarget className="h-11 w-11" />, text: 'Verde', hint: `+${GOOD_POINTS} punto` },
    { icon: <BadTarget className="h-11 w-11" />, text: 'Morado', hint: `${BAD_POINTS} puntos` },
    { icon: <span className="text-4xl">⚡</span>, text: `Alcanzá ${GOAL} puntos`, hint: `en ${SECONDS} segundos para ganar` },
  ]
  return (
    <main className="relative z-10 flex flex-1 flex-col items-center justify-center gap-6 py-4 text-center lg:grid lg:grid-cols-2 lg:gap-x-16 lg:py-10">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-fade-up relative">
          <GoodTarget className="tap-float absolute -top-10 -left-6 h-12 w-12 sm:-left-12" />
          <BadTarget className="tap-float absolute -right-6 bottom-2 h-12 w-12 [animation-delay:0.8s] sm:-right-10" />
          <Title />
        </div>
        <div className="animate-fade-up max-w-sm space-y-2 md:max-w-md [animation-delay:120ms]">
          <h2 className="font-display text-2xl leading-tight sm:text-3xl">¿Qué tan rápidos son tus reflejos?</h2>
          <p className="leading-relaxed text-white/80">
            Tocá los objetivos verdes, evitá los morados y conseguí {GOAL} puntos en {SECONDS} segundos para ganar.
          </p>
        </div>
      </div>

      <div className="flex w-full flex-col items-center gap-5 lg:rounded-3xl lg:border-2 lg:border-zeek/50 lg:bg-ink/60 lg:p-10 lg:backdrop-blur">
        <ul className="animate-fade-up grid w-full max-w-sm gap-2.5 md:max-w-md [animation-delay:200ms]">
          {rules.map((r) => (
            <li key={r.text} className="flex items-center gap-3 rounded-2xl border-2 border-zeek/60 bg-zeek/15 px-4 py-2.5 text-left">
              <span className="grid h-12 w-12 place-items-center">{r.icon}</span>
              <span>
                <span className="block font-bold">{r.text}</span>
                <span className="block text-sm text-white/65">{r.hint}</span>
              </span>
            </li>
          ))}
        </ul>
        <div className="animate-fade-up w-full max-w-sm md:max-w-md [animation-delay:300ms]">
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

interface ResultProps {
  result: TapResult
  onReplay: () => void
  onHome: () => void
}

export function TapVictory({ result, onReplay, onHome }: ResultProps) {
  return (
    <main className="relative z-10 flex flex-1 flex-col items-center justify-center gap-5 py-4 text-center lg:grid lg:grid-cols-2 lg:gap-x-16 lg:py-10">
      <Confetti />
      <div className="flex flex-col items-center gap-4">
        <div className="relative grid h-40 w-40 place-items-center" aria-hidden="true">
          <span className="tap-ring absolute inset-0 rounded-full border-4 border-neon" />
          <span className="tap-ring absolute inset-0 rounded-full border-4 border-zeek [animation-delay:0.5s]" />
          <GoodTarget className="tap-win h-28 w-28" />
        </div>
        <h1
          className="animate-fade-up font-display text-[clamp(2rem,8.5vw,3.6rem)] leading-[0.95] text-white [animation-delay:200ms]"
          aria-live="assertive"
        >
          ¡Reflejos de builder! ⚡
        </h1>
        <p className="animate-fade-up mx-auto max-w-sm leading-relaxed text-white/85 md:max-w-md [animation-delay:280ms]">
          Completaste ZEEK TAP. Mostrá esta pantalla al equipo de ZEEK para escanear tu QR de premio.
        </p>
      </div>
      <div className="flex w-full flex-col items-center gap-5">
        <div className="animate-fade-up flex w-full max-w-sm gap-3 md:max-w-md [animation-delay:360ms]">
          <Stat label="Puntaje" value={`${result.score}/${GOAL}`} />
          <Stat label="Tiempo restante" value={`${fmtSeconds(result.remainingMs)} s`} />
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

export function TapDefeat({ result, onReplay, onHome }: ResultProps) {
  return (
    <main className="relative z-10 mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-6 py-4 text-center">
      <div className="animate-wiggle grid h-32 w-32 place-items-center rounded-full border-4 border-zeek bg-zeek/20" aria-hidden="true">
        <span className="text-6xl">⚡</span>
      </div>
      <div className="animate-fade-up space-y-3 [animation-delay:120ms]">
        <h1 className="font-display text-[clamp(2.4rem,11vw,4.2rem)] text-neon" aria-live="assertive">
          ¡Casi lo tenés!
        </h1>
        <p className="mx-auto max-w-xs text-lg leading-relaxed text-white/85">Tus reflejos necesitan otra ronda. ¿Te animás?</p>
      </div>
      <div className="animate-fade-up flex w-full max-w-sm gap-3 [animation-delay:220ms]">
        <Stat label="Puntaje" value={`${result.score}/${GOAL}`} />
        <Stat label="Mejor racha" value={result.bestStreak} />
      </div>
      <div className="animate-fade-up w-full max-w-sm [animation-delay:300ms]">
        <Button onClick={onReplay}>Reintentar</Button>
        <button type="button" onClick={onHome} className="mt-3 text-sm font-bold text-white/70 underline underline-offset-4">
          Volver a ZEEK ARCADE
        </button>
      </div>
    </main>
  )
}
