# ZEEK IT

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

- React 19 + Vite
- Tailwind CSS v4
- Tipografía Archivo auto-alojada (funciona aunque el Wi-Fi del evento sea malo)
- Sonidos generados con Web Audio (sin archivos), con botón para silenciar
- Ranking: función serverless de Vercel (`api/scores.js`) + Upstash Redis

## Desarrollo

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # tests de la lógica del juego
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
