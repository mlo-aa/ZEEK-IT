import { useRef, useState } from 'react'
import type { PlayProps } from '../../arcade/kit/GameApp'
import { HudStat, HudTimer, ProgressBar } from '../../arcade/kit/Hud'
import PlayLayout from '../../arcade/kit/PlayLayout'
import { localPoint, useCanvas } from '../../arcade/kit/useCanvas'
import { useFinish } from '../../arcade/kit/useFinish'
import { useFrame } from '../../arcade/kit/useFrame'
import { usePlayState } from '../../arcade/kit/usePlayState'
import { exposeForTests } from '../../arcade/kit/testHook'
import { GAME_DURATION_MS, GOAL } from './config'
import { createSortState, drag, grab, pick, release, resizeSort, step, timeLeftMs, type Falling, type SortEvent, type SortState } from './engine'
import { render } from './render'

export interface SortResult {
  won: boolean
  correct: number
  score: number
  remainingMs: number
}

export default function SortPlay({ muted, onToggleMute, play, onFinish }: PlayProps<SortResult>) {
  const areaRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<SortState | null>(null)
  const grabbed = useRef(new Map<number, { item: Falling; t: number }>())
  const clock = useRef(0)
  const ctrl = usePlayState(play)
  const end = useFinish(onFinish, ctrl.finish)

  const [hud, setHud] = useState({ score: 0, seconds: GAME_DURATION_MS / 1000 })
  const [popups, setPopups] = useState<SortEvent[]>([])
  const [banner, setBanner] = useState<SortEvent | null>(null)

  exposeForTests('sort', () => stateRef.current)

  const canvas = useCanvas(areaRef, canvasRef, (w, h) => {
    if (!stateRef.current) stateRef.current = createSortState(w, h)
    else resizeSort(stateRef.current, w, h)
  })

  useFrame((dt) => {
    const s = stateRef.current
    const { ctx, dpr } = canvas.current
    if (!s || !ctx) return
    clock.current += dt
    if (ctrl.isRunning()) step(s, dt)
    else s.particles.update(dt / 1000)

    if (s.events.length) {
      const fresh = s.events.splice(0)
      for (const ev of fresh) {
        if (ev.type === 'correct') play('pop')
        if (ev.type === 'wrong') {
          play('buzz')
          navigator.vibrate?.(60)
        }
        if (ev.type === 'missed') play('buzz')
        if (ev.type === 'round') {
          play('combo')
          setBanner(ev)
        }
      }
      const shown = fresh.filter((e) => e.type !== 'round')
      if (shown.length) setPopups((p) => [...p.slice(-5), ...shown])
    }

    const seconds = Math.ceil(timeLeftMs(s) / 1000)
    if (seconds !== hud.seconds || s.score !== hud.score) setHud({ score: s.score, seconds })

    if (s.status !== 'playing') {
      end({ won: s.status === 'won', correct: s.correct, score: s.score, remainingMs: timeLeftMs(s) }, () =>
        play(s.status === 'won' ? 'win' : 'lose'),
      )
    }
    render(ctx, s, dpr, clock.current)
  })

  const onDown = (e: React.PointerEvent) => {
    const s = stateRef.current
    if (!s || !ctrl.isRunning()) return
    const p = localPoint(areaRef.current!, e)
    const it = pick(s, p.x, p.y)
    if (!it || it.dragging) return
    grab(s, it)
    grabbed.current.set(e.pointerId, { item: it, t: e.timeStamp })
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onMove = (e: React.PointerEvent) => {
    const g = grabbed.current.get(e.pointerId)
    if (!g) return
    const p = localPoint(areaRef.current!, e)
    drag(g.item, p.x, p.y, e.timeStamp - g.t)
    g.t = e.timeStamp
  }
  const onUp = (e: React.PointerEvent) => {
    const g = grabbed.current.get(e.pointerId)
    const s = stateRef.current
    if (!g || !s) return
    grabbed.current.delete(e.pointerId)
    release(s, g.item)
  }

  const r = stateRef.current?.round
  return (
    <PlayLayout
      areaRef={areaRef}
      areaLabel="Área de juego: arrastrá cada objeto a su categoría"
      state={ctrl}
      muted={muted}
      onToggleMute={onToggleMute}
      hud={
        <>
          <HudStat label="Puntos" value={hud.score} goal={GOAL} accent={hud.score >= GOAL - 5} />
          <HudTimer seconds={hud.seconds} />
          <span className="w-[4.5rem]" />
        </>
      }
      subHud={
        <>
          <ProgressBar value={hud.score} max={GOAL} label="Progreso hacia la meta" />
          {r && (
            <p className="text-center text-xs font-bold tracking-wide text-white/70 uppercase">
              <span className="text-neon">{r.categories[0]}</span> vs <span className="text-zeek-light">{r.categories[1]}</span>
            </p>
          )}
        </>
      }
      overlay={
        banner && (
          <div key={banner.id} className="pointer-events-none absolute inset-x-0 top-1/3 z-10 grid place-items-center">
            <span className="tap-combo font-display rounded-2xl bg-neon px-5 py-2 text-center text-2xl text-ink">
              ¡Nueva ronda!
              <span className="block text-base">
                {r?.categories[0]} vs {r?.categories[1]}
              </span>
            </span>
          </div>
        )
      }
    >
      <canvas
        ref={canvasRef}
        className="block"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      />
      {popups.map((p) => (
        <span
          key={p.id}
          className={`tap-popup font-display pointer-events-none absolute text-3xl ${p.type === 'correct' ? 'text-neon' : 'text-zeek-light'}`}
          style={{ left: p.x, top: p.y - 50 }}
          onAnimationEnd={() => setPopups((list) => list.filter((x) => x.id !== p.id))}
          aria-hidden="true"
        >
          {p.type === 'correct' ? '+1' : '−1'}
        </span>
      ))}
    </PlayLayout>
  )
}
