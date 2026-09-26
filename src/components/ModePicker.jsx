import { MODES } from '../lib/constants'

const DETAILS = {
  normal: (m) => [`${m.pairs} parejas`, `${m.durationMs / 1000} s`],
  extreme: (m) => [`${m.pairs} parejas`, `${m.durationMs / 1000} s`, 'trampas', 'glitch', `−${m.penaltyMs / 1000} s por error`],
}

export default function ModePicker({ value, onChange }) {
  return (
    <fieldset className="grid w-full grid-cols-2 gap-3">
      <legend className="sr-only">Modo de juego</legend>
      {Object.values(MODES).map((mode) => {
        const active = value === mode.id
        const extreme = mode.id === 'extreme'
        return (
          <label
            key={mode.id}
            className={`relative flex cursor-pointer flex-col items-start gap-1.5 rounded-2xl border-2 p-3 text-left transition active:scale-95 has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-neon ${
              active
                ? extreme
                  ? 'border-neon bg-zeek text-white shadow-[0_0_24px_rgb(99_53_237/0.6)]'
                  : 'border-neon bg-neon text-ink'
                : 'border-white/20 bg-white/5 text-white/80 hover:border-white/40'
            }`}
          >
            <input
              type="radio"
              name="mode"
              value={mode.id}
              checked={active}
              onChange={() => onChange(mode.id)}
              className="sr-only"
            />
            <span className="font-display text-lg">
              {extreme ? '🔥 ' : ''}
              {mode.label}
            </span>
            <span className="flex flex-wrap gap-1">
              {DETAILS[mode.id](mode).map((d) => (
                <span
                  key={d}
                  className={`rounded-full px-2 py-0.5 text-[0.68rem] font-bold ${
                    active ? (extreme ? 'bg-ink/40' : 'bg-ink/10') : 'bg-white/10'
                  }`}
                >
                  {d}
                </span>
              ))}
            </span>
          </label>
        )
      })}
    </fieldset>
  )
}
