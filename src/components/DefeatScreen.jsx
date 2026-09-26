import { TOTAL_PAIRS } from '../lib/constants'
import Button from './Button'

export default function DefeatScreen({ matchedPairs, onRetry }) {
  return (
    <main className="relative z-10 flex flex-1 flex-col items-center justify-center gap-7 py-4 text-center">
      <div className="animate-wiggle grid h-36 w-36 place-items-center rounded-full border-4 border-zeek bg-zeek/20" aria-hidden="true">
        <svg viewBox="0 0 64 64" className="h-20 w-20" fill="none" stroke="#01E576" strokeWidth="4.5" strokeLinecap="round">
          <circle cx="32" cy="34" r="22" />
          <path d="M32 34V22M32 34l9 6M26 6h12M32 6v6" />
        </svg>
      </div>

      <div className="animate-fade-up space-y-3 [animation-delay:120ms]">
        <h1 className="font-display text-[clamp(2.4rem,11vw,4.2rem)] text-neon" aria-live="assertive">
          ¡Casi lo tenés!
        </h1>
        <p className="mx-auto max-w-xs text-lg leading-relaxed text-white/85">
          Se acabó el tiempo, pero podés intentarlo de nuevo.
        </p>
      </div>

      <p className="animate-fade-up rounded-full border-2 border-zeek bg-zeek/20 px-5 py-2 font-bold [animation-delay:220ms]">
        Encontraste <span className="text-neon">{matchedPairs}</span> de {TOTAL_PAIRS} parejas
      </p>

      <div className="animate-fade-up w-full max-w-sm [animation-delay:320ms]">
        <Button onClick={onRetry}>Reintentar</Button>
      </div>
    </main>
  )
}
