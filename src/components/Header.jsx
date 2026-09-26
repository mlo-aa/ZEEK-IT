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

export default function Header({ muted, onToggleMute }) {
  return (
    <header className="relative z-10 flex items-center justify-between">
      <img src="/zeek-logo.png" alt="ZEEK" className="h-8 w-auto sm:h-9" width="88" height="32" />
      <button
        type="button"
        onClick={onToggleMute}
        aria-pressed={muted}
        aria-label={muted ? 'Activar sonido' : 'Silenciar sonido'}
        title={muted ? 'Activar sonido' : 'Silenciar sonido'}
        className="grid h-11 w-11 place-items-center rounded-full border-2 border-zeek/70 bg-ink/70 text-white transition hover:border-neon hover:text-neon active:scale-90"
      >
        <SpeakerIcon muted={muted} />
      </button>
    </header>
  )
}
