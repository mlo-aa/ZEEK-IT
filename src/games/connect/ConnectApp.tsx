import { GameApp, type GameDefinition } from '../../arcade/kit/GameApp'
import { GAME_DURATION_MS } from './engine'
import ConnectPlay, { type ConnectResult } from './ConnectPlay'

const fmt = (ms: number) => `${(ms / 1000).toLocaleString('es-AR', { maximumFractionDigits: 1 })} s`

export const CONNECT: GameDefinition<ConnectResult> = {
  id: 'connect',
  welcome: {
    name: 'CONNECT',
    emoji: '🔗',
    subtitle: 'Conectá sin cruzar.',
    description: `Uní los 4 pares de puntos del mismo color deslizando el dedo por la cuadrícula, sin que las líneas se crucen. Tenés ${GAME_DURATION_MS / 1000} segundos.`,
    rules: [
      { icon: '👉', title: 'Deslizá desde un punto', hint: 'Solo en horizontal o vertical' },
      { icon: '🚫', title: 'Sin cruces', hint: 'Dos líneas no pueden compartir una celda' },
      { icon: '↺', title: 'Corregí cuando quieras', hint: 'Volvé a empezar desde un punto o tocá Borrar' },
    ],
    chips: [`⏱️ ${GAME_DURATION_MS / 1000} s`, '🔗 4 pares', '🧩 12 tableros'],
  },
  Play: ConnectPlay,
  stats: (r) =>
    r.won
      ? [
          { label: 'Pares', value: '4/4' },
          { label: 'Tiempo restante', value: fmt(r.remainingMs) },
        ]
      : [{ label: 'Pares conectados', value: `${r.connected}/4` }],
  defeatMessage: 'Estuviste cerca. Probá empezar por los pares de las esquinas.',
}

export default function ConnectApp({ onExit }: { onExit: () => void }) {
  return <GameApp game={CONNECT} onExit={onExit} />
}
