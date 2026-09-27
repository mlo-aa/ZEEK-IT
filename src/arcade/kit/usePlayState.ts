import { useCallback, useEffect, useRef, useState } from 'react'
import { useFrame } from './useFrame'

export const COUNTDOWN_MS = 3000
const GO_MS = 650

export interface PlayState {
  /** true cuando el juego debe avanzar (sin cuenta regresiva ni pausa). */
  isRunning: () => boolean
  /** 3, 2, 1… o 0 cuando ya se juega. */
  countdown: number
  showGo: boolean
  paused: boolean
  resume: () => void
  /** Marca la partida como terminada: ya no se pausa ni cuenta. */
  finish: () => void
}

/**
 * Cuenta regresiva 3-2-1 al empezar, pausa automática al cambiar de pestaña o
 * salir de la app, y cuenta regresiva otra vez al continuar. Compartido por
 * todos los juegos de ZEEK ARCADE.
 */
export function usePlayState(play: (sound: string) => void): PlayState {
  const countdownRef = useRef(COUNTDOWN_MS)
  const pausedRef = useRef(false)
  const finishedRef = useRef(false)
  const goRef = useRef(0)
  const playRef = useRef(play)
  playRef.current = play

  const [countdown, setCountdown] = useState(3)
  const [showGo, setShowGo] = useState(false)
  const [paused, setPaused] = useState(false)

  useFrame((dt) => {
    if (pausedRef.current || finishedRef.current) return
    if (goRef.current > 0) {
      goRef.current -= dt
      if (goRef.current <= 0) setShowGo(false)
    }
    if (countdownRef.current <= 0) return
    const before = Math.ceil(countdownRef.current / 1000)
    countdownRef.current = Math.max(0, countdownRef.current - dt)
    const after = Math.ceil(countdownRef.current / 1000)
    if (after !== before) {
      setCountdown(after)
      playRef.current(after > 0 ? 'beep' : 'go')
      if (after === 0) {
        goRef.current = GO_MS
        setShowGo(true)
      }
    }
  })

  const pause = useCallback(() => {
    if (finishedRef.current || pausedRef.current) return
    pausedRef.current = true
    setPaused(true)
    setShowGo(false)
  }, [])

  const resume = useCallback(() => {
    countdownRef.current = COUNTDOWN_MS
    setCountdown(3)
    pausedRef.current = false
    setPaused(false)
  }, [])

  const finish = useCallback(() => {
    finishedRef.current = true
  }, [])

  useEffect(() => {
    playRef.current('beep')
    const onVisibility = () => document.hidden && pause()
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('blur', pause)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('blur', pause)
    }
  }, [pause])

  const isRunning = useCallback(
    () => !pausedRef.current && !finishedRef.current && countdownRef.current <= 0,
    [],
  )

  return { isRunning, countdown, showGo, paused, resume, finish }
}
