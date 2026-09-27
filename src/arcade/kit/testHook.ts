/**
 * Expone el estado de un juego a los tests de navegador. Solo existe en el
 * build `vite build --mode e2e`; en producción el bloque se elimina.
 */
export function exposeForTests(name: string, get: () => unknown) {
  if (import.meta.env.MODE === 'e2e') {
    const w = window as unknown as { __zeek?: Record<string, () => unknown> }
    w.__zeek ??= {}
    w.__zeek[name] = get
  }
}
