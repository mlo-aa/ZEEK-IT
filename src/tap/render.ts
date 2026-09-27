import { NEON, PURPLE, type Target, type TapState } from './engine'

// Canvas 2D. Brillos con trazos anchos translúcidos (sin shadowBlur, que es
// caro en celulares).

let bgCache: { w: number; h: number; grad: CanvasGradient; glow: CanvasGradient } | null = null

function background(ctx: CanvasRenderingContext2D, w: number, h: number) {
  if (!bgCache || bgCache.w !== w || bgCache.h !== h) {
    const grad = ctx.createLinearGradient(0, 0, 0, h)
    grad.addColorStop(0, '#07021a')
    grad.addColorStop(1, '#000000')
    const glow = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.65)
    glow.addColorStop(0, 'rgba(99,53,237,0.2)')
    glow.addColorStop(1, 'rgba(99,53,237,0)')
    bgCache = { w, h, grad, glow }
  }
  ctx.fillStyle = bgCache.grad
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = bgCache.glow
  ctx.fillRect(0, 0, w, h)
  // Grilla tenue, como en el resto de ZEEK ARCADE.
  ctx.strokeStyle = 'rgba(1,229,118,0.06)'
  ctx.lineWidth = 1
  ctx.beginPath()
  for (let x = 0; x <= w; x += 32) {
    ctx.moveTo(x + 0.5, 0)
    ctx.lineTo(x + 0.5, h)
  }
  for (let y = 0; y <= h; y += 32) {
    ctx.moveTo(0, y + 0.5)
    ctx.lineTo(w, y + 0.5)
  }
  ctx.stroke()
}

export function render(ctx: CanvasRenderingContext2D, s: TapState, dpr: number) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  background(ctx, s.w, s.h)

  if (s.shake > 0) {
    const amp = s.shake * 10
    ctx.translate((Math.random() - 0.5) * amp, (Math.random() - 0.5) * amp)
  }

  for (const t of s.targets) {
    const age = s.elapsed - t.bornAt
    const left = 1 - age / t.ttl
    // Aparece con un pequeño rebote; al final se achica un poco.
    const popIn = age < 180 ? 0.55 + 0.45 * easeOutBack(age / 180) : 1
    const fadeOut = left < 0.2 ? 0.85 + 0.15 * (left / 0.2) : 1
    const scale = popIn * fadeOut
    if (t.kind === 'good') drawGood(ctx, t, scale, left, s.clock)
    else drawBad(ctx, t, scale, left, s.clock)
  }

  for (const p of s.particles) {
    const k = 1 - p.life / p.max
    ctx.globalAlpha = k
    ctx.fillStyle = p.color
    const size = p.size * (0.4 + 0.6 * k)
    ctx.fillRect(p.x - size / 2, p.y - size / 2, size, size)
  }
  ctx.globalAlpha = 1
  ctx.setTransform(1, 0, 0, 1, 0, 0)
}

function ttlRing(ctx: CanvasRenderingContext2D, t: Target, r: number, left: number, color: string) {
  ctx.beginPath()
  ctx.arc(t.x, t.y, r + 7, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0, left))
  ctx.strokeStyle = color
  ctx.lineWidth = 3.5
  ctx.lineCap = 'round'
  ctx.stroke()
}

function drawGood(ctx: CanvasRenderingContext2D, t: Target, scale: number, left: number, clock: number) {
  const r = t.r * scale
  const pulse = 1 + Math.sin(clock / 120 + t.id) * 0.04
  // Halo de neón.
  ctx.beginPath()
  ctx.arc(t.x, t.y, r * pulse, 0, Math.PI * 2)
  ctx.strokeStyle = NEON
  ctx.globalAlpha = 0.25
  ctx.lineWidth = 16
  ctx.stroke()
  ctx.globalAlpha = 1
  ctx.fillStyle = NEON
  ctx.fill()
  // Anillo interior y rayo ⚡ negro.
  ctx.beginPath()
  ctx.arc(t.x, t.y, r * 0.78, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(0,0,0,0.35)'
  ctx.lineWidth = 2
  ctx.stroke()
  const b = r * 0.55
  ctx.beginPath()
  ctx.moveTo(t.x + b * 0.15, t.y - b)
  ctx.lineTo(t.x - b * 0.55, t.y + b * 0.12)
  ctx.lineTo(t.x - b * 0.02, t.y + b * 0.12)
  ctx.lineTo(t.x - b * 0.2, t.y + b)
  ctx.lineTo(t.x + b * 0.55, t.y - b * 0.18)
  ctx.lineTo(t.x + b * 0.02, t.y - b * 0.18)
  ctx.closePath()
  ctx.fillStyle = '#000000'
  ctx.fill()
  ttlRing(ctx, t, r, left, 'rgba(255,255,255,0.85)')
}

function drawBad(ctx: CanvasRenderingContext2D, t: Target, scale: number, left: number, clock: number) {
  const r = t.r * scale
  const rot = Math.sin(clock / 220 + t.id) * 0.25
  // Forma de estrella dentada: se distingue del verde también por la silueta.
  const spikes = 10
  ctx.beginPath()
  for (let i = 0; i < spikes * 2; i++) {
    const rr = i % 2 === 0 ? r : r * 0.82
    const ang = rot + (i * Math.PI) / spikes
    const x = t.x + Math.cos(ang) * rr
    const y = t.y + Math.sin(ang) * rr
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.lineJoin = 'round'
  ctx.strokeStyle = PURPLE
  ctx.globalAlpha = 0.3
  ctx.lineWidth = 14
  ctx.stroke()
  ctx.globalAlpha = 1
  ctx.fillStyle = PURPLE
  ctx.fill()
  // ✕ blanca.
  const k = r * 0.36
  ctx.beginPath()
  ctx.moveTo(t.x - k, t.y - k)
  ctx.lineTo(t.x + k, t.y + k)
  ctx.moveTo(t.x + k, t.y - k)
  ctx.lineTo(t.x - k, t.y + k)
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = Math.max(4, r * 0.17)
  ctx.lineCap = 'round'
  ctx.stroke()
  ttlRing(ctx, t, r, left, 'rgba(138,102,255,0.9)')
}

function easeOutBack(x: number) {
  const c1 = 1.70158
  const c3 = c1 + 1
  const k = Math.min(1, Math.max(0, x)) - 1
  return 1 + c3 * k * k * k + c1 * k * k
}
