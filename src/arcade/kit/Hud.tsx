// Piezas del HUD compartidas por los juegos de ZEEK ARCADE.

export function HudTimer({ seconds, dangerFrom = 5 }: { seconds: number; dangerFrom?: number }) {
  const danger = seconds <= dangerFrom
  const s = Math.max(0, seconds)
  return (
    <div
      role="timer"
      aria-label={`Tiempo restante: ${s} segundos`}
      className={`font-display rounded-full border-2 px-3.5 py-1.5 text-2xl tabular-nums transition-colors ${
        danger ? 'animate-danger border-neon bg-neon text-ink' : 'border-zeek bg-ink/60 text-white'
      }`}
    >
      {String(Math.floor(s / 60)).padStart(2, '0')}:{String(s % 60).padStart(2, '0')}
    </div>
  )
}

export function HudStat({ label, value, goal, accent = false }: { label: string; value: number | string; goal?: number; accent?: boolean }) {
  return (
    <div className="min-w-[4.5rem]" aria-live="polite" aria-label={`${label}: ${value}${goal ? ` de ${goal}` : ''}`}>
      <p className="text-[0.62rem] font-bold tracking-widest text-white/60 uppercase">{label}</p>
      <p className="font-display text-2xl leading-none tabular-nums sm:text-3xl">
        <span key={String(value)} className={`tap-bump inline-block ${accent ? 'text-neon' : 'text-white'}`}>
          {value}
        </span>
        {goal !== undefined && <span className="text-white/45">/{goal}</span>}
      </p>
    </div>
  )
}

export function Hearts({ lives, max = 3 }: { lives: number; max?: number }) {
  return (
    <div className="flex gap-0.5" role="img" aria-label={`${lives} vidas`}>
      {Array.from({ length: max }, (_, i) => {
        const full = i < lives
        return (
          <svg key={i} viewBox="0 0 24 24" className={`h-6 w-6 transition ${full ? '' : 'scale-90 opacity-40'}`} aria-hidden="true">
            <path
              d="M12 21s-7.5-4.6-9.5-9.2C1 8.3 3.3 4.5 7 4.5c2.1 0 3.6 1.1 5 2.9 1.4-1.8 2.9-2.9 5-2.9 3.7 0 6 3.8 4.5 7.3C19.5 16.4 12 21 12 21z"
              fill={full ? '#01E576' : 'none'}
              stroke={full ? '#01E576' : '#ffffff'}
              strokeWidth="2"
            />
          </svg>
        )
      })}
    </div>
  )
}

export function ProgressBar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = Math.max(0, Math.min(1, value / max)) * 100
  return (
    <div
      className="h-3 overflow-hidden rounded-full border border-white/15 bg-white/10"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-label={label}
    >
      <div className="h-full rounded-full bg-neon transition-[width] duration-200" style={{ width: `${pct}%` }} />
    </div>
  )
}
