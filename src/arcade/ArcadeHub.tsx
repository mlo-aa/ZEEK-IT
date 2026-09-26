import type { ReactNode } from 'react'
import Decorations from '../components/Decorations'
import Header from '../components/Header'
import CardIcon from '../components/CardIcon'
import { useFullscreen } from '../hooks/useFullscreen'
import RocketSvg from '../rush/RocketSvg'
import type { GameId } from './routes'

interface GameCardProps {
  title: string
  tagline: string
  chips: string[]
  art: ReactNode
  accent: 'neon' | 'purple'
  onPlay: () => void
  delay: string
}

function GameCard({ title, tagline, chips, art, accent, onPlay, delay }: GameCardProps) {
  const neon = accent === 'neon'
  return (
    <button
      type="button"
      onClick={onPlay}
      aria-label={`Jugar ${title}`}
      className={`group animate-fade-up relative flex w-full items-center gap-4 overflow-hidden rounded-3xl border-2 p-4 text-left transition active:scale-[0.98] sm:p-5 lg:flex-col lg:items-start lg:p-7 ${
        neon ? 'border-neon/70 bg-neon/10 hover:bg-neon/15' : 'border-zeek bg-zeek/20 hover:bg-zeek/30'
      }`}
      style={{ animationDelay: delay }}
    >
      <div className="grid h-24 w-24 shrink-0 place-items-center sm:h-28 sm:w-28 lg:h-40 lg:w-40 lg:self-center">{art}</div>
      <div className="min-w-0 flex-1">
        <h2 className={`font-display text-3xl sm:text-4xl ${neon ? 'text-neon' : 'text-white'}`}>{title}</h2>
        <p className="mt-1 text-sm leading-snug text-white/80 sm:text-base">{tagline}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {chips.map((c) => (
            <span key={c} className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-bold">
              {c}
            </span>
          ))}
        </div>
      </div>
      <span
        className={`font-display grid h-12 w-12 shrink-0 place-items-center rounded-full text-xl transition group-hover:scale-110 lg:absolute lg:top-6 lg:right-6 ${
          neon ? 'bg-neon text-ink' : 'bg-white text-zeek'
        }`}
        aria-hidden="true"
      >
        ▶
      </span>
    </button>
  )
}

function MemoryArt() {
  return (
    <div className="relative h-full w-full" aria-hidden="true">
      <div className="absolute top-1/2 left-1/2 grid h-[70%] w-[48%] -translate-x-[85%] -translate-y-1/2 -rotate-12 place-items-center rounded-xl border-2 border-zeek bg-ink">
        <span className="font-display text-3xl text-zeek">Z</span>
      </div>
      <div className="absolute top-1/2 left-1/2 grid h-[70%] w-[48%] -translate-x-[15%] -translate-y-1/2 rotate-6 place-items-center rounded-xl bg-neon text-ink">
        <CardIcon type="ia" className="h-[60%] w-[60%]" />
      </div>
    </div>
  )
}

function RushArt() {
  return (
    <div className="relative h-full w-full" aria-hidden="true">
      <span className="absolute top-[12%] left-[12%] h-5 w-5 rotate-12 rounded-md border-2 border-neon" />
      <span className="absolute right-[14%] bottom-[18%] h-4 w-4 -rotate-12 rounded-md border-2 border-zeek-light" />
      <span className="absolute top-[18%] right-[20%] text-lg text-white">★</span>
      <div className="absolute inset-0 grid place-items-center">
        <RocketSvg className="rush-float h-[85%] rotate-12" />
      </div>
    </div>
  )
}

export default function ArcadeHub({ onOpen }: { onOpen: (game: GameId) => void }) {
  const fullscreen = useFullscreen()
  return (
    <div className="safe-screen relative mx-auto flex min-h-dvh w-full max-w-xl flex-col overflow-x-hidden md:max-w-3xl lg:max-w-6xl lg:px-10">
      <Decorations />
      <Header fullscreen={fullscreen} />
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center gap-8 py-6 text-center">
        <div className="animate-fade-up">
          <h1 className="font-display text-center select-none">
            <span className="block -rotate-2 text-[clamp(3.4rem,17vw,6.5rem)] text-neon drop-shadow-[0_6px_0_#6335ED]">
              ZEEK
            </span>
            <span className="mt-1 block rotate-1 text-[clamp(3rem,15vw,5.8rem)] text-white drop-shadow-[0_5px_0_#6335ED]">
              ARCADE
            </span>
          </h1>
          <p className="mt-4 text-lg text-white/80">Minijuegos para builders. Elegí tu reto 👾</p>
        </div>

        <div className="grid w-full max-w-md gap-4 md:max-w-2xl lg:max-w-4xl lg:grid-cols-2 lg:gap-6">
          <GameCard
            title="ZEEK IT"
            tagline="Memorama: encontrá todas las parejas antes de que se acabe el tiempo."
            chips={['🧠 Memoria', '⏱️ 45 s', '🏆 Ranking']}
            art={<MemoryArt />}
            accent="neon"
            onPlay={() => onOpen('it')}
            delay="120ms"
          />
          <GameCard
            title="ZEEK RUSH"
            tagline="Pilotá tu cohete, esquivá asteroides y recolectá estrellas."
            chips={['🚀 Arcade', '⏱️ 30 s', '♥ 3 vidas']}
            art={<RushArt />}
            accent="purple"
            onPlay={() => onOpen('rush')}
            delay="220ms"
          />
        </div>
      </main>
    </div>
  )
}
