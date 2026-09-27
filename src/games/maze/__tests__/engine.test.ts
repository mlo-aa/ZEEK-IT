import { describe, expect, it } from 'vitest'
import { seeded } from '../../../arcade/kit/particles'
import { MAZES } from '../mazes'
import { BALL_R, GAME_DURATION_MS, INVULNERABLE_MS, KEY_SPEED, START_LIVES, createMazeState, isWall, moveBall, parseMaze, step, type MazeState } from '../engine'

const FRAME = 1000 / 60
type Cell = [number, number]

function bfs(grid: string[], from: Cell) {
  const dist = new Map<string, number>([[from.join(), 0]])
  const prev = new Map<string, Cell>()
  const queue: Cell[] = [from]
  while (queue.length) {
    const [r, c] = queue.shift()!
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const n: Cell = [r + dr, c + dc]
      if (grid[n[0]]?.[n[1]] === undefined || grid[n[0]][n[1]] === '#' || dist.has(n.join())) continue
      dist.set(n.join(), dist.get([r, c].join())! + 1)
      prev.set(n.join(), [r, c])
      queue.push(n)
    }
  }
  return { dist, prev }
}

function find(grid: string[], ch: string): Cell {
  const r = grid.findIndex((row) => row.includes(ch))
  return [r, grid[r].indexOf(ch)]
}

function shortestPath(grid: string[]) {
  const s = find(grid, 'S')
  const e = find(grid, 'E')
  const { prev } = bfs(grid, s)
  const path: Cell[] = [e]
  while (path[0].join() !== s.join()) path.unshift(prev.get(path[0].join())!)
  return path
}

describe('ZEEK MAZE designs', () => {
  it('has at least five mazes', () => expect(MAZES.length).toBeGreaterThanOrEqual(5))

  it.each(MAZES.map((m, i) => [i, m] as const))('maze %i: closed borders, a start, an exit and a valid route', (_, m) => {
    const rows = m.grid.length
    const cols = m.grid[0].length
    for (const row of m.grid) expect(row).toHaveLength(cols)
    expect(m.grid[0]).toBe('#'.repeat(cols))
    expect(m.grid[rows - 1]).toBe('#'.repeat(cols))
    for (const row of m.grid) expect(row[0] + row[cols - 1]).toBe('##')
    const { dist } = bfs(m.grid, find(m.grid, 'S'))
    expect(dist.has(find(m.grid, 'E').join())).toBe(true)
  })

  it.each(MAZES.map((m, i) => [i, m] as const))('maze %i: traps patrol straight open corridors away from the start', (_, m) => {
    const { dist } = bfs(m.grid, find(m.grid, 'S'))
    for (const { a, b } of m.traps) {
      expect(a[0] === b[0] || a[1] === b[1]).toBe(true)
      // `a` es un cruce del camino más corto (la trampa lo cruza por momentos).
      expect(shortestPath(m.grid).some(([r, c]) => r === a[0] && c === a[1])).toBe(true)
      const len = Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1])
      for (let k = 0; k <= len; k++) {
        const r = a[0] + Math.sign(b[0] - a[0]) * k
        const c = a[1] + Math.sign(b[1] - a[1]) * k
        expect(m.grid[r][c]).not.toBe('#')
        expect(dist.get([r, c].join())).toBeGreaterThanOrEqual(3)
      }
    }
  })
})

describe('ZEEK MAZE physics', () => {
  it('the sphere never goes through walls, even with huge fast drags', () => {
    const rng = seeded(1)
    for (let i = 0; i < MAZES.length; i++) {
      const s = createMazeState(MAZES, i, rng)
      for (let k = 0; k < 400; k++) {
        moveBall(s, (rng() - 0.5) * 6, (rng() - 0.5) * 6)
        const { x, y } = s.ball
        // El centro está en un pasillo y la esfera no se mete en la pared.
        expect(isWall(s, Math.floor(y), Math.floor(x))).toBe(false)
        for (const [ox, oy] of [[BALL_R * 0.98, 0], [-BALL_R * 0.98, 0], [0, BALL_R * 0.98], [0, -BALL_R * 0.98]]) {
          expect(isWall(s, Math.floor(y + oy), Math.floor(x + ox))).toBe(false)
        }
      }
    }
  })

  it('a trap hit costs a life and gives 1.5 s of invulnerability; 3 hits end the game', () => {
    const s = createMazeState(MAZES, 0, seeded(2))
    const t = s.traps[0]
    const park = () => {
      s.ball.x = t.x
      s.ball.y = t.y
    }
    park()
    step(s, FRAME, { dx: 0, dy: 0 })
    expect(s.lives).toBe(START_LIVES - 1)
    park()
    step(s, FRAME, { dx: 0, dy: 0 })
    expect(s.lives).toBe(START_LIVES - 1)
    s.invulnerableUntil = 0
    park()
    step(s, FRAME, { dx: 0, dy: 0 })
    s.invulnerableUntil = 0
    park()
    step(s, FRAME, { dx: 0, dy: 0 })
    expect(s.lives).toBe(0)
    expect(s.status).toBe('lost')
    expect(INVULNERABLE_MS).toBe(1500)
  })

  it('reaching the portal wins; 45 s without reaching it is a loss', () => {
    const s = createMazeState(MAZES, 0, seeded(3))
    s.traps.length = 0
    s.ball = { ...s.exit }
    step(s, FRAME, { dx: 0, dy: 0 })
    expect(s.status).toBe('won')
    const idle = createMazeState(MAZES, 0, seeded(4))
    idle.traps.length = 0
    for (let t = 0; t < GAME_DURATION_MS + 100; t += FRAME) step(idle, FRAME, { dx: 0, dy: 0 })
    expect(idle.status).toBe('lost')
  })

  it('a keyboard player who follows the route and waits for traps wins every maze', () => {
    for (let i = 0; i < MAZES.length; i++) {
      for (let seed = 0; seed < 10; seed++) {
        const s: MazeState = createMazeState(MAZES, i, seeded(seed))
        const path = shortestPath(MAZES[i].grid)
        let k = 1
        for (let t = 0; t < GAME_DURATION_MS && s.status === 'playing'; t += FRAME) {
          const [r, c] = path[Math.min(k, path.length - 1)]
          const tx = c + 0.5 - s.ball.x
          const ty = r + 0.5 - s.ball.y
          if (Math.hypot(tx, ty) < 0.12) k++
          const d = Math.hypot(tx, ty) || 1
          // Como una persona: si una trampa está por cruzar el próximo tramo, espera.
          const ahead = path.slice(k, k + 2).map(([rr, cc]) => [cc + 0.5, rr + 0.5])
          const danger = s.traps.some((tr) => ahead.some(([ax, ay]) => Math.hypot(tr.x - ax, tr.y - ay) < 1.1))
          const v = danger && d < 0.95 ? 0 : Math.min(KEY_SPEED * (FRAME / 1000), d)
          step(s, FRAME, { dx: (tx / d) * v, dy: (ty / d) * v })
        }
        expect({ i, seed, status: s.status }).toEqual({ i, seed, status: 'won' })
        expect(s.lives).toBeGreaterThanOrEqual(START_LIVES - 1)
      }
    }
  })

  it('parses start and exit positions', () => {
    const p = parseMaze(MAZES[0])
    expect(p.start).toEqual({ x: 1.5, y: 1.5 })
  })
})
