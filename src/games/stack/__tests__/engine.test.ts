import { describe, expect, it } from 'vitest'
import { seeded } from '../../../arcade/kit/particles'
import { GAME_DURATION_MS, GOAL_FLOORS, PERFECT_PX, createStackState, drop, floors, step, type StackState } from '../engine'

const FRAME = 1000 / 60
const run = (s: StackState, ms: number) => {
  for (let t = 0; t < ms && s.status === 'playing'; t += FRAME) step(s, FRAME)
}
/** Deja el bloque exactamente a `offset` px de la cima. */
const alignWith = (s: StackState, offset: number) => {
  const top = s.tower[s.tower.length - 1]
  s.moving.x = top.x + offset
}

describe('ZEEK STACK engine', () => {
  it('the moving block goes back and forth and stays near the screen', () => {
    const s = createStackState(390, 700)
    let minX = Infinity
    let maxX = -Infinity
    for (let t = 0; t < 6000; t += FRAME) {
      step(s, FRAME)
      minX = Math.min(minX, s.moving.x)
      maxX = Math.max(maxX, s.moving.x + s.moving.w)
    }
    expect(minX).toBeGreaterThan(-s.moving.w * 0.25)
    expect(maxX).toBeLessThan(s.w + s.moving.w * 0.25)
    expect(maxX - minX).toBeGreaterThan(s.w * 0.9)
  })

  it('a near-perfect drop (≤ 5 px) keeps the full width and counts as PERFECT', () => {
    const s = createStackState(390, 700)
    const w0 = s.tower[0].w
    alignWith(s, PERFECT_PX)
    expect(drop(s)).toBe('perfect')
    expect(s.tower[1].w).toBe(w0)
    expect(s.tower[1].x).toBe(s.tower[0].x)
  })

  it('an offset drop trims the overhang, which falls; the next block has the new width', () => {
    const s = createStackState(390, 700)
    const w0 = s.tower[0].w
    alignWith(s, 30)
    expect(drop(s)).toBe('place')
    expect(s.tower[1].w).toBeCloseTo(w0 - 30)
    expect(s.chunks).toHaveLength(1)
    expect(s.chunks[0].w).toBeCloseTo(30)
    expect(s.moving.w).toBeCloseTo(w0 - 30)
  })

  it('each new block moves faster', () => {
    const s = createStackState(390, 700)
    const v0 = s.speed
    alignWith(s, 0)
    drop(s)
    expect(s.speed).toBeGreaterThan(v0)
  })

  it('missing the tower completely ends the game', () => {
    const s = createStackState(390, 700)
    alignWith(s, s.tower[0].w + 1)
    expect(drop(s)).toBe('miss')
    expect(s.status).toBe('lost')
  })

  it('10 floors win; 45 s without them is a loss', () => {
    const s = createStackState(390, 700)
    for (let i = 0; i < GOAL_FLOORS; i++) {
      alignWith(s, 3)
      drop(s)
    }
    expect(floors(s)).toBe(GOAL_FLOORS)
    expect(s.status).toBe('won')
    const slow = createStackState(390, 700)
    run(slow, GAME_DURATION_MS + 100)
    expect(slow.status).toBe('lost')
  })

  it('the camera keeps the top of the tower on screen', () => {
    const s = createStackState(390, 600)
    for (let i = 0; i < 9; i++) {
      alignWith(s, 0)
      drop(s)
      run(s, 400)
    }
    run(s, 1500)
    const bh = Math.max(26, Math.min(40, s.h * 0.06))
    const topY = s.h - bh * 1.2 - (s.tower.length) * bh + s.camera
    expect(topY).toBeGreaterThan(0)
    expect(topY).toBeLessThan(s.h * 0.7)
  })
})

describe('ZEEK STACK balance', () => {
  // Jugador simulado: toca cuando cree que el bloque está alineado, con un error
  // de timing aleatorio (desvío típico `sigmaMs`) y ~0,6 s de pensar entre pisos.
  function play(seed: number, sigmaMs: number, w = 390, h = 720) {
    const rng = seeded(seed)
    const gauss = () => Math.sqrt(-2 * Math.log(rng() || 1e-9)) * Math.cos(2 * Math.PI * rng())
    const s = createStackState(w, h, rng)
    let wait = 600
    let planned: number | null = null
    for (let t = 0; t < GAME_DURATION_MS + 1000 && s.status === 'playing'; t += FRAME) {
      step(s, FRAME)
      wait -= FRAME
      if (wait > 0) continue
      const top = s.tower[s.tower.length - 1]
      const dist = top.x - s.moving.x
      if (planned === null && Math.sign(dist) === s.dir && Math.abs(dist) < s.speed * 0.5) {
        planned = (Math.abs(dist) / s.speed) * 1000 + gauss() * sigmaMs
      }
      if (planned !== null) {
        planned -= FRAME
        if (planned <= 0) {
          drop(s)
          planned = null
          wait = 600
        }
      }
    }
    return s
  }

  const winRate = (sigma: number) => {
    let wins = 0
    for (let seed = 0; seed < 60; seed++) if (play(seed, sigma).status === 'won') wins++
    return wins / 60
  }

  it('precise players (~40 ms timing error) almost always win', () => {
    expect(winRate(40)).toBeGreaterThanOrEqual(0.9)
  })

  it('average players (~90 ms) win sometimes: challenging but fair', () => {
    const r = winRate(90)
    expect(r).toBeGreaterThan(0.15)
    expect(r).toBeLessThan(0.8)
  })

  it('imprecise players (~120 ms) rarely win', () => {
    expect(winRate(120)).toBeLessThan(0.25)
  })
})
