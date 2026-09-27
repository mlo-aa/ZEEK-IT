import { useEffect, useRef, useState } from 'react'
import type { PlayProps } from '../../arcade/kit/GameApp'
import { HudStat, HudTimer, ProgressBar } from '../../arcade/kit/Hud'
import PlayLayout from '../../arcade/kit/PlayLayout'
import { exposeForTests } from '../../arcade/kit/testHook'
import { useCanvas } from '../../arcade/kit/useCanvas'
import { useFinish } from '../../arcade/kit/useFinish'
import { useFrame } from '../../arcade/kit/useFrame'
import { usePlayState } from '../../arcade/kit/usePlayState'
import { GAME_DURATION_MS, GOAL_FLOORS, createStackState, drop, floorTopY, floors, resizeStack, step, timeLeftMs, type StackEvent, type StackState } from './engine'
import { render } from './render'

export interface StackResult {
  won: boolean
  floors: number
  perfects: number
  remainingMs: number
}

export default function StackPlay({ muted, onToggleMute, play, onFinish }: PlayProps<StackResult>) {
  const areaRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<StackState | null>(null)
  const clock = useRef(0)
  const ctrl = usePlayState(play)
  const end = useFinish(onFinish, ctrl.finish, 900)
  const [hud, setHud] = useState({ floors: 0, seconds: GAME_DURATION_MS / 1000 })
  const [popups, setPopups] = useState<(StackEvent & { y: number })[]>([])

  exposeForTests('stack', () => stateRef.current)

  const canvas = useCanvas(areaRef, canvasRef, (w, h) => {
    if (!stateRef.current) stateRef.current = createStackState(w, h)
    else resizeStack(stateRef.current, w, h)
  })

  const handleEvents = (s: StackState) => {
    if (!s.events.length) return
    const fresh = s.events.splice(0)
    for (const ev of fresh) {
      if (ev.type === 'perfect') play('combo')
      else if (ev.type === 'place') play('pop')
      else play('buzz')
    }
    const shown = fresh.filter((e) => e.type === 'perfect').map((e) => ({ ...e, y: floorTopY(s, e.floor) }))
    if (shown.length) setPopups((p) => [...p.slice(-3), ...shown])
  }

  // Toque o tecla: se suelta el bloque en el acto (dentro del evento, sin esperar un frame).
  const tap = () => {
    const s = stateRef.current
    if (!s || !ctrl.isRunning()) return
    drop(s)
    handleEvents(s)
    setHud((h) => ({ ...h, floors: floors(s) }))
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || ![' ', 'Enter', 'ArrowDown', 's', 'S'].includes(e.key)) return
      e.preventDefault()
      tap()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  useFrame((dt) => {
    const s = stateRef.current
    const { ctx, dpr } = canvas.current
    if (!s || !ctx) return
    clock.current += dt
    if (ctrl.isRunning() || s.status !== 'playing') step(s, dt)
    handleEvents(s)
    const seconds = Math.ceil(timeLeftMs(s) / 1000)
    if (seconds !== hud.seconds || floors(s) !== hud.floors) setHud({ floors: floors(s), seconds })
    if (s.status !== 'playing') {
      end({ won: s.status === 'won', floors: floors(s), perfects: s.perfects, remainingMs: timeLeftMs(s) }, () =>
        play(s.status === 'won' ? 'win' : 'lose'),
      )
    }
    render(ctx, s, dpr, clock.current)
  })

  return (
    <PlayLayout
      areaRef={areaRef}
      areaLabel="Área de juego: tocá para soltar el bloque"
      state={ctrl}
      muted={muted}
      onToggleMute={onToggleMute}
      hud={
        <>
          <HudStat label="Pisos" value={hud.floors} goal={GOAL_FLOORS} accent={hud.floors >= 7} />
          <HudTimer seconds={hud.seconds} />
          <span className="w-[4.5rem]" />
        </>
      }
      subHud={<ProgressBar value={hud.floors} max={GOAL_FLOORS} label="Pisos construidos" />}
    >
      <canvas ref={canvasRef} className="block" onPointerDown={(e) => (e.preventDefault(), tap())} />
      {popups.map((p) => (
        <span
          key={p.id}
          className="tap-popup font-display pointer-events-none absolute text-4xl text-neon"
          style={{ left: p.x, top: Math.max(40, p.y - 30), textShadow: '0 0 18px rgb(1 229 118 / 0.8), 0 3px 0 #000' }}
          onAnimationEnd={() => setPopups((list) => list.filter((x) => x.id !== p.id))}
          aria-live="polite"
        >
          PERFECT!
        </span>
      ))}
    </PlayLayout>
  )
}
