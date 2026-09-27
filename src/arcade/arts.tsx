import CardIcon from '../components/CardIcon'
import RocketSvg from '../rush/RocketSvg'
import { BadTarget, GoodTarget } from '../tap/TapScreens'

// Ilustraciones de las tarjetas del menú.

export function MemoryArt() {
  return (
    <div className="relative h-full w-full" aria-hidden="true">
      <div className="absolute top-1/2 left-1/2 grid h-[70%] w-[46%] -translate-x-[85%] -translate-y-1/2 -rotate-12 place-items-center rounded-xl border-2 border-zeek bg-ink">
        <span className="font-display text-2xl text-zeek">Z</span>
      </div>
      <div className="absolute top-1/2 left-1/2 grid h-[70%] w-[46%] -translate-x-[15%] -translate-y-1/2 rotate-6 place-items-center rounded-xl bg-neon text-ink">
        <CardIcon type="ia" className="h-[60%] w-[60%]" />
      </div>
    </div>
  )
}

export function RushArt() {
  return (
    <div className="relative h-full w-full" aria-hidden="true">
      <span className="absolute top-[12%] left-[12%] h-4 w-4 rotate-12 rounded-md border-2 border-neon" />
      <span className="absolute right-[14%] bottom-[18%] h-3 w-3 -rotate-12 rounded-md border-2 border-zeek-light" />
      <span className="absolute top-[14%] right-[20%] text-sm text-white">★</span>
      <div className="absolute inset-0 grid place-items-center">
        <RocketSvg className="rush-float h-[85%] rotate-12" />
      </div>
    </div>
  )
}

export function TapArt() {
  return (
    <div className="relative h-full w-full" aria-hidden="true">
      <GoodTarget className="tap-float absolute top-[8%] left-[10%] h-[55%] w-[55%]" />
      <BadTarget className="tap-float absolute right-[6%] bottom-[8%] h-[42%] w-[42%] [animation-delay:0.7s]" />
    </div>
  )
}

export function SortArt() {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
      <rect x="38" y="8" width="24" height="24" rx="6" fill="#fff" />
      <text x="50" y="26" textAnchor="middle" fontSize="15">💾</text>
      <path d="M44 38 L30 56 M56 38 L70 56" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeDasharray="4 5" />
      <rect x="8" y="60" width="38" height="32" rx="8" fill="none" stroke="#01E576" strokeWidth="4" />
      <rect x="54" y="60" width="38" height="32" rx="8" fill="none" stroke="#6335ED" strokeWidth="4" />
      <rect x="8" y="80" width="38" height="12" rx="4" fill="#01E576" opacity="0.5" />
      <rect x="54" y="80" width="38" height="12" rx="4" fill="#6335ED" opacity="0.5" />
    </svg>
  )
}

export function ConnectArt() {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
      <rect x="6" y="6" width="88" height="88" rx="10" fill="none" stroke="#6335ED" strokeWidth="2.5" opacity="0.7" />
      <path d="M24 24 H76 V50" stroke="#01E576" strokeWidth="7" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M24 76 V50 H50 V76" stroke="#8A66FF" strokeWidth="7" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="24" cy="24" r="8" fill="#01E576" />
      <circle cx="76" cy="50" r="8" fill="#01E576" />
      <circle cx="24" cy="76" r="8" fill="#8A66FF" />
      <circle cx="50" cy="76" r="8" fill="#8A66FF" />
      <circle cx="76" cy="76" r="8" fill="#38BDF8" />
    </svg>
  )
}

export function StackArt() {
  const blocks = [
    { y: 80, w: 70, c: '#6335ED' },
    { y: 66, w: 62, c: '#01E576' },
    { y: 52, w: 62, c: '#8A66FF' },
    { y: 38, w: 50, c: '#01E576' },
    { y: 24, w: 50, c: '#6335ED' },
  ]
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
      {blocks.map((b, i) => (
        <rect key={i} x={50 - b.w / 2 + (i === 4 ? 12 : 0)} y={b.y} width={b.w} height="12" rx="3" fill={b.c} />
      ))}
      <text x="50" y="16" textAnchor="middle" fontSize="11" fontWeight="900" fill="#01E576">
        PERFECT!
      </text>
    </svg>
  )
}

export function MazeArt() {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
      <path
        d="M8 8 H92 V92 H8 Z M8 30 H60 M80 8 V50 M30 50 H92 M30 50 V72 M50 72 H92 M8 72 H20"
        stroke="#6335ED"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="20" cy="19" r="7" fill="#01E576" />
      <circle cx="80" cy="82" r="8" fill="none" stroke="#8A66FF" strokeWidth="4" />
      <circle cx="80" cy="82" r="3" fill="#fff" />
    </svg>
  )
}

export function BreakArt() {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
      {[0, 1, 2].map((row) =>
        [0, 1, 2, 3].map((col) =>
          row === 1 && col === 2 ? null : (
            <rect
              key={`${row}-${col}`}
              x={8 + col * 22}
              y={10 + row * 12}
              width="18"
              height="8"
              rx="2"
              fill={row === 0 ? '#6335ED' : '#01E576'}
            />
          ),
        ),
      )}
      <circle cx="60" cy="62" r="6" fill="#fff" />
      <path d="M60 62 L44 78" stroke="#01E576" strokeWidth="2" strokeDasharray="3 3" />
      <rect x="28" y="84" width="44" height="7" rx="3.5" fill="#01E576" />
    </svg>
  )
}
