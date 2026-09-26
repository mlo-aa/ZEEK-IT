import { useState } from 'react'
import Decorations from '../components/Decorations'
import Header from '../components/Header'
import { useFullscreen } from '../hooks/useFullscreen'
import { useSound } from '../hooks/useSound'
import RushGame, { type RushResult } from './RushGame'
import { RushDefeat, RushVictory, RushWelcome } from './RushScreens'

type Screen = 'welcome' | 'playing' | 'won' | 'lost'

export default function RushApp({ onExit }: { onExit: () => void }) {
  // El sonido arranca desactivado; la preferencia se recuerda en este equipo.
  const sound = useSound('zeek-rush:muted', true)
  const fullscreen = useFullscreen()
  const [screen, setScreen] = useState<Screen>('welcome')
  const [result, setResult] = useState<RushResult | null>(null)
  const [run, setRun] = useState(0)

  const start = () => {
    sound.unlock()
    setResult(null)
    setRun((n) => n + 1)
    setScreen('playing')
  }

  const finish = (r: RushResult) => {
    setResult(r)
    setScreen(r.won ? 'won' : 'lost')
  }

  if (screen === 'playing') {
    return (
      <RushGame key={run} muted={sound.muted} onToggleMute={sound.toggleMuted} play={sound.play} onFinish={finish} />
    )
  }

  return (
    <div className="safe-screen relative mx-auto flex min-h-dvh w-full max-w-xl flex-col overflow-x-hidden md:max-w-3xl lg:max-w-6xl lg:px-10">
      <Decorations />
      <Header muted={sound.muted} onToggleMute={sound.toggleMuted} fullscreen={fullscreen} onBack={onExit} />
      {screen === 'welcome' && <RushWelcome onPlay={start} />}
      {screen === 'won' && result && <RushVictory result={result} onReplay={start} onHome={onExit} />}
      {screen === 'lost' && result && <RushDefeat result={result} onReplay={start} onHome={onExit} />}
    </div>
  )
}
