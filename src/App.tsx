import { Suspense, useCallback, useEffect, useState } from 'react'
import ArcadeHub from './arcade/ArcadeHub'
import { GAMES } from './arcade/games'
import { pathFor, routeFromLocation, type Route } from './arcade/routes'

function Loading() {
  return (
    <div className="grid min-h-dvh place-items-center">
      <span className="font-display animate-pulse text-3xl text-neon">Cargando…</span>
    </div>
  )
}

// ZEEK ARCADE: menú de juegos. Rutas simples sin librerías: / → menú,
// /<juego> → cada juego (ver src/arcade/games.tsx).
export default function App() {
  const [route, setRoute] = useState<Route>(() => routeFromLocation())

  useEffect(() => {
    const onPop = () => setRoute(routeFromLocation())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const go = useCallback((next: Route) => {
    const path = pathFor(next)
    if (window.location.pathname !== path || window.location.hash) {
      window.history.pushState(null, '', path)
    }
    setRoute(next)
    window.scrollTo(0, 0)
  }, [])

  const toHub = useCallback(() => go('hub'), [go])
  const game = GAMES.find((g) => g.id === route)

  if (!game) return <ArcadeHub onOpen={go} />
  const { App: GameComponent } = game
  return (
    <Suspense fallback={<Loading />}>
      <GameComponent onExit={toHub} />
    </Suspense>
  )
}
