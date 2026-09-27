import type { ReactNode } from 'react'
import Button from '../../components/Button'
import Confetti from '../../components/Confetti'

export interface Rule {
  icon: ReactNode
  title: string
  hint: string
}

export interface WelcomeConfig {
  /** Segunda palabra del título: ZEEK <name>. */
  name: string
  emoji: string
  subtitle: string
  description: string
  rules: Rule[]
  chips: string[]
  art?: ReactNode
}

export function GameWelcome({ config, onPlay }: { config: WelcomeConfig; onPlay: () => void }) {
  return (
    <main className="relative z-10 flex flex-1 flex-col items-center justify-center gap-6 py-4 text-center lg:grid lg:grid-cols-2 lg:gap-x-16 lg:py-10">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-fade-up relative">
          {config.art}
          <h1 className="font-display text-center select-none">
            <span className="block -rotate-2 text-[clamp(3.4rem,18vw,6.5rem)] text-neon drop-shadow-[0_6px_0_#6335ED]">ZEEK</span>
            <span className="mt-1 block rotate-1 text-[clamp(2.9rem,15vw,6rem)] text-white drop-shadow-[0_6px_0_#01E576]">
              {config.name} <span className="tap-bolt inline-block">{config.emoji}</span>
            </span>
          </h1>
        </div>
        <div className="animate-fade-up max-w-sm space-y-2 md:max-w-md [animation-delay:120ms]">
          <h2 className="font-display text-2xl leading-tight sm:text-3xl">{config.subtitle}</h2>
          <p className="leading-relaxed text-white/80">{config.description}</p>
        </div>
      </div>

      <div className="flex w-full flex-col items-center gap-5 lg:rounded-3xl lg:border-2 lg:border-zeek/50 lg:bg-ink/60 lg:p-10 lg:backdrop-blur">
        <ul className="animate-fade-up grid w-full max-w-sm gap-2.5 md:max-w-md [animation-delay:200ms]">
          {config.rules.map((r) => (
            <li key={r.title} className="flex items-center gap-3 rounded-2xl border-2 border-zeek/60 bg-zeek/15 px-4 py-2.5 text-left">
              <span className="grid h-11 w-11 shrink-0 place-items-center text-3xl" aria-hidden="true">
                {r.icon}
              </span>
              <span>
                <span className="block font-bold">{r.title}</span>
                <span className="block text-sm text-white/65">{r.hint}</span>
              </span>
            </li>
          ))}
        </ul>
        <div className="animate-fade-up flex flex-wrap justify-center gap-2 [animation-delay:250ms]">
          {config.chips.map((c) => (
            <span key={c} className="rounded-full border-2 border-neon/50 bg-neon/10 px-3 py-1 text-sm font-bold">
              {c}
            </span>
          ))}
        </div>
        <div className="animate-fade-up w-full max-w-sm md:max-w-md [animation-delay:300ms]">
          <Button onClick={onPlay}>¡Jugar!</Button>
        </div>
      </div>
    </main>
  )
}

export interface ResultStat {
  label: string
  value: string | number
}

interface ResultProps {
  won: boolean
  emoji: string
  stats: ResultStat[]
  /** Mensaje de la derrota (motivación propia de cada juego). */
  defeatMessage: string
  onReplay: () => void
  onHome: () => void
}

function Stat({ label, value }: ResultStat) {
  return (
    <div className="flex-1 rounded-2xl border-2 border-zeek bg-zeek/20 px-3 py-3">
      <p className="text-[0.7rem] font-bold tracking-widest text-white/70 uppercase">{label}</p>
      <p className="font-display mt-1 text-2xl text-neon tabular-nums sm:text-3xl">{value}</p>
    </div>
  )
}

export function GameResult({ won, emoji, stats, defeatMessage, onReplay, onHome }: ResultProps) {
  if (won) {
    return (
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center gap-5 py-4 text-center lg:grid lg:grid-cols-2 lg:gap-x-16 lg:py-10">
        <Confetti />
        <div className="flex flex-col items-center gap-4">
          <div className="relative grid h-40 w-40 place-items-center" aria-hidden="true">
            <span className="tap-ring absolute inset-0 rounded-full border-4 border-neon" />
            <span className="tap-ring absolute inset-0 rounded-full border-4 border-zeek [animation-delay:0.5s]" />
            <span className="tap-win grid h-28 w-28 place-items-center rounded-full bg-neon text-6xl shadow-[0_0_40px_rgb(1_229_118/0.6)]">
              {emoji}
            </span>
          </div>
          <h1 className="animate-fade-up font-display text-[clamp(2.4rem,11vw,4.2rem)] text-white [animation-delay:200ms]" aria-live="assertive">
            ¡Lo lograste!
          </h1>
          <p className="animate-fade-up mx-auto max-w-sm leading-relaxed text-white/85 md:max-w-md [animation-delay:280ms]">
            Mostrá esta pantalla al equipo de ZEEK para escanear tu QR de premio.
          </p>
        </div>
        <div className="flex w-full flex-col items-center gap-5">
          <div className="animate-fade-up flex w-full max-w-sm gap-3 md:max-w-md [animation-delay:360ms]">
            {stats.map((s) => (
              <Stat key={s.label} {...s} />
            ))}
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
  return (
    <main className="relative z-10 mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-6 py-4 text-center">
      <div className="animate-wiggle grid h-32 w-32 place-items-center rounded-full border-4 border-zeek bg-zeek/20" aria-hidden="true">
        <span className="text-6xl">{emoji}</span>
      </div>
      <div className="animate-fade-up space-y-3 [animation-delay:120ms]">
        <h1 className="font-display text-[clamp(2.4rem,11vw,4.2rem)] text-neon" aria-live="assertive">
          ¡Casi lo tenés!
        </h1>
        <p className="mx-auto max-w-xs text-lg leading-relaxed text-white/85">{defeatMessage}</p>
      </div>
      <div className="animate-fade-up flex w-full max-w-sm gap-3 [animation-delay:220ms]">
        {stats.map((s) => (
          <Stat key={s.label} {...s} />
        ))}
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
