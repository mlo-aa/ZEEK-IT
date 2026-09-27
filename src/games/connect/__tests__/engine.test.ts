import { describe, expect, it } from 'vitest'
import { COLORS, LEVELS, SIZE, type Color } from '../levels'
import {
  GAME_DURATION_MS,
  adjacent,
  cellOf,
  clearAll,
  connectedCount,
  createConnectState,
  extend,
  filledCount,
  isSolved,
  extendToward,
  start,
  step,
  stop,
} from '../engine'

/** Recorre el camino de la solución de un color, de extremo a extremo. */
function solutionPath(solution: string[], color: Color, from: number) {
  const path = [from]
  for (;;) {
    const last = path[path.length - 1]
    const r = Math.floor(last / SIZE)
    const c = last % SIZE
    const next = [
      [r - 1, c],
      [r + 1, c],
      [r, c - 1],
      [r, c + 1],
    ]
      .filter(([rr, cc]) => solution[rr]?.[cc] === color)
      .map(([rr, cc]) => cellOf(rr, cc))
      .find((cell) => !path.includes(cell))
    if (next === undefined) return path
    path.push(next)
  }
}

describe('ZEEK CONNECT levels', () => {
  it('has at least 10 boards, all different', () => {
    expect(LEVELS.length).toBeGreaterThanOrEqual(10)
    expect(new Set(LEVELS.map((l) => l.join('/'))).size).toBe(LEVELS.length)
  })

  it.each(LEVELS.map((l, i) => [i, l] as const))('board %i is a valid 5×5 with 4 simple paths that fill every cell', (_, level) => {
    expect(level).toHaveLength(SIZE)
    // Sin celdas libres: la solución llena las 25.
    for (const row of level) expect(row).toMatch(/^[GPBO]{5}$/)
    for (const color of COLORS) {
      const cells: number[] = []
      level.forEach((row, r) => [...row].forEach((ch, c) => ch === color && cells.push(cellOf(r, c))))
      const s = createConnectState([level], 0)
      const [a, b] = s.ends[color]
      expect(a).toBeDefined()
      expect(b).toBeDefined()
      // Los extremos no están pegados (si no, sería trivial).
      expect(adjacent(a, b)).toBe(false)
      // El camino de la solución recorre TODAS las celdas de ese color: es simple.
      const path = solutionPath(level, color, a)
      expect(path[path.length - 1]).toBe(b)
      expect(path.length).toBe(cells.length)
    }
  })

  it.each(LEVELS.map((l, i) => [i, l] as const))('board %i is solvable by playing its solution', (i, level) => {
    const s = createConnectState(LEVELS, i)
    for (const color of COLORS) {
      const [a] = s.ends[color]
      const path = solutionPath(level, color, a)
      expect(start(s, a)).toBe(true)
      for (const cell of path.slice(1)) expect(extend(s, cell)).toBe(true)
      stop(s)
    }
    expect(connectedCount(s)).toBe(4)
    expect(filledCount(s)).toBe(SIZE * SIZE)
    expect(s.status).toBe('won')
  })
})

describe('ZEEK CONNECT rules', () => {
  const level = 0 // 'OOOOG', 'OGGGG', 'PGBBB', 'PGPPB', 'PPPBB'
  const fresh = () => createConnectState(LEVELS, level)

  it('only starts from an endpoint or an existing line', () => {
    const s = fresh()
    expect(start(s, cellOf(1, 2))).toBe(false) // celda vacía
    expect(start(s, cellOf(1, 0))).toBe(true) // extremo naranja
  })

  it('no diagonals, no jumping, no crossing other colors', () => {
    const s = fresh()
    start(s, cellOf(0, 4)) // verde
    expect(extend(s, cellOf(1, 3))).toBe(false) // diagonal
    expect(extend(s, cellOf(2, 4))).toBe(false) // salto
    expect(extend(s, cellOf(0, 3))).toBe(false) // extremo naranja
    expect(extend(s, cellOf(1, 4))).toBe(true)
    stop(s)
    start(s, cellOf(0, 3)) // naranja
    extend(s, cellOf(1, 3))
    expect(extend(s, cellOf(1, 4))).toBe(false) // celda con línea verde
  })

  it('going back over the line shortens it; starting again from an endpoint redraws it', () => {
    const s = fresh()
    start(s, cellOf(0, 4))
    extend(s, cellOf(1, 4))
    extend(s, cellOf(1, 3))
    expect(extend(s, cellOf(1, 4))).toBe(true)
    expect(s.paths.G).toEqual([cellOf(0, 4), cellOf(1, 4)])
    stop(s)
    start(s, cellOf(0, 4))
    expect(s.paths.G).toEqual([cellOf(0, 4)])
  })

  it('touching a drawn line cuts it there and continues', () => {
    const s = fresh()
    start(s, cellOf(0, 4))
    extend(s, cellOf(1, 4))
    extend(s, cellOf(1, 3))
    stop(s)
    start(s, cellOf(1, 4))
    expect(s.drawing).toBe('G')
    expect(s.paths.G).toEqual([cellOf(0, 4), cellOf(1, 4)])
  })

  it('fast drags that skip cells still follow the grid', () => {
    const s = fresh()
    start(s, cellOf(0, 3)) // naranja
    extendToward(s, cellOf(0, 0))
    expect(s.paths.O).toEqual([3, 2, 1, 0].map((c) => cellOf(0, c)))
  })

  it('connecting every pair is not enough: all 25 cells must be filled', () => {
    // Tablero con celdas libres en su solución: los 4 pares se conectan sin llenar todo.
    const gappy = ['BGG.G', 'B.GGG', 'BBPPP', '.B..P', 'OOOOO']
    const s = createConnectState([gappy], 0)
    for (const color of COLORS) {
      const [a] = s.ends[color]
      start(s, a)
      for (const cell of solutionPath(gappy, color, a).slice(1)) extend(s, cell)
      stop(s)
    }
    expect(connectedCount(s)).toBe(4)
    expect(filledCount(s)).toBe(SIZE * SIZE - 5)
    expect(isSolved(s)).toBe(false)
    expect(s.status).toBe('playing')
  })

  it('clearing removes every line; time over is a loss', () => {
    const s = fresh()
    start(s, cellOf(0, 3))
    extendToward(s, cellOf(0, 0))
    clearAll(s)
    expect(connectedCount(s)).toBe(0)
    expect(filledCount(s)).toBe(8) // solo los extremos
    step(s, 100)
    for (let t = 0; t < GAME_DURATION_MS; t += 100) step(s, 100)
    expect(s.status).toBe('lost')
  })
})
