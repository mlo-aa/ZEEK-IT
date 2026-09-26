import { GAME_DURATION_MS, TOTAL_PAIRS } from '../lib/constants'
import Button from './Button'
import CardIcon from './CardIcon'
import ClockIcon from './ClockIcon'
import Logotype from './Logotype'

const PREVIEW = ['ia', 'startup', 'innovacion']

export default function WelcomeScreen({ onPlay }) {
  const seconds = GAME_DURATION_MS / 1000
  return (
    <main className="relative z-10 flex flex-1 flex-col items-center justify-center gap-7 py-4 text-center">
      <div className="animate-fade-up">
        <Logotype />
      </div>

      <div className="animate-fade-up flex gap-3 [animation-delay:120ms]" aria-hidden="true">
        {PREVIEW.map((type, i) => (
          <div
            key={type}
            className="animate-float grid h-16 w-14 place-items-center rounded-xl bg-neon text-ink"
            style={{ '--rot': `${(i - 1) * 8}deg`, animationDelay: `${i * 0.4}s` }}
          >
            <CardIcon type={type} className="h-9 w-9" />
          </div>
        ))}
      </div>

      <div className="animate-fade-up max-w-sm space-y-3 [animation-delay:200ms]">
        <h2 className="font-display text-2xl leading-tight sm:text-3xl">Poné a prueba tu memoria</h2>
        <p className="text-base leading-relaxed text-white/80">
          Encontrá todas las parejas antes de que se acabe el tiempo y desbloqueá tu premio.
        </p>
      </div>

      <div className="animate-fade-up w-full max-w-sm space-y-4 [animation-delay:300ms]">
        <Button onClick={onPlay} aria-label={`Jugar: ${TOTAL_PAIRS} parejas en ${seconds} segundos`}>
          ¡Jugar!
        </Button>
        <p className="text-white/85">
          <ClockIcon className="mr-1.5 inline h-5 w-5 align-[-4px] text-neon" />
          Tenés <strong className="text-neon">{seconds} segundos</strong> para encontrar {TOTAL_PAIRS} parejas
        </p>
      </div>
    </main>
  )
}
