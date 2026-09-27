import { useEffect, useRef } from 'react'

/** Bucle con requestAnimationFrame. `dt` en ms, acotado para evitar saltos. */
export function useFrame(callback: (dt: number) => void, enabled = true) {
  const ref = useRef(callback)
  ref.current = callback
  useEffect(() => {
    if (!enabled) return
    let raf = 0
    let last = performance.now()
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      const dt = Math.min(Math.max(now - last, 0), 100)
      last = now
      ref.current(dt)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [enabled])
}
