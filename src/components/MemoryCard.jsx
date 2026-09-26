import { memo } from 'react'
import CardIcon from './CardIcon'

const BURST_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315]

function MemoryCard({ card, position, isMiss, disabled, onFlip }) {
  const revealed = card.flipped || card.matched
  const stateLabel = card.matched ? `${card.label}, pareja encontrada` : revealed ? card.label : 'oculta'

  const classes = ['card', 'relative', 'w-full']
  if (revealed) classes.push('is-flipped')
  if (card.matched) classes.push('is-matched')
  if (isMiss) classes.push('is-miss')

  return (
    <button
      type="button"
      className={classes.join(' ')}
      aria-label={`Tarjeta ${position}: ${stateLabel}`}
      aria-disabled={disabled || revealed}
      onClick={() => !disabled && !revealed && onFlip(card.id)}
    >
      <div className="card-inner">
        <div className="card-face card-back grid place-items-center border-2 border-zeek bg-ink shadow-[inset_0_0_24px_rgb(99_53_237/0.35)]">
          <span className="font-display text-[clamp(2rem,11cqmin,3.6rem)] text-zeek drop-shadow-[0_0_10px_rgb(99_53_237/0.8)]">
            Z
          </span>
        </div>
        <div
          className={`card-face card-front flex flex-col items-center justify-center gap-1 border-2 text-ink ${
            card.matched ? 'border-neon bg-neon' : 'border-white/80 bg-neon'
          }`}
        >
          <CardIcon type={card.type} className="h-[52%] w-[52%]" />
          <span className="text-[clamp(0.62rem,3cqmin,0.9rem)] font-extrabold tracking-tight">{card.label}</span>
          {card.matched && (
            <div className="match-burst" aria-hidden="true">
              {BURST_ANGLES.map((r) => (
                <span key={r} style={{ '--r': `${r}deg` }} />
              ))}
            </div>
          )}
        </div>
      </div>
    </button>
  )
}

export default memo(MemoryCard)
