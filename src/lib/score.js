// Puntaje para el ranking. Compartido por el cliente y la API, que lo
// recalcula para no confiar en el número que manda el navegador.
export const SCORE_RULES = {
  perPair: 100,
  winBonus: 200,
  perSecondLeft: 50,
  perMiss: 10,
}

export function computeScore({ won, pairs, remainingMs, attempts }) {
  const misses = Math.max(0, attempts - pairs)
  const timeBonus = won ? SCORE_RULES.winBonus + Math.round((remainingMs / 1000) * SCORE_RULES.perSecondLeft) : 0
  return Math.max(0, pairs * SCORE_RULES.perPair + timeBonus - misses * SCORE_RULES.perMiss)
}
