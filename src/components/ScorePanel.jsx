// Puntaje de la partida + posición en el ranking del día.
export default function ScorePanel({ score, submission, onShowRanking }) {
  let status = 'Guardando en el ranking…'
  if (submission?.state === 'done' && submission.result) {
    const { rank, improved, best, local } = submission.result
    status = improved
      ? rank
        ? `¡Quedaste #${rank} en el ranking de hoy!`
        : 'Puntaje guardado.'
      : `Tu mejor puntaje de hoy sigue siendo ${best}.`
    if (local) status += ' (ranking de este dispositivo)'
  } else if (submission?.state === 'done') {
    status = 'No pudimos guardar esta partida.'
  }

  return (
    <div className="flex w-full max-w-sm items-center md:max-w-md justify-between gap-3 rounded-2xl border-2 border-neon/70 bg-ink/70 px-4 py-3 text-left">
      <div>
        <p className="text-[0.7rem] font-bold tracking-widest text-white/70 uppercase">Puntaje</p>
        <p className="font-display text-4xl text-neon tabular-nums">{score}</p>
      </div>
      <div className="flex flex-col items-end gap-1.5 text-right">
        <p className="text-sm leading-snug font-semibold text-white/85" aria-live="polite">
          {status}
        </p>
        <button type="button" onClick={onShowRanking} className="text-sm font-bold text-neon underline underline-offset-4">
          Ver ranking →
        </button>
      </div>
    </div>
  )
}
