import { useEffect, useRef, useState } from 'react'
import type { PlayProps } from '../../arcade/kit/GameApp'
import { HudStat, HudTimer } from '../../arcade/kit/Hud'
import PlayLayout from '../../arcade/kit/PlayLayout'
import { exposeForTests } from '../../arcade/kit/testHook'
import { useFinish } from '../../arcade/kit/useFinish'
import { useFrame } from '../../arcade/kit/useFrame'
import { usePlayState } from '../../arcade/kit/usePlayState'
import {
  GAME_DURATION_MS,
  cellOf,
  clearAll,
  colOf,
  connectedCount,
  createConnectState,
  extendToward,
  filledCount,
  isComplete,
  rowOf,
  start,
  step,
  stop,
  timeLeftMs,
  TOTAL_CELLS,
  type Cell,
  type ConnectState,
} from './engine'
import { COLORS, COLOR_HEX, COLOR_NAME, LEVELS, SIZE, type Color } from './levels'

export interface ConnectResult {
  won: boolean
  connected: number
  filled: number
  remainingMs: number
}

const CELL = 100
const VIEW = CELL * SIZE
const center = (cell: Cell) => [colOf(cell) * CELL + CELL / 2, rowOf(cell) * CELL + CELL / 2] as const

/** Símbolo dentro de cada punto: se distinguen también sin ver el color. */
function Symbol({ color, x, y }: { color: Color; x: number; y: number }) {
  const k = 11
  if (color === 'G') return <path d={`M${x} ${y - k} L${x + k} ${y + k * 0.8} L${x - k} ${y + k * 0.8} Z`} fill="#000" />
  if (color === 'P') return <rect x={x - k * 0.85} y={y - k * 0.85} width={k * 1.7} height={k * 1.7} rx="2" fill="#000" />
  if (color === 'B') return <circle cx={x} cy={y} r={k * 0.9} fill="#000" />
  return <path d={`M${x} ${y - k} L${x + k} ${y} L${x} ${y + k} L${x - k} ${y} Z`} fill="#000" />
}

export default function ConnectPlay({ muted, onToggleMute, play, onFinish }: PlayProps<ConnectResult>) {
  const areaRef = useRef<HTMLDivElement>(null)
  const boardRef = useRef<SVGSVGElement>(null)
  const stateRef = useRef<ConnectState>(createConnectState(LEVELS, Math.floor(Math.random() * LEVELS.length)))
  const ctrl = usePlayState(play)
  const end = useFinish(onFinish, ctrl.finish, 1100)
  const [, setVersion] = useState(0)
  const [seconds, setSeconds] = useState(GAME_DURATION_MS / 1000)
  const [boardPx, setBoardPx] = useState(320)

  exposeForTests('connect', () => stateRef.current)

  useEffect(() => {
    const area = areaRef.current!
    const fit = () => setBoardPx(Math.max(220, Math.min(560, Math.min(area.clientWidth, area.clientHeight) - 28)))
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(area)
    return () => ro.disconnect()
  }, [])

  useFrame((dt) => {
    const s = stateRef.current
    if (ctrl.isRunning()) step(s, dt)
    const secs = Math.ceil(timeLeftMs(s) / 1000)
    if (secs !== seconds) setSeconds(secs)
    if (s.status !== 'playing') {
      end({ won: s.status === 'won', connected: connectedCount(s), filled: filledCount(s), remainingMs: timeLeftMs(s) }, () =>
        play(s.status === 'won' ? 'win' : 'lose'),
      )
    }
  })

  const cellAt = (e: React.PointerEvent): Cell | null => {
    const rect = boardRef.current!.getBoundingClientRect()
    const c = Math.floor(((e.clientX - rect.left) / rect.width) * SIZE)
    const r = Math.floor(((e.clientY - rect.top) / rect.height) * SIZE)
    if (r < 0 || c < 0 || r >= SIZE || c >= SIZE) return null
    return cellOf(r, c)
  }

  const afterChange = (before: number) => {
    const s = stateRef.current
    const now = connectedCount(s)
    if (now > before) play(now === COLORS.length ? 'combo' : 'pop')
    setVersion((v) => v + 1)
  }

  const onDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!ctrl.isRunning()) return
    const cell = cellAt(e)
    if (cell === null) return
    const before = connectedCount(stateRef.current)
    if (start(stateRef.current, cell)) {
      e.currentTarget.setPointerCapture(e.pointerId)
      afterChange(before)
    }
  }
  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const s = stateRef.current
    if (!s.drawing || !ctrl.isRunning()) return
    const cell = cellAt(e)
    if (cell === null) return
    const before = connectedCount(s)
    const len = s.paths[s.drawing].length
    extendToward(s, cell)
    if (s.drawing === null || s.paths[s.drawing]?.length !== len) afterChange(before)
  }
  const onUp = () => {
    stop(stateRef.current)
    setVersion((v) => v + 1)
  }

  const s = stateRef.current
  const connected = connectedCount(s)
  const filled = filledCount(s)
  // Todos los pares unidos pero con huecos: hay que rearmar alguna línea.
  const gaps = connected === COLORS.length && filled < TOTAL_CELLS
  const solved = s.status === 'won'

  return (
    <PlayLayout
      areaRef={areaRef}
      areaLabel="Tablero: uní cada par de puntos del mismo color y llená todas las celdas"
      state={ctrl}
      muted={muted}
      onToggleMute={onToggleMute}
      hud={
        <>
          <HudStat label="Celdas" value={filled} goal={TOTAL_CELLS} accent={filled === TOTAL_CELLS} />
          <HudTimer seconds={seconds} />
          <button
            type="button"
            onClick={() => {
              clearAll(stateRef.current)
              setVersion((v) => v + 1)
            }}
            className="rounded-full border-2 border-white/30 px-3 py-1.5 text-sm font-bold text-white/85 active:scale-95"
            aria-label="Borrar todas las líneas"
          >
            ↺ Borrar
          </button>
        </>
      }
      subHud={
        gaps ? (
          <p className="connect-gaps text-center text-sm font-bold text-neon" aria-live="polite">
            ¡Faltan {TOTAL_CELLS - filled} celdas! Rearmá una línea para llenarlas todas.
          </p>
        ) : (
          <div className="flex justify-center gap-2" aria-label={`${connected} de 4 pares conectados`}>
            {COLORS.map((c) => (
              <span
                key={c}
                className={`h-2.5 w-10 rounded-full transition ${isComplete(s, c) ? '' : 'opacity-25'}`}
                style={{ background: COLOR_HEX[c] }}
                title={COLOR_NAME[c]}
              />
            ))}
          </div>
        )
      }
    >
      <div className="grid h-full w-full place-items-center">
        <svg
          ref={boardRef}
          viewBox={`-8 -8 ${VIEW + 16} ${VIEW + 16}`}
          width={boardPx}
          height={boardPx}
          className={`touch-none ${solved ? 'connect-solved' : ''}`}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          role="img"
          aria-label={`Tablero 5 por 5, ${connected} de 4 pares conectados, ${filled} de ${TOTAL_CELLS} celdas llenas`}
        >
          <rect x="-6" y="-6" width={VIEW + 12} height={VIEW + 12} rx="22" fill="#07021a" stroke="#6335ED" strokeWidth="4" />
          {Array.from({ length: SIZE - 1 }, (_, i) => (
            <g key={i} stroke="rgba(1,229,118,0.14)" strokeWidth="2">
              <line x1={(i + 1) * CELL} y1="0" x2={(i + 1) * CELL} y2={VIEW} />
              <line x1="0" y1={(i + 1) * CELL} x2={VIEW} y2={(i + 1) * CELL} />
            </g>
          ))}
          {COLORS.map((color) =>
            s.paths[color].map((cell) => (
              <rect
                key={`${color}-${cell}`}
                x={colOf(cell) * CELL + 4}
                y={rowOf(cell) * CELL + 4}
                width={CELL - 8}
                height={CELL - 8}
                rx="14"
                fill={COLOR_HEX[color]}
                opacity={isComplete(s, color) ? 0.2 : 0.1}
              />
            )),
          )}
          {COLORS.map((color) => {
            const pts = s.paths[color].map((c) => center(c).join(',')).join(' ')
            if (s.paths[color].length < 2) return null
            const done = isComplete(s, color)
            return (
              <g key={color} className={done ? 'connect-done' : ''}>
                <polyline points={pts} fill="none" stroke={COLOR_HEX[color]} strokeOpacity="0.28" strokeWidth="40" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points={pts} fill="none" stroke={COLOR_HEX[color]} strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" />
              </g>
            )
          })}
          {COLORS.map((color) =>
            s.ends[color].map((cell) => {
              const [x, y] = center(cell)
              return (
                <g key={`${color}-${cell}`}>
                  <circle cx={x} cy={y} r="38" fill={COLOR_HEX[color]} opacity={isComplete(s, color) ? 0.35 : 0.15} />
                  <circle cx={x} cy={y} r="29" fill={COLOR_HEX[color]} />
                  <Symbol color={color} x={x} y={y} />
                </g>
              )
            }),
          )}
        </svg>
      </div>
    </PlayLayout>
  )
}
