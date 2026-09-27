import { Particles, NEON, PURPLE, type Rng } from '../../arcade/kit/particles'
import { GAME_DURATION_MS, GOAL, MAX_ITEMS, MISS_PENALTY, ROUNDS, roundAt, speedAt, type Item, type Round } from './config'

// Motor de ZEEK SORT (sin DOM).

export type Status = 'playing' | 'won' | 'lost'
export type Side = 0 | 1

export interface Falling {
  id: number
  item: Item
  side: Side
  x: number
  y: number
  vy: number
  dragging: boolean
  /** Para detectar un "flick" al soltar. */
  dragVx: number
}

export interface SortEvent {
  id: number
  type: 'correct' | 'wrong' | 'missed' | 'round'
  x: number
  y: number
}

export interface SortState {
  w: number
  h: number
  status: Status
  elapsed: number
  score: number
  correct: number
  wrong: number
  missed: number
  round: Round
  items: Falling[]
  nextSpawnAt: number
  events: SortEvent[]
  particles: Particles
  shake: number
  seq: number
  rng: Rng
}

export function createSortState(w: number, h: number, rng: Rng = Math.random): SortState {
  return {
    w,
    h,
    status: 'playing',
    elapsed: 0,
    score: 0,
    correct: 0,
    wrong: 0,
    missed: 0,
    round: ROUNDS[0],
    items: [],
    nextSpawnAt: 300,
    events: [],
    particles: new Particles(rng),
    shake: 0,
    seq: 0,
    rng,
  }
}

/** Tamaño de cada objeto (lado del recuadro). */
export const itemSize = (s: SortState) => Math.max(64, Math.min(96, Math.min(s.w, s.h) * 0.2))
/** Altura de los contenedores inferiores. */
export const binHeight = (s: SortState) => Math.max(92, Math.min(140, s.h * 0.2))
export const binTop = (s: SortState) => s.h - binHeight(s)
export const timeLeftMs = (s: SortState) => Math.max(0, GAME_DURATION_MS - s.elapsed)

export function resizeSort(s: SortState, w: number, h: number) {
  const fx = w / s.w
  const fy = h / s.h
  s.w = w
  s.h = h
  for (const it of s.items) {
    it.x *= fx
    it.y *= fy
    it.vy *= fy
  }
}

export function step(s: SortState, dtMs: number) {
  const dt = Math.min(dtMs, 50)
  const sec = dt / 1000
  s.particles.update(sec)
  s.shake = Math.max(0, s.shake - sec * 4)
  if (s.status !== 'playing') return

  s.elapsed += dt
  if (s.elapsed >= GAME_DURATION_MS) {
    s.elapsed = GAME_DURATION_MS
    s.status = 'lost'
    s.items.length = 0
    return
  }

  // Nueva ronda: cambian las categorías y se retiran los objetos anteriores.
  const round = roundAt(s.elapsed)
  if (round !== s.round) {
    s.round = round
    s.items.length = 0
    s.nextSpawnAt = s.elapsed + 700
    s.events.push({ id: ++s.seq, type: 'round', x: s.w / 2, y: s.h / 2 })
  }

  const size = itemSize(s)
  const floor = binTop(s)
  let n = 0
  for (const it of s.items) {
    if (!it.dragging) it.y += it.vy * sec
    // Llegó a los contenedores sin clasificar: se pierde y resta 1 (nunca menos de 0).
    if (!it.dragging && it.y + size / 2 >= floor) {
      s.missed += 1
      s.score = Math.max(0, s.score - MISS_PENALTY)
      s.shake = Math.max(s.shake, 0.6)
      s.particles.burst(it.x, floor, ['rgba(255,255,255,0.6)', PURPLE], 10, size * 1.5)
      s.events.push({ id: ++s.seq, type: 'missed', x: it.x, y: floor - size / 2 })
      continue
    }
    s.items[n++] = it
  }
  s.items.length = n

  const speed = speedAt(s.elapsed)
  if (s.items.length < MAX_ITEMS && s.elapsed >= s.nextSpawnAt) {
    if (spawn(s)) s.nextSpawnAt = s.elapsed + speed.spawnEveryMs
  }
}

export function spawn(s: SortState): Falling | null {
  const size = itemSize(s)
  const margin = size / 2 + 8
  const speed = speedAt(s.elapsed)
  for (let attempt = 0; attempt < 20; attempt++) {
    const x = margin + s.rng() * Math.max(1, s.w - 2 * margin)
    // Que no aparezca encima de otro objeto que todavía está arriba.
    const blocked = s.items.some((o) => Math.abs(o.x - x) < size * 1.1 && o.y < size * 2.2)
    if (blocked) continue
    const side: Side = s.rng() < 0.5 ? 0 : 1
    const pool = s.round.items[side]
    const item = pool[Math.floor(s.rng() * pool.length)]
    // Distancia de caída: desde arriba (-size/2) hasta tocar los contenedores.
    const fall = binTop(s)
    const f: Falling = { id: ++s.seq, item, side, x, y: -size / 2, vy: fall / speed.fallSeconds, dragging: false, dragVx: 0 }
    s.items.push(f)
    return f
  }
  return null
}

/** Objeto bajo el dedo (el de más arriba en el dibujo = el último). */
export function pick(s: SortState, x: number, y: number): Falling | null {
  if (s.status !== 'playing') return null
  const half = itemSize(s) / 2 + 10
  for (let i = s.items.length - 1; i >= 0; i--) {
    const it = s.items[i]
    if (Math.abs(it.x - x) <= half && Math.abs(it.y - y) <= half) return it
  }
  return null
}

export function grab(s: SortState, it: Falling) {
  it.dragging = true
  it.dragVx = 0
  // Lo lleva al frente del dibujo.
  s.items = [...s.items.filter((o) => o !== it), it]
}

export function drag(it: Falling, x: number, y: number, dtMs: number) {
  if (dtMs > 0) it.dragVx = it.dragVx * 0.5 + ((x - it.x) / dtMs) * 1000 * 0.5
  it.x = x
  it.y = y
}

const FLICK_SPEED = 750 // px/s

/**
 * Suelta el objeto: si está sobre un contenedor, o si se lo "tiró" con fuerza
 * hacia un costado, se clasifica. Si no, sigue cayendo.
 */
export function release(s: SortState, it: Falling): 'correct' | 'wrong' | null {
  if (!s.items.includes(it)) return null
  it.dragging = false
  const size = itemSize(s)
  let side: Side | null = null
  if (it.y + size * 0.2 >= binTop(s)) side = it.x < s.w / 2 ? 0 : 1
  else if (Math.abs(it.dragVx) >= FLICK_SPEED) side = it.dragVx < 0 ? 0 : 1
  if (side === null) {
    it.y = Math.min(it.y, binTop(s) - size / 2 - 1)
    return null
  }
  return classify(s, it, side)
}

export function classify(s: SortState, it: Falling, side: Side): 'correct' | 'wrong' {
  s.items = s.items.filter((o) => o !== it)
  const binX = side === 0 ? s.w / 4 : (s.w * 3) / 4
  const binY = binTop(s) + binHeight(s) / 2
  if (side === it.side) {
    s.score += 1
    s.correct += 1
    s.particles.burst(binX, binY, side === 0 ? [NEON, '#ffffff'] : [PURPLE, '#ffffff', '#8A66FF'], 24, itemSize(s) * 4)
    s.events.push({ id: ++s.seq, type: 'correct', x: binX, y: binY })
    if (s.score >= GOAL) {
      s.status = 'won'
      s.items.length = 0
    }
    return 'correct'
  }
  s.score = Math.max(0, s.score - 1)
  s.wrong += 1
  s.shake = 1
  s.events.push({ id: ++s.seq, type: 'wrong', x: binX, y: binY })
  return 'wrong'
}
