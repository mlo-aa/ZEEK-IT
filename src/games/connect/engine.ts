import { COLORS, SIZE, type Color } from './levels'

// Motor de ZEEK CONNECT (sin DOM).

export const GAME_DURATION_MS = 45_000

export type Cell = number // fila * SIZE + columna
export type Status = 'playing' | 'won' | 'lost'

export const cellOf = (r: number, c: number): Cell => r * SIZE + c
export const rowOf = (cell: Cell) => Math.floor(cell / SIZE)
export const colOf = (cell: Cell) => cell % SIZE
export const adjacent = (a: Cell, b: Cell) => Math.abs(rowOf(a) - rowOf(b)) + Math.abs(colOf(a) - colOf(b)) === 1

export interface ConnectState {
  level: number
  /** Extremos de cada color. */
  ends: Record<Color, [Cell, Cell]>
  /** Camino dibujado de cada color (puede estar incompleto). */
  paths: Record<Color, Cell[]>
  drawing: Color | null
  status: Status
  elapsed: number
  /** Para animar cada conexión completada. */
  completedAt: Partial<Record<Color, number>>
}

/** Extrae los extremos (celdas con un solo vecino del mismo color) de una solución. */
export function endpointsOf(solution: string[]): Record<Color, [Cell, Cell]> {
  const ends = {} as Record<Color, [Cell, Cell]>
  for (const color of COLORS) {
    const found: Cell[] = []
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (solution[r][c] !== color) continue
        const same = [
          [r - 1, c],
          [r + 1, c],
          [r, c - 1],
          [r, c + 1],
        ].filter(([rr, cc]) => solution[rr]?.[cc] === color).length
        if (same === 1) found.push(cellOf(r, c))
      }
    }
    ends[color] = [found[0], found[1]]
  }
  return ends
}

export function createConnectState(levels: string[][], pickIndex: number): ConnectState {
  const level = ((pickIndex % levels.length) + levels.length) % levels.length
  return {
    level,
    ends: endpointsOf(levels[level]),
    paths: { G: [], P: [], B: [], O: [] },
    drawing: null,
    status: 'playing',
    elapsed: 0,
    completedAt: {},
  }
}

export const timeLeftMs = (s: ConnectState) => Math.max(0, GAME_DURATION_MS - s.elapsed)

export function step(s: ConnectState, dtMs: number) {
  if (s.status !== 'playing') return
  s.elapsed += Math.min(dtMs, 100)
  if (s.elapsed >= GAME_DURATION_MS) {
    s.elapsed = GAME_DURATION_MS
    s.status = 'lost'
    s.drawing = null
  }
}

function endpointColor(s: ConnectState, cell: Cell): Color | null {
  return COLORS.find((c) => s.ends[c].includes(cell)) ?? null
}

function pathColor(s: ConnectState, cell: Cell): Color | null {
  return COLORS.find((c) => s.paths[c].includes(cell)) ?? null
}

export function isComplete(s: ConnectState, color: Color) {
  const p = s.paths[color]
  const [a, b] = s.ends[color]
  return p.length >= 2 && ((p[0] === a && p[p.length - 1] === b) || (p[0] === b && p[p.length - 1] === a))
}

export const connectedCount = (s: ConnectState) => COLORS.filter((c) => isComplete(s, c)).length

/**
 * Empieza a dibujar: desde un extremo (borra y rehace esa conexión) o desde
 * una celda de un camino ya dibujado (lo corta ahí y sigue).
 */
export function start(s: ConnectState, cell: Cell): boolean {
  if (s.status !== 'playing') return false
  const endColor = endpointColor(s, cell)
  if (endColor) {
    s.paths[endColor] = [cell]
    delete s.completedAt[endColor]
    s.drawing = endColor
    return true
  }
  const pc = pathColor(s, cell)
  if (pc) {
    const p = s.paths[pc]
    s.paths[pc] = p.slice(0, p.indexOf(cell) + 1)
    delete s.completedAt[pc]
    s.drawing = pc
    return true
  }
  return false
}

/** Extiende el trazo a una celda vecina. Devuelve true si el trazo cambió. */
export function extend(s: ConnectState, cell: Cell): boolean {
  const color = s.drawing
  if (!color || s.status !== 'playing') return false
  const path = s.paths[color]
  const last = path[path.length - 1]
  if (cell === last) return false

  // Volver sobre el propio trazo lo acorta.
  const idx = path.indexOf(cell)
  if (idx !== -1) {
    s.paths[color] = path.slice(0, idx + 1)
    delete s.completedAt[color]
    return true
  }
  if (!adjacent(last, cell)) return false
  // Si ya está conectado, no se sigue alargando.
  if (isComplete(s, color)) return false
  // No se puede pisar otro color (ni sus puntos ni sus líneas).
  const endColor = endpointColor(s, cell)
  if (endColor && endColor !== color) return false
  if (pathColor(s, cell)) return false
  // Tampoco pasar por encima del extremo propio de origen.
  if (endColor === color && cell === path[0]) return false

  path.push(cell)
  if (isComplete(s, color)) {
    s.completedAt[color] = s.elapsed
    if (connectedCount(s) === COLORS.length) {
      s.status = 'won'
      s.drawing = null
    }
  }
  return true
}

/**
 * Lleva el trazo hacia una celda aunque el dedo haya saltado varias:
 * avanza paso a paso (primero por el eje con mayor distancia).
 */
export function extendToward(s: ConnectState, target: Cell) {
  for (let guard = 0; guard < SIZE * 2 && s.drawing; guard++) {
    const path = s.paths[s.drawing]
    const last = path[path.length - 1]
    if (last === target) return
    if (path.includes(target)) {
      extend(s, target)
      return
    }
    const dr = rowOf(target) - rowOf(last)
    const dc = colOf(target) - colOf(last)
    const next =
      Math.abs(dr) >= Math.abs(dc) ? cellOf(rowOf(last) + Math.sign(dr), colOf(last)) : cellOf(rowOf(last), colOf(last) + Math.sign(dc))
    if (!extend(s, next)) return
  }
}

export function stop(s: ConnectState) {
  s.drawing = null
}

/** Borra todas las líneas. */
export function clearAll(s: ConnectState) {
  if (s.status !== 'playing') return
  for (const c of COLORS) s.paths[c] = []
  s.completedAt = {}
  s.drawing = null
}
