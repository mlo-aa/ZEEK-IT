import { useEffect, useMemo, useState } from 'react'
import Button from './Button'
import Confetti from './Confetti'
import Trophy from './Trophy'

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function makeCode() {
  return Array.from({ length: 4 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('')
}

const formatClock = (d) => d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' })

function Stat({ label, value }) {
  return (
    <div className="flex-1 rounded-2xl border-2 border-zeek bg-zeek/20 px-3 py-3">
      <p className="text-[0.7rem] font-bold tracking-widest text-white/70 uppercase">{label}</p>
      <p className="font-display mt-1 text-3xl text-neon tabular-nums">{value}</p>
    </div>
  )
}

export default function VictoryScreen({ remainingMs, attempts, onPlayAgain }) {
  // Código + hora en vivo: ayudan al staff a distinguir una victoria real
  // de una captura de pantalla vieja.
  const code = useMemo(makeCode, [])
  const wonAt = useMemo(() => new Date(), [])
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

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
          Encontraste todas las parejas. Mostrá esta pantalla al equipo de ZEEK para escanear tu QR de premio.
        </p>
      </div>

      <div className="animate-fade-up flex w-full max-w-sm gap-3 [animation-delay:380ms]">
        <Stat label="Tiempo restante" value={`${secondsLeft} s`} />
        <Stat label="Intentos" value={attempts} />
      </div>

      <div className="animate-fade-up w-full max-w-sm rounded-2xl bg-neon p-4 text-left text-ink [animation-delay:480ms]">
        <div className="flex items-center gap-3">
          <svg viewBox="0 0 24 24" className="h-9 w-9 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="8" width="18" height="4" rx="1" />
            <path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5" />
          </svg>
          <p className="text-sm leading-snug font-semibold">
            Mostrá esta pantalla <strong className="font-black">en el stand de ZEEK</strong> para recibir tu QR de premio.
          </p>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t-2 border-ink/15 pt-3 text-xs font-bold">
          <span className="whitespace-nowrap">
            Código <span className="font-display ml-1 text-base tracking-widest">ZK-{code}</span>
          </span>
          <span className="flex items-center gap-1.5 tabular-nums">
            <span className="animate-live h-2 w-2 rounded-full bg-zeek" aria-hidden="true" />
            Ganaste {formatClock(wonAt)} · ahora {formatClock(now)}
          </span>
        </div>
      </div>

      <div className="animate-fade-up w-full max-w-sm [animation-delay:560ms]">
        <Button variant="purple" onClick={onPlayAgain}>
          Jugar de nuevo
        </Button>
      </div>
    </main>
  )
}
