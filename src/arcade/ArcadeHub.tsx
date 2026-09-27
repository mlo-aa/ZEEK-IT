import Decorations from '../components/Decorations'
import Header from '../components/Header'
import { useFullscreen } from '../hooks/useFullscreen'
import { GAMES, type GameEntry } from './games'
import type { GameId } from './routes'

function GameTile({ game, onPlay, index }: { game: GameEntry; onPlay: () => void; index: number }) {
  const neon = game.accent === 'neon'
  const { Art } = game
  return (
    <button
      type="button"
      onClick={onPlay}
      aria-label={`Jugar ${game.title}`}
      className={`group animate-fade-up relative flex h-full flex-col items-center gap-2 overflow-hidden rounded-3xl border-2 p-3 text-center transition active:scale-[0.97] sm:p-4 ${
        neon ? 'border-neon/70 bg-neon/10 hover:bg-neon/15' : 'border-zeek bg-zeek/20 hover:bg-zeek/30'
      }`}
      style={{ animationDelay: `${80 + index * 60}ms` }}
    >
      <div className="grid h-20 w-24 place-items-center sm:h-24 sm:w-28 lg:h-28 lg:w-32">
        <Art />
      </div>
      <h2 className={`font-display text-xl leading-none sm:text-2xl ${neon ? 'text-neon' : 'text-white'}`}>{game.title}</h2>
      <p className="text-xs leading-snug text-white/75 sm:text-sm">{game.tagline}</p>
      <div className="mt-auto flex flex-wrap justify-center gap-1">
        {game.chips.map((c) => (
          <span key={c} className="rounded-full bg-white/10 px-2 py-0.5 text-[0.68rem] font-bold whitespace-nowrap sm:text-xs">
            {c}
          </span>
        ))}
      </div>
    </button>
  )
}

export default function ArcadeHub({ onOpen }: { onOpen: (game: GameId) => void }) {
  const fullscreen = useFullscreen()
  return (
    <div className="safe-screen relative mx-auto flex min-h-dvh w-full max-w-xl flex-col overflow-x-hidden md:max-w-3xl lg:max-w-6xl lg:px-10">
      <Decorations />
      <Header fullscreen={fullscreen} />
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center gap-7 py-6 text-center">
        <div className="animate-fade-up">
          <h1 className="font-display text-center select-none">
            <span className="block -rotate-2 text-[clamp(3rem,15vw,5.8rem)] text-neon drop-shadow-[0_6px_0_#6335ED]">ZEEK</span>
            <span className="mt-1 block rotate-1 text-[clamp(2.7rem,13vw,5.2rem)] text-white drop-shadow-[0_5px_0_#6335ED]">
              ARCADE
            </span>
          </h1>
          <p className="mt-3 text-lg text-white/80">
            {GAMES.length} minijuegos para builders. Elegí tu reto 👾
          </p>
        </div>

        <div className="grid w-full grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-5">
          {GAMES.map((g, i) => (
            <GameTile key={g.id} game={g} index={i} onPlay={() => onOpen(g.id)} />
          ))}
        </div>
      </main>
    </div>
  )
}
