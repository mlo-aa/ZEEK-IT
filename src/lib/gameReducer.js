import { MODES } from './constants'

// status: 'ready' (esperando el primer toque) → 'playing' → 'won' | 'lost'
export function createInitialState(deck, mode = 'normal') {
  const config = MODES[mode]
  return {
    mode,
    status: 'ready',
    cards: deck,
    selected: [],
    locked: false,
    attempts: 0,
    matchedPairs: 0,
    totalPairs: deck.length / 2,
    lastResult: null,
    startedAt: null,
    endsAt: null,
    remainingMs: config.durationMs,
    penalties: 0,
    glitchIndex: 0,
    glitchCount: 0,
    glitchIds: [],
  }
}

const isOver = (status) => status === 'won' || status === 'lost'

function expire(state) {
  return { ...state, status: 'lost', remainingMs: 0, locked: true }
}

function flip(state, { id, now }) {
  if (isOver(state.status) || state.locked || state.selected.length >= 2) return state

  const card = state.cards.find((c) => c.id === id)
  if (!card || card.flipped || card.matched) return state

  const config = MODES[state.mode]
  let { status, endsAt, startedAt } = state
  if (status === 'ready') {
    status = 'playing'
    startedAt = now
    endsAt = now + config.durationMs
  } else if (now >= endsAt) {
    return expire(state)
  }

  const selected = [...state.selected, id]
  let cards = state.cards.map((c) => (c.id === id ? { ...c, flipped: true } : c))
  const next = { ...state, status, startedAt, endsAt, cards, selected, remainingMs: endsAt - now }

  if (selected.length < 2) return next

  const [first, second] = selected.map((sid) => cards.find((c) => c.id === sid))
  const attempts = state.attempts + 1

  if (first.pairKey !== second.pairKey) {
    const penalized = {
      ...next,
      attempts,
      locked: true,
      lastResult: 'miss',
      endsAt: endsAt - config.penaltyMs,
      remainingMs: endsAt - config.penaltyMs - now,
      penalties: state.penalties + (config.penaltyMs > 0 ? 1 : 0),
    }
    return penalized.remainingMs <= 0 ? expire(penalized) : penalized
  }

  cards = cards.map((c) => (selected.includes(c.id) ? { ...c, matched: true } : c))
  const matchedPairs = state.matchedPairs + 1
  const won = matchedPairs === state.totalPairs

  return {
    ...next,
    cards,
    attempts,
    matchedPairs,
    selected: [],
    lastResult: 'match',
    status: won ? 'won' : status,
    locked: won,
  }
}

// Intercambia dos tarjetas ocultas de lugar. `rand` son dos números en [0, 1)
// que pasa quien despacha la acción, para que el reducer siga siendo puro.
function glitch(state, rand) {
  const candidates = state.cards
    .map((c, i) => ({ c, i }))
    .filter(({ c }) => !c.flipped && !c.matched && !state.selected.includes(c.id))
  if (candidates.length < 2) return state

  const a = Math.floor(rand[0] * candidates.length)
  let b = Math.floor(rand[1] * (candidates.length - 1))
  if (b >= a) b += 1
  const [i, j] = [candidates[a].i, candidates[b].i]

  const cards = [...state.cards]
  ;[cards[i], cards[j]] = [cards[j], cards[i]]
  return { ...state, cards, glitchCount: state.glitchCount + 1, glitchIds: [cards[i].id, cards[j].id] }
}

function tick(state, { now, rand = [Math.random(), Math.random()] }) {
  if (state.status !== 'playing') return state
  const remainingMs = state.endsAt - now
  if (remainingMs <= 0) return expire(state)

  let next = { ...state, remainingMs }
  const { glitchesAt } = MODES[state.mode]
  if (next.glitchIndex < glitchesAt.length && now - state.startedAt >= glitchesAt[next.glitchIndex]) {
    next = glitch({ ...next, glitchIndex: next.glitchIndex + 1 }, rand)
  }
  return next
}

export function gameReducer(state, action) {
  switch (action.type) {
    case 'RESET':
      return createInitialState(action.deck, action.mode)

    case 'FLIP':
      return flip(state, action)

    case 'HIDE_MISMATCH': {
      if (state.status !== 'playing' || state.selected.length !== 2) return state
      const cards = state.cards.map((c) =>
        state.selected.includes(c.id) ? { ...c, flipped: false } : c,
      )
      return { ...state, cards, selected: [], locked: false }
    }

    case 'TICK':
      return tick(state, action)

    case 'CLEAR_GLITCH':
      return state.glitchIds.length ? { ...state, glitchIds: [] } : state

    default:
      return state
  }
}
