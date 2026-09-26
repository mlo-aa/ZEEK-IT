export const MISMATCH_DELAY_MS = 800
export const TICK_INTERVAL_MS = 100
export const RESULT_DELAY_MS = 750
export const GLITCH_ANIMATION_MS = 700
export const NAME_MAX_LENGTH = 16

// Banco de íconos: cada ronda elige al azar los que necesita.
export const ICON_POOL = [
  { type: 'ia', label: 'IA' },
  { type: 'robot', label: 'Robot' },
  { type: 'startup', label: 'Startup' },
  { type: 'laptop', label: 'Laptop' },
  { type: 'comunidad', label: 'Comunidad' },
  { type: 'innovacion', label: 'Innovación' },
  { type: 'codigo', label: 'Código' },
  { type: 'nube', label: 'Nube' },
  { type: 'datos', label: 'Datos' },
  { type: 'cafe', label: 'Café' },
  { type: 'git', label: 'Git' },
  { type: 'bug', label: 'Bug' },
  { type: 'gamer', label: 'Gamer' },
  { type: 'cerebro', label: 'Cerebro' },
]

export const MODES = {
  normal: {
    id: 'normal',
    label: 'Normal',
    pairs: 6,
    cols: 3,
    rows: 4,
    durationMs: 45_000,
    penaltyMs: 0,
    // Tipos que aparecen en las dos versiones (verde y oscura).
    trapTypes: 0,
    // Momentos (ms transcurridos) en que dos tarjetas ocultas cambian de lugar.
    glitchesAt: [],
  },
  extreme: {
    id: 'extreme',
    label: 'Extremo',
    pairs: 8,
    cols: 4,
    rows: 4,
    durationMs: 50_000,
    penaltyMs: 2_000,
    trapTypes: 3,
    glitchesAt: [15_000, 30_000],
  },
}

export const MODE_IDS = Object.keys(MODES)
