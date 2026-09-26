import { describe, expect, it } from 'vitest'
import { ICON_POOL, MODES } from '../constants'
import { createDeck, shuffle } from '../deck'
import { createInitialState, gameReducer } from '../gameReducer'

const T0 = 1_000_000

// Mazo en orden: las dos copias de cada pareja quedan juntas.
function orderedDeck(mode = 'normal') {
  return createDeck(mode).sort((x, y) => x.id.localeCompare(y.id))
}

const run = (state, ...actions) => actions.reduce(gameReducer, state)
const flip = (id, now = T0) => ({ type: 'FLIP', id, now })
const pairsOf = (deck) => {
  const groups = {}
  deck.forEach((c) => (groups[c.pairKey] ??= []).push(c.id))
  return Object.values(groups)
}

describe('deck', () => {
  it.each(Object.keys(MODES))('%s: right size, unique ids, two cards per pair', (mode) => {
    const deck = createDeck(mode)
    expect(deck).toHaveLength(MODES[mode].pairs * 2)
    expect(new Set(deck.map((c) => c.id)).size).toBe(deck.length)
    expect(pairsOf(deck).every((p) => p.length === 2)).toBe(true)
  })

  it('normal uses only green cards, no traps', () => {
    const deck = createDeck('normal')
    expect(deck.every((c) => c.variant === 'neon')).toBe(true)
    expect(new Set(deck.map((c) => c.type)).size).toBe(6)
  })

  it('extreme includes trap icons in both colors', () => {
    const deck = createDeck('extreme')
    const variantsByType = {}
    deck.forEach((c) => (variantsByType[c.type] ??= new Set()).add(c.variant))
    const traps = Object.values(variantsByType).filter((v) => v.size === 2)
    expect(traps).toHaveLength(MODES.extreme.trapTypes)
  })

  it('icons vary between rounds', () => {
    const seen = new Set()
    for (let i = 0; i < 30; i++) createDeck('normal').forEach((c) => seen.add(c.type))
    expect(seen.size).toBeGreaterThan(6)
    expect([...seen].every((t) => ICON_POOL.some((p) => p.type === t))).toBe(true)
  })

  it('shuffle keeps all items and does not mutate input', () => {
    const input = [1, 2, 3, 4, 5]
    const out = shuffle(input)
    expect(input).toEqual([1, 2, 3, 4, 5])
    expect([...out].sort()).toEqual(input)
  })
})

describe('gameReducer — normal', () => {
  const deck = orderedDeck()
  const [p1, p2] = pairsOf(deck)

  it('starts the timer on the first flip', () => {
    const s = run(createInitialState(deck), flip(p1[0]))
    expect(s.status).toBe('playing')
    expect(s.endsAt).toBe(T0 + MODES.normal.durationMs)
  })

  it('keeps matched pairs visible and counts attempts', () => {
    const s = run(createInitialState(deck), flip(p1[0]), flip(p1[1]))
    expect(s.matchedPairs).toBe(1)
    expect(s.attempts).toBe(1)
    expect(s.locked).toBe(false)
    expect(s.cards.filter((c) => c.matched).map((c) => c.id).sort()).toEqual([...p1].sort())
  })

  it('locks the board on a mismatch, ignores a third card, no penalty', () => {
    let s = run(createInitialState(deck), flip(p1[0]), flip(p2[0]))
    expect(s.locked).toBe(true)
    expect(s.endsAt).toBe(T0 + MODES.normal.durationMs)
    s = gameReducer(s, flip(p2[1]))
    expect(s.cards.find((c) => c.id === p2[1]).flipped).toBe(false)
    s = gameReducer(s, { type: 'HIDE_MISMATCH' })
    expect(s.locked).toBe(false)
    expect(s.cards.every((c) => !c.flipped)).toBe(true)
  })

  it('wins when all pairs are found and freezes remaining time', () => {
    let s = createInitialState(deck)
    deck.forEach((c, i) => (s = gameReducer(s, flip(c.id, T0 + i * 1000))))
    expect(s.status).toBe('won')
    expect(s.remainingMs).toBe(MODES.normal.durationMs - 11_000)
    expect(gameReducer(s, { type: 'TICK', now: T0 + 60_000 })).toBe(s)
  })

  it('loses when time runs out and blocks further moves', () => {
    let s = run(createInitialState(deck), flip(p1[0]))
    s = gameReducer(s, { type: 'TICK', now: T0 + MODES.normal.durationMs })
    expect(s.status).toBe('lost')
    expect(gameReducer(s, flip(p1[1], T0 + 1))).toBe(s)
  })

  it('never glitches in normal mode', () => {
    let s = run(createInitialState(deck), flip(p1[0]))
    s = gameReducer(s, { type: 'TICK', now: T0 + 40_000, rand: [0, 0.5] })
    expect(s.glitchCount).toBe(0)
  })
})

describe('gameReducer — extreme', () => {
  const deck = orderedDeck('extreme')
  const pairs = pairsOf(deck)
  const init = () => createInitialState(deck, 'extreme')

  it('trap cards (same icon, other color) do not match', () => {
    const trap = deck.find((c) => deck.some((o) => o.type === c.type && o.variant !== c.variant))
    const twin = deck.find((o) => o.type === trap.type && o.variant !== trap.variant)
    const s = run(init(), flip(trap.id), flip(twin.id))
    expect(s.lastResult).toBe('miss')
    expect(s.matchedPairs).toBe(0)
  })

  it('a mistake subtracts the penalty from the clock', () => {
    const s = run(init(), flip(pairs[0][0]), flip(pairs[1][0], T0 + 1000))
    expect(s.endsAt).toBe(T0 + MODES.extreme.durationMs - MODES.extreme.penaltyMs)
    expect(s.penalties).toBe(1)
  })

  it('a penalty that empties the clock ends the game', () => {
    const late = T0 + MODES.extreme.durationMs - 1000
    const s = run(init(), flip(pairs[0][0]), flip(pairs[1][0], late))
    expect(s.status).toBe('lost')
  })

  it('glitch swaps two hidden cards at the scheduled times, once each', () => {
    let s = run(init(), flip(pairs[0][0]))
    const before = s.cards.map((c) => c.id)
    s = gameReducer(s, { type: 'TICK', now: T0 + 14_000, rand: [0, 0] })
    expect(s.glitchCount).toBe(0)
    s = gameReducer(s, { type: 'TICK', now: T0 + 15_000, rand: [0, 0] })
    expect(s.glitchCount).toBe(1)
    expect(s.glitchIds).toHaveLength(2)
    const after = s.cards.map((c) => c.id)
    expect(after).not.toEqual(before)
    expect([...after].sort()).toEqual([...before].sort())
    // La tarjeta dada vuelta nunca se mueve.
    expect(after.indexOf(pairs[0][0])).toBe(before.indexOf(pairs[0][0]))
    s = gameReducer(s, { type: 'TICK', now: T0 + 16_000, rand: [0, 0] })
    expect(s.glitchCount).toBe(1)
    s = gameReducer(s, { type: 'TICK', now: T0 + 30_000, rand: [0.9, 0.9] })
    expect(s.glitchCount).toBe(2)
    expect(gameReducer(s, { type: 'CLEAR_GLITCH' }).glitchIds).toEqual([])
  })
})
