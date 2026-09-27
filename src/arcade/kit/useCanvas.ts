import { useEffect, useRef, type RefObject } from 'react'

export interface CanvasInfo {
  ctx: CanvasRenderingContext2D | null
  dpr: number
  w: number
  h: number
}

/**
 * Canvas nítido (devicePixelRatio, máx. 2) que ocupa todo su contenedor y se
 * adapta al redimensionar. `onResize` recibe el tamaño en px CSS.
 */
export function useCanvas(
  areaRef: RefObject<HTMLElement | null>,
  canvasRef: RefObject<HTMLCanvasElement | null>,
  onResize: (w: number, h: number) => void,
) {
  const info = useRef<CanvasInfo>({ ctx: null, dpr: 1, w: 0, h: 0 })
  const resizeRef = useRef(onResize)
  resizeRef.current = onResize

  useEffect(() => {
    const area = areaRef.current
    const canvas = canvasRef.current
    if (!area || !canvas) return
    info.current.ctx = canvas.getContext('2d', { alpha: false })
    const fit = () => {
      const w = Math.max(1, area.clientWidth)
      const h = Math.max(1, area.clientHeight)
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      Object.assign(info.current, { dpr, w, h })
      resizeRef.current(w, h)
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(area)
    return () => ro.disconnect()
  }, [areaRef, canvasRef])

  return info
}

/** Coordenadas de un evento relativas a un elemento. */
export function localPoint(el: HTMLElement, e: { clientX: number; clientY: number }) {
  const r = el.getBoundingClientRect()
  return { x: e.clientX - r.left, y: e.clientY - r.top }
}
