import {
  BAD_POINTS,
  COUNTDOWN_MS,
  GAME_DURATION_MS,
  GOAL,
  GOOD_POINTS,
  HIT_SLOP,
  MAX_STEP_MS,
  MIN_TARGET_RADIUS,
  TARGET_GAP,
  phaseAt,
  type Phase,
} from './config'

// Motor de ZEEK TAP: lógica pura (sin DOM), mutable para no generar basura por
// frame, y con el azar inyectable para testear.

export type Rng = () => number
export type Status = 'playing' | 'won' | 'lost'
export type Kind = 'good' | 'bad'

export interface Target {
  id: number
  kind: Kind
  x: number
  y: number
  r: number
  vx: number
  vy: number
  bornAt: number
  ttl: number
}

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
  size: number
  color: string
}

/** Algo que la UI muestra una vez: "+1", "-2", un combo o un toque errado. */
export interface TapEvent {
  id: number
  type: 'good' | 'bad' | 'combo'
  x: number
  y: number
  streak: number
}

export interface TapState {
  w: number
  h: number
  status: Status
  countdown: number
  /** Tiempo jugado (ms): no corre en la cuenta regresiva ni en pausa. */
  elapsed: number
  clock: number
  score: number
  goodHits: number
  badHits: number
  streak: number
  bestStreak: number
  targets: Target[]
  particles: Particle[]
  events: TapEvent[]
  nextSpawnAt: number
  /** En la fase de alternancia: tipo del próximo objetivo. */
  nextKind: Kind
  shake: number
  seq: number
  rng: Rng
}

export const NEON = '#01E576'
export const PURPLE = '#6335ED'
const MAX_PARTICLES = 260

export function createTapState(w: number, h: number, rng: Rng = Math.random): TapState {
  return {
    w,
    h,
    status: 'playing',
    countdown: COUNTDOWN_MS,
    elapsed: 0,
    clock: 0,
    score: 0,
    goodHits: 0,
    badHits: 0,
    streak: 0,
    bestStreak: 0,
    targets: [],
    particles: [],
    events: [],
    nextSpawnAt: 0,
    nextKind: 'good',
    shake: 0,
    seq: 0,
    rng,
  }
}

export const timeLeftMs = (s: TapState) => Math.max(0, GAME_DURATION_MS - s.elapsed)

export function startCountdown(s: TapState) {
  if (s.status === 'playing') s.countdown = COUNTDOWN_MS
}

export function targetRadius(s: TapState, phase: Phase) {
  return Math.max(MIN_TARGET_RADIUS, Math.min(s.w, s.h) * phase.radius)
}

/** Margen al borde: el objetivo entero queda visible y lejos del filo. */
export const edgeMargin = (s: TapState) => Math.max(14, Math.min(s.w, s.h) * 0.05)

export function resizeTap(s: TapState, w: number, h: number) {
  if (w === s.w && h === s.h) return
  const fx = w / s.w
  const fy = h / s.h
  s.w = w
  s.h = h
  const m = edgeMargin(s)
  for (const t of s.targets) {
    t.x = clamp(t.x * fx, t.r + m, w - t.r - m)
    t.y = clamp(t.y * fy, t.r + m, h - t.r - m)
  }
  s.particles.length = 0
}

export function step(s: TapState, rawDt: number) {
  const dt = Math.min(Math.max(rawDt, 0), MAX_STEP_MS)
  const sec = dt / 1000
  s.clock += dt
  updateParticles(s, sec)
  s.shake = Math.max(0, s.shake - sec * 4)

  if (s.status !== 'playing') return
  if (s.countdown > 0) {
    s.countdown = Math.max(0, s.countdown - dt)
    return
  }

  s.elapsed += dt
  if (s.elapsed >= GAME_DURATION_MS) {
    s.elapsed = GAME_DURATION_MS
    s.status = 'lost'
    s.targets.length = 0
    return
  }

  // Los que no se tocaron a tiempo desaparecen, sin penalización.
  let n = 0
  for (const t of s.targets) {
    if (s.elapsed - t.bornAt < t.ttl) s.targets[n++] = t
  }
  s.targets.length = n

  moveTargets(s, sec)

  const phase = phaseAt(s.elapsed)
  if (s.targets.length < phase.maxTargets && s.elapsed >= s.nextSpawnAt) {
    if (spawnTarget(s, phase)) s.nextSpawnAt = s.elapsed + phase.spawnEveryMs
  }
}

function moveTargets(s: TapState, sec: number) {
  const m = edgeMargin(s)
  for (const t of s.targets) {
    t.x += t.vx * sec
    t.y += t.vy * sec
    // Rebota contra los bordes del área (nunca se sale).
    if (t.x < t.r + m) (t.x = t.r + m), (t.vx = Math.abs(t.vx))
    if (t.x > s.w - t.r - m) (t.x = s.w - t.r - m), (t.vx = -Math.abs(t.vx))
    if (t.y < t.r + m) (t.y = t.r + m), (t.vy = Math.abs(t.vy))
    if (t.y > s.h - t.r - m) (t.y = s.h - t.r - m), (t.vy = -Math.abs(t.vy))
  }
  // Y entre sí: si se acercan demasiado, se separan y rebotan.
  for (let i = 0; i < s.targets.length; i++) {
    for (let j = i + 1; j < s.targets.length; j++) {
      const a = s.targets[i]
      const b = s.targets[j]
      const dx = b.x - a.x
      const dy = b.y - a.y
      const dist = Math.hypot(dx, dy) || 0.001
      const min = a.r + b.r + TARGET_GAP
      if (dist >= min) continue
      const nx = dx / dist
      const ny = dy / dist
      const push = (min - dist) / 2
      a.x -= nx * push
      a.y -= ny * push
      b.x += nx * push
      b.y += ny * push
      const va = a.vx * nx + a.vy * ny
      const vb = b.vx * nx + b.vy * ny
      a.vx += (vb - va) * nx
      a.vy += (vb - va) * ny
      b.vx += (va - vb) * nx
      b.vy += (va - vb) * ny
    }
  }
}

function pickKind(s: TapState, phase: Phase): Kind {
  // Nunca queda la pantalla solo con morados: siempre hay algo que sumar.
  const hasGood = s.targets.some((t) => t.kind === 'good')
  if (!hasGood && s.targets.length > 0) return 'good'
  if (phase.alternate) {
    const kind = s.nextKind
    s.nextKind = kind === 'good' ? 'bad' : 'good'
    return kind
  }
  return s.rng() < phase.badChance ? 'bad' : 'good'
}

export function spawnTarget(s: TapState, phase: Phase): Target | null {
  const r = targetRadius(s, phase)
  const m = edgeMargin(s)
  if (s.w < 2 * (r + m) || s.h < 2 * (r + m)) return null
  for (let attempt = 0; attempt < 30; attempt++) {
    const x = r + m + s.rng() * (s.w - 2 * (r + m))
    const y = r + m + s.rng() * (s.h - 2 * (r + m))
    const free = s.targets.every((t) => Math.hypot(t.x - x, t.y - y) >= t.r + r + TARGET_GAP)
    if (!free) continue
    const speed = phase.drift * Math.min(s.w, s.h)
    const ang = s.rng() * Math.PI * 2
    const target: Target = {
      id: ++s.seq,
      kind: pickKind(s, phase),
      x,
      y,
      r,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      bornAt: s.elapsed,
      ttl: phase.ttlMs,
    }
    s.targets.push(target)
    return target
  }
  return null
}

/**
 * Un toque en (x, y). Activa como máximo UN objetivo (el más cercano dentro de
 * su área táctil). Devuelve el tipo tocado o null.
 */
export function tap(s: TapState, x: number, y: number): Kind | null {
  if (s.status !== 'playing' || s.countdown > 0) return null
  let best = -1
  let bestDist = Infinity
  for (let i = 0; i < s.targets.length; i++) {
    const t = s.targets[i]
    const d = Math.hypot(t.x - x, t.y - y)
    if (d <= t.r * HIT_SLOP && d < bestDist) {
      best = i
      bestDist = d
    }
  }
  if (best === -1) return null

  const [t] = s.targets.splice(best, 1)
  if (t.kind === 'good') {
    s.score += GOOD_POINTS
    s.goodHits += 1
    s.streak += 1
    s.bestStreak = Math.max(s.bestStreak, s.streak)
    burst(s, t.x, t.y, [NEON, '#ffffff', '#b7ffd9'], 22, t.r * 5)
    s.events.push({ id: ++s.seq, type: 'good', x: t.x, y: t.y, streak: s.streak })
    if (s.streak >= 3 && s.streak % 3 === 0) {
      s.events.push({ id: ++s.seq, type: 'combo', x: t.x, y: t.y, streak: s.streak })
    }
  } else {
    s.score = Math.max(0, s.score + BAD_POINTS)
    s.badHits += 1
    s.streak = 0
    s.shake = 1
    burst(s, t.x, t.y, [PURPLE, '#ffffff'], 12, t.r * 3)
    s.events.push({ id: ++s.seq, type: 'bad', x: t.x, y: t.y, streak: 0 })
  }

  // El siguiente aparece tras un respiro breve.
  s.nextSpawnAt = s.elapsed + phaseAt(s.elapsed).respawnMs

  if (s.score >= GOAL) {
    s.status = 'won'
    s.targets.length = 0
    burst(s, s.w / 2, s.h / 2, [NEON, PURPLE, '#ffffff'], 60, Math.min(s.w, s.h) * 1.2)
  }
  return t.kind
}

function burst(s: TapState, x: number, y: number, colors: string[], n: number, speed: number) {
  for (let i = 0; i < n; i++) {
    const ang = s.rng() * Math.PI * 2
    const sp = speed * (0.35 + s.rng() * 0.8)
    if (s.particles.length >= MAX_PARTICLES) s.particles.shift()
    s.particles.push({
      x,
      y,
      vx: Math.cos(ang) * sp,
      vy: Math.sin(ang) * sp,
      life: 0,
      max: 350 + s.rng() * 350,
      size: 2.5 + s.rng() * 3.5,
      color: colors[i % colors.length],
    })
  }
}

function updateParticles(s: TapState, sec: number) {
  let n = 0
  for (const p of s.particles) {
    p.life += sec * 1000
    if (p.life >= p.max) continue
    p.x += p.vx * sec
    p.y += p.vy * sec
    p.vx *= 1 - Math.min(1, sec * 4)
    p.vy *= 1 - Math.min(1, sec * 4)
    s.particles[n++] = p
  }
  s.particles.length = n
}

export function clamp(v: number, min: number, max: number) {
  return v < min ? min : v > max ? max : v
}
