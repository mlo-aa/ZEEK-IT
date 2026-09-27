import { useState, type ComponentType } from 'react'
import Decorations from '../../components/Decorations'
import Header from '../../components/Header'
import { useFullscreen } from '../../hooks/useFullscreen'
import { useSound } from '../../hooks/useSound'
import { GameResult, GameWelcome, type ResultStat, type WelcomeConfig } from './screens'

export interface Outcome {
  won: boolean
}

export interface PlayProps<R extends Outcome> {
  muted: boolean
  onToggleMute: () => void
  play: (sound: string) => void
  onFinish: (result: R) => void
}

export interface GameDefinition<R extends Outcome> {
  /** Clave de la preferencia de sonido (arranca apagado). */
  id: string
  welcome: WelcomeConfig
  Play: ComponentType<PlayProps<R>>
  stats: (result: R) => ResultStat[]
  defeatMessage: string
}

type Screen = 'welcome' | 'playing' | 'result'

/**
 * Flujo común de cada juego: bienvenida → partida → victoria/derrota.
 * Cada juego tiene su propio estado; reiniciar remonta la partida desde cero.
 */
export function GameApp<R extends Outcome>({ game, onExit }: { game: GameDefinition<R>; onExit: () => void }) {
  const sound = useSound(`zeek-${game.id}:muted`, true)
  const fullscreen = useFullscreen()
  const [screen, setScreen] = useState<Screen>('welcome')
  const [result, setResult] = useState<R | null>(null)
  const [run, setRun] = useState(0)
  const { Play } = game

  const start = () => {
    sound.unlock()
    setResult(null)
    setRun((n) => n + 1)
    setScreen('playing')
  }

  const finish = (r: R) => {
    setResult(r)
    setScreen('result')
  }

  if (screen === 'playing') {
    return <Play key={run} muted={sound.muted} onToggleMute={sound.toggleMuted} play={sound.play} onFinish={finish} />
  }

  return (
    <div className="safe-screen relative mx-auto flex min-h-dvh w-full max-w-xl flex-col overflow-x-hidden md:max-w-3xl lg:max-w-6xl lg:px-10">
      <Decorations />
      <Header muted={sound.muted} onToggleMute={sound.toggleMuted} fullscreen={fullscreen} onBack={onExit} />
      {screen === 'welcome' && <GameWelcome config={game.welcome} onPlay={start} />}
      {screen === 'result' && result && (
        <GameResult
          won={result.won}
          emoji={game.welcome.emoji}
          stats={game.stats(result)}
          defeatMessage={game.defeatMessage}
          onReplay={start}
          onHome={onExit}
        />
      )}
    </div>
  )
}
