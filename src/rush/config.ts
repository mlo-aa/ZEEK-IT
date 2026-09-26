// Parámetros de ZEEK RUSH. Las velocidades y tamaños se expresan en relación
// al tamaño de la pantalla, para que la dificultad sea igual en cualquier equipo.

export const GAME_DURATION_MS = 30_000
export const COUNTDOWN_MS = 3_000
export const START_LIVES = 3
export const INVULNERABLE_MS = 1_500
export const STAR_POINTS = 10
/** Paso máximo de simulación: evita saltos tras un tirón del navegador. */
export const MAX_STEP_MS = 50

export interface Phase {
  /** Hasta qué momento (ms jugados) rige esta fase. */
  untilMs: number
  /** Tiempo entre oleadas de asteroides. */
  waveEveryMs: number
  /** Velocidad de caída, en altos de pantalla por segundo. */
  speed: number
  /** Asteroides por oleada [mín, máx]. */
  count: [number, number]
  /** Ancho del hueco libre garantizado, en anchos de cohete. */
  gap: number
  /** Probabilidad de que la oleada traiga una estrella. */
  starChance: number
}

// 0–10 s: calentamiento · 10–20 s: sube un poco · 20–30 s: exigente pero justo.
export const PHASES: Phase[] = [
  { untilMs: 10_000, waveEveryMs: 1_150, speed: 0.36, count: [1, 2], gap: 3.4, starChance: 0.7 },
  { untilMs: 20_000, waveEveryMs: 900, speed: 0.46, count: [2, 3], gap: 3.0, starChance: 0.6 },
  { untilMs: Infinity, waveEveryMs: 780, speed: 0.55, count: [2, 4], gap: 2.7, starChance: 0.55 },
]

export function phaseAt(elapsedMs: number): Phase {
  return PHASES.find((p) => elapsedMs < p.untilMs) ?? PHASES[PHASES.length - 1]
}

/** Ancho del cohete según la pantalla (px CSS). */
export function rocketWidthFor(w: number, h: number): number {
  return Math.max(34, Math.min(56, Math.min(w * 0.11, h * 0.07)))
}

/** Velocidad máxima del cohete con teclado (px/s): cruza un celular en ~0,9 s,
 * sin volverse nerviosa en pantallas anchas. */
export function keyboardSpeedFor(w: number, rocketWidth: number): number {
  return Math.min(w * 1.15, rocketWidth * 11)
}
