import { useRef } from 'react'

/**
 * Llama a `onFinish` una sola vez, tras una breve pausa para ver el último
 * frame. Seguro aunque el final ocurra dentro de un evento táctil o del bucle.
 */
export function useFinish<R>(onFinish: (r: R) => void, stop: () => void, delayMs = 650) {
  const done = useRef(false)
  const cb = useRef(onFinish)
  cb.current = onFinish
  return (result: R, sound?: () => void) => {
    if (done.current) return
    done.current = true
    stop()
    sound?.()
    window.setTimeout(() => cb.current(result), delayMs)
  }
}
