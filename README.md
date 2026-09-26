# ZEEK ARCADE

Colección de minijuegos de ZEEK para el stand en eventos. La gente escanea un QR
y juega desde el celular, sin cuentas ni instalación.

| Ruta | Juego |
| --- | --- |
| `/` | Menú de ZEEK ARCADE |
| `/it` | **ZEEK IT**: memorama (ver abajo) |
| `/rush` | **ZEEK RUSH** 🚀: arcade espacial de 30 segundos |
| `/#ranking` o `/it#ranking` | Ranking del día de ZEEK IT (pantalla del stand) |

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

- React 19 + Vite + TypeScript (ZEEK RUSH y el menú)
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
