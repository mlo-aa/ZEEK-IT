import { Particles, NEON, PURPLE, type Rng } from '../../arcade/kit/particles'

// Motor de ZEEK STACK (sin DOM). Coordenadas de mundo: x en px desde la
// izquierda; los pisos se numeran desde la base (0 = plataforma).

export const GAME_DURATION_MS = 45_000
export const GOAL_FLOORS = 10
/** Tolerancia para PERFECT (px). */
export const PERFECT_PX = 5
/** Velocidad inicial del bloque, en anchos de pantalla por segundo. */
export const START_SPEED = 0.65
/** Cada piso nuevo se mueve un poco más rápido. */
export const SPEED_STEP = 1.08

export type Status = 'playing' | 'won' | 'lost'

export interface Block {
  x: number
  w: number
}

export interface Chunk {
  x: number
  w: number
  floor: number
  dy: number
  vy: number
  rot: number
  vr: number
}

export interface StackEvent {
  id: number
  type: 'place' | 'perfect' | 'miss'
  x: number
  floor: number
}

export interface StackState {
  w: number
  h: number
  status: Status
  elapsed: number
  /** Pisos apilados sobre la plataforma (tower[0] es la plataforma). */
  tower: Block[]
  moving: Block
  dir: 1 | -1
  speed: number
  perfects: number
  streak: number
  chunks: Chunk[]
  /** Desplazamiento vertical de cámara (px), suavizado. */
  camera: number
  particles: Particles
  events: StackEvent[]
  seq: number
}

export const blockHeight = (s: StackState) => Math.max(26, Math.min(40, s.h * 0.06))
export const floors = (s: StackState) => s.tower.length - 1
export const timeLeftMs = (s: StackState) => Math.max(0, GAME_DURATION_MS - s.elapsed)

export function createStackState(w: number, h: number, rng: Rng = Math.random): StackState {
  const baseW = Math.min(w * 0.62, 340)
  const base = { x: (w - baseW) / 2, w: baseW }
  return {
    w,
    h,
    status: 'playing',
    elapsed: 0,
    tower: [base],
    moving: { x: 0, w: baseW },
    dir: 1,
    speed: START_SPEED * w,
    perfects: 0,
    streak: 0,
    chunks: [],
    camera: 0,
    particles: new Particles(rng),
    events: [],
    seq: 0,
  }
}

export function resizeStack(s: StackState, w: number, h: number) {
  const f = w / s.w
  for (const b of [...s.tower, s.moving]) {
    b.x *= f
    b.w *= f
  }
  s.speed *= f
  s.w = w
  s.h = h
}

/** Y en pantalla de la parte de arriba de un piso, aplicando la cámara. */
export function floorTopY(s: StackState, floor: number) {
  const bh = blockHeight(s)
  const groundY = s.h - bh * 1.2
  return groundY - (floor + 1) * bh + s.camera
}

export function step(s: StackState, dtMs: number) {
  const dt = Math.min(dtMs, 50)
  const sec = dt / 1000
  s.particles.update(sec, 600)

  // Pedazos que se desprenden y caen.
  let n = 0
  for (const c of s.chunks) {
    c.vy += 1800 * sec
    c.dy += c.vy * sec
    c.rot += c.vr * sec
    if (c.dy < s.h * 2) s.chunks[n++] = c
  }
  s.chunks.length = n

  // La cámara sigue la cima para que siempre se vea.
  const bh = blockHeight(s)
  const target = Math.max(0, (floors(s) + 2) * bh - s.h * 0.55)
  s.camera += (target - s.camera) * Math.min(1, sec * 6)

  if (s.status !== 'playing') return
  s.elapsed += dt
  if (s.elapsed >= GAME_DURATION_MS) {
    s.elapsed = GAME_DURATION_MS
    s.status = 'lost'
    return
  }

  // El bloque va y viene de borde a borde.
  const m = s.moving
  m.x += s.dir * s.speed * sec
  const min = -m.w * 0.2
  const max = s.w - m.w * 0.8
  if (m.x > max) {
    m.x = max - (m.x - max)
    s.dir = -1
  } else if (m.x < min) {
    m.x = min + (min - m.x)
    s.dir = 1
  }
}

/** El jugador toca: se suelta el bloque sobre la torre. */
export function drop(s: StackState): StackEvent['type'] | null {
  if (s.status !== 'playing') return null
  const top = s.tower[s.tower.length - 1]
  const m = s.moving
  const floor = s.tower.length
  const dx = m.x - top.x

  if (Math.abs(dx) <= PERFECT_PX) {
    s.tower.push({ x: top.x, w: top.w })
    s.perfects += 1
    s.streak += 1
    s.particles.burst(top.x + top.w / 2, floorTopY(s, floor), [NEON, '#ffffff', PURPLE], 26, top.w * 1.4)
    s.events.push({ id: ++s.seq, type: 'perfect', x: top.x + top.w / 2, floor })
  } else {
    const left = Math.max(m.x, top.x)
    const right = Math.min(m.x + m.w, top.x + top.w)
    const overlap = right - left
    if (overlap <= 0) {
      // No apoyó nada: se cae entero y termina la partida.
      s.chunks.push({ x: m.x, w: m.w, floor, dy: 0, vy: 0, rot: 0, vr: (dx > 0 ? 1 : -1) * 2 })
      s.status = 'lost'
      s.events.push({ id: ++s.seq, type: 'miss', x: m.x + m.w / 2, floor })
      return 'miss'
    }
    // La parte que sobresale se desprende.
    const cutX = dx > 0 ? right : m.x
    const cutW = m.w - overlap
    s.chunks.push({ x: cutX, w: cutW, floor, dy: 0, vy: -60, rot: 0, vr: (dx > 0 ? 1 : -1) * 3 })
    s.tower.push({ x: left, w: overlap })
    s.streak = 0
    s.events.push({ id: ++s.seq, type: 'place', x: left + overlap / 2, floor })
  }

  if (floors(s) >= GOAL_FLOORS) {
    s.status = 'won'
    return s.events[s.events.length - 1].type
  }
  // Siguiente bloque: mismo ancho que la superficie que quedó, un poco más rápido,
  // entrando alternadamente por cada lado.
  const next = s.tower[s.tower.length - 1]
  s.speed *= SPEED_STEP
  s.dir = s.dir === 1 ? -1 : 1
  s.moving = { x: s.dir === 1 ? -next.w * 0.2 : s.w - next.w * 0.8, w: next.w }
  return s.events[s.events.length - 1].type
}
