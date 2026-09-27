import { Particles, NEON, PURPLE, type Rng } from '../../arcade/kit/particles'
import type { MazeDef } from './mazes'

// Motor de ZEEK MAZE (sin DOM). Todo se mide en celdas: x = columna, y = fila
// (el centro de la celda (f, c) es (c + 0,5, f + 0,5)).

export const GAME_DURATION_MS = 45_000
export const START_LIVES = 3
export const INVULNERABLE_MS = 1_500
export const BALL_R = 0.27
export const TRAP_R = 0.26
/** Velocidad con teclado (celdas/s). */
export const KEY_SPEED = 3.4
/** Velocidad de las trampas (celdas/s). */
export const TRAP_SPEED = 1.5
const EXIT_R = 0.36

export type Status = 'playing' | 'won' | 'lost'

export interface Trap {
  ax: number
  ay: number
  bx: number
  by: number
  /** Posición a lo largo del tramo (0..2, ida y vuelta). */
  t: number
  len: number
  x: number
  y: number
}

export interface MazeState {
  maze: number
  rows: number
  cols: number
  walls: boolean[]
  start: { x: number; y: number }
  exit: { x: number; y: number }
  ball: { x: number; y: number }
  traps: Trap[]
  lives: number
  invulnerableUntil: number
  status: Status
  elapsed: number
  hits: number
  wonAt: number
  particles: Particles
  events: { id: number; type: 'hit' | 'exit' }[]
  seq: number
}

export interface Input {
  dx: number
  dy: number
}

export function parseMaze(def: MazeDef) {
  const rows = def.grid.length
  const cols = def.grid[0].length
  const walls: boolean[] = []
  let start = { x: 0, y: 0 }
  let exit = { x: 0, y: 0 }
  def.grid.forEach((row, r) =>
    [...row].forEach((ch, c) => {
      walls.push(ch === '#')
      if (ch === 'S') start = { x: c + 0.5, y: r + 0.5 }
      if (ch === 'E') exit = { x: c + 0.5, y: r + 0.5 }
    }),
  )
  return { rows, cols, walls, start, exit }
}

export function createMazeState(mazes: MazeDef[], index: number, rng: Rng = Math.random): MazeState {
  const maze = ((index % mazes.length) + mazes.length) % mazes.length
  const def = mazes[maze]
  const { rows, cols, walls, start, exit } = parseMaze(def)
  const traps = def.traps.map(({ a, b }): Trap => {
    const ax = a[1] + 0.5
    const ay = a[0] + 0.5
    const bx = b[1] + 0.5
    const by = b[0] + 0.5
    const t = rng() * 2
    const trap: Trap = { ax, ay, bx, by, t, len: Math.hypot(bx - ax, by - ay), x: ax, y: ay }
    placeTrap(trap)
    return trap
  })
  return {
    maze,
    rows,
    cols,
    walls,
    start,
    exit,
    ball: { ...start },
    traps,
    lives: START_LIVES,
    invulnerableUntil: 0,
    status: 'playing',
    elapsed: 0,
    hits: 0,
    wonAt: 0,
    particles: new Particles(rng, 200),
    events: [],
    seq: 0,
  }
}

function placeTrap(t: Trap) {
  const k = t.t <= 1 ? t.t : 2 - t.t
  t.x = t.ax + (t.bx - t.ax) * k
  t.y = t.ay + (t.by - t.ay) * k
}

export const isWall = (s: MazeState, r: number, c: number) =>
  r < 0 || c < 0 || r >= s.rows || c >= s.cols || s.walls[r * s.cols + c]

export const isInvulnerable = (s: MazeState) => s.elapsed < s.invulnerableUntil
export const timeLeftMs = (s: MazeState) => Math.max(0, GAME_DURATION_MS - s.elapsed)

/** Empuja la esfera fuera de cualquier pared que esté tocando. */
function resolve(s: MazeState) {
  const b = s.ball
  for (let pass = 0; pass < 2; pass++) {
    const r0 = Math.floor(b.y - BALL_R)
    const r1 = Math.floor(b.y + BALL_R)
    const c0 = Math.floor(b.x - BALL_R)
    const c1 = Math.floor(b.x + BALL_R)
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        if (!isWall(s, r, c)) continue
        const cx = Math.max(c, Math.min(b.x, c + 1))
        const cy = Math.max(r, Math.min(b.y, r + 1))
        const dx = b.x - cx
        const dy = b.y - cy
        const d = Math.hypot(dx, dy)
        if (d >= BALL_R) continue
        if (d > 1e-6) {
          b.x = cx + (dx / d) * BALL_R
          b.y = cy + (dy / d) * BALL_R
        } else {
          // Centro dentro de la pared: salir por el lado más cercano.
          const exits = [b.x - c, c + 1 - b.x, b.y - r, r + 1 - b.y]
          const i = exits.indexOf(Math.min(...exits))
          if (i === 0) b.x = c - BALL_R
          else if (i === 1) b.x = c + 1 + BALL_R
          else if (i === 2) b.y = r - BALL_R
          else b.y = r + 1 + BALL_R
        }
      }
    }
  }
}

/** Mueve la esfera (en celdas) sin atravesar paredes: pasos cortos. */
export function moveBall(s: MazeState, dx: number, dy: number) {
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / (BALL_R * 0.4)))
  for (let i = 0; i < steps; i++) {
    s.ball.x += dx / steps
    resolve(s)
    s.ball.y += dy / steps
    resolve(s)
  }
}

export function step(s: MazeState, dtMs: number, input: Input) {
  const dt = Math.min(dtMs, 50)
  const sec = dt / 1000
  s.particles.update(sec)
  if (s.status !== 'playing') return

  s.elapsed += dt
  if (s.elapsed >= GAME_DURATION_MS) {
    s.elapsed = GAME_DURATION_MS
    s.status = 'lost'
    return
  }

  if (input.dx || input.dy) moveBall(s, input.dx, input.dy)

  for (const t of s.traps) {
    t.t = (t.t + (TRAP_SPEED * sec) / Math.max(0.5, t.len)) % 2
    placeTrap(t)
  }

  // Trampas: una vida menos y 1,5 s de invulnerabilidad.
  if (!isInvulnerable(s)) {
    for (const t of s.traps) {
      if (Math.hypot(t.x - s.ball.x, t.y - s.ball.y) < BALL_R + TRAP_R) {
        s.lives -= 1
        s.hits += 1
        s.invulnerableUntil = s.elapsed + INVULNERABLE_MS
        s.particles.burst(s.ball.x, s.ball.y, [PURPLE, '#ffffff'], 18, 4)
        s.events.push({ id: ++s.seq, type: 'hit' })
        if (s.lives <= 0) {
          s.lives = 0
          s.status = 'lost'
        }
        return
      }
    }
  }

  if (Math.hypot(s.exit.x - s.ball.x, s.exit.y - s.ball.y) < EXIT_R) {
    s.status = 'won'
    s.wonAt = s.elapsed
    s.particles.burst(s.exit.x, s.exit.y, [NEON, PURPLE, '#ffffff'], 40, 6)
    s.events.push({ id: ++s.seq, type: 'exit' })
  }
}
