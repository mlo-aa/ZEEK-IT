import {
  COUNTDOWN_MS,
  GAME_DURATION_MS,
  INVULNERABLE_MS,
  MAX_STEP_MS,
  STAR_POINTS,
  START_LIVES,
  keyboardSpeedFor,
  phaseAt,
  rocketWidthFor,
  type Phase,
} from './config'

// Motor de ZEEK RUSH: estado mutable (sin crear objetos por frame, para ir a
// 60 FPS en celulares) y sin dependencias del DOM, así se puede testear.

export type Rng = () => number
export type Status = 'playing' | 'won' | 'lost'

export interface Asteroid {
  x: number
  y: number
  r: number
  vy: number
  rot: number
  vr: number
  /** Radios relativos de los vértices: forma irregular. */
  shape: number[]
  color: 0 | 1
}

export interface StarItem {
  x: number
  y: number
  r: number
  vy: number
}

/** Hueco libre de una oleada: garantiza siempre un camino posible. */
export interface Wave {
  gapX: number
  gapW: number
  y: number
  vy: number
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

export interface BgStar {
  x: number
  y: number
  layer: 0 | 1 | 2
  size: number
}

export interface Input {
  /** Teclado: -1 izquierda, 1 derecha. */
  dir: -1 | 0 | 1
  /** Arrastre táctil/mouse acumulado desde el último frame (px). */
  dragDx: number
}

export interface RushState {
  w: number
  h: number
  /** Ancho del cohete (px). */
  rw: number
  status: Status
  /** Tiempo jugado (ms). No corre durante la cuenta regresiva ni en pausa. */
  elapsed: number
  /** Cuenta regresiva restante (ms). Mientras sea > 0 no aparecen asteroides. */
  countdown: number
  /** Reloj total para animaciones (ms). */
  clock: number
  lives: number
  invulnerableUntil: number
  starsCollected: number
  score: number
  rocket: { x: number; y: number; vx: number }
  asteroids: Asteroid[]
  starItems: StarItem[]
  waves: Wave[]
  particles: Particle[]
  bg: BgStar[]
  nextWaveAt: number
  lastGapX: number
  shake: number
  /** Contadores que la UI compara para disparar sonidos. */
  events: { stars: number; hits: number }
  rng: Rng
}

export const NEON = '#01E576'
export const PURPLE = '#6335ED'
const MAX_PARTICLES = 320
/** Cuánto se puede correr el hueco entre oleadas (fracción de su ancho). */
export const GAP_DRIFT = 0.55

export const rocketHeight = (rw: number) => rw * 1.45

export function createRushState(w: number, h: number, rng: Rng = Math.random): RushState {
  const rw = rocketWidthFor(w, h)
  const s: RushState = {
    w,
    h,
    rw,
    status: 'playing',
    elapsed: 0,
    countdown: COUNTDOWN_MS,
    clock: 0,
    lives: START_LIVES,
    invulnerableUntil: 0,
    starsCollected: 0,
    score: 0,
    rocket: { x: w / 2, y: rocketY(h, rw), vx: 0 },
    asteroids: [],
    starItems: [],
    waves: [],
    particles: [],
    bg: [],
    nextWaveAt: 500,
    lastGapX: w / 2,
    shake: 0,
    events: { stars: 0, hits: 0 },
    rng,
  }
  const count = Math.round(Math.min(160, (w * h) / 5000))
  for (let i = 0; i < count; i++) {
    const layer = (i % 3) as 0 | 1 | 2
    s.bg.push({ x: rng() * w, y: rng() * h, layer, size: 0.8 + layer * 0.7 + rng() * 0.6 })
  }
  return s
}

function rocketY(h: number, rw: number) {
  return h - rocketHeight(rw) * 0.9 - 12
}

/** Adapta el estado a un nuevo tamaño de pantalla manteniendo las proporciones. */
export function resizeRush(s: RushState, w: number, h: number) {
  if (w === s.w && h === s.h) return
  const fx = w / s.w
  const fy = h / s.h
  for (const a of s.asteroids) {
    a.x *= fx
    a.y *= fy
    a.vy *= fy
  }
  for (const st of s.starItems) {
    st.x *= fx
    st.y *= fy
    st.vy *= fy
  }
  for (const wv of s.waves) {
    wv.gapX *= fx
    wv.gapW *= fx
    wv.y *= fy
    wv.vy *= fy
  }
  for (const b of s.bg) {
    b.x *= fx
    b.y *= fy
  }
  s.particles.length = 0
  s.w = w
  s.h = h
  s.rw = rocketWidthFor(w, h)
  s.rocket.x = clamp(s.rocket.x * fx, s.rw / 2, w - s.rw / 2)
  s.rocket.y = rocketY(h, s.rw)
  s.lastGapX *= fx
}

/** Vuelve a la cuenta regresiva (p. ej. al volver de una pausa). */
export function startCountdown(s: RushState) {
  if (s.status === 'playing') s.countdown = COUNTDOWN_MS
}

export const isInvulnerable = (s: RushState) => s.elapsed < s.invulnerableUntil

export const timeLeftMs = (s: RushState) => Math.max(0, GAME_DURATION_MS - s.elapsed)

export function step(s: RushState, rawDt: number, input: Input) {
  const dt = Math.min(Math.max(rawDt, 0), MAX_STEP_MS)
  const sec = dt / 1000
  s.clock += dt

  const live = s.status === 'playing'
  if (live) moveRocket(s, sec, input)
  scrollBackground(s, sec)
  updateParticles(s, sec)
  if (live) emitTrail(s)
  s.shake = Math.max(0, s.shake - sec * 3)

  if (!live) return
  if (s.countdown > 0) {
    s.countdown = Math.max(0, s.countdown - dt)
    return
  }

  s.elapsed += dt
  if (s.elapsed >= GAME_DURATION_MS) {
    s.elapsed = GAME_DURATION_MS
    s.status = 'won'
    burst(s, s.rocket.x, s.rocket.y, [NEON, '#ffffff', PURPLE], 40, 0.5)
    return
  }

  const phase = phaseAt(s.elapsed)
  while (s.elapsed >= s.nextWaveAt) {
    spawnWave(s, phase)
    s.nextWaveAt += phase.waveEveryMs
  }

  moveObjects(s, sec)
  collide(s)
}

function moveRocket(s: RushState, sec: number, input: Input) {
  const r = s.rocket
  const prev = r.x
  if (input.dragDx !== 0) {
    r.x += input.dragDx
  } else {
    const target = input.dir * keyboardSpeedFor(s.w, s.rw)
    // Aceleración suave: se siente fluido pero responde rápido.
    r.vx += (target - r.vx) * Math.min(1, sec * 14)
    r.x += r.vx * sec
  }
  const clamped = clamp(r.x, s.rw / 2, s.w - s.rw / 2)
  if (input.dragDx !== 0) r.vx = sec > 0 ? (clamped - prev) / sec : 0
  else if (clamped !== r.x) r.vx = 0
  r.x = clamped
}

function scrollBackground(s: RushState, sec: number) {
  const boost = s.countdown > 0 ? 0.6 : 1 + s.elapsed / GAME_DURATION_MS
  const speeds = [0.03, 0.08, 0.16]
  for (const b of s.bg) {
    b.y += speeds[b.layer] * s.h * boost * sec
    if (b.y > s.h) {
      b.y -= s.h
      b.x = s.rng() * s.w
    }
  }
}

function moveObjects(s: RushState, sec: number) {
  const { h } = s
  let n = 0
  for (const a of s.asteroids) {
    a.y += a.vy * sec
    a.rot += a.vr * sec
    if (a.y - a.r <= h) s.asteroids[n++] = a
  }
  s.asteroids.length = n

  n = 0
  for (const st of s.starItems) {
    st.y += st.vy * sec
    if (st.y - st.r <= h) s.starItems[n++] = st
  }
  s.starItems.length = n

  n = 0
  for (const wv of s.waves) {
    wv.y += wv.vy * sec
    if (wv.y - s.rw * 4 <= h) s.waves[n++] = wv
  }
  s.waves.length = n
}

/** Círculos de colisión del cohete: cuerpo y punta (un poco menores que el dibujo). */
export function rocketHitCircles(s: RushState): [number, number, number][] {
  const { x, y } = s.rocket
  const rh = rocketHeight(s.rw)
  return [
    [x, y + rh * 0.1, s.rw * 0.34],
    [x, y - rh * 0.26, s.rw * 0.2],
  ]
}

/** Radio de colisión de un asteroide: coincide con el borde medio dibujado. */
export const asteroidHitRadius = (a: Asteroid) => a.r * 0.84

function collide(s: RushState) {
  const { rocket, rw } = s

  let n = 0
  for (const st of s.starItems) {
    const dx = st.x - rocket.x
    const dy = st.y - rocket.y
    const reach = st.r + rw * 0.55
    if (dx * dx + dy * dy <= reach * reach) {
      s.starsCollected += 1
      s.score += STAR_POINTS
      s.events.stars += 1
      burst(s, st.x, st.y, [NEON, '#ffffff', '#b7ffd9'], 18, 0.35)
    } else {
      s.starItems[n++] = st
    }
  }
  s.starItems.length = n

  if (isInvulnerable(s)) return
  const circles = rocketHitCircles(s)
  for (let i = 0; i < s.asteroids.length; i++) {
    const a = s.asteroids[i]
    const ar = asteroidHitRadius(a)
    const hit = circles.some(([cx, cy, cr]) => {
      const dx = a.x - cx
      const dy = a.y - cy
      const d = ar + cr
      return dx * dx + dy * dy <= d * d
    })
    if (!hit) continue

    s.asteroids.splice(i, 1)
    s.lives -= 1
    s.events.hits += 1
    s.invulnerableUntil = s.elapsed + INVULNERABLE_MS
    s.shake = 1
    burst(s, (a.x + rocket.x) / 2, (a.y + rocket.y) / 2, [a.color ? PURPLE : NEON, '#ffffff'], 26, 0.45)
    if (s.lives <= 0) {
      s.lives = 0
      s.status = 'lost'
      burst(s, rocket.x, rocket.y, [PURPLE, '#ffffff', NEON], 36, 0.55)
    }
    return
  }
}

function asteroidRadius(s: RushState) {
  const roll = s.rng()
  const [min, max] = roll < 0.5 ? [0.42, 0.6] : roll < 0.85 ? [0.65, 0.9] : [0.95, 1.2]
  return s.rw * (min + s.rng() * (max - min))
}

export function spawnWave(s: RushState, phase: Phase) {
  const { rng, w, h, rw } = s
  const gapW = Math.min(phase.gap * rw, w * 0.8)

  // Un poco más rápido a medida que avanza la fase (máx. +8 %).
  const phaseStart = phase.untilMs === Infinity ? 20_000 : phase.untilMs - 10_000
  const ramp = 1 + 0.08 * clamp((s.elapsed - phaseStart) / 10_000, 0, 1)
  const vy = phase.speed * h * ramp

  // Camino siempre posible: huecos consecutivos se solapan en más de un ancho
  // de cohete. Así se puede ir acomodando mientras se atraviesa la oleada
  // actual, sin necesitar reflejos imposibles.
  const maxShift = gapW * GAP_DRIFT
  const center = clamp(s.lastGapX + (rng() * 2 - 1) * maxShift, gapW / 2, w - gapW / 2)
  const gapL = center - gapW / 2
  const gapR = center + gapW / 2
  const baseY = -rw * 1.3

  const want = phase.count[0] + Math.floor(rng() * (phase.count[1] - phase.count[0] + 1))
  const placed: Asteroid[] = []
  for (let attempt = 0; attempt < want * 14 && placed.length < want; attempt++) {
    const r = asteroidRadius(s)
    if (2 * r >= w) continue
    const x = r + rng() * (w - 2 * r)
    if (x + r > gapL - 4 && x - r < gapR + 4) continue
    if (placed.some((p) => Math.abs(p.x - x) < p.r + r + 6)) continue
    const vertices = 9
    placed.push({
      x,
      y: baseY - r - rng() * rw * 0.4,
      r,
      vy,
      rot: rng() * Math.PI * 2,
      vr: (rng() * 2 - 1) * 1.6,
      shape: Array.from({ length: vertices }, () => 0.8 + rng() * 0.25),
      color: rng() < 0.5 ? 0 : 1,
    })
  }
  s.asteroids.push(...placed)
  s.waves.push({ gapX: center, gapW, y: baseY, vy })

  if (rng() < phase.starChance) {
    const inGap = rng() < 0.6
    const r = rw * 0.28
    s.starItems.push(
      inGap
        ? { x: center + (rng() - 0.5) * gapW * 0.5, y: baseY - rw * 1.6, r, vy }
        : // A mitad de camino entre oleadas, donde no hay asteroides.
          { x: r + rng() * (w - 2 * r), y: baseY - (vy * phase.waveEveryMs) / 2000, r, vy },
    )
  }
  s.lastGapX = center
}

function emitTrail(s: RushState) {
  const { rocket, rng, rw, h } = s
  const rh = rocketHeight(rw)
  const count = s.countdown > 0 ? 1 : 2
  for (let i = 0; i < count; i++) {
    addParticle(s, {
      x: rocket.x + (rng() - 0.5) * rw * 0.22,
      y: rocket.y + rh * 0.48,
      vx: (rng() - 0.5) * 30 - rocket.vx * 0.15,
      vy: h * (0.3 + rng() * 0.25),
      life: 0,
      max: 280 + rng() * 260,
      size: 2 + rng() * 2.5,
      color: rng() < 0.6 ? NEON : rng() < 0.5 ? PURPLE : '#ffffff',
    })
  }
}

export function burst(s: RushState, x: number, y: number, colors: string[], n: number, power: number) {
  const { rng } = s
  const base = Math.min(s.w, s.h) * power
  for (let i = 0; i < n; i++) {
    const ang = rng() * Math.PI * 2
    const sp = base * (0.4 + rng() * 0.8)
    addParticle(s, {
      x,
      y,
      vx: Math.cos(ang) * sp,
      vy: Math.sin(ang) * sp,
      life: 0,
      max: 380 + rng() * 420,
      size: 2 + rng() * 3,
      color: colors[i % colors.length],
    })
  }
}

function addParticle(s: RushState, p: Particle) {
  if (s.particles.length >= MAX_PARTICLES) s.particles.shift()
  s.particles.push(p)
}

function updateParticles(s: RushState, sec: number) {
  let n = 0
  for (const p of s.particles) {
    p.life += sec * 1000
    if (p.life >= p.max) continue
    p.x += p.vx * sec
    p.y += p.vy * sec
    p.vx *= 1 - Math.min(1, sec * 2.5)
    p.vy *= 1 - Math.min(1, sec * 1.2)
    s.particles[n++] = p
  }
  s.particles.length = n
}

export function clamp(v: number, min: number, max: number) {
  return v < min ? min : v > max ? max : v
}
