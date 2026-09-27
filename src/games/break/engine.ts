import { Particles, NEON, PURPLE, type Rng } from '../../arcade/kit/particles'

// Motor de ZEEK BREAK (sin DOM).

export const GAME_DURATION_MS = 60_000
export const START_LIVES = 3
export const COLS = 5
export const ROWS = 4
/** Ángulo máximo de rebote en la paleta (desde la vertical). */
const MAX_BOUNCE = (60 * Math.PI) / 180
/** Nunca exactamente vertical: evita quedar rebotando en el mismo lugar. */
const MIN_BOUNCE = (9 * Math.PI) / 180
/** Nunca casi horizontal: evita rebotes eternos de pared a pared. */
const MIN_VY_RATIO = 0.3

export type Status = 'playing' | 'won' | 'lost'

export interface Brick {
  x: number
  y: number
  w: number
  h: number
  /** 'green' = 1 golpe; 'purple' = 2 golpes. */
  kind: 'green' | 'purple'
  hp: number
  hitAt: number
}

export interface BreakEvent {
  id: number
  type: 'bounce' | 'hit' | 'break' | 'lose' | 'launch'
  x: number
  y: number
  points?: number
}

export interface BreakState {
  w: number
  h: number
  status: Status
  elapsed: number
  lives: number
  score: number
  bricks: Brick[]
  paddle: { x: number; w: number; h: number; y: number }
  ball: { x: number; y: number; vx: number; vy: number; r: number }
  /** Pelota apoyada en la paleta esperando el lanzamiento. */
  stuck: boolean
  speed: number
  particles: Particles
  events: BreakEvent[]
  seq: number
  rng: Rng
}

export const baseSpeed = (h: number) => Math.max(380, Math.min(760, h * 0.82))
export const maxSpeed = (h: number) => baseSpeed(h) * 1.45
export const bricksLeft = (s: BreakState) => s.bricks.filter((b) => b.hp > 0).length
export const timeLeftMs = (s: BreakState) => Math.max(0, GAME_DURATION_MS - s.elapsed)

function layoutBricks(w: number, h: number): Brick[] {
  const pad = Math.max(12, w * 0.04)
  const gap = Math.max(6, w * 0.015)
  const bw = (Math.min(w, 720) - 2 * pad - (COLS - 1) * gap) / COLS
  const left = (w - (bw * COLS + gap * (COLS - 1))) / 2
  const bh = Math.max(18, Math.min(30, h * 0.038))
  const top = Math.max(40, h * 0.15)
  const bricks: Brick[] = []
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      // Fila de arriba morada (2 golpes); el resto, verdes.
      const purple = r === 0
      bricks.push({ x: left + c * (bw + gap), y: top + r * (bh + gap), w: bw, h: bh, kind: purple ? 'purple' : 'green', hp: purple ? 2 : 1, hitAt: -1e9 })
    }
  }
  return bricks
}

export function createBreakState(w: number, h: number, rng: Rng = Math.random): BreakState {
  const pw = Math.max(84, Math.min(170, w * 0.26))
  const r = Math.max(7, Math.min(11, Math.min(w, h) * 0.02))
  const s: BreakState = {
    w,
    h,
    status: 'playing',
    elapsed: 0,
    lives: START_LIVES,
    score: 0,
    bricks: layoutBricks(w, h),
    paddle: { x: w / 2, w: pw, h: 14, y: h - Math.max(46, h * 0.08) },
    ball: { x: w / 2, y: 0, vx: 0, vy: 0, r },
    stuck: true,
    speed: baseSpeed(h),
    particles: new Particles(rng),
    events: [],
    seq: 0,
    rng,
  }
  placeOnPaddle(s)
  return s
}

export function resizeBreak(s: BreakState, w: number, h: number) {
  const fx = w / s.w
  const fy = h / s.h
  const old = s.bricks
  s.bricks = layoutBricks(w, h).map((b, i) => ({ ...b, hp: old[i].hp, hitAt: old[i].hitAt }))
  s.paddle.x *= fx
  s.paddle.w = Math.max(84, Math.min(170, w * 0.26))
  s.paddle.y = h - Math.max(46, h * 0.08)
  s.ball.x *= fx
  s.ball.y *= fy
  s.speed = (s.speed / baseSpeed(s.h)) * baseSpeed(h)
  s.w = w
  s.h = h
  if (s.stuck) placeOnPaddle(s)
}

function placeOnPaddle(s: BreakState) {
  s.ball.x = s.paddle.x
  s.ball.y = s.paddle.y - s.ball.r - 1
  s.ball.vx = 0
  s.ball.vy = 0
}

export function movePaddleTo(s: BreakState, x: number) {
  const half = s.paddle.w / 2
  s.paddle.x = Math.max(half, Math.min(s.w - half, x))
  if (s.stuck) placeOnPaddle(s)
}

/** Lanza la pelota (toque, clic o barra espaciadora). */
export function launch(s: BreakState) {
  if (!s.stuck || s.status !== 'playing') return false
  s.stuck = false
  const ang = (s.rng() * 2 - 1) * (25 * Math.PI) / 180
  setVelocity(s, ang === 0 ? MIN_BOUNCE : ang)
  s.events.push({ id: ++s.seq, type: 'launch', x: s.ball.x, y: s.ball.y })
  return true
}

/** Velocidad a partir de un ángulo desde la vertical (hacia arriba). */
function setVelocity(s: BreakState, angle: number) {
  s.ball.vx = s.speed * Math.sin(angle)
  s.ball.vy = -s.speed * Math.cos(angle)
}

/** Corrige trayectorias casi horizontales y mantiene la rapidez actual. */
function normalize(s: BreakState) {
  const b = s.ball
  const minVy = s.speed * MIN_VY_RATIO
  if (Math.abs(b.vy) < minVy) b.vy = (b.vy < 0 ? -1 : 1) * minVy
  const k = s.speed / Math.hypot(b.vx, b.vy)
  b.vx *= k
  b.vy *= k
}

export function step(s: BreakState, dtMs: number, paddleDir: -1 | 0 | 1 = 0) {
  const dt = Math.min(dtMs, 50)
  const sec = dt / 1000
  s.particles.update(sec, 500)
  if (s.status !== 'playing') return
  s.elapsed += dt
  if (s.elapsed >= GAME_DURATION_MS) {
    s.elapsed = GAME_DURATION_MS
    s.status = 'lost'
    return
  }
  if (paddleDir) movePaddleTo(s, s.paddle.x + paddleDir * s.w * 1.3 * sec)
  if (s.stuck) return

  // Pasos cortos: la pelota nunca avanza más de medio radio por paso,
  // así no atraviesa bloques ni paredes.
  const b = s.ball
  const dist = Math.hypot(b.vx, b.vy) * sec
  const steps = Math.max(1, Math.ceil(dist / (b.r * 0.5)))
  for (let i = 0; i < steps && !s.stuck && s.status === 'playing'; i++) substep(s, sec / steps)
}

function substep(s: BreakState, sec: number) {
  const b = s.ball
  b.x += b.vx * sec
  b.y += b.vy * sec

  // Paredes.
  if (b.x - b.r < 0) {
    b.x = b.r
    b.vx = Math.abs(b.vx)
    bounce(s)
  } else if (b.x + b.r > s.w) {
    b.x = s.w - b.r
    b.vx = -Math.abs(b.vx)
    bounce(s)
  }
  if (b.y - b.r < 0) {
    b.y = b.r
    b.vy = Math.abs(b.vy)
    bounce(s)
  }

  // Paleta: el punto de impacto define el ángulo.
  const p = s.paddle
  if (b.vy > 0 && b.y + b.r >= p.y && b.y - b.r <= p.y + p.h && b.x >= p.x - p.w / 2 - b.r && b.x <= p.x + p.w / 2 + b.r) {
    const rel = Math.max(-1, Math.min(1, (b.x - p.x) / (p.w / 2)))
    let ang = rel * MAX_BOUNCE
    if (Math.abs(ang) < MIN_BOUNCE) ang = (ang < 0 || (ang === 0 && s.rng() < 0.5) ? -1 : 1) * MIN_BOUNCE
    b.y = p.y - b.r
    setVelocity(s, ang)
    s.events.push({ id: ++s.seq, type: 'bounce', x: b.x, y: b.y })
  }

  // Cayó por debajo de la paleta: se pierde una vida.
  if (b.y - b.r > s.h) {
    s.lives -= 1
    s.events.push({ id: ++s.seq, type: 'lose', x: b.x, y: s.h })
    if (s.lives <= 0) {
      s.lives = 0
      s.status = 'lost'
      return
    }
    s.stuck = true
    placeOnPaddle(s)
    return
  }

  // Bloques: como máximo uno por paso.
  for (const br of s.bricks) {
    if (br.hp <= 0) continue
    const cx = Math.max(br.x, Math.min(b.x, br.x + br.w))
    const cy = Math.max(br.y, Math.min(b.y, br.y + br.h))
    const dx = b.x - cx
    const dy = b.y - cy
    if (dx * dx + dy * dy > b.r * b.r) continue
    // Rebote según el lado por el que entró (menor penetración).
    const overlapX = Math.min(b.x + b.r - br.x, br.x + br.w - (b.x - b.r))
    const overlapY = Math.min(b.y + b.r - br.y, br.y + br.h - (b.y - b.r))
    if (overlapX < overlapY) {
      b.vx = b.x < br.x + br.w / 2 ? -Math.abs(b.vx) : Math.abs(b.vx)
      b.x += b.vx < 0 ? -overlapX : overlapX
    } else {
      b.vy = b.y < br.y + br.h / 2 ? -Math.abs(b.vy) : Math.abs(b.vy)
      b.y += b.vy < 0 ? -overlapY : overlapY
    }
    hitBrick(s, br)
    normalize(s)
    break
  }
}

function bounce(s: BreakState) {
  normalize(s)
  s.events.push({ id: ++s.seq, type: 'bounce', x: s.ball.x, y: s.ball.y })
}

function hitBrick(s: BreakState, br: Brick) {
  br.hp -= 1
  br.hitAt = s.elapsed
  const cx = br.x + br.w / 2
  const cy = br.y + br.h / 2
  if (br.hp > 0) {
    s.particles.burst(cx, cy, [PURPLE, '#ffffff'], 8, br.w * 1.5)
    s.events.push({ id: ++s.seq, type: 'hit', x: cx, y: cy })
    return
  }
  const points = br.kind === 'purple' ? 20 : 10
  s.score += points
  s.particles.burst(cx, cy, br.kind === 'purple' ? [PURPLE, '#8A66FF', '#ffffff'] : [NEON, '#ffffff', '#b7ffd9'], 22, br.w * 3)
  s.events.push({ id: ++s.seq, type: 'break', x: cx, y: cy, points })
  // La pelota se acelera un poco con cada bloque destruido.
  s.speed = Math.min(maxSpeed(s.h), s.speed * 1.035)
  if (bricksLeft(s) === 0) s.status = 'won'
}
