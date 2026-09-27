export const GAME_IDS = ['it', 'rush', 'tap', 'sort', 'connect', 'stack', 'maze', 'break'] as const
export type GameId = (typeof GAME_IDS)[number]
export type Route = GameId | 'hub'

export function routeFromLocation(loc: Location = window.location): Route {
  const path = (loc.pathname.replace(/\/+$/, '') || '/').slice(1)
  if ((GAME_IDS as readonly string[]).includes(path)) return path as GameId
  // Compatibilidad: /#ranking abría el ranking de ZEEK IT.
  if (loc.hash === '#ranking') return 'it'
  return 'hub'
}

export function pathFor(route: Route) {
  return route === 'hub' ? '/' : `/${route}`
}
