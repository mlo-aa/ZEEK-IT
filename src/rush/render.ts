import { NEON, PURPLE, clamp, isInvulnerable, rocketHeight, type RushState } from './engine'

// Dibujo en Canvas 2D. Sin shadowBlur (caro en celulares): los brillos de
// neón se hacen con un trazo ancho y translúcido debajo de uno fino.

interface Cache {
  w: number
  h: number
  bg: CanvasGradient
  glowA: CanvasGradient
  glowB: CanvasGradient
}

let cache: Cache | null = null

function getCache(ctx: CanvasRenderingContext2D, w: number, h: number): Cache {
  if (cache && cache.w === w && cache.h === h) return cache
  const bg = ctx.createLinearGradient(0, 0, 0, h)
  bg.addColorStop(0, '#07021a')
  bg.addColorStop(1, '#000000')
  const glowA = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(w, h) * 0.7)
  glowA.addColorStop(0, 'rgba(99,53,237,0.28)')
  glowA.addColorStop(1, 'rgba(99,53,237,0)')
  const glowB = ctx.createRadialGradient(w, h, 0, w, h, Math.max(w, h) * 0.6)
  glowB.addColorStop(0, 'rgba(1,229,118,0.14)')
  glowB.addColorStop(1, 'rgba(1,229,118,0)')
  cache = { w, h, bg, glowA, glowB }
  return cache
}

const BG_COLORS = ['rgba(255,255,255,0.35)', 'rgba(255,255,255,0.6)', 'rgba(190,255,225,0.95)']

export function render(ctx: CanvasRenderingContext2D, s: RushState, dpr: number) {
  const { w, h } = s
  const c = getCache(ctx, w, h)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  ctx.fillStyle = c.bg
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = c.glowA
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = c.glowB
  ctx.fillRect(0, 0, w, h)

  // Estrellas de fondo en 3 capas (parallax): las cercanas se estiran con la velocidad.
  for (const b of s.bg) {
    ctx.fillStyle = BG_COLORS[b.layer]
    const len = b.layer === 2 ? b.size * 3 : b.size
    ctx.fillRect(b.x, b.y, b.size, len)
  }

  if (s.shake > 0) {
    const amp = s.shake * s.rw * 0.18
    ctx.translate((Math.random() - 0.5) * amp, (Math.random() - 0.5) * amp)
  }

  for (const st of s.starItems) drawStar(ctx, st.x, st.y, st.r, s.clock)
  for (const a of s.asteroids) drawAsteroid(ctx, a.x, a.y, a.r, a.rot, a.shape, a.color ? PURPLE : NEON)

  // Partículas (estela, destellos, choques).
  for (const p of s.particles) {
    const k = 1 - p.life / p.max
    ctx.globalAlpha = k
    ctx.fillStyle = p.color
    const size = p.size * (0.4 + k * 0.6)
    ctx.fillRect(p.x - size / 2, p.y - size / 2, size, size)
  }
  ctx.globalAlpha = 1

  if (s.status !== 'lost') {
    const blink = isInvulnerable(s) && Math.floor(s.clock / 90) % 2 === 0
    const tilt = clamp(s.rocket.vx / (s.rw * 11), -1, 1) * 0.28
    drawRocket(ctx, s.rocket.x, s.rocket.y, s.rw, tilt, s.clock, blink ? 0.25 : 1, s.countdown > 0 ? 0.7 : 1)
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0)
}

function drawAsteroid(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  rot: number,
  shape: number[],
  color: string,
) {
  const n = shape.length
  ctx.beginPath()
  for (let i = 0; i < n; i++) {
    const ang = rot + (i / n) * Math.PI * 2
    const rr = r * shape[i]
    const px = x + Math.cos(ang) * rr
    const py = y + Math.sin(ang) * rr
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
  ctx.fillStyle = 'rgba(6,4,18,0.92)'
  ctx.fill()
  ctx.lineJoin = 'round'
  ctx.strokeStyle = color
  ctx.globalAlpha = 0.22
  ctx.lineWidth = 7
  ctx.stroke()
  ctx.globalAlpha = 1
  ctx.lineWidth = 2.4
  ctx.stroke()
  // Cráter: detalle mínimo para que se lea como roca.
  ctx.beginPath()
  ctx.arc(x + Math.cos(rot) * r * 0.3, y + Math.sin(rot) * r * 0.3, r * 0.18, 0, Math.PI * 2)
  ctx.globalAlpha = 0.55
  ctx.lineWidth = 1.6
  ctx.stroke()
  ctx.globalAlpha = 1
}

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, clock: number) {
  const pulse = 1 + Math.sin(clock / 160) * 0.12
  const rot = clock / 900
  const outer = r * pulse
  const inner = outer * 0.45
  ctx.beginPath()
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 === 0 ? outer : inner
    const ang = rot - Math.PI / 2 + (i * Math.PI) / 5
    const px = x + Math.cos(ang) * rr
    const py = y + Math.sin(ang) * rr
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
  // Halo
  ctx.lineJoin = 'round'
  ctx.strokeStyle = NEON
  ctx.globalAlpha = 0.3
  ctx.lineWidth = 8
  ctx.stroke()
  ctx.globalAlpha = 1
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.lineWidth = 2
  ctx.stroke()
}

export function drawRocket(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rw: number,
  tilt: number,
  clock: number,
  alpha = 1,
  flameScale = 1,
) {
  const rh = rocketHeight(rw)
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(tilt)
  ctx.globalAlpha = alpha

  // Llama: parpadea verde → blanco.
  const flicker = 0.85 + Math.sin(clock / 45) * 0.1 + Math.sin(clock / 23) * 0.05
  const fl = rh * 0.42 * flicker * flameScale
  ctx.beginPath()
  ctx.moveTo(-rw * 0.2, rh * 0.36)
  ctx.quadraticCurveTo(0, rh * 0.36 + fl * 1.1, rw * 0.2, rh * 0.36)
  ctx.closePath()
  ctx.fillStyle = NEON
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(-rw * 0.1, rh * 0.36)
  ctx.quadraticCurveTo(0, rh * 0.36 + fl * 0.65, rw * 0.1, rh * 0.36)
  ctx.closePath()
  ctx.fillStyle = '#ffffff'
  ctx.fill()

  // Aletas moradas.
  ctx.fillStyle = PURPLE
  for (const side of [-1, 1]) {
    ctx.beginPath()
    ctx.moveTo(side * rw * 0.2, rh * 0.02)
    ctx.lineTo(side * rw * 0.5, rh * 0.3)
    ctx.lineTo(side * rw * 0.46, rh * 0.42)
    ctx.lineTo(side * rw * 0.18, rh * 0.32)
    ctx.closePath()
    ctx.fill()
  }

  // Fuselaje blanco.
  ctx.beginPath()
  ctx.moveTo(0, -rh * 0.5)
  ctx.bezierCurveTo(rw * 0.3, -rh * 0.32, rw * 0.3, rh * 0.05, rw * 0.22, rh * 0.38)
  ctx.lineTo(-rw * 0.22, rh * 0.38)
  ctx.bezierCurveTo(-rw * 0.3, rh * 0.05, -rw * 0.3, -rh * 0.32, 0, -rh * 0.5)
  ctx.closePath()
  ctx.fillStyle = '#ffffff'
  ctx.fill()

  // Punta verde neón (recorte del fuselaje).
  ctx.save()
  ctx.clip()
  ctx.fillStyle = NEON
  ctx.fillRect(-rw * 0.4, -rh * 0.55, rw * 0.8, rh * 0.25)
  ctx.fillStyle = '#000000'
  ctx.fillRect(-rw * 0.4, rh * 0.2, rw * 0.8, rh * 0.05)
  ctx.restore()

  // Ventana morada con brillo.
  ctx.beginPath()
  ctx.arc(0, -rh * 0.06, rw * 0.13, 0, Math.PI * 2)
  ctx.fillStyle = PURPLE
  ctx.fill()
  ctx.lineWidth = rw * 0.045
  ctx.strokeStyle = '#000000'
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(-rw * 0.04, -rh * 0.09, rw * 0.04, 0, Math.PI * 2)
  ctx.fillStyle = '#ffffff'
  ctx.fill()

  ctx.restore()
}
