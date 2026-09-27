import { GameApp, type GameDefinition } from '../../arcade/kit/GameApp'
import { GAME_DURATION_MS, START_LIVES } from './engine'
import BreakPlay, { type BreakResult } from './BreakPlay'

const fmt = (ms: number) => `${(ms / 1000).toLocaleString('es-AR', { maximumFractionDigits: 1 })} s`

export const BREAK: GameDefinition<BreakResult> = {
  id: 'break',
  welcome: {
    name: 'BREAK',
    emoji: '💥',
    subtitle: 'Rompé todo.',
    description: `Mové la plataforma con el dedo y hacé rebotar la pelota para destruir los 20 bloques. Tenés ${START_LIVES} vidas y ${GAME_DURATION_MS / 1000} segundos.`,
    rules: [
      { icon: '👆', title: 'Tocá para lanzar', hint: 'Deslizá para mover la plataforma (mouse o ← →)' },
      { icon: '🟩', title: 'Verde: 1 golpe · 10 pts', hint: 'Morado: 2 golpes · 20 pts' },
      { icon: '🎯', title: 'Apuntá con la plataforma', hint: 'Donde pega la pelota cambia el ángulo' },
    ],
    chips: [`⏱️ ${GAME_DURATION_MS / 1000} s`, `♥ ${START_LIVES} vidas`, '🧱 20 bloques'],
  },
  Play: BreakPlay,
  stats: (r) =>
    r.won
      ? [
          { label: 'Puntos', value: r.score },
          { label: 'Tiempo restante', value: fmt(r.remainingMs) },
        ]
      : [
          { label: 'Puntos', value: r.score },
          { label: 'Bloques restantes', value: r.bricksLeft },
        ],
  defeatMessage: 'Pegale con los bordes de la plataforma para mandar la pelota a los bloques que quedan. ¡Dale!',
}

export default function BreakApp({ onExit }: { onExit: () => void }) {
  return <GameApp game={BREAK} onExit={onExit} />
}
