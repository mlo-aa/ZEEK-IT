# ZEEK IT

Memorama web de ZEEK para el stand en eventos. La gente escanea un QR, abre el
juego en el celular y tiene **45 segundos** para encontrar las **6 parejas**
(IA, Robot, Startup, Laptop, Comunidad, Innovación). Si gana, sigue a ZEEK en Instagram
para reclamar el QR de premio (que **no** está en la app).

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

## Reclamar el premio

La pantalla de victoria invita a seguir a [@zeek_cr en Instagram](https://www.instagram.com/zeek_cr)
para reclamar el QR de premio. El link abre en una pestaña nueva, así que la
pantalla de victoria sigue abierta en el juego. Recargar la página vuelve al inicio.

## Personalizar

- Tiempo: `GAME_DURATION_MS` en `src/lib/constants.js`.
- Tarjetas: `CARD_TYPES` en el mismo archivo + su ícono en `src/components/CardIcon.jsx`.
- Colores: variables `--color-*` en `src/index.css`.
