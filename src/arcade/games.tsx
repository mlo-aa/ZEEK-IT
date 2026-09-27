import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import { BreakArt, ConnectArt, MazeArt, MemoryArt, RushArt, SortArt, StackArt, TapArt } from './arts'
import type { GameId } from './routes'

export interface GameEntry {
  id: GameId
  title: string
  tagline: string
  chips: string[]
  accent: 'neon' | 'purple'
  Art: ComponentType
  /** Cada juego se carga por separado (y mantiene su propio estado). */
  App: LazyExoticComponent<ComponentType<{ onExit: () => void }>>
}

// Registro de ZEEK ARCADE: el menú y las rutas se generan a partir de acá.
export const GAMES: GameEntry[] = [
  {
    id: 'it',
    title: 'ZEEK IT',
    tagline: 'Memorama: encontrá todas las parejas.',
    chips: ['🧠 45 s', '🏆 Ranking'],
    accent: 'neon',
    Art: MemoryArt,
    App: lazy(() => import('../ZeekItApp')),
  },
  {
    id: 'rush',
    title: 'ZEEK RUSH',
    tagline: 'Esquivá asteroides con tu cohete.',
    chips: ['🚀 30 s', '♥ 3 vidas'],
    accent: 'purple',
    Art: RushArt,
    App: lazy(() => import('../rush/RushApp')),
  },
  {
    id: 'tap',
    title: 'ZEEK TAP',
    tagline: 'Tocá los verdes, evitá los morados.',
    chips: ['⚡ 20 s', '🎯 15 pts'],
    accent: 'neon',
    Art: TapArt,
    App: lazy(() => import('../tap/TapApp')),
  },
  {
    id: 'sort',
    title: 'ZEEK SORT',
    tagline: 'Clasificá lo que cae en su categoría.',
    chips: ['📦 40 s', '🎯 15 pts'],
    accent: 'purple',
    Art: SortArt,
    App: lazy(() => import('../games/sort/SortApp')),
  },
  {
    id: 'connect',
    title: 'ZEEK CONNECT',
    tagline: 'Uní cada par sin cruzar líneas.',
    chips: ['🔗 45 s', '4 pares'],
    accent: 'neon',
    Art: ConnectArt,
    App: lazy(() => import('../games/connect/ConnectApp')),
  },
  {
    id: 'stack',
    title: 'ZEEK STACK',
    tagline: 'Apilá bloques con precisión.',
    chips: ['🏗️ 45 s', '10 pisos'],
    accent: 'purple',
    Art: StackArt,
    App: lazy(() => import('../games/stack/StackApp')),
  },
  {
    id: 'maze',
    title: 'ZEEK MAZE',
    tagline: 'Guiá la esfera hasta el portal.',
    chips: ['🌀 45 s', '♥ 3 vidas'],
    accent: 'neon',
    Art: MazeArt,
    App: lazy(() => import('../games/maze/MazeApp')),
  },
  {
    id: 'break',
    title: 'ZEEK BREAK',
    tagline: 'Rompé los 20 bloques con la pelota.',
    chips: ['💥 60 s', '♥ 3 vidas'],
    accent: 'purple',
    Art: BreakArt,
    App: lazy(() => import('../games/break/BreakApp')),
  },
]
