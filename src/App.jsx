import { useEffect, useRef, useState } from 'react'
import Decorations from './components/Decorations'
import DefeatScreen from './components/DefeatScreen'
import GameScreen from './components/GameScreen'
import Header from './components/Header'
import RankingScreen from './components/RankingScreen'
import VictoryScreen from './components/VictoryScreen'
import WelcomeScreen from './components/WelcomeScreen'
import { useMemoryGame } from './hooks/useMemoryGame'
import { useSound } from './hooks/useSound'
import { useStoredState } from './hooks/useStoredState'
import { MODES, RESULT_DELAY_MS } from './lib/constants'
import { submitScore } from './lib/rankingApi'
import { cleanName } from './lib/rankingRules'
import { computeScore } from './lib/score'

const isMode = (m) => Boolean(MODES[m])
const isString = (v) => typeof v === 'string'

// Abrir /#ranking muestra directo el ranking (ideal para una pantalla del stand).
const initialScreen = () => (window.location.hash === '#ranking' ? 'ranking' : 'welcome')

export default function App() {
  const sound = useSound()
  const game = useMemoryGame(sound.play)
  const [name, setName] = useStoredState('zeek-it:name', '', isString)
  const [mode, setMode] = useStoredState('zeek-it:mode', 'normal', isMode)
  const [screen, setScreen] = useState(initialScreen)
  const [returnTo, setReturnTo] = useState('welcome')
  const [submission, setSubmission] = useState(null)
  const gameIdRef = useRef(0)

  const finished = game.status === 'won' || game.status === 'lost'
  const score = computeScore({
    won: game.status === 'won',
    pairs: game.matchedPairs,
    remainingMs: game.remainingMs,
    attempts: game.attempts,
  })

  // Pequeña pausa para ver la última tarjeta antes de pasar al resultado.
  useEffect(() => {
    if (screen !== 'game' || !finished) return
    const id = setTimeout(() => setScreen(game.status), RESULT_DELAY_MS)
    return () => clearTimeout(id)
  }, [screen, finished, game.status])

  // Enviar la partida al ranking una sola vez, apenas termina.
  useEffect(() => {
    if (!finished || screen !== 'game') return
    const gameId = gameIdRef.current
    setSubmission({ gameId, state: 'pending' })
    submitScore({
      name: cleanName(name),
      mode: game.mode,
      won: game.status === 'won',
      pairs: game.matchedPairs,
      attempts: game.attempts,
      remainingMs: game.remainingMs,
    })
      .catch(() => null)
      .then((result) => {
        setSubmission((s) => (s?.gameId === gameId ? { gameId, state: 'done', result } : s))
      })
    // Solo al cambiar a terminado; el resto de valores ya quedó fijo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished])

  const startGame = () => {
    sound.unlock()
    gameIdRef.current += 1
    setSubmission(null)
    game.reset(mode)
    setScreen('game')
  }

  const showRanking = () => {
    setReturnTo(screen === 'ranking' ? 'welcome' : screen)
    setScreen('ranking')
  }

  const leaveRanking = () => {
    if (window.location.hash) history.replaceState(null, '', window.location.pathname)
    setScreen(returnTo)
  }

  return (
    <div
      className={`safe-screen relative mx-auto flex w-full max-w-xl flex-col md:max-w-3xl lg:max-w-6xl lg:px-10 ${
        screen === 'game' ? 'h-dvh overflow-hidden' : 'min-h-dvh overflow-x-hidden'
      }`}
    >
      <Decorations />
      <Header muted={sound.muted} onToggleMute={sound.toggleMuted} />

      {screen === 'welcome' && (
        <WelcomeScreen
          name={name}
          onNameChange={setName}
          mode={mode}
          onModeChange={setMode}
          onPlay={startGame}
          onShowRanking={showRanking}
        />
      )}
      {screen === 'game' && <GameScreen game={game} />}
      {screen === 'won' && (
        <VictoryScreen
          remainingMs={game.remainingMs}
          attempts={game.attempts}
          score={score}
          submission={submission}
          onShowRanking={showRanking}
          onPlayAgain={startGame}
          onHome={() => setScreen('welcome')}
        />
      )}
      {screen === 'lost' && (
        <DefeatScreen
          matchedPairs={game.matchedPairs}
          totalPairs={game.totalPairs}
          score={score}
          submission={submission}
          onShowRanking={showRanking}
          onRetry={startGame}
          onHome={() => setScreen('welcome')}
        />
      )}
      {screen === 'ranking' && (
        <RankingScreen initialMode={returnTo === 'welcome' ? mode : game.mode} playerName={name} onBack={leaveRanking} />
      )}
    </div>
  )
}
