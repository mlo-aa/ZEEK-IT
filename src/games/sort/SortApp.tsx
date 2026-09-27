import { GameApp, type GameDefinition } from '../../arcade/kit/GameApp'
import { GAME_DURATION_MS, GOAL } from './config'
import SortPlay, { type SortResult } from './SortPlay'

const fmt = (ms: number) => `${(ms / 1000).toLocaleString('es-AR', { maximumFractionDigits: 1 })} s`

export const SORT: GameDefinition<SortResult> = {
  id: 'sort',
  welcome: {
    name: 'SORT',
    emoji: '📦',
    subtitle: '¿Hardware o software? ¡Rápido!',
    description: `Los objetos caen cada vez más rápido: arrastralos (o tiralos de costado) al contenedor correcto antes de que lleguen abajo. Conseguí ${GOAL} puntos en ${GAME_DURATION_MS / 1000} segundos.`,
    rules: [
      { icon: '👆', title: 'Arrastrá y soltá', hint: 'O deslizá rápido hacia un costado' },
      { icon: '✅', title: 'Correcto: +1', hint: 'Incorrecto: −1 (nunca menos de 0)' },
      { icon: '⬇️', title: 'Si se cae: −1', hint: 'No dejes que lleguen abajo sin clasificar' },
      { icon: '🔄', title: '3 rondas', hint: 'Hardware/Software · IA/Robótica · Diseño/Programación' },
    ],
    chips: [`⏱️ ${GAME_DURATION_MS / 1000} s`, `🎯 ${GOAL} puntos`, '⚡ Cada vez más rápido'],
  },
  Play: SortPlay,
  stats: (r) => (r.won ? [{ label: 'Aciertos', value: r.correct }, { label: 'Tiempo restante', value: fmt(r.remainingMs) }] : [{ label: 'Puntos', value: `${r.score}/${GOAL}` }, { label: 'Aciertos', value: r.correct }]),
  defeatMessage: 'Ya le agarraste la mano a las categorías. ¡Una ronda más y lo sacás!',
}

export default function SortApp({ onExit }: { onExit: () => void }) {
  return <GameApp game={SORT} onExit={onExit} />
}
