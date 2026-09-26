import { useCallback, useEffect, useState } from 'react'
import { MODES } from '../lib/constants'
import { fetchRanking } from '../lib/rankingApi'
import { SCORE_RULES } from '../lib/score'
import Button from './Button'

const REFRESH_MS = 15_000
const MEDALS = ['🥇', '🥈', '🥉']

function formatDay(day) {
  const [y, m, d] = day.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default function RankingScreen({ initialMode, playerName, onBack }) {
  const [mode, setMode] = useState(initialMode)
  const [data, setData] = useState(null)
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
    try {
      setData(await fetchRanking())
      setError(false)
    } catch {
      setError(true)
    }
  }, [])

  // Se refresca solo, para dejarlo abierto en una pantalla del stand.
  useEffect(() => {
    load()
    const id = setInterval(load, REFRESH_MS)
    return () => clearInterval(id)
  }, [load])

  const board = data?.boards?.[mode] ?? []
  const me = playerName.trim().toLocaleLowerCase('es')

  return (
    <main className="relative z-10 flex flex-1 flex-col gap-4 py-4">
      <div className="text-center">
        <h1 className="font-display text-[clamp(2.2rem,10vw,3.4rem)] text-neon">Ranking del día</h1>
        {data?.day && <p className="mt-1 text-sm text-white/60 first-letter:uppercase">{formatDay(data.day)}</p>}
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-full border-2 border-zeek p-1" role="tablist" aria-label="Modo">
        {Object.values(MODES).map((m) => (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={mode === m.id}
            onClick={() => setMode(m.id)}
            className={`font-display rounded-full py-2.5 text-lg transition ${
              mode === m.id ? 'bg-neon text-ink' : 'text-white/70 hover:text-white'
            }`}
          >
            {m.id === 'extreme' ? '🔥 ' : ''}
            {m.label}
          </button>
        ))}
      </div>

      <ol className="flex flex-col gap-2" aria-live="polite">
        {!data && !error && <li className="py-10 text-center text-white/60">Cargando…</li>}
        {error && <li className="py-10 text-center text-white/60">No pudimos cargar el ranking.</li>}
        {data && board.length === 0 && (
          <li className="py-10 text-center text-white/60">Todavía nadie jugó en este modo hoy. ¡Sé el primero!</li>
        )}
        {board.map((e, i) => {
          const mine = e.name?.toLocaleLowerCase('es') === me
          return (
            <li
              key={`${e.name}-${i}`}
              className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-3 ${
                mine ? 'border-neon bg-neon/15' : i < 3 ? 'border-zeek bg-zeek/20' : 'border-white/10 bg-white/5'
              }`}
            >
              <span className="font-display w-8 text-center text-xl">{MEDALS[i] ?? i + 1}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-bold">{e.name}</span>
                <span className="block text-xs text-white/60">
                  {e.won ? `✅ ${(e.remainingMs / 1000).toLocaleString('es-AR', { maximumFractionDigits: 1 })} s de sobra` : `⏱️ ${e.pairs} parejas`} · {e.attempts}{' '}
                  intentos
                </span>
              </span>
              <span className="font-display text-2xl text-neon tabular-nums">{e.score}</span>
            </li>
          )
        })}
      </ol>

      {data?.local && (
        <p className="text-center text-xs text-white/50">
          Mostrando el ranking guardado en este dispositivo (el ranking en línea no está disponible).
        </p>
      )}

      <p className="text-center text-xs leading-relaxed text-white/50">
        Puntaje: {SCORE_RULES.perPair} por pareja · +{SCORE_RULES.winBonus} si ganás · +{SCORE_RULES.perSecondLeft} por
        segundo de sobra · −{SCORE_RULES.perMiss} por error. Se guarda tu mejor partida del día.
      </p>

      <div className="mt-auto w-full">
        <Button variant="purple" onClick={onBack}>
          Volver
        </Button>
      </div>
    </main>
  )
}
