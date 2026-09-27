import { NEON, PURPLE, drawArcadeBackground, roundRect } from '../../arcade/kit/particles'
import { binHeight, binTop, itemSize, type SortState } from './engine'


export function render(ctx: CanvasRenderingContext2D, s: SortState, dpr: number, clock: number) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  drawArcadeBackground(ctx, s.w, s.h)
  if (s.shake > 0) ctx.translate((Math.random() - 0.5) * s.shake * 12, 0)

  // Contenedores: izquierda verde, derecha morado.
  const top = binTop(s)
  const bh = binHeight(s)
  const dragged = s.items.find((it) => it.dragging)
  const pad = 10
  for (const side of [0, 1] as const) {
    const x = side === 0 ? pad : s.w / 2 + pad / 2
    const w = s.w / 2 - pad * 1.5
    const color = side === 0 ? NEON : PURPLE
    const hover = dragged && dragged.y + itemSize(s) * 0.2 >= top && (side === 0 ? dragged.x < s.w / 2 : dragged.x >= s.w / 2)
    roundRect(ctx, x, top + 4, w, bh - pad - 4, 18)
    ctx.fillStyle = side === 0 ? 'rgba(1,229,118,0.14)' : 'rgba(99,53,237,0.28)'
    ctx.fill()
    ctx.strokeStyle = color
    ctx.globalAlpha = hover ? 0.5 : 0.18
    ctx.lineWidth = hover ? 16 : 10
    ctx.stroke()
    ctx.globalAlpha = 1
    ctx.lineWidth = 3
    ctx.stroke()
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const cx = x + w / 2
    const cy = top + 4 + (bh - pad - 4) / 2
    ctx.font = `${Math.round(bh * 0.28)}px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif`
    ctx.fillStyle = '#ffffff'
    ctx.fillText(s.round.icons[side], cx, cy - bh * 0.14)
    ctx.font = `900 ${Math.round(Math.min(bh * 0.2, w / 7))}px "Archivo Variable", system-ui, sans-serif`
    ctx.fillStyle = '#ffffff'
    ctx.fillText(s.round.categories[side].toUpperCase(), cx, cy + bh * 0.2)
  }

  // Objetos (sin pistas de color: la categoría la decide el jugador).
  const size = itemSize(s)
  for (const it of s.items) {
    const scale = it.dragging ? 1.12 : 1
    const sz = size * scale
    const x = it.x - sz / 2
    const y = it.y - sz / 2
    if (it.dragging) {
      ctx.fillStyle = 'rgba(0,0,0,0.45)'
      roundRect(ctx, x + 6, y + 10, sz, sz, 18)
      ctx.fill()
    }
    roundRect(ctx, x, y, sz, sz, 18)
    ctx.fillStyle = '#0d0822'
    ctx.fill()
    ctx.strokeStyle = '#ffffff'
    ctx.globalAlpha = 0.18 + (it.dragging ? 0.2 : 0.06 * Math.sin(clock / 200 + it.id))
    ctx.lineWidth = 10
    ctx.stroke()
    ctx.globalAlpha = 1
    ctx.lineWidth = 2.5
    ctx.stroke()
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `${Math.round(sz * 0.42)}px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif`
    ctx.fillStyle = '#ffffff'
    ctx.fillText(it.item.icon, it.x, it.y - sz * 0.1)
    ctx.fillStyle = '#ffffff'
    const label = it.item.label
    let fs = Math.round(sz * 0.15)
    ctx.font = `800 ${fs}px "Archivo Variable", system-ui, sans-serif`
    while (ctx.measureText(label).width > sz - 10 && fs > 9) {
      fs -= 1
      ctx.font = `800 ${fs}px "Archivo Variable", system-ui, sans-serif`
    }
    ctx.fillText(label, it.x, it.y + sz * 0.3)
  }

  s.particles.draw(ctx)
  ctx.setTransform(1, 0, 0, 1, 0, 0)
}
