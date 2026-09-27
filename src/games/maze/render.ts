import { NEON, PURPLE, drawArcadeBackground, roundRect } from '../../arcade/kit/particles'
import { BALL_R, TRAP_R, isInvulnerable, isWall, type MazeState } from './engine'

export interface Layout {
  cell: number
  ox: number
  oy: number
}

/** Tamaño de celda y margen para centrar el laberinto en el área. */
export function layoutFor(s: MazeState, w: number, h: number): Layout {
  const cell = Math.floor(Math.min((w - 16) / s.cols, (h - 16) / s.rows))
  return { cell, ox: Math.round((w - cell * s.cols) / 2), oy: Math.round((h - cell * s.rows) / 2) }
}

/** `portal`: 0..1, avance de la animación de entrada al portal al ganar. */
export function render(
  ctx: CanvasRenderingContext2D,
  s: MazeState,
  dpr: number,
  w: number,
  h: number,
  clock: number,
  trail: { x: number; y: number }[],
  portal: number,
) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  drawArcadeBackground(ctx, w, h, 0)
  const { cell, ox, oy } = layoutFor(s, w, h)
  const X = (x: number) => ox + x * cell
  const Y = (y: number) => oy + y * cell

  // Piso del laberinto.
  roundRect(ctx, ox, oy, cell * s.cols, cell * s.rows, 10)
  ctx.fillStyle = '#05020f'
  ctx.fill()

  // Paredes: bloques morados con borde de neón.
  for (let r = 0; r < s.rows; r++) {
    for (let c = 0; c < s.cols; c++) {
      if (!isWall(s, r, c)) continue
      ctx.fillStyle = '#1b0f4d'
      ctx.fillRect(X(c), Y(r), cell + 0.5, cell + 0.5)
    }
  }
  ctx.strokeStyle = PURPLE
  ctx.lineWidth = 2
  ctx.beginPath()
  for (let r = 0; r < s.rows; r++) {
    for (let c = 0; c < s.cols; c++) {
      if (!isWall(s, r, c)) continue
      // Solo los bordes que dan a un pasillo.
      if (!isWall(s, r - 1, c) && r > 0) (ctx.moveTo(X(c), Y(r)), ctx.lineTo(X(c + 1), Y(r)))
      if (!isWall(s, r + 1, c) && r < s.rows - 1) (ctx.moveTo(X(c), Y(r + 1)), ctx.lineTo(X(c + 1), Y(r + 1)))
      if (!isWall(s, r, c - 1) && c > 0) (ctx.moveTo(X(c), Y(r)), ctx.lineTo(X(c), Y(r + 1)))
      if (!isWall(s, r, c + 1) && c < s.cols - 1) (ctx.moveTo(X(c + 1), Y(r)), ctx.lineTo(X(c + 1), Y(r + 1)))
    }
  }
  ctx.globalAlpha = 0.35
  ctx.lineWidth = 7
  ctx.stroke()
  ctx.globalAlpha = 1
  ctx.lineWidth = 2
  ctx.stroke()

  // Portal de salida.
  const px = X(s.exit.x)
  const py = Y(s.exit.y)
  for (let i = 0; i < 3; i++) {
    ctx.beginPath()
    ctx.ellipse(px, py, cell * (0.42 - i * 0.1), cell * (0.42 - i * 0.1), clock / (300 - i * 60), 0.3, Math.PI * 1.6)
    ctx.strokeStyle = i === 1 ? '#ffffff' : '#8A66FF'
    ctx.lineWidth = 3
    ctx.stroke()
  }
  ctx.beginPath()
  ctx.arc(px, py, cell * 0.12 * (1 + Math.sin(clock / 150) * 0.2), 0, Math.PI * 2)
  ctx.fillStyle = '#ffffff'
  ctx.fill()

  // Trampas: estrellas giratorias.
  for (const t of s.traps) {
    const tx = X(t.x)
    const ty = Y(t.y)
    const rr = TRAP_R * cell
    ctx.beginPath()
    for (let i = 0; i < 16; i++) {
      const rad = i % 2 === 0 ? rr * 1.15 : rr * 0.6
      const a = clock / 180 + (i * Math.PI) / 8
      const x = tx + Math.cos(a) * rad
      const y = ty + Math.sin(a) * rad
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.fillStyle = '#ffffff'
    ctx.strokeStyle = PURPLE
    ctx.globalAlpha = 0.5
    ctx.lineWidth = 8
    ctx.stroke()
    ctx.globalAlpha = 1
    ctx.fill()
    ctx.beginPath()
    ctx.arc(tx, ty, rr * 0.35, 0, Math.PI * 2)
    ctx.fillStyle = PURPLE
    ctx.fill()
  }

  // Estela y esfera.
  trail.forEach((p, i) => {
    ctx.globalAlpha = (i / trail.length) * 0.35
    ctx.beginPath()
    ctx.arc(X(p.x), Y(p.y), BALL_R * cell * (i / trail.length), 0, Math.PI * 2)
    ctx.fillStyle = NEON
    ctx.fill()
  })
  ctx.globalAlpha = 1
  let bx = X(s.ball.x)
  let by = Y(s.ball.y)
  let scale = 1
  if (s.status === 'won') {
    // Animación de portal: la esfera gira hacia el centro y se achica.
    const k = portal
    const ang = k * Math.PI * 3
    bx = px + (bx - px) * (1 - k) + Math.cos(ang) * cell * 0.2 * (1 - k)
    by = py + (by - py) * (1 - k) + Math.sin(ang) * cell * 0.2 * (1 - k)
    scale = 1 - k
  }
  const blink = isInvulnerable(s) && Math.floor(clock / 90) % 2 === 0
  if (s.status !== 'lost' && scale > 0.02) {
    ctx.globalAlpha = blink ? 0.3 : 1
    ctx.beginPath()
    ctx.arc(bx, by, BALL_R * cell * scale * 1.6, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(1,229,118,0.25)'
    ctx.fill()
    ctx.beginPath()
    ctx.arc(bx, by, BALL_R * cell * scale, 0, Math.PI * 2)
    ctx.fillStyle = NEON
    ctx.fill()
    ctx.beginPath()
    ctx.arc(bx - BALL_R * cell * 0.3 * scale, by - BALL_R * cell * 0.3 * scale, BALL_R * cell * 0.3 * scale, 0, Math.PI * 2)
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    ctx.globalAlpha = 1
  }

  // Partículas (en celdas → px).
  for (const p of s.particles.list) {
    const k = 1 - p.life / p.max
    ctx.globalAlpha = k
    ctx.fillStyle = p.color
    const size = p.size * (0.4 + 0.6 * k)
    ctx.fillRect(X(p.x) - size / 2, Y(p.y) - size / 2, size, size)
  }
  ctx.globalAlpha = 1
  ctx.setTransform(1, 0, 0, 1, 0, 0)
}
