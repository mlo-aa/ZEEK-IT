import GameHud from './GameHud'
import MemoryCard from './MemoryCard'

export default function GameScreen({ game }) {
  const { cards, status, locked, selected, secondsLeft, remainingMs, matchedPairs, flipCard } = game
  const playable = status === 'ready' || status === 'playing'
  const boardDisabled = !playable || locked

  return (
    <main className="relative z-10 flex min-h-0 flex-1 flex-col gap-4 pt-3">
      <GameHud
        secondsLeft={secondsLeft}
        remainingMs={remainingMs}
        matchedPairs={matchedPairs}
        started={status !== 'ready'}
      />

      <p
        className={`text-center text-sm font-semibold text-white/70 transition-opacity ${
          status === 'ready' ? 'opacity-100' : 'opacity-0'
        }`}
        aria-hidden={status !== 'ready'}
      >
        Tocá una tarjeta para empezar el reloj ⏱️
      </p>

      <div className="board-area grid min-h-0 flex-1 place-items-center">
        <div className="board" role="group" aria-label="Tablero de memoria">
          {cards.map((card, i) => (
            <MemoryCard
              key={card.id}
              card={card}
              position={i + 1}
              isMiss={locked && status === 'playing' && selected.includes(card.id)}
              disabled={boardDisabled}
              onFlip={flipCard}
            />
          ))}
        </div>
      </div>
    </main>
  )
}
