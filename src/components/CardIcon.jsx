const PURPLE = '#6335ED'

const common = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

const ICONS = {
  ia: (
    <>
      <path d="M17 6v5M24 6v5M31 6v5M17 37v5M24 37v5M31 37v5M6 17h5M6 24h5M6 31h5M37 17h5M37 24h5M37 31h5" />
      <rect x="11" y="11" width="26" height="26" rx="5" fill={PURPLE} />
      <path
        d="M24 15.5c.9 4.6 3.9 7.6 8.5 8.5-4.6.9-7.6 3.9-8.5 8.5-.9-4.6-3.9-7.6-8.5-8.5 4.6-.9 7.6-3.9 8.5-8.5Z"
        fill="#01E576"
      />
    </>
  ),
  robot: (
    <>
      <path d="M24 5v6" />
      <circle cx="24" cy="5" r="2.2" fill={PURPLE} />
      <rect x="9" y="11" width="30" height="24" rx="7" fill={PURPLE} />
      <path d="M5 20v8M43 20v8" />
      <circle cx="18" cy="22" r="3.4" fill="#01E576" />
      <circle cx="30" cy="22" r="3.4" fill="#01E576" />
      <path d="M18 29.5h12" />
      <path d="M17 35v4a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-4" />
    </>
  ),
  startup: (
    <>
      <path
        d="M29 30c7-6 11.5-14 11-24-10-.5-18 4-24 11l-6 1-5 6 7 2 6 6 2 7 6-5 3-4Z"
        fill={PURPLE}
      />
      <circle cx="30.5" cy="17.5" r="3.6" fill="#01E576" />
      <path d="M13 35c-3 1-5 4-6 8 4-1 7-3 8-6" fill="#01E576" />
    </>
  ),
  laptop: (
    <>
      <rect x="9" y="9" width="30" height="21" rx="3" fill={PURPLE} />
      <path d="M15 17l4 3-4 3M22 23h6" stroke="#01E576" />
      <path d="M4 35h40l-2.5 4.5a2 2 0 0 1-1.8 1H8.3a2 2 0 0 1-1.8-1Z" />
    </>
  ),
  comunidad: (
    <>
      <circle cx="12" cy="17" r="4.5" />
      <circle cx="36" cy="17" r="4.5" />
      <path d="M4 36c0-5 3.5-8.5 8-8.5 2 0 3.7.6 5 1.8M44 36c0-5-3.5-8.5-8-8.5-2 0-3.7.6-5 1.8" />
      <circle cx="24" cy="14" r="6" fill={PURPLE} />
      <path d="M13 41c0-7 4.9-11.5 11-11.5S35 34 35 41Z" fill={PURPLE} />
    </>
  ),
  innovacion: (
    <>
      <path d="M24 3v4M9 9.5l3 3M39 9.5l-3 3M4 23h4M44 23h-4" />
      <path
        d="M17.5 34.5c0-3-1.5-4.8-3.3-7A11 11 0 1 1 35 23c0 2-.6 3.2-1.6 4.5-1.8 2.2-3.3 4-3.3 7Z"
        fill={PURPLE}
      />
      <path d="M18 39h12M20 44h8" />
      <path d="M21 26l3-5 3 5" stroke="#01E576" />
    </>
  ),
}

export default function CardIcon({ type, className = '' }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className={className} {...common}>
      {ICONS[type]}
    </svg>
  )
}
