import { useCallback, useState } from 'react'

// Estado persistido en localStorage, tolerante a modo privado o storage lleno.
export function useStoredState(key, initial, isValid = () => true) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key)
      if (raw !== null) {
        const parsed = JSON.parse(raw)
        if (isValid(parsed)) return parsed
      }
    } catch {
      // Ignorar y usar el valor inicial.
    }
    return initial
  })

  const update = useCallback(
    (next) => {
      setValue(next)
      try {
        localStorage.setItem(key, JSON.stringify(next))
      } catch {
        // Sin almacenamiento: el valor vale solo para esta sesión.
      }
    },
    [key],
  )

  return [value, update]
}
