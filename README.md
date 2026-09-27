# ZEEK ARCADE

Colección de minijuegos de ZEEK para el stand en eventos. La gente escanea un QR
y juega desde el celular, sin cuentas ni instalación.

| Ruta | Juego | Reto |
| --- | --- | --- |
| `/` | Menú de ZEEK ARCADE | |
| `/it` | **ZEEK IT** 🧠 memorama | 6 u 8 parejas en 45–50 s · ranking del día |
| `/rush` | **ZEEK RUSH** 🚀 esquivar asteroides | sobrevivir 30 s con 3 vidas |
| `/tap` | **ZEEK TAP** ⚡ reflejos | 15 puntos en 20 s |
| `/sort` | **ZEEK SORT** 📦 clasificar | 15 aciertos en 40 s |
| `/connect` | **ZEEK CONNECT** 🔗 unir pares | 4 pares en 45 s |
| `/stack` | **ZEEK STACK** 🏗️ apilar | 10 pisos en 45 s |
| `/maze` | **ZEEK MAZE** 🌀 laberinto | llegar al portal en 45 s con 3 vidas |
| `/break` | **ZEEK BREAK** 💥 breakout | 20 bloques en 60 s con 3 vidas |
| `/#ranking` o `/it#ranking` | Ranking del día de ZEEK IT (pantalla del stand) | |

## Estructura

```
src/
  App.tsx                 rutas (se generan del registro)
  arcade/
    games.tsx             registro de juegos: título, tarjeta, carga diferida
    ArcadeHub.tsx         menú
    kit/                  piezas compartidas por los juegos nuevos:
      GameApp.tsx           flujo bienvenida → partida → victoria/derrota
      screens.tsx           pantallas de bienvenida y resultado
      PlayLayout.tsx, Hud   pantalla de juego, HUD, cuenta 3-2-1, pausa
      usePlayState.ts       cuenta regresiva + pausa automática
      useFrame / useCanvas / particles / useFinish / testHook
  games/<juego>/          sort, connect, stack, maze, break: cada uno con
    engine.ts               lógica pura (sin DOM) y testeada
    render.ts               dibujo en canvas (connect usa SVG)
    <Juego>Play.tsx         partida · <Juego>App.tsx textos y resultado
  rush/, tap/, ZeekItApp  juegos anteriores (sin cambios de lógica)
```

Cada juego tiene su propio estado, se carga por separado y se puede
modificar sin tocar los demás. Para agregar uno: crear `src/games/<id>/`,
sumarlo a `GAME_IDS` (`arcade/routes.ts`) y a `GAMES` (`arcade/games.tsx`).

**Todos:** sin cuentas, sonido apagado por defecto, pausa automática al
cambiar de pestaña (con cuenta 3-2-1 al volver), sin desplazamiento durante la
partida, y sin QR de premio dentro de la app (lo entrega el equipo de ZEEK al
ver la pantalla de victoria).

## ZEEK SORT · CONNECT · STACK · MAZE · BREAK

- **SORT:** los objetos caen; se arrastran (o se "tiran" de costado) al
  contenedor verde o morado. 3 rondas: Hardware/Software, IA/Robótica,
  Diseño/Programación. +1 / −1 (nunca menos de 0). Caída lenta, media y rápida.
- **CONNECT:** 12 tableros 5 × 5 guardados con su solución (resolubles por
  construcción, verificados en tests). Sin diagonales ni celdas compartidas; se
  puede retroceder, cortar una línea o borrar todo. Los puntos tienen símbolos
  además de color.
- **STACK:** tocar (o barra espaciadora) suelta el bloque; lo que sobresale se
  cae. ±5 px = PERFECT y conserva el ancho. Cada piso es 8 % más rápido.
- **MAZE:** 6 laberintos; arrastre relativo o flechas/WASD. Las trampas cruzan
  el camino desde ramales laterales (siempre hay un momento para pasar); 3 vidas
  con 1,5 s de invulnerabilidad.
- **BREAK:** 20 bloques (morados de 2 golpes con grietas). El punto de impacto
  en la plataforma define el ángulo (nunca plano ni vertical). En pantallas
  anchas el campo es una columna centrada.

La dificultad de TAP, STACK y BREAK está medida con jugadores simulados en los
tests (distintos tiempos de reacción / precisión).

### Tests de navegador

`npm run build:e2e` genera un build con un gancho de pruebas
(`window.__zeek`) que el build de producción elimina.

## ZEEK RUSH

Pilotá el cohete, esquivá asteroides y recolectá estrellas. Sobreviví 30 s con
tus 3 vidas para ganar; cada estrella suma 10 puntos (opcionales).

- **Controles:** deslizar el dedo (o arrastrar con el mouse) en cualquier parte
  de la pantalla; en computadora también ← → o A / D.
- **Dificultad:** 0–10 s tranquilo, 10–20 s más rápido y denso, 20–30 s exigente.
  Tiempos, velocidades y tamaños en `src/rush/config.ts`.
- **Juego justo:** los asteroides llegan en oleadas que siempre dejan un hueco
  más ancho que el cohete, y cada hueco se solapa con el siguiente, así que
  siempre existe un camino. Los tests lo comprueban con un bot con tiempo de
  reacción humano en cientos de partidas (`src/rush/__tests__/engine.test.ts`).
- **Vidas:** cada choque resta una y da 1,5 s de invulnerabilidad (el cohete
  parpadea).
- **Pausa automática** al cambiar de pestaña o salir de la app; al volver hay
  una cuenta regresiva 3, 2, 1.
- **Sonido** apagado por defecto (botón en la pantalla de juego).
- **Motor:** Canvas 2D propio en TypeScript, sin librerías de juego:
  `engine.ts` (lógica pura, testeable), `render.ts` (dibujo), `RushGame.tsx`
  (bucle, controles, HUD).

## ZEEK TAP

Tocá los objetivos verdes (+1, con ⚡) y evitá los morados (−2, dentados con ✕).
Llegá a 15 puntos en 20 segundos; al alcanzarlos se gana en el acto. El puntaje
nunca baja de 0 y los objetivos que se escapan no restan.

- **Progresión:** 1–7 s objetivos grandes y de a uno (solo verdes); 8–14 s más
  chicos, hasta 2 a la vez y aparecen morados; 15–20 s hasta 3, verdes y morados
  alternados. Todo en `src/tap/config.ts`.
- **Toques precisos:** objetivos de al menos 60 px, área táctil un 15 % más
  grande que el dibujo, lejos de los bordes y sin superponerse (también mientras
  se mueven). Cada toque activa como máximo un objetivo.
- **Dificultad medida:** los tests simulan jugadores con distinto tiempo de
  reacción (con variación y errores): con buenos reflejos (~550 ms) se gana casi
  siempre, con ~750 ms a veces y con ~850 ms rara vez.
- **Feedback:** partículas al acertar, "+1 / −2", sacudida y destello morado al
  errar (y vibración en Android), racha con "¡Combo xN!".
- Cuenta regresiva 3-2-1, pausa automática al cambiar de pestaña, sonido apagado
  por defecto.

## ZEEK IT

Memorama web de ZEEK para el stand en eventos. La gente escanea un QR, escribe su
nombre, elige un modo y juega desde el celular. Al terminar, gane o pierda, puede ver el
QR del Instagram de ZEEK.

| | Normal | 🔥 Extremo |
| --- | --- | --- |
| Tablero | 3×4 (6 parejas) | 4×4 (8 parejas) |
| Tiempo | 45 s | 50 s |
| Error | sin castigo | −2 s |
| Tarjetas trampa | no | 3 íconos aparecen en verde **y** en negro: solo es pareja si coinciden ícono y color |
| Glitch | no | a los 15 s y 30 s dos tarjetas ocultas cambian de lugar |

En cada ronda los íconos salen al azar de un banco de 14 (IA, robot, startup,
laptop, comunidad, innovación, código, nube, datos, café, git, bug, gamer, cerebro).

Sin cuentas ni instalación.

## Stack

- React 19 + Vite + TypeScript (menú, kit y juegos nuevos)
- Tailwind CSS v4
- Tipografía Archivo auto-alojada (funciona aunque el Wi-Fi del evento sea malo)
- Sonidos generados con Web Audio (sin archivos), con botón para silenciar
- Ranking: función serverless de Vercel (`api/scores.js`) + Upstash Redis

## Desarrollo

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # tests de la lógica de los juegos
npm run typecheck
npm run build    # genera dist/
```

## Deploy en Vercel

1. Importar el repo en Vercel (Vite; `vercel.json` ya lo fija).
2. **Ranking:** en el proyecto, *Storage → Create Database → Upstash (Redis)* →
   conectarlo a `zeek-it` para Production y Preview. Eso crea las variables
   `KV_REST_API_URL` y `KV_REST_API_TOKEN` (también sirven
   `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`). Hacer *Redeploy*.
3. Usar la URL pública para el QR del stand.

Sin Redis el juego funciona igual: cada celular guarda su propio ranking local
y la pantalla lo indica.

## Ranking del día

- Un ranking por modo, que se reinicia a medianoche (hora de Costa Rica).
- Se guarda la mejor partida de cada nombre (sin distinguir mayúsculas).
- Puntaje: 100 por pareja · +200 si gana · +50 por segundo sobrante · −10 por error.
  La API lo recalcula y descarta partidas imposibles; aun así no es a prueba de
  trampas (no hay cuentas), así que conviene revisarlo antes de premiar por ranking.
- **Pantalla del stand:** abrir `https://<tu-dominio>/#ranking` en una TV o
  tablet; se actualiza sola cada 15 s.

## Cómo funciona

| Pieza | Archivo |
| --- | --- |
| Reglas del juego (reducer puro, testeado) | `src/lib/gameReducer.js` |
| Mazo, íconos al azar y tarjetas trampa | `src/lib/deck.js` |
| Modos, tiempos, íconos | `src/lib/constants.js` |
| Puntaje y validación del ranking | `src/lib/score.js`, `src/lib/rankingRules.js` |
| API del ranking | `api/scores.js` |
| Temporizador, ocultado de parejas, sonidos | `src/hooks/useMemoryGame.js` |
| Pantallas | `src/components/*Screen.jsx` |

- El reloj arranca con la primera tarjeta y se calcula con la hora real, así
  que no se atrasa si el navegador frena los timers.
- Solo se pueden revelar dos tarjetas; mientras se comprueba una pareja el
  tablero se bloquea. Las incorrectas se ocultan a los 800 ms.
- Al ganar o perder se detiene el reloj y se cancelan los timeouts pendientes.

## Instagram de ZEEK

La pantalla de victoria invita a seguir a [@zeek_cr en Instagram](https://www.instagram.com/zeek_cr)
para reclamar el premio. Al terminar cada partida (gane o pierda) también hay
un botón **QR de Instagram** con un QR grande y un botón *Abrir Instagram*: en
el iPad del stand lo escanean con su celular. El link está en `INSTAGRAM_URL`
(`src/lib/constants.js`).

## Personalizar

- Tiempos, penalización, glitches y cantidad de parejas por modo: `MODES` en `src/lib/constants.js`.
- Íconos: `ICON_POOL` en el mismo archivo + su dibujo en `src/components/CardIcon.jsx`.
- Colores: variables `--color-*` en `src/index.css`.
