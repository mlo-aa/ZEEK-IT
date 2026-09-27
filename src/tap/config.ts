// Parámetros de ZEEK TAP. Los tamaños se expresan en relación al lado menor
// del área de juego para que se sienta igual en celular, iPad o computadora.

export const GAME_DURATION_MS = 20_000
export const COUNTDOWN_MS = 3_000
export const GOAL = 15
export const GOOD_POINTS = 1
export const BAD_POINTS = -2
export const MAX_STEP_MS = 50

/** Diámetro mínimo tocable en px (recomendación táctil: ≥ 44–48 px). */
export const MIN_TARGET_RADIUS = 30
/** Separación mínima entre objetivos, además de sus radios (px). */
export const TARGET_GAP = 18
/** Área táctil un poco más generosa que el dibujo. */
export const HIT_SLOP = 1.15

export interface Phase {
  untilMs: number
  /** Radio del objetivo, en fracción del lado menor del área. */
  radius: number
  /** Objetivos simultáneos como máximo. */
  maxTargets: number
  /** Tiempo entre apariciones (si hay lugar). */
  spawnEveryMs: number
  /** Respiro entre tocar un objetivo y que aparezca el siguiente. */
  respawnMs: number
  /** Cuánto dura visible cada objetivo. */
  ttlMs: number
  /** Velocidad de desplazamiento, en fracción del lado menor por segundo. */
  drift: number
  /** Probabilidad de objetivo morado (en la fase 3 se alternan). */
  badChance: number
  alternate: boolean
}

// 1–7 s: grandes, lentos, de a uno, solo verdes.
// 8–14 s: algo más chicos y rápidos, aparecen morados, hasta 2 a la vez.
// 15–20 s: más rápido, hasta 3 a la vez, verdes y morados alternados.
export const PHASES: Phase[] = [
  { untilMs: 7_000, radius: 0.13, maxTargets: 1, spawnEveryMs: 350, respawnMs: 350, ttlMs: 1400, drift: 0.04, badChance: 0, alternate: false },
  { untilMs: 14_000, radius: 0.11, maxTargets: 2, spawnEveryMs: 550, respawnMs: 250, ttlMs: 1100, drift: 0.07, badChance: 0.3, alternate: false },
  { untilMs: Infinity, radius: 0.095, maxTargets: 3, spawnEveryMs: 420, respawnMs: 200, ttlMs: 900, drift: 0.1, badChance: 0.5, alternate: true },
]

export function phaseAt(elapsedMs: number): Phase {
  return PHASES.find((p) => elapsedMs < p.untilMs) ?? PHASES[PHASES.length - 1]
}

/** Racha a partir de la cual se festeja el combo. */
export const COMBO_FROM = 3
