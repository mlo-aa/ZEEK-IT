import { drawArcadeBackground } from '../../arcade/kit/particles'
import { GOAL_FLOORS, blockHeight, floorTopY, type StackState } from './engine'

// Color por piso: de verde neón (abajo) a morado (arriba).
function floorColor(floor: number) {
  const t = Math.min(1, floor / GOAL_FLOORS)
  const a = [1, 229, 118]
  const b = [99, 53, 237]
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * t))
  return `rgb(${c[0]},${c[1]},${c[2]})`
}

function drawBlock(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, glow = false) {
  const depth = h * 0.35
  // Cara superior (efecto 3D).
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x + depth, y - depth)
  ctx.lineTo(x + w + depth, y - depth)
  ctx.lineTo(x + w, y)
  ctx.closePath()
  ctx.fillStyle = color
  ctx.globalAlpha = 0.55
  ctx.fill()
  // Lateral derecho.
  ctx.beginPath()
  ctx.moveTo(x + w, y)
  ctx.lineTo(x + w + depth, y - depth)
  ctx.lineTo(x + w + depth, y + h - depth)
  ctx.lineTo(x + w, y + h)
  ctx.closePath()
  ctx.globalAlpha = 0.35
  ctx.fill()
  ctx.globalAlpha = 1
  // Frente.
  if (glow) {
    ctx.strokeStyle = color
    ctx.globalAlpha = 0.35
    ctx.lineWidth = 10
    ctx.strokeRect(x, y, w, h)
    ctx.globalAlpha = 1
  }
  ctx.fillStyle = color
  ctx.fillRect(x, y, w, h)
  ctx.fillStyle = 'rgba(255,255,255,0.25)'
  ctx.fillRect(x, y, w, 3)
}

export function render(ctx: CanvasRenderingContext2D, s: StackState, dpr: number, clock: number) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  drawArcadeBackground(ctx, s.w, s.h, 36)
  const bh = blockHeight(s)

  // Suelo.
  const groundY = floorTopY(s, 0) + bh
  ctx.fillStyle = 'rgba(99,53,237,0.25)'
  ctx.fillRect(0, groundY, s.w, s.h - groundY)
  ctx.fillStyle = '#6335ED'
  ctx.fillRect(0, groundY, s.w, 2)

  // Guías verticales de la cima: ayudan a alinear.
  const top = s.tower[s.tower.length - 1]
  if (s.status === 'playing') {
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'
    ctx.setLineDash([4, 6])
    ctx.lineWidth = 1.5
    ctx.beginPath()
    for (const gx of [top.x, top.x + top.w]) {
      ctx.moveTo(gx, 0)
      ctx.lineTo(gx, floorTopY(s, s.tower.length - 1))
    }
    ctx.stroke()
    ctx.setLineDash([])
  }

  // Torre (la plataforma es el piso 0).
  s.tower.forEach((b, floor) => {
    const y = floorTopY(s, floor)
    if (y > s.h + bh || y < -bh * 2) return
    drawBlock(ctx, b.x, y, b.w, bh, floor === 0 ? '#2a1a66' : floorColor(floor))
  })

  // Bloque en movimiento.
  if (s.status === 'playing') {
    const floor = s.tower.length
    const pulse = 0.8 + Math.sin(clock / 120) * 0.2
    ctx.globalAlpha = pulse
    drawBlock(ctx, s.moving.x, floorTopY(s, floor), s.moving.w, bh, floorColor(floor), true)
    ctx.globalAlpha = 1
  }

  // Pedazos que caen.
  for (const c of s.chunks) {
    const y = floorTopY(s, c.floor) + c.dy
    ctx.save()
    ctx.translate(c.x + c.w / 2, y + bh / 2)
    ctx.rotate(c.rot)
    ctx.globalAlpha = 0.8
    ctx.fillStyle = floorColor(c.floor)
    ctx.fillRect(-c.w / 2, -bh / 2, c.w, bh)
    ctx.restore()
  }
  ctx.globalAlpha = 1

  s.particles.draw(ctx)
  ctx.setTransform(1, 0, 0, 1, 0, 0)
}
