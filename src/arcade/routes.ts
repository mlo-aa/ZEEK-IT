export type GameId = 'it' | 'rush' | 'tap'
export type Route = GameId | 'hub'

const PATHS: Record<Route, string> = { hub: '/', it: '/it', rush: '/rush', tap: '/tap' }

export function routeFromLocation(loc: Location = window.location): Route {
  const path = loc.pathname.replace(/\/+$/, '') || '/'
  if (path === '/it') return 'it'
  if (path === '/rush') return 'rush'
  if (path === '/tap') return 'tap'
  // Compatibilidad: /#ranking abría el ranking de ZEEK IT.
  if (loc.hash === '#ranking') return 'it'
  return 'hub'
}

export function pathFor(route: Route) {
  return PATHS[route]
}
