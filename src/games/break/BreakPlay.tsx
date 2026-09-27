import { useEffect, useRef, useState } from 'react'
import type { PlayProps } from '../../arcade/kit/GameApp'
import { Hearts, HudStat, HudTimer } from '../../arcade/kit/Hud'
import PlayLayout from '../../arcade/kit/PlayLayout'
import { exposeForTests } from '../../arcade/kit/testHook'
import { localPoint, useCanvas } from '../../arcade/kit/useCanvas'
import { useFinish } from '../../arcade/kit/useFinish'
import { useFrame } from '../../arcade/kit/useFrame'
import { usePlayState } from '../../arcade/kit/usePlayState'
import { GAME_DURATION_MS, START_LIVES, bricksLeft, createBreakState, launch, movePaddleTo, resizeBreak, step, timeLeftMs, type BreakEvent, type BreakState } from './engine'
import { render } from './render'

export interface BreakResult {
  won: boolean
  score: number
  bricksLeft: number
  remainingMs: number
}

export default function BreakPlay({ muted, onToggleMute, play, onFinish }: PlayProps<BreakResult>) {
  const areaRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<BreakState | null>(null)
  const keys = useRef({ left: false, right: false })
  const trail = useRef<{ x: number; y: number }[]>([])
  const clock = useRef(0)
  const ctrl = usePlayState(play)
  const end = useFinish(onFinish, ctrl.finish, 900)
  const [hud, setHud] = useState({ lives: START_LIVES, score: 0, left: 20, seconds: GAME_DURATION_MS / 1000 })
  const [popups, setPopups] = useState<BreakEvent[]>([])

  exposeForTests('break', () => stateRef.current)

  // En pantallas anchas el campo es una columna centrada (como una máquina
  // arcade), para que la dificultad sea la misma en celular, iPad o PC.
  const field = useRef({ ox: 0, w: 0 })
  const canvas = useCanvas(areaRef, canvasRef, (w, h) => {
    const fw = Math.min(w, Math.max(360, h * 0.78))
    field.current = { ox: (w - fw) / 2, w: fw }
    if (!stateRef.current) stateRef.current = createBreakState(fw, h)
    else resizeBreak(stateRef.current, fw, h)
  })

  const tryLaunch = () => {
    const s = stateRef.current
    if (s && ctrl.isRunning() && launch(s)) play('go')
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const down = e.type === 'keydown'
      if (['ArrowLeft', 'a', 'A'].includes(e.key)) keys.current.left = down
      else if (['ArrowRight', 'd', 'D'].includes(e.key)) keys.current.right = down
      else if (down && [' ', 'Enter', 'ArrowUp', 'w', 'W'].includes(e.key)) tryLaunch()
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('keyup', onKey)
    }
  })

  useFrame((dt) => {
    const s = stateRef.current
    const { ctx, dpr } = canvas.current
    if (!s || !ctx) return
    clock.current += dt
    const dir = keys.current.left === keys.current.right ? 0 : keys.current.left ? -1 : 1
    if (ctrl.isRunning()) step(s, dt, dir)
    else s.particles.update(dt / 1000, 500)

    trail.current.push({ x: s.ball.x, y: s.ball.y })
    if (trail.current.length > 8 || s.stuck) trail.current.shift()

    if (s.events.length) {
      const fresh = s.events.splice(0)
      for (const ev of fresh) {
        if (ev.type === 'bounce') play('tick')
        if (ev.type === 'hit') play('pop')
        if (ev.type === 'break') play('star')
        if (ev.type === 'lose') {
          play('hit')
          navigator.vibrate?.(80)
        }
      }
      const shown = fresh.filter((e) => e.type === 'break')
      if (shown.length) setPopups((p) => [...p.slice(-5), ...shown])
    }

    const seconds = Math.ceil(timeLeftMs(s) / 1000)
    const left = bricksLeft(s)
    if (seconds !== hud.seconds || s.lives !== hud.lives || s.score !== hud.score || left !== hud.left) {
      setHud({ lives: s.lives, score: s.score, left, seconds })
    }
    if (s.status !== 'playing') {
      end({ won: s.status === 'won', score: s.score, bricksLeft: left, remainingMs: timeLeftMs(s) }, () =>
        play(s.status === 'won' ? 'win' : 'lose'),
      )
    }
    render(ctx, s, dpr, clock.current, trail.current, field.current.ox, canvas.current.w)
  })

  // La paleta sigue al dedo (o al mouse) en horizontal.
  const follow = (e: React.PointerEvent) => {
    const s = stateRef.current
    if (!s || s.status !== 'playing') return
    if (e.pointerType === 'mouse' || e.buttons || e.type === 'pointerdown') movePaddleTo(s, localPoint(areaRef.current!, e).x - field.current.ox)
  }

  return (
    <PlayLayout
      areaRef={areaRef}
      areaLabel="Área de juego: mové la paleta y rompé los bloques"
      state={ctrl}
      muted={muted}
      onToggleMute={onToggleMute}
      hud={
        <>
          <Hearts lives={hud.lives} />
          <HudTimer seconds={hud.seconds} />
          <HudStat label="Puntos" value={hud.score} accent />
        </>
      }
      subHud={
        <p className="text-center text-xs font-bold tracking-wide text-white/70 uppercase">
          Bloques restantes: <span className="text-neon">{hud.left}</span>
        </p>
      }
    >
      <canvas
        ref={canvasRef}
        className="block"
        onPointerDown={(e) => {
          follow(e)
          e.currentTarget.setPointerCapture(e.pointerId)
          tryLaunch()
        }}
        onPointerMove={follow}
      />
      {popups.map((p) => (
        <span
          key={p.id}
          className={`tap-popup font-display pointer-events-none absolute text-2xl ${p.points === 20 ? 'text-zeek-light' : 'text-neon'}`}
          style={{ left: p.x + field.current.ox, top: p.y }}
          onAnimationEnd={() => setPopups((list) => list.filter((x) => x.id !== p.id))}
          aria-hidden="true"
        >
          +{p.points}
        </span>
      ))}
    </PlayLayout>
  )
}
