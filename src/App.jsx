import { useEffect, useState } from 'react'
import Decorations from './components/Decorations'
import DefeatScreen from './components/DefeatScreen'
import GameScreen from './components/GameScreen'
import Header from './components/Header'
import VictoryScreen from './components/VictoryScreen'
import WelcomeScreen from './components/WelcomeScreen'
import { useMemoryGame } from './hooks/useMemoryGame'
import { useSound } from './hooks/useSound'
import { RESULT_DELAY_MS } from './lib/constants'

export default function App() {
  const sound = useSound()
  const game = useMemoryGame(sound.play)
  const [screen, setScreen] = useState('welcome')

  // Pequeña pausa para ver la última tarjeta antes de pasar al resultado.
  useEffect(() => {
    if (screen !== 'game' || (game.status !== 'won' && game.status !== 'lost')) return
    const id = setTimeout(() => setScreen(game.status), RESULT_DELAY_MS)
    return () => clearTimeout(id)
  }, [screen, game.status])

  const startGame = () => {
    sound.unlock()
    game.reset()
    setScreen('game')
  }

  return (
    <div
      className={`safe-screen relative mx-auto flex max-w-xl flex-col ${
        screen === 'game' ? 'h-dvh overflow-hidden' : 'min-h-dvh overflow-x-hidden'
      }`}
    >
      <Decorations />
      <Header muted={sound.muted} onToggleMute={sound.toggleMuted} />

      {screen === 'welcome' && <WelcomeScreen onPlay={startGame} />}
      {screen === 'game' && <GameScreen game={game} />}
      {screen === 'won' && (
        <VictoryScreen remainingMs={game.remainingMs} attempts={game.attempts} onPlayAgain={startGame} />
      )}
      {screen === 'lost' && <DefeatScreen matchedPairs={game.matchedPairs} onRetry={startGame} />}
    </div>
  )
}
