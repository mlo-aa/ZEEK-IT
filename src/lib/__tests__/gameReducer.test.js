import { describe, expect, it } from 'vitest'
import { GAME_DURATION_MS, TOTAL_PAIRS } from '../constants'
import { createDeck, shuffle } from '../deck'
import { createInitialState, gameReducer } from '../gameReducer'

const T0 = 1_000_000

function orderedDeck() {
  // a,b de cada tipo en orden: [ia-a, ia-b, robot-a, robot-b, ...]
  return createDeck(() => 0.999999).sort((x, y) => x.id.localeCompare(y.id))
}

function run(state, ...actions) {
  return actions.reduce(gameReducer, state)
}

const flip = (id, now = T0) => ({ type: 'FLIP', id, now })

describe('deck', () => {
  it('has 12 cards, 6 pairs, unique ids', () => {
    const deck = createDeck()
    expect(deck).toHaveLength(12)
    expect(new Set(deck.map((c) => c.id)).size).toBe(12)
    const counts = {}
    deck.forEach((c) => (counts[c.type] = (counts[c.type] ?? 0) + 1))
    expect(Object.values(counts)).toEqual(Array(TOTAL_PAIRS).fill(2))
  })

  it('shuffle keeps all items and does not mutate input', () => {
    const input = [1, 2, 3, 4, 5]
    const out = shuffle(input)
    expect(input).toEqual([1, 2, 3, 4, 5])
    expect([...out].sort()).toEqual(input)
  })
})

describe('gameReducer', () => {
  it('starts the timer on the first flip', () => {
    const s = run(createInitialState(orderedDeck()), flip('ia-a'))
    expect(s.status).toBe('playing')
    expect(s.endsAt).toBe(T0 + GAME_DURATION_MS)
  })

  it('keeps matched pairs visible and counts attempts', () => {
    const s = run(createInitialState(orderedDeck()), flip('ia-a'), flip('ia-b'))
    expect(s.matchedPairs).toBe(1)
    expect(s.attempts).toBe(1)
    expect(s.selected).toEqual([])
    expect(s.locked).toBe(false)
    expect(s.cards.filter((c) => c.matched).map((c) => c.id).sort()).toEqual(['ia-a', 'ia-b'])
  })

  it('locks the board on a mismatch and ignores a third card', () => {
    let s = run(createInitialState(orderedDeck()), flip('ia-a'), flip('robot-a'))
    expect(s.locked).toBe(true)
    expect(s.lastResult).toBe('miss')
    s = gameReducer(s, flip('startup-a'))
    expect(s.cards.find((c) => c.id === 'startup-a').flipped).toBe(false)
    s = gameReducer(s, { type: 'HIDE_MISMATCH' })
    expect(s.locked).toBe(false)
    expect(s.cards.every((c) => !c.flipped)).toBe(true)
  })

  it('ignores flipping the same card twice', () => {
    const s = run(createInitialState(orderedDeck()), flip('ia-a'), flip('ia-a'))
    expect(s.selected).toEqual(['ia-a'])
    expect(s.attempts).toBe(0)
  })

  it('wins when all pairs are found in time and freezes remaining time', () => {
    const deck = orderedDeck()
    let s = createInitialState(deck)
    deck.forEach((c, i) => (s = gameReducer(s, flip(c.id, T0 + i * 1000))))
    expect(s.status).toBe('won')
    expect(s.attempts).toBe(6)
    expect(s.remainingMs).toBe(GAME_DURATION_MS - 11_000)
    const after = gameReducer(s, { type: 'TICK', now: T0 + 60_000 })
    expect(after).toBe(s)
  })

  it('loses when time runs out and blocks further moves', () => {
    let s = run(createInitialState(orderedDeck()), flip('ia-a'))
    s = gameReducer(s, { type: 'TICK', now: T0 + GAME_DURATION_MS })
    expect(s.status).toBe('lost')
    expect(s.remainingMs).toBe(0)
    expect(gameReducer(s, flip('ia-b', T0 + 1))).toBe(s)
    expect(gameReducer(s, { type: 'HIDE_MISMATCH' })).toBe(s)
  })

  it('a flip after the deadline counts as a loss even without a tick', () => {
    const s = run(createInitialState(orderedDeck()), flip('ia-a'), flip('ia-b', T0 + GAME_DURATION_MS + 5))
    expect(s.status).toBe('lost')
    expect(s.matchedPairs).toBe(0)
  })

  it('reset produces a fresh game', () => {
    let s = run(createInitialState(orderedDeck()), flip('ia-a'), flip('ia-b'))
    s = gameReducer(s, { type: 'RESET', deck: createDeck() })
    expect(s.status).toBe('ready')
    expect(s.matchedPairs).toBe(0)
    expect(s.cards.every((c) => !c.flipped && !c.matched)).toBe(true)
  })
})
