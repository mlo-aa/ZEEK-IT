import { useCallback, useState } from 'react'
import { playSound, unlockAudio } from '../lib/sound'

function readMuted(key, defaultMuted) {
  try {
    const stored = localStorage.getItem(key)
    return stored === null ? defaultMuted : stored === '1'
  } catch {
    return defaultMuted
  }
}

// Cada juego guarda su propia preferencia de sonido.
export function useSound(storageKey = 'zeek-it:muted', defaultMuted = false) {
  const [muted, setMuted] = useState(() => readMuted(storageKey, defaultMuted))

  const toggleMuted = useCallback(() => {
    setMuted((prev) => {
      const next = !prev
      try {
        localStorage.setItem(storageKey, next ? '1' : '0')
      } catch {
        // Modo privado: la preferencia vale solo para esta sesión.
      }
      if (!next) unlockAudio()
      return next
    })
  }, [storageKey])

  const play = useCallback((name) => !muted && playSound(name), [muted])

  return { muted, toggleMuted, play, unlock: unlockAudio }
}
