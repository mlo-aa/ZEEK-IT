import { useCallback, useState } from 'react'
import { playSound, unlockAudio } from '../lib/sound'

const STORAGE_KEY = 'zeek-it:muted'

function readMuted() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function useSound() {
  const [muted, setMuted] = useState(readMuted)

  const toggleMuted = useCallback(() => {
    setMuted((prev) => {
      const next = !prev
      try {
        localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
      } catch {
        // Modo privado: la preferencia vale solo para esta sesión.
      }
      if (!next) unlockAudio()
      return next
    })
  }, [])

  const play = useCallback((name) => !muted && playSound(name), [muted])

  return { muted, toggleMuted, play, unlock: unlockAudio }
}
