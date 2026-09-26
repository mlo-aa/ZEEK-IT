import { CARD_TYPES } from './constants'

export function shuffle(items, rng = Math.random) {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function createDeck(rng = Math.random) {
  const cards = CARD_TYPES.flatMap(({ type, label }) =>
    ['a', 'b'].map((copy) => ({
      id: `${type}-${copy}`,
      type,
      label,
      flipped: false,
      matched: false,
    })),
  )
  return shuffle(cards, rng)
}
