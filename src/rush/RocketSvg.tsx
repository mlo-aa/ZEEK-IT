// El cohete de ZEEK RUSH en SVG, igual al del canvas, para las pantallas.
export default function RocketSvg({ className = '', flame = true }: { className?: string; flame?: boolean }) {
  return (
    <svg viewBox="-50 -60 100 130" className={className} aria-hidden="true">
      {flame && (
        <g className="rush-flame">
          <path d="M-20 26 Q0 70 20 26 Z" fill="#01E576" />
          <path d="M-10 26 Q0 52 10 26 Z" fill="#fff" />
        </g>
      )}
      <path d="M-20 1 L-50 20 L-46 30 L-18 23 Z" fill="#6335ED" />
      <path d="M20 1 L50 20 L46 30 L18 23 Z" fill="#6335ED" />
      <clipPath id="rocket-body">
        <path d="M0 -50 C30 -32 30 3 22 27 L-22 27 C-30 3 -30 -32 0 -50 Z" />
      </clipPath>
      <path d="M0 -50 C30 -32 30 3 22 27 L-22 27 C-30 3 -30 -32 0 -50 Z" fill="#fff" />
      <g clipPath="url(#rocket-body)">
        <rect x="-40" y="-55" width="80" height="25" fill="#01E576" />
        <rect x="-40" y="14" width="80" height="5" fill="#000" />
      </g>
      <circle cx="0" cy="-6" r="13" fill="#6335ED" stroke="#000" strokeWidth="4.5" />
      <circle cx="-4" cy="-9" r="4" fill="#fff" />
    </svg>
  )
}
