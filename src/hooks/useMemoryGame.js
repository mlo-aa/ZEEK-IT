import { useCallback, useEffect, useReducer, useRef } from 'react'
import { GLITCH_ANIMATION_MS, MISMATCH_DELAY_MS, TICK_INTERVAL_MS } from '../lib/constants'
import { createDeck } from '../lib/deck'
import { createInitialState, gameReducer } from '../lib/gameReducer'

export function useMemoryGame(play) {
  const [state, dispatch] = useReducer(gameReducer, undefined, () =>
    createInitialState(createDeck('normal'), 'normal'),
  )
  const { status, locked, selected, attempts, lastResult, remainingMs, glitchCount } = state

  // Cuenta regresiva basada en reloj real: sigue siendo exacta aunque el
  // navegador frene los intervalos (pestaña en segundo plano, batería baja).
  useEffect(() => {
    if (status !== 'playing') return
    const id = setInterval(
      () => dispatch({ type: 'TICK', now: Date.now(), rand: [Math.random(), Math.random()] }),
      TICK_INTERVAL_MS,
    )
    return () => clearInterval(id)
  }, [status])

  // Ocultar una pareja incorrecta. El cleanup cancela el timeout si la
  // partida termina o se reinicia antes de que se cumpla.
  const mismatchPending = status === 'playing' && locked && selected.length === 2
  useEffect(() => {
    if (!mismatchPending) return
    const id = setTimeout(() => dispatch({ type: 'HIDE_MISMATCH' }), MISMATCH_DELAY_MS)
    return () => clearTimeout(id)
  }, [mismatchPending])

  useEffect(() => {
    if (!glitchCount) return
    const id = setTimeout(() => dispatch({ type: 'CLEAR_GLITCH' }), GLITCH_ANIMATION_MS)
    return () => clearTimeout(id)
  }, [glitchCount])

  // Sonidos derivados de cambios de estado.
  const playRef = useRef(play)
  playRef.current = play

  useEffect(() => {
    if (attempts > 0 && lastResult) playRef.current(lastResult)
  }, [attempts, lastResult])

  useEffect(() => {
    if (glitchCount) playRef.current('glitch')
  }, [glitchCount])

  useEffect(() => {
    if (status === 'won') playRef.current('win')
    if (status === 'lost') playRef.current('lose')
  }, [status])

  const secondsLeft = Math.ceil(remainingMs / 1000)
  useEffect(() => {
    if (status === 'playing' && secondsLeft <= 5 && secondsLeft > 0) playRef.current('tick')
  }, [status, secondsLeft])

  const flipCard = useCallback((id) => {
    playRef.current('flip')
    dispatch({ type: 'FLIP', id, now: Date.now() })
  }, [])

  const reset = useCallback((mode) => dispatch({ type: 'RESET', mode, deck: createDeck(mode) }), [])

  return { ...state, secondsLeft, flipCard, reset }
}
