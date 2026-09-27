import { GameApp, type GameDefinition } from '../../arcade/kit/GameApp'
import { GAME_DURATION_MS, GOAL_FLOORS } from './engine'
import StackPlay, { type StackResult } from './StackPlay'

const fmt = (ms: number) => `${(ms / 1000).toLocaleString('es-AR', { maximumFractionDigits: 1 })} s`

export const STACK: GameDefinition<StackResult> = {
  id: 'stack',
  welcome: {
    name: 'STACK',
    emoji: '🏗️',
    subtitle: 'Precisión de builder.',
    description: `Tocá la pantalla para soltar cada bloque sobre la torre. Lo que sobresale se cae y el siguiente bloque es más angosto. Construí ${GOAL_FLOORS} pisos en ${GAME_DURATION_MS / 1000} segundos.`,
    rules: [
      { icon: '👆', title: 'Tocá para soltar', hint: 'O usá la barra espaciadora' },
      { icon: '✨', title: '¡PERFECT!', hint: 'Si lo alineás justo, conserva todo su ancho' },
      { icon: '⚠️', title: 'Cada piso va más rápido', hint: 'Si no apoya nada, se termina' },
    ],
    chips: [`⏱️ ${GAME_DURATION_MS / 1000} s`, `🏗️ ${GOAL_FLOORS} pisos`],
  },
  Play: StackPlay,
  stats: (r) =>
    r.won
      ? [
          { label: 'Perfectos', value: r.perfects },
          { label: 'Tiempo restante', value: fmt(r.remainingMs) },
        ]
      : [
          { label: 'Pisos', value: `${r.floors}/${GOAL_FLOORS}` },
          { label: 'Perfectos', value: r.perfects },
        ],
  defeatMessage: 'Mirá las líneas guía y tocá un instante antes de que el bloque llegue. ¡Otra vez!',
}

export default function StackApp({ onExit }: { onExit: () => void }) {
  return <GameApp game={STACK} onExit={onExit} />
}
