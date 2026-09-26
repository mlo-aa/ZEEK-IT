# ZEEK IT

Memorama web de ZEEK para el stand en eventos. La gente escanea un QR, abre el
juego en el celular y tiene **45 segundos** para encontrar las **6 parejas**
(IA, Robot, Startup, Laptop, Comunidad, Innovación). Si gana, muestra la pantalla
de victoria al equipo de ZEEK para recibir el QR de premio (que **no** está en la app).

Sin cuentas, sin backend, sin instalar nada.

## Stack

- React 19 + Vite
- Tailwind CSS v4
- Tipografía Archivo auto-alojada (funciona aunque el Wi-Fi del evento sea malo)
- Sonidos generados con Web Audio (sin archivos), con botón para silenciar

## Desarrollo

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # tests de la lógica del juego
npm run build    # genera dist/
```

## Deploy en Vercel

1. Importar el repo en Vercel (se detecta Vite automáticamente; `vercel.json` ya lo fija).
2. Deploy. Usar la URL pública para generar el QR del stand.

O por CLI: `npx vercel --prod`.

## Cómo funciona

| Pieza | Archivo |
| --- | --- |
| Reglas del juego (reducer puro, testeado) | `src/lib/gameReducer.js` |
| Mazo y mezcla (Fisher-Yates) | `src/lib/deck.js` |
| Temporizador, ocultado de parejas, sonidos | `src/hooks/useMemoryGame.js` |
| Constantes (duración, 800 ms, etc.) | `src/lib/constants.js` |
| Pantallas | `src/components/*Screen.jsx` |

- El reloj arranca con la primera tarjeta y se calcula con la hora real, así
  que no se atrasa si el navegador frena los timers.
- Solo se pueden revelar dos tarjetas; mientras se comprueba una pareja el
  tablero se bloquea. Las incorrectas se ocultan a los 800 ms.
- Al ganar o perder se detiene el reloj y se cancelan los timeouts pendientes.

## Validar una victoria en el stand

La pantalla de victoria muestra un **código aleatorio** (`ZK-XXXX`), la **hora en
que se ganó** y un **reloj en vivo** que avanza cada segundo. Si el reloj no se
mueve o la hora no coincide, probablemente sea una captura de pantalla.
Recargar la página vuelve al inicio, así que la victoria no se puede "guardar".

## Personalizar

- Tiempo: `GAME_DURATION_MS` en `src/lib/constants.js`.
- Tarjetas: `CARD_TYPES` en el mismo archivo + su ícono en `src/components/CardIcon.jsx`.
- Colores: variables `--color-*` en `src/index.css`.
