// Partículas simples y baratas (sin crear objetos por frame más allá de las
// explosiones). Compartidas por los juegos de canvas.

export type Rng = () => number

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

export class Particles {
  list: Particle[] = []
  constructor(
    private rng: Rng = Math.random,
    private maxCount = 300,
  ) {}

  burst(x: number, y: number, colors: string[], n: number, speed: number, gravity = 0) {
    for (let i = 0; i < n; i++) {
      const ang = this.rng() * Math.PI * 2
      const sp = speed * (0.35 + this.rng() * 0.8)
      if (this.list.length >= this.maxCount) this.list.shift()
      this.list.push({
        x,
        y,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp - gravity * 0.3,
        life: 0,
        max: 350 + this.rng() * 400,
        size: 2.5 + this.rng() * 3.5,
        color: colors[i % colors.length],
      })
    }
  }

  update(sec: number, gravity = 0) {
    let n = 0
    for (const p of this.list) {
      p.life += sec * 1000
      if (p.life >= p.max) continue
      p.x += p.vx * sec
      p.y += p.vy * sec
      p.vx *= 1 - Math.min(1, sec * 3)
      p.vy = p.vy * (1 - Math.min(1, sec * 3)) + gravity * sec
      this.list[n++] = p
    }
    this.list.length = n
  }

  draw(ctx: CanvasRenderingContext2D, offsetY = 0) {
    for (const p of this.list) {
      const k = 1 - p.life / p.max
      ctx.globalAlpha = k
      ctx.fillStyle = p.color
      const size = p.size * (0.4 + 0.6 * k)
      ctx.fillRect(p.x - size / 2, p.y - size / 2 + offsetY, size, size)
    }
    ctx.globalAlpha = 1
  }
}

export const NEON = '#01E576'
export const PURPLE = '#6335ED'
export const PURPLE_LIGHT = '#8A66FF'

/** Fondo común: degradado, brillo morado y grilla tenue. */
export function drawArcadeBackground(ctx: CanvasRenderingContext2D, w: number, h: number, grid = 32) {
  const g = ctx.createLinearGradient(0, 0, 0, h)
  g.addColorStop(0, '#07021a')
  g.addColorStop(1, '#000000')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
  const glow = ctx.createRadialGradient(w / 2, h * 0.4, 0, w / 2, h * 0.4, Math.max(w, h) * 0.7)
  glow.addColorStop(0, 'rgba(99,53,237,0.18)')
  glow.addColorStop(1, 'rgba(99,53,237,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, w, h)
  if (grid > 0) {
    ctx.strokeStyle = 'rgba(1,229,118,0.05)'
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let x = 0; x <= w; x += grid) {
      ctx.moveTo(x + 0.5, 0)
      ctx.lineTo(x + 0.5, h)
    }
    for (let y = 0; y <= h; y += grid) {
      ctx.moveTo(0, y + 0.5)
      ctx.lineTo(w, y + 0.5)
    }
    ctx.stroke()
  }
}

/** Mulberry32: azar con semilla, para tests reproducibles. */
export function seeded(seed: number): Rng {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Rectángulo redondeado (compatible con Safari viejos, sin ctx.roundRect). */
export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2))
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}
