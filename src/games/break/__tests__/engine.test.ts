import { describe, expect, it } from 'vitest'
import { seeded } from '../../../arcade/kit/particles'
import { COLS, GAME_DURATION_MS, ROWS, START_LIVES, bricksLeft, createBreakState, launch, movePaddleTo, step, type BreakState } from '../engine'

const FRAME = 1000 / 60
// Tamaños de campo reales: en pantallas anchas el campo es una columna centrada.
const SIZES: [number, number][] = [
  [360, 620],
  [390, 720],
  [569, 730],
  [560, 950],
]
const run = (s: BreakState, ms: number, each?: (s: BreakState) => void) => {
  for (let t = 0; t < ms && s.status === 'playing'; t += FRAME) {
    each?.(s)
    step(s, FRAME)
  }
}

describe('ZEEK BREAK engine', () => {
  it('lays out 20 bricks (green 1 hit, purple 2) inside the screen', () => {
    for (const [w, h] of SIZES) {
      const s = createBreakState(w, h, seeded(1))
      expect(s.bricks).toHaveLength(COLS * ROWS)
      expect(s.bricks.length).toBe(20)
      for (const b of s.bricks) {
        expect(b.x).toBeGreaterThanOrEqual(0)
        expect(b.x + b.w).toBeLessThanOrEqual(w)
        expect(b.hp).toBe(b.kind === 'purple' ? 2 : 1)
      }
      expect(s.bricks.some((b) => b.kind === 'purple')).toBe(true)
      expect(s.bricks.some((b) => b.kind === 'green')).toBe(true)
    }
  })

  it('the ball waits on the paddle until launched, and follows it', () => {
    const s = createBreakState(390, 720, seeded(2))
    run(s, 500)
    expect(s.stuck).toBe(true)
    movePaddleTo(s, 100)
    expect(s.ball.x).toBe(100)
    expect(launch(s)).toBe(true)
    expect(s.ball.vy).toBeLessThan(0)
  })

  it('the paddle hit point steers the bounce, never flat nor perfectly vertical', () => {
    for (const offset of [-1, -0.5, 0, 0.5, 1]) {
      const s = createBreakState(390, 720, seeded(3))
      s.stuck = false
      const p = s.paddle
      s.ball.x = p.x + offset * (p.w / 2)
      s.ball.y = p.y - s.ball.r - 2
      s.ball.vx = 0
      s.ball.vy = s.speed
      step(s, FRAME)
      const ang = (Math.atan2(s.ball.vx, -s.ball.vy) * 180) / Math.PI
      expect(s.ball.vy).toBeLessThan(0)
      expect(Math.abs(ang)).toBeGreaterThanOrEqual(8.9)
      expect(Math.abs(ang)).toBeLessThanOrEqual(60.1)
      if (offset !== 0) expect(Math.sign(ang)).toBe(Math.sign(offset))
    }
  })

  it('never tunnels: the ball never ends a step inside a brick or outside the walls', () => {
    const rng = seeded(4)
    for (const [w, h] of SIZES) {
      const s = createBreakState(w, h, rng)
      s.speed *= 1.45
      launch(s)
      run(s, 20_000, (st) => {
        movePaddleTo(st, st.ball.x)
        const b = st.ball
        expect(b.x - b.r).toBeGreaterThanOrEqual(-0.01)
        expect(b.x + b.r).toBeLessThanOrEqual(st.w + 0.01)
        for (const br of st.bricks) {
          if (br.hp <= 0) continue
          const cx = Math.max(br.x, Math.min(b.x, br.x + br.w))
          const cy = Math.max(br.y, Math.min(b.y, br.y + br.h))
          expect(Math.hypot(b.x - cx, b.y - cy)).toBeGreaterThanOrEqual(b.r * 0.5)
        }
        if (st.stuck) launch(st)
      })
    }
  })

  it('purple bricks need two hits; destroying gives 10 or 20 points; speed goes up', () => {
    const s = createBreakState(390, 720, seeded(5))
    const purple = s.bricks.find((b) => b.kind === 'purple')!
    const green = s.bricks.find((b) => b.kind === 'green')!
    const v0 = s.speed
    // Golpes desde arriba (sobre la fila superior hay espacio libre).
    const hit = (br: typeof purple, fromAbove: boolean) => {
      s.stuck = false
      s.ball.x = br.x + br.w / 2
      s.ball.y = fromAbove ? br.y - s.ball.r - 1 : br.y + br.h + s.ball.r + 1
      s.ball.vx = 0
      s.ball.vy = fromAbove ? s.speed : -s.speed
      step(s, FRAME / 4)
    }
    hit(purple, true)
    expect(purple.hp).toBe(1)
    expect(s.score).toBe(0)
    hit(purple, true)
    expect(purple.hp).toBe(0)
    expect(s.score).toBe(20)
    // Un verde de la última fila, desde abajo (debajo no hay nada).
    const lowGreen = s.bricks.filter((b) => b.kind === 'green').sort((a, b) => b.y - a.y)[0]
    hit(lowGreen, false)
    expect(lowGreen.hp).toBe(0)
    expect(s.score).toBe(30)
    expect(green.kind).toBe('green')
    expect(s.speed).toBeGreaterThan(v0)
  })

  it('dropping the ball costs a life; losing 3 ends the game; time over too', () => {
    const s = createBreakState(390, 720, seeded(6))
    for (let i = 0; i < START_LIVES; i++) {
      launch(s)
      movePaddleTo(s, 0)
      run(s, 8000, (st) => {
        movePaddleTo(st, st.ball.x < st.w / 2 ? st.w : 0)
      })
      if (s.status === 'playing') expect(s.stuck).toBe(true)
    }
    expect(s.lives).toBe(0)
    expect(s.status).toBe('lost')
    const idle = createBreakState(390, 720, seeded(7))
    run(idle, GAME_DURATION_MS + 100)
    expect(idle.status).toBe('lost')
  })

  it('a player who follows the ball and roughly aims at the bricks usually clears all 20 in time', () => {
    let wins = 0
    let games = 0
    for (const [w, h] of SIZES) {
      for (let seed = 0; seed < 12; seed++) {
        const rng = seeded(100 + seed)
        const s = createBreakState(w, h, seeded(seed))
        let aim = 0
        run(s, GAME_DURATION_MS + 100, (st) => {
          if (st.stuck) {
            launch(st)
            return
          }
          // Como una persona: cuando la pelota baja, elige un bloque que quede y
          // pone la paleta para que el rebote salga hacia él (con imprecisión).
          const b = st.ball
          if (b.vy > 0 && b.y > st.paddle.y - st.h * 0.25 && aim === 0) {
            const left = st.bricks.filter((br) => br.hp > 0)
            const target = left[Math.floor(rng() * left.length)]
            const tx = target.x + target.w / 2 - b.x
            const ty = st.paddle.y - (target.y + target.h / 2)
            const ang = Math.atan2(tx, ty)
            const rel = Math.max(-1, Math.min(1, ang / ((60 * Math.PI) / 180)))
            aim = -rel * (st.paddle.w / 2) + (rng() * 2 - 1) * st.paddle.w * 0.12 || 0.001
          }
          if (b.vy < 0) aim = 0
          movePaddleTo(st, b.x - aim)
        })
        games++
        if (s.status === 'won') {
          wins++
          expect(bricksLeft(s)).toBe(0)
        }
      }
    }
    // Desafiante pero justo: se gana la gran mayoría de las veces, no siempre.
    expect(wins / games).toBeGreaterThanOrEqual(0.9)
  })
})
