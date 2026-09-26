import { ICON_POOL, MODES } from './constants'

export function shuffle(items, rng = Math.random) {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

// Una pareja = mismo ícono Y misma versión (verde o oscura). En modo extremo
// algunos íconos aparecen en ambas versiones: son las tarjetas trampa.
export function pickPairs(mode, rng = Math.random) {
  const { pairs, trapTypes } = MODES[mode]
  const types = shuffle(ICON_POOL, rng).slice(0, pairs - trapTypes)
  return types.flatMap((icon, i) => {
    if (i < trapTypes) {
      return [
        { ...icon, variant: 'neon' },
        { ...icon, variant: 'dark' },
      ]
    }
    const variant = trapTypes > 0 && rng() < 0.5 ? 'dark' : 'neon'
    return [{ ...icon, variant }]
  })
}

export function createDeck(mode = 'normal', rng = Math.random) {
  const cards = pickPairs(mode, rng).flatMap(({ type, label, variant }) =>
    ['a', 'b'].map((copy) => ({
      id: `${type}-${variant}-${copy}`,
      pairKey: `${type}:${variant}`,
      type,
      label,
      variant,
      flipped: false,
      matched: false,
    })),
  )
  return shuffle(cards, rng)
}
