import { useEffect, useRef, useState } from 'react'
import type { PlayProps } from '../../arcade/kit/GameApp'
import { Hearts, HudTimer } from '../../arcade/kit/Hud'
import PlayLayout from '../../arcade/kit/PlayLayout'
import { exposeForTests } from '../../arcade/kit/testHook'
import { useCanvas } from '../../arcade/kit/useCanvas'
import { useFinish } from '../../arcade/kit/useFinish'
import { useFrame } from '../../arcade/kit/useFrame'
import { usePlayState } from '../../arcade/kit/usePlayState'
import { GAME_DURATION_MS, KEY_SPEED, START_LIVES, createMazeState, step, timeLeftMs, type MazeState } from './engine'
import { MAZES } from './mazes'
import { layoutFor, render } from './render'

export interface MazeResult {
  won: boolean
  lives: number
  remainingMs: number
  elapsedMs: number
}

const KEYS: Record<string, [number, number]> = {
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  w: [0, -1],
  s: [0, 1],
  a: [-1, 0],
  d: [1, 0],
}

export default function MazePlay({ muted, onToggleMute, play, onFinish }: PlayProps<MazeResult>) {
  const areaRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<MazeState>(createMazeState(MAZES, Math.floor(Math.random() * MAZES.length)))
  const drag = useRef({ id: -1, x: 0, y: 0, dx: 0, dy: 0 })
  const keys = useRef(new Set<string>())
  const trail = useRef<{ x: number; y: number }[]>([])
  const clock = useRef(0)
  const portal = useRef(0)
  const ctrl = usePlayState(play)
  const end = useFinish(onFinish, ctrl.finish, 1100)
  const [hud, setHud] = useState({ lives: START_LIVES, seconds: GAME_DURATION_MS / 1000 })

  exposeForTests('maze', () => stateRef.current)
  const canvas = useCanvas(areaRef, canvasRef, () => {})

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key
      if (!KEYS[k]) return
      e.preventDefault()
      if (e.type === 'keydown') keys.current.add(k)
      else keys.current.delete(k)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('keyup', onKey)
    }
  }, [])

  useFrame((dt) => {
    const s = stateRef.current
    const { ctx, dpr, w, h } = canvas.current
    if (!ctx) return
    clock.current += dt
    const cell = layoutFor(s, w, h).cell || 1

    let dx = drag.current.dx / cell
    let dy = drag.current.dy / cell
    drag.current.dx = 0
    drag.current.dy = 0
    for (const k of keys.current) {
      dx += KEYS[k][0] * KEY_SPEED * (dt / 1000)
      dy += KEYS[k][1] * KEY_SPEED * (dt / 1000)
    }
    if (ctrl.isRunning()) step(s, dt, { dx, dy })
    else s.particles.update(dt / 1000)
    if (s.status === 'won') portal.current = Math.min(1, portal.current + dt / 700)

    trail.current.push({ ...s.ball })
    if (trail.current.length > 10) trail.current.shift()

    for (const ev of s.events.splice(0)) {
      if (ev.type === 'hit') {
        play('hit')
        navigator.vibrate?.(80)
      } else play('combo')
    }
    const seconds = Math.ceil(timeLeftMs(s) / 1000)
    if (seconds !== hud.seconds || s.lives !== hud.lives) setHud({ lives: s.lives, seconds })
    if (s.status !== 'playing') {
      end({ won: s.status === 'won', lives: s.lives, remainingMs: timeLeftMs(s), elapsedMs: s.elapsed }, () =>
        play(s.status === 'won' ? 'win' : 'lose'),
      )
    }
    render(ctx, s, dpr, w, h, clock.current, trail.current, portal.current)
  })

  // Arrastre relativo: la esfera se mueve lo mismo que el dedo, en cualquier parte.
  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (drag.current.id !== -1) return
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, dx: 0, dy: 0 }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (e.pointerId !== d.id) return
    d.dx += e.clientX - d.x
    d.dy += e.clientY - d.y
    d.x = e.clientX
    d.y = e.clientY
  }
  const onUp = (e: React.PointerEvent) => {
    if (e.pointerId === drag.current.id) drag.current.id = -1
  }

  return (
    <PlayLayout
      areaRef={areaRef}
      areaLabel="Laberinto: deslizá el dedo para mover la esfera hasta el portal"
      state={ctrl}
      muted={muted}
      onToggleMute={onToggleMute}
      hud={
        <>
          <Hearts lives={hud.lives} />
          <HudTimer seconds={hud.seconds} />
          <span className="w-[4.5rem]" />
        </>
      }
      subHud={<p className="text-center text-xs font-bold text-white/60">Deslizá en cualquier parte · ← ↑ → ↓ o WASD</p>}
    >
      <canvas ref={canvasRef} className="block" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} />
    </PlayLayout>
  )
}
