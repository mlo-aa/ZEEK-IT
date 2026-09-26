import { MODES } from '../lib/constants'
import ClockIcon from './ClockIcon'

const format = (s) => {
  const t = Math.max(0, s)
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`
}

export default function GameHud({ mode, secondsLeft, remainingMs, matchedPairs, totalPairs, penalties, started }) {
  const config = MODES[mode]
  const danger = started && secondsLeft <= 10
  const pct = Math.max(0, (remainingMs / config.durationMs) * 100)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="relative">
          <div
            role="timer"
            aria-label={`Tiempo restante: ${secondsLeft} segundos`}
            className={`flex items-center gap-2 rounded-full border-2 px-4 py-2 transition-colors ${
              danger ? 'animate-danger border-neon bg-neon text-ink' : 'border-zeek bg-zeek/25 text-white'
            }`}
          >
            <ClockIcon className="h-6 w-6" />
            <span className="font-display text-3xl leading-none tabular-nums">{format(secondsLeft)}</span>
          </div>
          {penalties > 0 && (
            <span key={penalties} className="penalty-float font-display" aria-hidden="true">
              −{config.penaltyMs / 1000}s
            </span>
          )}
        </div>

        <div className="text-right" aria-live="polite">
          <p className="text-xs font-bold tracking-widest text-white/60 uppercase">
            {mode === 'extreme' ? '🔥 Extremo · ' : ''}Parejas
          </p>
          <p className="font-display text-3xl leading-none tabular-nums">
            <span className="text-neon">{matchedPairs}</span>
            <span className="text-white/50">/{totalPairs}</span>
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
