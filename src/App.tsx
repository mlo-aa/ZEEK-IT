import { useCallback, useEffect, useState } from 'react'
import ArcadeHub from './arcade/ArcadeHub'
import { pathFor, routeFromLocation, type Route } from './arcade/routes'
import RushApp from './rush/RushApp'
import ZeekItApp from './ZeekItApp'

// ZEEK ARCADE: menú de juegos. Rutas simples sin librerías:
// /  → menú · /it → ZEEK IT · /rush → ZEEK RUSH
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

  if (route === 'it') return <ZeekItApp onExit={toHub} />
  if (route === 'rush') return <RushApp onExit={toHub} />
  return <ArcadeHub onOpen={go} />
}
