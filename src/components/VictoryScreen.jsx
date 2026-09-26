import Button from './Button'
import Confetti from './Confetti'
import Trophy from './Trophy'

const INSTAGRAM_URL = 'https://www.instagram.com/zeek_cr'

function Stat({ label, value }) {
  return (
    <div className="flex-1 rounded-2xl border-2 border-zeek bg-zeek/20 px-3 py-3">
      <p className="text-[0.7rem] font-bold tracking-widest text-white/70 uppercase">{label}</p>
      <p className="font-display mt-1 text-3xl text-neon tabular-nums">{value}</p>
    </div>
  )
}

export default function VictoryScreen({ remainingMs, attempts, onPlayAgain }) {
  const secondsLeft = (remainingMs / 1000).toLocaleString('es-AR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })

  return (
    <main className="relative z-10 flex flex-1 flex-col items-center justify-center gap-5 py-2 text-center">
      <Confetti />
      <Trophy />

      <div className="animate-fade-up space-y-3 [animation-delay:250ms]">
        <h1 className="font-display text-[clamp(2.6rem,12vw,4.5rem)] text-white" aria-live="assertive">
          ¡Lo lograste!
        </h1>
        <p className="mx-auto max-w-sm leading-relaxed text-white/85">
          Encontraste todas las parejas. Seguí a ZEEK en Instagram para reclamar tu QR de premio.
        </p>
      </div>

      <div className="animate-fade-up flex w-full max-w-sm gap-3 [animation-delay:380ms]">
        <Stat label="Tiempo restante" value={`${secondsLeft} s`} />
        <Stat label="Intentos" value={attempts} />
      </div>

      <div className="animate-fade-up w-full max-w-sm rounded-2xl bg-neon p-4 text-left text-ink [animation-delay:480ms]">
        <div className="flex items-center gap-3">
          <svg viewBox="0 0 24 24" className="h-9 w-9 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.3" cy="6.7" r="0.6" fill="currentColor" />
          </svg>
          <p className="text-sm leading-snug font-semibold">
            Seguí a <strong className="font-black">@zeek_cr</strong> en Instagram para reclamar tu{' '}
            <strong className="font-black">QR de premio</strong>.
          </p>
        </div>
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-display mt-3 flex items-center justify-center gap-2 rounded-full bg-ink px-5 py-3.5 text-base tracking-wide text-neon transition active:scale-95"
        >
          Seguir a @zeek_cr
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M7 17L17 7M9 7h8v8" />
          </svg>
        </a>
      </div>

      <div className="animate-fade-up w-full max-w-sm [animation-delay:560ms]">
        <Button variant="purple" onClick={onPlayAgain}>
          Jugar de nuevo
        </Button>
      </div>
    </main>
  )
}
