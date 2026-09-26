import { useMemo } from 'react'

const COLORS = ['#01E576', '#6335ED', '#FFFFFF', '#8A66FF']

export default function Confetti({ count = 44 }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: `${Math.random() * 100}%`,
        background: COLORS[i % COLORS.length],
        '--drift': `${(Math.random() - 0.5) * 120}px`,
        '--spin': `${(Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 540)}deg`,
        '--dur': `${2.6 + Math.random() * 2.2}s`,
        '--delay': `${-Math.random() * 4}s`,
      })),
    [count],
  )

  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {pieces.map((style, i) => (
        <span key={i} className="confetti" style={style} />
      ))}
    </div>
  )
}
