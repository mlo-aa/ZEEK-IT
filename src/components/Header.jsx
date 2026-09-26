function SpeakerIcon({ muted }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />
      {muted ? (
        <path d="M17 9l5 6M22 9l-5 6" />
      ) : (
        <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" />
      )}
    </svg>
  )
}

function FullscreenIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {active ? (
        <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
      ) : (
        <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
      )}
    </svg>
  )
}

const ROUND_BUTTON =
  'grid h-11 w-11 place-items-center rounded-full border-2 border-zeek/70 bg-ink/70 text-white transition hover:border-neon hover:text-neon active:scale-90'

/**
 * @param {{
 *   muted?: boolean
 *   onToggleMute?: () => void
 *   fullscreen?: { supported: boolean, active: boolean, toggle: () => void }
 *   onBack?: () => void
 * }} props
 */
export default function Header({ muted = false, onToggleMute, fullscreen, onBack }) {
  return (
    <header className="relative z-10 grid grid-cols-[1fr_auto_1fr] items-center">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          aria-label="Volver a ZEEK ARCADE"
          title="Volver a ZEEK ARCADE"
          className={`${ROUND_BUTTON} justify-self-start`}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
      ) : (
        <span aria-hidden="true" />
      )}
      <img src="/zeek-logo.png" alt="ZEEK" className="h-8 w-auto sm:h-9" width="88" height="32" />
      <div className="flex items-center justify-end gap-2">
      {fullscreen?.supported && (
        <button
          type="button"
          onClick={fullscreen.toggle}
          aria-pressed={fullscreen.active}
          aria-label={fullscreen.active ? 'Salir de pantalla completa' : 'Pantalla completa'}
          title={fullscreen.active ? 'Salir de pantalla completa' : 'Pantalla completa'}
          className={ROUND_BUTTON}
        >
          <FullscreenIcon active={fullscreen.active} />
        </button>
      )}
      {onToggleMute && (
      <button
        type="button"
        onClick={onToggleMute}
        aria-pressed={muted}
        aria-label={muted ? 'Activar sonido' : 'Silenciar sonido'}
        title={muted ? 'Activar sonido' : 'Silenciar sonido'}
        className={ROUND_BUTTON}
      >
        <SpeakerIcon muted={muted} />
      </button>
      )}
      </div>
    </header>
  )
}
