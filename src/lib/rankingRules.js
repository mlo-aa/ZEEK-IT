// Importado también por api/scores.js en Node puro: usar extensiones .js.
import { MODES, NAME_MAX_LENGTH } from './constants.js'
import { computeScore } from './score.js'

export const RANKING_TIMEZONE = 'America/Costa_Rica'
export const RANKING_LIMIT = 20

// "2026-09-26" en la zona horaria del evento: el ranking se reinicia a medianoche.
export function dayKey(date = new Date(), timeZone = RANKING_TIMEZONE) {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
}

export function cleanName(raw) {
  return String(raw ?? '')
    .normalize('NFC')
    .replace(/[\u0000-\u001f\u007f<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, NAME_MAX_LENGTH)
}

// Valida una partida enviada por el navegador y devuelve la entrada del
// ranking con el puntaje recalculado, o null si los datos no tienen sentido.
export function buildEntry(input) {
  const mode = MODES[input?.mode]
  const name = cleanName(input?.name)
  const pairs = Number(input?.pairs)
  const attempts = Number(input?.attempts)
  const remainingMs = Math.round(Number(input?.remainingMs))
  const won = input?.won === true

  if (!mode || !name) return null
  if (!Number.isInteger(pairs) || pairs < 0 || pairs > mode.pairs) return null
  if (!Number.isInteger(attempts) || attempts < pairs || attempts > 200) return null
  if (!Number.isFinite(remainingMs) || remainingMs < 0 || remainingMs > mode.durationMs) return null
  if (won !== (pairs === mode.pairs)) return null
  if (!won && remainingMs !== 0) return null
  // Nadie encuentra una pareja en menos de ~0,6 s (dos toques + animación).
  if (mode.durationMs - remainingMs < pairs * 600) return null

  return {
    name,
    mode: mode.id,
    won,
    pairs,
    attempts,
    remainingMs,
    score: computeScore({ won, pairs, remainingMs, attempts }),
  }
}
