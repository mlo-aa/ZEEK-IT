import { GameApp, type GameDefinition } from '../../arcade/kit/GameApp'
import { GAME_DURATION_MS, START_LIVES } from './engine'
import MazePlay, { type MazeResult } from './MazePlay'

const fmt = (ms: number) => `${(ms / 1000).toLocaleString('es-AR', { maximumFractionDigits: 1 })} s`

export const MAZE: GameDefinition<MazeResult> = {
  id: 'maze',
  welcome: {
    name: 'MAZE',
    emoji: '🌀',
    subtitle: 'Encontrá la salida.',
    description: `Guiá la esfera verde hasta el portal morado deslizando el dedo. Esquivá las trampas que van y vienen: tenés ${START_LIVES} vidas y ${GAME_DURATION_MS / 1000} segundos.`,
    rules: [
      { icon: '🟢', title: 'Deslizá para moverte', hint: 'En computadora: flechas o WASD' },
      { icon: '✴️', title: 'Cuidado con las trampas', hint: 'Cruzan el camino: esperá tu momento' },
      { icon: '🌀', title: 'Llegá al portal', hint: 'Cada partida, un laberinto distinto' },
    ],
    chips: [`⏱️ ${GAME_DURATION_MS / 1000} s`, `♥ ${START_LIVES} vidas`, '🌀 6 laberintos'],
  },
  Play: MazePlay,
  stats: (r) =>
    r.won
      ? [
          { label: 'Tu tiempo', value: fmt(r.elapsedMs) },
          { label: 'Vidas', value: `${r.lives}/${START_LIVES}` },
        ]
      : [{ label: 'Vidas', value: `${r.lives}/${START_LIVES}` }],
  defeatMessage: 'Las trampas siguen siempre el mismo ritmo: esperá a que se aparten y pasá. ¡Probá otra vez!',
}

export default function MazeApp({ onExit }: { onExit: () => void }) {
  return <GameApp game={MAZE} onExit={onExit} />
}
