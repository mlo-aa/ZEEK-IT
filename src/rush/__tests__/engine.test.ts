import { describe, expect, it } from 'vitest'
import { COUNTDOWN_MS, GAME_DURATION_MS, INVULNERABLE_MS, PHASES, START_LIVES, phaseAt } from '../config'
import {
  asteroidHitRadius,
  createRushState,
  isInvulnerable,
  resizeRush,
  rocketHitCircles,
  spawnWave,
  startCountdown,
  step,
  type Input,
  type RushState,
} from '../engine'

// Generador pseudoaleatorio con semilla, para tests reproducibles.
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

const IDLE: Input = { dir: 0, dragDx: 0 }
const FRAME = 1000 / 60

function run(s: RushState, ms: number, input: Input | ((s: RushState) => Input) = IDLE) {
  for (let t = 0; t < ms && s.status === 'playing'; t += FRAME) {
    step(s, FRAME, typeof input === 'function' ? input(s) : input)
  }
}

function skipCountdown(s: RushState) {
  run(s, COUNTDOWN_MS + FRAME)
}

/** Pone un asteroide encima del cohete. */
function dropOnRocket(s: RushState) {
  s.asteroids.push({ x: s.rocket.x, y: s.rocket.y, r: s.rw * 0.5, vy: 0, rot: 0, vr: 0, shape: [1], color: 0 })
}

describe('ZEEK RUSH engine', () => {
  it('countdown freezes the timer and spawns nothing', () => {
    const s = createRushState(390, 700, mulberry32(1))
    run(s, COUNTDOWN_MS - 100)
    expect(s.elapsed).toBe(0)
    expect(s.asteroids).toHaveLength(0)
    run(s, 1500)
    expect(s.elapsed).toBeGreaterThan(0)
  })

  it('keyboard and drag move the rocket and keep it inside the screen', () => {
    const s = createRushState(390, 700, mulberry32(2))
    run(s, 3000, { dir: -1, dragDx: 0 })
    expect(s.rocket.x).toBeCloseTo(s.rw / 2)
    step(s, FRAME, { dir: 0, dragDx: 10_000 })
    expect(s.rocket.x).toBeCloseTo(s.w - s.rw / 2)
    step(s, FRAME, { dir: 0, dragDx: -50 })
    expect(s.rocket.x).toBeCloseTo(s.w - s.rw / 2 - 50)
  })

  it('a hit costs one life and gives 1.5 s of invulnerability', () => {
    const s = createRushState(390, 700, mulberry32(3))
    skipCountdown(s)
    s.asteroids.length = 0
    s.nextWaveAt = Infinity
    dropOnRocket(s)
    step(s, FRAME, IDLE)
    expect(s.lives).toBe(START_LIVES - 1)
    expect(isInvulnerable(s)).toBe(true)
    dropOnRocket(s)
    step(s, FRAME, IDLE)
    expect(s.lives).toBe(START_LIVES - 1)
    s.asteroids.length = 0
    run(s, INVULNERABLE_MS)
    expect(isInvulnerable(s)).toBe(false)
    s.asteroids.length = 0
    dropOnRocket(s)
    step(s, FRAME, IDLE)
    expect(s.lives).toBe(START_LIVES - 2)
  })

  it('losing all lives ends the game', () => {
    const s = createRushState(390, 700, mulberry32(4))
    skipCountdown(s)
    s.nextWaveAt = Infinity
    for (let i = 0; i < START_LIVES; i++) {
      s.asteroids.length = 0
      s.invulnerableUntil = 0
      dropOnRocket(s)
      step(s, FRAME, IDLE)
    }
    expect(s.status).toBe('lost')
    expect(s.lives).toBe(0)
    const elapsed = s.elapsed
    step(s, FRAME, IDLE)
    expect(s.elapsed).toBe(elapsed)
  })

  it('surviving 30 s wins and stops the clock exactly at 30 s', () => {
    const s = createRushState(390, 700, mulberry32(5))
    run(s, COUNTDOWN_MS + GAME_DURATION_MS + 2000, (st) => {
      st.asteroids.length = 0
      return IDLE
    })
    expect(s.status).toBe('won')
    expect(s.elapsed).toBe(GAME_DURATION_MS)
  })

  it('stars give 10 points each', () => {
    const s = createRushState(390, 700, mulberry32(6))
    skipCountdown(s)
    s.nextWaveAt = Infinity
    s.asteroids.length = 0
    s.starItems.push({ x: s.rocket.x, y: s.rocket.y, r: 10, vy: 0 })
    step(s, FRAME, IDLE)
    expect(s.starsCollected).toBe(1)
    expect(s.score).toBe(10)
  })

  it('resuming after a pause replays the countdown without losing progress', () => {
    const s = createRushState(390, 700, mulberry32(7))
    skipCountdown(s)
    run(s, 2000, (st) => ((st.asteroids.length = 0), IDLE))
    const elapsed = s.elapsed
    startCountdown(s)
    run(s, COUNTDOWN_MS - 100)
    expect(s.elapsed).toBe(elapsed)
  })

  it('resize keeps the rocket inside and at the bottom', () => {
    const s = createRushState(390, 700, mulberry32(8))
    resizeRush(s, 1000, 600)
    expect(s.rocket.x).toBeGreaterThanOrEqual(s.rw / 2)
    expect(s.rocket.x).toBeLessThanOrEqual(1000 - s.rw / 2)
    expect(s.rocket.y).toBeGreaterThan(600 * 0.7)
  })
})

describe('ZEEK RUSH fairness', () => {
  const SIZES: [number, number][] = [
    [360, 640],
    [390, 780],
    [820, 1100],
    [1280, 720],
  ]

  it('every wave leaves a free gap wider than the rocket, reachable from the previous one', () => {
    for (const [w, h] of SIZES) {
      for (let seed = 0; seed < 40; seed++) {
        const s = createRushState(w, h, mulberry32(seed))
        for (const phase of PHASES) {
          s.elapsed = Math.min(phase.untilMs, GAME_DURATION_MS) - 1
          const prevGap = s.lastGapX
          const before = s.asteroids.length
          spawnWave(s, phaseAt(s.elapsed))
          const wave = s.waves[s.waves.length - 1]
          const hitboxW = Math.max(...rocketHitCircles(s).map(([, , r]) => r)) * 2
          expect(wave.gapW).toBeGreaterThan(hitboxW * 2)
          for (const a of s.asteroids.slice(before)) {
            const outside = a.x + a.r <= wave.gapX - wave.gapW / 2 || a.x - a.r >= wave.gapX + wave.gapW / 2
            expect(outside).toBe(true)
          }
          // El hueco nuevo se solapa con el anterior en más de un ancho de cohete.
          const overlap = wave.gapW - Math.abs(wave.gapX - prevGap)
          expect(overlap).toBeGreaterThan(hitboxW + s.rw * 0.4)
        }
      }
    }
  })

  it('a keyboard bot with human reaction time always wins, and is only hit outside the free gap', () => {
    // Bot: decide con ~150 ms de retraso, como una persona. Se ubica en el hueco
    // de la oleada más cercana y, mientras la atraviesa, en la zona donde ese
    // hueco se solapa con el siguiente.
    const REACTION_FRAMES = 9
    const makeBot = () => {
      const pending: Input[] = []
      return (s: RushState): Input => {
        const [cur, next] = s.waves.filter((wv) => wv.y - s.rw * 3 < s.rocket.y + s.rw).sort((a, b) => b.y - a.y)
        let target = cur ? cur.gapX : s.rocket.x
        if (cur && next && cur.y > s.rocket.y - s.rw * 3) {
          const left = Math.max(cur.gapX - cur.gapW / 2, next.gapX - next.gapW / 2)
          const right = Math.min(cur.gapX + cur.gapW / 2, next.gapX + next.gapW / 2)
          target = (left + right) / 2
        }
        // Suelta la tecla antes de llegar: predice su propia inercia.
        const dx = target - (s.rocket.x + s.rocket.vx * (REACTION_FRAMES / 60))
        pending.push({ dir: Math.abs(dx) < s.rw * 0.15 ? 0 : dx > 0 ? 1 : -1, dragDx: 0 })
        return pending.length > REACTION_FRAMES ? pending.shift()! : IDLE
      }
    }

    let hitsInsideGap = 0
    for (const [w, h] of SIZES) {
      for (let seed = 0; seed < 60; seed++) {
        const s = createRushState(w, h, mulberry32(seed * 7 + 1))
        const bot = makeBot()
        let lives = s.lives
        for (let t = 0; t < COUNTDOWN_MS + GAME_DURATION_MS + 1000 && s.status === 'playing'; t += FRAME) {
          const waves = s.waves.map((wv) => ({ ...wv }))
          const asteroids = s.asteroids.slice()
          step(s, FRAME, bot(s))
          if (s.lives === lives) continue
          lives = s.lives
          // ¿El cohete estaba dentro del hueco libre de la oleada que lo golpeó?
          const hit = asteroids.find((a) => !s.asteroids.includes(a))!
          const wave = waves.filter((wv) => wv.y >= hit.y - 1).sort((a, b) => a.y - b.y)[0]
          const [[, , bodyR]] = rocketHitCircles(s)
          if (
            wave &&
            s.rocket.x - bodyR >= wave.gapX - wave.gapW / 2 &&
            s.rocket.x + bodyR <= wave.gapX + wave.gapW / 2
          ) {
            hitsInsideGap++
          }
        }
        expect({ w, h, seed, status: s.status }).toEqual({ w, h, seed, status: 'won' })
        expect(s.lives).toBeGreaterThanOrEqual(START_LIVES - 1)
      }
    }
    expect(hitsInsideGap).toBe(0)
  })

  it('asteroid hit radius stays inside the drawn outline', () => {
    const s = createRushState(390, 700, mulberry32(9))
    spawnWave(s, PHASES[0])
    for (const a of s.asteroids) {
      expect(asteroidHitRadius(a)).toBeLessThanOrEqual(a.r * Math.max(...a.shape))
      expect(asteroidHitRadius(a)).toBeGreaterThanOrEqual(a.r * Math.min(...a.shape))
    }
  })
})
