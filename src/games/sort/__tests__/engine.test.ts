import { describe, expect, it } from 'vitest'
import { seeded } from '../../../arcade/kit/particles'
import { GAME_DURATION_MS, GOAL, MAX_ITEMS, ROUNDS } from '../config'
import { binTop, classify, createSortState, drag, grab, itemSize, pick, release, step, type SortState } from '../engine'

const FRAME = 1000 / 60
const run = (s: SortState, ms: number, each?: (s: SortState) => void) => {
  for (let t = 0; t < ms && s.status === 'playing'; t += FRAME) {
    step(s, FRAME)
    each?.(s)
  }
}

describe('ZEEK SORT content', () => {
  it('every item belongs to exactly one category of its round', () => {
    for (const r of ROUNDS) {
      const [a, b] = r.items.map((list) => list.map((i) => i.label))
      expect(a.filter((l) => b.includes(l))).toEqual([])
      expect(new Set(a).size).toBe(a.length)
      expect(new Set(b).size).toBe(b.length)
      expect(a.length).toBeGreaterThanOrEqual(5)
      expect(b.length).toBeGreaterThanOrEqual(5)
    }
  })
})

describe('ZEEK SORT engine', () => {
  it('spawns up to 3 items at a time, inside the screen, above the bins', () => {
    for (const [w, h] of [
      [360, 600],
      [820, 1000],
      [1280, 640],
    ]) {
      const s = createSortState(w, h, seeded(1))
      run(s, GAME_DURATION_MS, (st) => {
        expect(st.items.length).toBeLessThanOrEqual(MAX_ITEMS)
        const half = itemSize(st) / 2
        for (const it of st.items) {
          expect(it.x - half).toBeGreaterThanOrEqual(0)
          expect(it.x + half).toBeLessThanOrEqual(st.w)
          expect(it.y + half).toBeLessThanOrEqual(binTop(st) + 1)
        }
      })
    }
  })

  it('rounds change categories at 15 s and 30 s and clear old items', () => {
    const s = createSortState(390, 700, seeded(2))
    run(s, 14_900)
    expect(s.round).toBe(ROUNDS[0])
    run(s, 200)
    expect(s.round).toBe(ROUNDS[1])
    expect(s.items.every((it) => ROUNDS[1].items[it.side].includes(it.item))).toBe(true)
    run(s, 15_000)
    expect(s.round).toBe(ROUNDS[2])
  })

  it('falls faster in each phase', () => {
    const speeds: number[] = []
    for (const at of [1000, 16_000, 31_000]) {
      const s = createSortState(390, 700, seeded(3))
      run(s, at)
      s.items.length = 0
      s.nextSpawnAt = 0
      run(s, FRAME * 2)
      speeds.push(s.items[0].vy)
    }
    expect(speeds[0]).toBeLessThan(speeds[1])
    expect(speeds[1]).toBeLessThan(speeds[2])
  })

  it('+1 for correct, -1 for wrong, never below zero; missed items cost nothing', () => {
    const s = createSortState(390, 700, seeded(4))
    run(s, 500)
    const first = s.items[0]
    expect(classify(s, first, first.side === 0 ? 1 : 0)).toBe('wrong')
    expect(s.score).toBe(0)
    s.nextSpawnAt = 0
    run(s, 100)
    const it = s.items[0]
    expect(classify(s, it, it.side)).toBe('correct')
    expect(s.score).toBe(1)
    // Dejar caer todo sin tocar: no resta.
    run(s, 9000)
    expect(s.score).toBe(1)
    expect(s.missed).toBeGreaterThan(0)
  })

  it('dragging onto the right bin classifies it; letting go mid-air resumes falling', () => {
    const s = createSortState(390, 700, seeded(5))
    run(s, 500)
    const it = s.items[0]
    expect(pick(s, it.x, it.y)).toBe(it)
    grab(s, it)
    run(s, 2000)
    expect(s.items).toContain(it) // mientras se arrastra no cae
    drag(it, it.x, 200, 16)
    expect(release(s, it)).toBeNull()
    expect(it.dragging).toBe(false)
    grab(s, it)
    const targetX = it.side === 0 ? s.w * 0.25 : s.w * 0.75
    drag(it, targetX, binTop(s) + 20, 400)
    expect(release(s, it)).toBe('correct')
  })

  it('a quick sideways flick classifies to that side', () => {
    const s = createSortState(390, 700, seeded(6))
    run(s, 500)
    const it = s.items[0]
    grab(s, it)
    const dir = it.side === 0 ? -1 : 1
    for (let i = 0; i < 4; i++) drag(it, it.x + dir * 30, it.y, 16)
    expect(release(s, it)).toBe('correct')
  })

  it('reaching 15 wins immediately; time over is a loss', () => {
    const s = createSortState(390, 700, seeded(7))
    run(s, 500)
    s.score = GOAL - 1
    const it = s.items[0]
    classify(s, it, it.side)
    expect(s.status).toBe('won')
    const lost = createSortState(390, 700, seeded(8))
    run(lost, GAME_DURATION_MS + 100)
    expect(lost.status).toBe('lost')
  })

  it('a player who sorts each item ~1.2 s after it appears wins', () => {
    for (let seed = 0; seed < 20; seed++) {
      const s = createSortState(390, 700, seeded(seed))
      const seen = new Map<number, number>()
      run(s, GAME_DURATION_MS, (st) => {
        for (const it of st.items) if (!seen.has(it.id)) seen.set(it.id, st.elapsed)
        const ready = st.items.find((it) => st.elapsed - seen.get(it.id)! > 1200)
        if (ready) classify(st, ready, ready.side)
      })
      expect(s.status).toBe('won')
    }
  })
})
