import { NEON, PURPLE, drawArcadeBackground, roundRect } from '../../arcade/kit/particles'
import type { BreakState } from './engine'

/** `ox`: margen del campo centrado; `fullW`: ancho total del canvas. */
export function render(
  ctx: CanvasRenderingContext2D,
  s: BreakState,
  dpr: number,
  clock: number,
  trail: { x: number; y: number }[],
  ox = 0,
  fullW = s.w,
) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  drawArcadeBackground(ctx, fullW, s.h, 40)
  if (ox > 0) {
    // Paredes laterales del campo.
    ctx.fillStyle = 'rgba(0,0,0,0.55)'
    ctx.fillRect(0, 0, ox, s.h)
    ctx.fillRect(ox + s.w, 0, fullW - ox - s.w, s.h)
    ctx.fillStyle = PURPLE
    ctx.fillRect(ox - 3, 0, 3, s.h)
    ctx.fillRect(ox + s.w, 0, 3, s.h)
  }
  ctx.translate(ox, 0)

  // Bloques.
  for (const b of s.bricks) {
    if (b.hp <= 0) continue
    const flash = s.elapsed - b.hitAt < 120
    const color = b.kind === 'purple' ? PURPLE : NEON
    roundRect(ctx, b.x, b.y, b.w, b.h, 6)
    ctx.strokeStyle = color
    ctx.globalAlpha = 0.3
    ctx.lineWidth = 8
    ctx.stroke()
    ctx.globalAlpha = b.kind === 'purple' && b.hp === 1 ? 0.6 : 1
    ctx.fillStyle = flash ? '#ffffff' : color
    ctx.fill()
    ctx.globalAlpha = 1
    // Brillo superior.
    ctx.fillStyle = 'rgba(255,255,255,0.25)'
    ctx.fillRect(b.x + 5, b.y + 3, b.w - 10, 3)
    // Morado dañado: grietas visibles.
    if (b.kind === 'purple' && b.hp === 1) {
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.beginPath()
      const cx = b.x + b.w * 0.45
      ctx.moveTo(cx, b.y + 2)
      ctx.lineTo(cx - b.w * 0.08, b.y + b.h * 0.45)
      ctx.lineTo(cx + b.w * 0.06, b.y + b.h * 0.6)
      ctx.lineTo(cx - b.w * 0.02, b.y + b.h - 2)
      ctx.moveTo(cx - b.w * 0.08, b.y + b.h * 0.45)
      ctx.lineTo(cx - b.w * 0.25, b.y + b.h * 0.3)
      ctx.moveTo(cx + b.w * 0.06, b.y + b.h * 0.6)
      ctx.lineTo(cx + b.w * 0.24, b.y + b.h * 0.72)
      ctx.stroke()
    }
  }

  // Paleta con degradado verde → morado.
  const p = s.paddle
  const px = p.x - p.w / 2
  const grad = ctx.createLinearGradient(px, 0, px + p.w, 0)
  grad.addColorStop(0, NEON)
  grad.addColorStop(1, PURPLE)
  roundRect(ctx, px, p.y, p.w, p.h, p.h / 2)
  ctx.strokeStyle = grad
  ctx.globalAlpha = 0.35
  ctx.lineWidth = 12
  ctx.stroke()
  ctx.globalAlpha = 1
  ctx.fillStyle = grad
  ctx.fill()

  // Estela y pelota.
  const b = s.ball
  trail.forEach((t, i) => {
    ctx.globalAlpha = (i / trail.length) * 0.4
    ctx.beginPath()
    ctx.arc(t.x, t.y, b.r * (0.4 + (0.6 * i) / trail.length), 0, Math.PI * 2)
    ctx.fillStyle = NEON
    ctx.fill()
  })
  ctx.globalAlpha = 1
  if (s.status !== 'lost') {
    ctx.beginPath()
    ctx.arc(b.x, b.y, b.r * 2, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(1,229,118,0.22)'
    ctx.fill()
    ctx.beginPath()
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
    ctx.fillStyle = '#ffffff'
    ctx.fill()
  }

  if (s.stuck && s.status === 'playing') {
    ctx.globalAlpha = 0.6 + Math.sin(clock / 200) * 0.4
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'center'
    ctx.font = '800 16px "Archivo Variable", system-ui, sans-serif'
    ctx.fillText('Tocá para lanzar', s.w / 2, p.y - 40)
    ctx.globalAlpha = 1
  }

  s.particles.draw(ctx)
  ctx.setTransform(1, 0, 0, 1, 0, 0)
}
