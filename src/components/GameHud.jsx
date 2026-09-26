import { GAME_DURATION_MS, TOTAL_PAIRS } from '../lib/constants'
import ClockIcon from './ClockIcon'

const format = (s) => `00:${String(Math.max(0, s)).padStart(2, '0')}`

export default function GameHud({ secondsLeft, remainingMs, matchedPairs, started }) {
  const danger = started && secondsLeft <= 10
  const pct = (remainingMs / GAME_DURATION_MS) * 100

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div
          role="timer"
          aria-label={`Tiempo restante: ${secondsLeft} segundos`}
          className={`flex items-center gap-2 rounded-full border-2 px-4 py-2 transition-colors ${
            danger ? 'animate-danger border-neon bg-neon text-ink' : 'border-zeek bg-zeek/25 text-white'
          }`}
        >
          <ClockIcon className="h-6 w-6" />
          <span className="font-display text-3xl tabular-nums leading-none">{format(secondsLeft)}</span>
        </div>

        <div className="text-right" aria-live="polite">
          <p className="text-xs font-bold tracking-widest text-white/60 uppercase">Parejas</p>
          <p className="font-display text-3xl leading-none tabular-nums">
            <span className="text-neon">{matchedPairs}</span>
            <span className="text-white/50">/{TOTAL_PAIRS}</span>
          </p>
        </div>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
        <div
          className={`h-full rounded-full transition-[width] duration-100 ease-linear ${danger ? 'bg-neon' : 'bg-zeek'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
