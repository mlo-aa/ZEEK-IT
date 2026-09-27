import { useState } from 'react'
import Decorations from '../components/Decorations'
import Header from '../components/Header'
import { useFullscreen } from '../hooks/useFullscreen'
import { useSound } from '../hooks/useSound'
import TapGame, { type TapResult } from './TapGame'
import { TapDefeat, TapVictory, TapWelcome } from './TapScreens'

type Screen = 'welcome' | 'playing' | 'won' | 'lost'

export default function TapApp({ onExit }: { onExit: () => void }) {
  // El sonido arranca desactivado; la preferencia se recuerda en este equipo.
  const sound = useSound('zeek-tap:muted', true)
  const fullscreen = useFullscreen()
  const [screen, setScreen] = useState<Screen>('welcome')
  const [result, setResult] = useState<TapResult | null>(null)
  const [run, setRun] = useState(0)

  const start = () => {
    sound.unlock()
    setResult(null)
    setRun((n) => n + 1)
    setScreen('playing')
  }

  const finish = (r: TapResult) => {
    setResult(r)
    setScreen(r.won ? 'won' : 'lost')
  }

  if (screen === 'playing') {
    return <TapGame key={run} muted={sound.muted} onToggleMute={sound.toggleMuted} play={sound.play} onFinish={finish} />
  }

  return (
    <div className="safe-screen relative mx-auto flex min-h-dvh w-full max-w-xl flex-col overflow-x-hidden md:max-w-3xl lg:max-w-6xl lg:px-10">
      <Decorations />
      <Header muted={sound.muted} onToggleMute={sound.toggleMuted} fullscreen={fullscreen} onBack={onExit} />
      {screen === 'welcome' && <TapWelcome onPlay={start} />}
      {screen === 'won' && result && <TapVictory result={result} onReplay={start} onHome={onExit} />}
      {screen === 'lost' && result && <TapDefeat result={result} onReplay={start} onHome={onExit} />}
    </div>
  )
}
