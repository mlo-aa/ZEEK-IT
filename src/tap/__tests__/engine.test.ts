import { describe, expect, it } from 'vitest'
import { COUNTDOWN_MS, GAME_DURATION_MS, GOAL, HIT_SLOP, PHASES, TARGET_GAP, phaseAt } from '../config'
import { createTapState, edgeMargin, spawnTarget, startCountdown, step, tap, type TapState } from '../engine'

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const FRAME = 1000 / 60
const SIZES: [number, number][] = [
  [360, 560],
  [390, 700],
  [820, 1000],
  [1280, 640],
]

function run(s: TapState, ms: number, each?: (s: TapState) => void) {
  for (let t = 0; t < ms && s.status === 'playing'; t += FRAME) {
    step(s, FRAME)
    each?.(s)
  }
}

const skipCountdown = (s: TapState) => run(s, COUNTDOWN_MS + FRAME)

function checkLayout(s: TapState) {
  const m = edgeMargin(s)
  for (const t of s.targets) {
    expect(t.x - t.r).toBeGreaterThanOrEqual(m - 0.01)
    expect(t.y - t.r).toBeGreaterThanOrEqual(m - 0.01)
    expect(t.x + t.r).toBeLessThanOrEqual(s.w - m + 0.01)
    expect(t.y + t.r).toBeLessThanOrEqual(s.h - m + 0.01)
    expect(t.r * 2).toBeGreaterThanOrEqual(60)
  }
  for (let i = 0; i < s.targets.length; i++) {
    for (let j = i + 1; j < s.targets.length; j++) {
      const a = s.targets[i]
      const b = s.targets[j]
      // Nunca se superponen (con un pequeño margen por el rebote).
      expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(a.r + b.r)
    }
  }
}

describe('ZEEK TAP engine', () => {
  it('countdown freezes the clock and shows no targets', () => {
    const s = createTapState(390, 700, mulberry32(1))
    run(s, COUNTDOWN_MS - 100)
    expect(s.elapsed).toBe(0)
    expect(s.targets).toHaveLength(0)
    expect(tap(s, 100, 100)).toBeNull()
  })

  it('phases: 1 target, then up to 2, then up to 3; purple from phase 2 on', () => {
    for (let seed = 0; seed < 10; seed++) {
      const s = createTapState(390, 700, mulberry32(seed))
      skipCountdown(s)
      const seen: Record<number, { max: number; bad: number }> = { 0: { max: 0, bad: 0 }, 1: { max: 0, bad: 0 }, 2: { max: 0, bad: 0 } }
      run(s, GAME_DURATION_MS, (st) => {
        const idx = PHASES.indexOf(phaseAt(st.elapsed))
        seen[idx].max = Math.max(seen[idx].max, st.targets.length)
        seen[idx].bad += st.targets.filter((t) => t.kind === 'bad').length
      })
      expect(seen[0].max).toBe(1)
      expect(seen[0].bad).toBe(0)
      expect(seen[1].max).toBeLessThanOrEqual(2)
      expect(seen[2].max).toBeLessThanOrEqual(3)
      expect(seen[2].max).toBeGreaterThanOrEqual(2)
      expect(seen[1].bad + seen[2].bad).toBeGreaterThan(0)
    }
  })

  it('targets stay inside the area, are big enough and never overlap (also while moving)', () => {
    for (const [w, h] of SIZES) {
      for (let seed = 0; seed < 15; seed++) {
        const s = createTapState(w, h, mulberry32(seed))
        skipCountdown(s)
        run(s, GAME_DURATION_MS, checkLayout)
      }
    }
  })

  it('green +1, purple -2, never below zero; one tap activates at most one target', () => {
    const s = createTapState(390, 700, mulberry32(2))
    skipCountdown(s)
    s.nextSpawnAt = Infinity
    s.targets.length = 0
    const put = (kind: 'good' | 'bad', x: number, y: number) =>
      s.targets.push({ id: ++s.seq, kind, x, y, r: 40, vx: 0, vy: 0, bornAt: s.elapsed, ttl: 5000 })

    put('bad', 100, 100)
    expect(tap(s, 100, 100)).toBe('bad')
    expect(s.score).toBe(0)

    put('good', 100, 100)
    put('good', 100 + 80 + TARGET_GAP, 100)
    // Toque justo entre los dos: solo uno (el más cercano) cuenta.
    expect(tap(s, 100 + 40 * HIT_SLOP - 1, 100)).toBe('good')
    expect(s.score).toBe(1)
    expect(s.targets).toHaveLength(1)

    put('good', 300, 300)
    tap(s, 300, 300)
    put('bad', 300, 300)
    tap(s, 300, 300)
    expect(s.score).toBe(0)
    expect(tap(s, 5, 5)).toBeNull()
  })

  it('missed targets vanish without penalty', () => {
    const s = createTapState(390, 700, mulberry32(3))
    skipCountdown(s)
    run(s, 5000)
    expect(s.score).toBe(0)
    expect(s.status).toBe('playing')
  })

  it('reaching the goal wins immediately', () => {
    const s = createTapState(390, 700, mulberry32(4))
    skipCountdown(s)
    s.score = GOAL - 1
    s.nextSpawnAt = Infinity
    s.targets.push({ id: 1, kind: 'good', x: 200, y: 300, r: 40, vx: 0, vy: 0, bornAt: s.elapsed, ttl: 5000 })
    const elapsed = s.elapsed
    tap(s, 200, 300)
    expect(s.status).toBe('won')
    step(s, FRAME)
    expect(s.elapsed).toBe(elapsed)
  })

  it('time over without the goal is a loss, stopping at exactly 20 s', () => {
    const s = createTapState(390, 700, mulberry32(5))
    run(s, COUNTDOWN_MS + GAME_DURATION_MS + 1000)
    expect(s.status).toBe('lost')
    expect(s.elapsed).toBe(GAME_DURATION_MS)
    expect(s.targets).toHaveLength(0)
  })

  it('resuming from pause replays the countdown without losing time', () => {
    const s = createTapState(390, 700, mulberry32(6))
    skipCountdown(s)
    run(s, 4000)
    const elapsed = s.elapsed
    startCountdown(s)
    run(s, COUNTDOWN_MS - 50)
    expect(s.elapsed).toBe(elapsed)
  })

  it('spawn gives up gracefully when there is no room', () => {
    const s = createTapState(80, 80, mulberry32(7))
    expect(spawnTarget(s, PHASES[0])).toBeNull()
  })
})

describe('ZEEK TAP balance', () => {
  // Jugador simulado: presta atención a un objetivo a la vez (el tiempo de
  // reacción corre desde que aparece o desde su último toque), su reacción
  // varía ±30 % y a veces (8 %) toca un morado por error.
  function play(w: number, h: number, seed: number, reactionMs: number) {
    const s = createTapState(w, h, mulberry32(seed))
    const human = mulberry32(seed + 999)
    const noticed = new Map<number, number>()
    let lastTap = -Infinity
    let need = reactionMs
    run(s, COUNTDOWN_MS + GAME_DURATION_MS + 500, (st) => {
      for (const t of st.targets) if (!noticed.has(t.id)) noticed.set(t.id, st.clock)
      if (st.clock - lastTap < 220) return
      const good = st.targets.find((t) => t.kind === 'good' && st.clock - Math.max(noticed.get(t.id)!, lastTap) >= need)
      if (!good) return
      const bad = st.targets.find((t) => t.kind === 'bad')
      const pick = bad && human() < 0.08 ? bad : good
      tap(st, pick.x, pick.y)
      lastTap = st.clock
      need = reactionMs * (0.75 + human() * 0.6)
    })
    return s
  }

  function winRate(reactionMs: number) {
    let wins = 0
    let games = 0
    for (const [w, h] of SIZES) {
      for (let seed = 0; seed < 25; seed++) {
        games++
        if (play(w, h, seed, reactionMs).status === 'won') wins++
      }
    }
    return wins / games
  }

  it('good reflexes (~550 ms) almost always win', () => {
    expect(winRate(550)).toBeGreaterThanOrEqual(0.95)
  })

  it('average reflexes (~750 ms) win sometimes: challenging but fair', () => {
    const rate = winRate(750)
    expect(rate).toBeGreaterThan(0.2)
    expect(rate).toBeLessThan(0.85)
  })

  it('slow reflexes (~850 ms) rarely win', () => {
    expect(winRate(850)).toBeLessThan(0.25)
  })
})
