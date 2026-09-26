import { NAME_MAX_LENGTH } from '../lib/constants'
import { cleanName } from '../lib/rankingRules'
import Button from './Button'
import Logotype from './Logotype'
import ModePicker from './ModePicker'

export default function WelcomeScreen({ name, onNameChange, mode, onModeChange, onPlay, onShowRanking }) {
  const ready = cleanName(name).length > 0

  const submit = (e) => {
    e.preventDefault()
    if (ready) onPlay()
  }

  return (
    <main className="relative z-10 flex flex-1 flex-col items-center justify-center gap-6 py-4 text-center">
      <div className="animate-fade-up">
        <Logotype />
      </div>

      <div className="animate-fade-up max-w-sm space-y-2 [animation-delay:120ms]">
        <h2 className="font-display text-2xl leading-tight sm:text-3xl">Poné a prueba tu memoria</h2>
        <p className="leading-relaxed text-white/80">
          Encontrá todas las parejas antes de que se acabe el tiempo y desbloqueá tu premio.
        </p>
      </div>

      <form onSubmit={submit} className="animate-fade-up flex w-full max-w-sm flex-col gap-4 [animation-delay:220ms]">
        <label className="flex flex-col gap-1.5 text-left">
          <span className="text-xs font-bold tracking-widest text-white/70 uppercase">Tu nombre para el ranking</span>
          <input
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value.slice(0, NAME_MAX_LENGTH))}
            maxLength={NAME_MAX_LENGTH}
            placeholder="Ej: Ada Lovelace"
            autoComplete="nickname"
            enterKeyHint="go"
            className="rounded-2xl border-2 border-zeek bg-ink/80 px-4 py-3.5 text-lg font-bold text-white placeholder:font-normal placeholder:text-white/35 focus:border-neon focus:outline-none"
          />
        </label>

        <ModePicker value={mode} onChange={onModeChange} />

        <Button type="submit" disabled={!ready} className="disabled:animate-none disabled:opacity-40">
          ¡Jugar!
        </Button>
        {!ready && <p className="-mt-2 text-sm text-white/60">Escribí tu nombre para empezar.</p>}
      </form>

      <button
        type="button"
        onClick={onShowRanking}
        className="animate-fade-up font-bold text-neon underline decoration-2 underline-offset-4 [animation-delay:300ms]"
      >
        🏆 Ver ranking del día
      </button>
    </main>
  )
}
