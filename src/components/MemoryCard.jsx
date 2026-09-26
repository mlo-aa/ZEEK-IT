import { memo } from 'react'
import CardIcon from './CardIcon'

const BURST_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315]

const FRONT_STYLES = {
  neon: 'border-white/80 bg-neon text-ink',
  dark: 'border-neon bg-ink text-neon shadow-[inset_0_0_18px_rgb(1_229_118/0.25)]',
}

function MemoryCard({ card, position, isMiss, isGlitch, disabled, onFlip }) {
  const revealed = card.flipped || card.matched
  const name = card.variant === 'dark' ? `${card.label} oscura` : card.label
  const stateLabel = card.matched ? `${name}, pareja encontrada` : revealed ? name : 'oculta'

  const classes = ['card', 'relative', 'w-full']
  if (revealed) classes.push('is-flipped')
  if (card.matched) classes.push('is-matched')
  if (isMiss) classes.push('is-miss')
  if (isGlitch) classes.push('is-glitch')

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
          <span className="font-display text-[clamp(1.6rem,11cqmin,3.6rem)] text-zeek drop-shadow-[0_0_10px_rgb(99_53_237/0.8)]">
            Z
          </span>
        </div>
        <div
          className={`card-face card-front flex flex-col items-center justify-center gap-0.5 border-2 ${FRONT_STYLES[card.variant]}`}
        >
          <CardIcon type={card.type} className="h-[52%] w-[52%]" />
          <span className="text-[clamp(0.55rem,2.8cqmin,0.9rem)] leading-none font-extrabold tracking-tight">
            {card.label}
          </span>
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
