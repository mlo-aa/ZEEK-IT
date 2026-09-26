import { MODES } from '../lib/constants'
import GameHud from './GameHud'
import MemoryCard from './MemoryCard'

const HINTS = {
  normal: 'Tocá una tarjeta para empezar el reloj ⏱️',
  extreme: 'Ojo: solo valen parejas del mismo ícono y color. Cada error resta tiempo.',
}

export default function GameScreen({ game }) {
  const { mode, cards, status, locked, selected, glitchIds, secondsLeft, remainingMs, matchedPairs, totalPairs, penalties, flipCard } =
    game
  const { cols, rows } = MODES[mode]
  const playable = status === 'ready' || status === 'playing'
  const boardDisabled = !playable || locked

  return (
    <main className="relative z-10 flex min-h-0 flex-1 flex-col gap-3 pt-3">
      <GameHud
        mode={mode}
        secondsLeft={secondsLeft}
        remainingMs={remainingMs}
        matchedPairs={matchedPairs}
        totalPairs={totalPairs}
        penalties={penalties}
        started={status !== 'ready'}
      />

      <p
        className={`min-h-10 text-center text-sm leading-tight font-semibold text-white/70 transition-opacity ${
          status === 'ready' ? 'opacity-100' : 'opacity-0'
        }`}
        aria-hidden={status !== 'ready'}
      >
        {HINTS[mode]}
      </p>

      <div className="board-area relative grid min-h-0 flex-1 place-items-center">
        <div className="board" data-layout={`${cols}x${rows}`} role="group" aria-label="Tablero de memoria">
          {cards.map((card, i) => (
            <MemoryCard
              key={card.id}
              card={card}
              position={i + 1}
              isMiss={locked && status === 'playing' && selected.includes(card.id)}
              isGlitch={glitchIds.includes(card.id)}
              disabled={boardDisabled}
              onFlip={flipCard}
            />
          ))}
        </div>
        {glitchIds.length > 0 && (
          <div className="glitch-banner font-display" role="status">
            ⚠ Glitch
          </div>
        )}
      </div>
    </main>
  )
}
