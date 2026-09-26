import { useCallback, useEffect, useState } from 'react'

// Fullscreen API con prefijo webkit (Safari en iPad). En iPhone Safari no
// existe para páginas: ahí `supported` es false y el botón no se muestra.
const getElement = () => document.fullscreenElement ?? document.webkitFullscreenElement ?? null

function isSupported() {
  if (typeof document === 'undefined') return false
  return Boolean(document.fullscreenEnabled ?? document.webkitFullscreenEnabled)
}

export function useFullscreen() {
  const [supported] = useState(isSupported)
  const [active, setActive] = useState(() => supported && Boolean(getElement()))

  useEffect(() => {
    if (!supported) return
    const sync = () => setActive(Boolean(getElement()))
    document.addEventListener('fullscreenchange', sync)
    document.addEventListener('webkitfullscreenchange', sync)
    return () => {
      document.removeEventListener('fullscreenchange', sync)
      document.removeEventListener('webkitfullscreenchange', sync)
    }
  }, [supported])

  const toggle = useCallback(async () => {
    try {
      if (getElement()) {
        await (document.exitFullscreen ?? document.webkitExitFullscreen).call(document)
      } else {
        const el = document.documentElement
        await (el.requestFullscreen ?? el.webkitRequestFullscreen).call(el, { navigationUI: 'hide' })
      }
    } catch {
      // El navegador puede rechazarlo (p. ej. sin gesto del usuario): no pasa nada.
    }
  }, [])

  return { supported, active, toggle }
}
