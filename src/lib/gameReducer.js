import { GAME_DURATION_MS, TOTAL_PAIRS } from './constants'

// status: 'ready' (esperando el primer toque) → 'playing' → 'won' | 'lost'
export function createInitialState(deck) {
  return {
    status: 'ready',
    cards: deck,
    selected: [],
    locked: false,
    attempts: 0,
    matchedPairs: 0,
    lastResult: null,
    endsAt: null,
    remainingMs: GAME_DURATION_MS,
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

  let { status, endsAt } = state
  if (status === 'ready') {
    status = 'playing'
    endsAt = now + GAME_DURATION_MS
  } else if (now >= endsAt) {
    return expire(state)
  }

  const selected = [...state.selected, id]
  let cards = state.cards.map((c) => (c.id === id ? { ...c, flipped: true } : c))
  const next = { ...state, status, endsAt, cards, selected, remainingMs: endsAt - now }

  if (selected.length < 2) return next

  const [first, second] = selected.map((sid) => cards.find((c) => c.id === sid))
  const attempts = state.attempts + 1

  if (first.type !== second.type) {
    return { ...next, attempts, locked: true, lastResult: 'miss' }
  }

  cards = cards.map((c) => (selected.includes(c.id) ? { ...c, matched: true } : c))
  const matchedPairs = state.matchedPairs + 1
  const won = matchedPairs === TOTAL_PAIRS

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

export function gameReducer(state, action) {
  switch (action.type) {
    case 'RESET':
      return createInitialState(action.deck)

    case 'FLIP':
      return flip(state, action)

    case 'HIDE_MISMATCH': {
      if (state.status !== 'playing' || state.selected.length !== 2) return state
      const cards = state.cards.map((c) =>
        state.selected.includes(c.id) ? { ...c, flipped: false } : c,
      )
      return { ...state, cards, selected: [], locked: false }
    }

    case 'TICK': {
      if (state.status !== 'playing') return state
      const remainingMs = state.endsAt - action.now
      if (remainingMs <= 0) return expire(state)
      return { ...state, remainingMs }
    }

    default:
      return state
  }
}
