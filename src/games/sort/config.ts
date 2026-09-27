// ZEEK SORT: parámetros y contenido.

export const GAME_DURATION_MS = 40_000
export const GOAL = 22
export const MAX_ITEMS = 4
/** Lo que resta un objeto que llega abajo sin clasificar. */
export const MISS_PENALTY = 1

export interface Item {
  icon: string
  label: string
}

export interface Round {
  /** Desde qué momento (ms jugados) rige esta ronda. */
  fromMs: number
  /** [izquierda (verde), derecha (morado)] */
  categories: [string, string]
  icons: [string, string]
  items: [Item[], Item[]]
}

// Cada objeto pertenece a una sola categoría de su ronda (sin ambigüedades).
export const ROUNDS: Round[] = [
  {
    fromMs: 0,
    categories: ['Hardware', 'Software'],
    icons: ['🖥️', '💿'],
    items: [
      [
        { icon: '🖥️', label: 'Monitor' },
        { icon: '⌨️', label: 'Teclado' },
        { icon: '🖱️', label: 'Mouse' },
        { icon: '🖨️', label: 'Impresora' },
        { icon: '🔌', label: 'Cable' },
        { icon: '🎧', label: 'Audífonos' },
        { icon: '💽', label: 'Disco duro' },
      ],
      [
        { icon: '🌐', label: 'Navegador' },
        { icon: '🛡️', label: 'Antivirus' },
        { icon: '📝', label: 'Editor de texto' },
        { icon: '📊', label: 'Hoja de cálculo' },
        { icon: '💬', label: 'App de chat' },
        { icon: '🪟', label: 'Sistema operativo' },
        { icon: '🧩', label: 'Extensión web' },
      ],
    ],
  },
  {
    fromMs: 15_000,
    categories: ['IA', 'Robótica'],
    icons: ['🧠', '🦾'],
    items: [
      [
        { icon: '🧠', label: 'Red neuronal' },
        { icon: '🗣️', label: 'Reconoc. de voz' },
        { icon: '📚', label: 'Modelo de lenguaje' },
        { icon: '👁️', label: 'Visión artificial' },
        { icon: '✨', label: 'IA generativa' },
        { icon: '🌍', label: 'Traductor automático' },
      ],
      [
        { icon: '🦾', label: 'Brazo robótico' },
        { icon: '🦿', label: 'Pierna robótica' },
        { icon: '🤖', label: 'Robot' },
        { icon: '⚙️', label: 'Servomotor' },
        { icon: '🚁', label: 'Dron' },
        { icon: '📡', label: 'Sensor' },
      ],
    ],
  },
  {
    fromMs: 30_000,
    categories: ['Diseño', 'Programación'],
    icons: ['🎨', '💻'],
    items: [
      [
        { icon: '🎨', label: 'Paleta de colores' },
        { icon: '✏️', label: 'Boceto' },
        { icon: '🖌️', label: 'Pincel' },
        { icon: '🔤', label: 'Tipografía' },
        { icon: '🖼️', label: 'Ilustración' },
        { icon: '🌈', label: 'Degradado' },
      ],
      [
        { icon: '🐛', label: 'Bug' },
        { icon: '🔁', label: 'Bucle' },
        { icon: '🧮', label: 'Algoritmo' },
        { icon: '⌨️', label: 'Código' },
        { icon: '🌿', label: 'Git' },
        { icon: '📦', label: 'Paquete npm' },
      ],
    ],
  },
]

export interface Speed {
  untilMs: number
  /** Segundos que tarda un objeto en caer desde arriba hasta los contenedores. */
  fallSeconds: number
  spawnEveryMs: number
}

// 0–15 s lento · 15–30 s medio · 30–40 s rápido.
export const SPEEDS: Speed[] = [
  { untilMs: 15_000, fallSeconds: 5, spawnEveryMs: 1_100 },
  { untilMs: 30_000, fallSeconds: 3.8, spawnEveryMs: 850 },
  { untilMs: Infinity, fallSeconds: 2.8, spawnEveryMs: 650 },
]

export const roundAt = (ms: number) => [...ROUNDS].reverse().find((r) => ms >= r.fromMs) ?? ROUNDS[0]
export const speedAt = (ms: number) => SPEEDS.find((s) => ms < s.untilMs) ?? SPEEDS[SPEEDS.length - 1]
