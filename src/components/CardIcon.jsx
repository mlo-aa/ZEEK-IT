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
  codigo: (
    <>
      <rect x="5" y="8" width="38" height="32" rx="5" fill={PURPLE} />
      <path d="M5 15h38" />
      <path d="M17 22l-5 5 5 5M31 22l5 5-5 5" stroke="#01E576" />
      <path d="M26 20l-4 14" stroke="#01E576" />
    </>
  ),
  nube: (
    <>
      <path
        d="M14 36a8 8 0 0 1-1.2-15.9A11 11 0 0 1 34 17.5 9.3 9.3 0 0 1 35 36Z"
        fill={PURPLE}
      />
      <path d="M24 33v-10M20 27l4-4 4 4" stroke="#01E576" />
    </>
  ),
  datos: (
    <>
      <path d="M9 11v26c0 3 6.7 5.5 15 5.5S39 40 39 37V11" fill={PURPLE} />
      <ellipse cx="24" cy="11" rx="15" ry="5.5" fill={PURPLE} />
      <path d="M9 20c0 3 6.7 5.5 15 5.5S39 23 39 20M9 28.5c0 3 6.7 5.5 15 5.5s15-2.5 15-5.5" />
      <circle cx="32" cy="31" r="1.4" fill="#01E576" stroke="none" />
    </>
  ),
  cafe: (
    <>
      <path d="M8 18h26v12a10 10 0 0 1-10 10h-6A10 10 0 0 1 8 30Z" fill={PURPLE} />
      <path d="M34 21h3a5 5 0 0 1 0 10h-3" />
      <path d="M16 5c-2 3 2 5 0 8M24 5c-2 3 2 5 0 8" stroke="#01E576" />
      <path d="M6 44h30" />
    </>
  ),
  git: (
    <>
      <path d="M15 12v24M15 30c0-8 18-6 18-14" />
      <circle cx="15" cy="10" r="4.5" fill={PURPLE} />
      <circle cx="15" cy="38" r="4.5" fill={PURPLE} />
      <circle cx="33" cy="13" r="4.5" fill="#01E576" />
    </>
  ),
  bug: (
    <>
      <path d="M17 13a7 7 0 0 1 14 0" fill={PURPLE} />
      <rect x="13" y="15" width="22" height="26" rx="11" fill={PURPLE} />
      <path d="M24 17v24M13 23H6M42 23h-7M13 31H6M42 31h-7M15 38l-6 5M33 38l6 5M18 8l-3-3M30 8l3-3" />
      <circle cx="19" cy="25" r="1.8" fill="#01E576" stroke="none" />
      <circle cx="29" cy="31" r="1.8" fill="#01E576" stroke="none" />
    </>
  ),
  gamer: (
    <>
      <path
        d="M14 13h20a10 10 0 0 1 9.7 7.6l2 8.6a6 6 0 0 1-10.4 5.3L31 30H17l-4.3 4.5A6 6 0 0 1 2.3 29.2l2-8.6A10 10 0 0 1 14 13Z"
        fill={PURPLE}
      />
      <path d="M14 19v8M10 23h8" stroke="#01E576" />
      <circle cx="32" cy="21" r="1.8" fill="#01E576" stroke="none" />
      <circle cx="36" cy="25.5" r="1.8" fill="#01E576" stroke="none" />
    </>
  ),
  cerebro: (
    <>
      <path
        d="M24 9a6 6 0 0 0-11 1.5A6.5 6.5 0 0 0 8 21a7 7 0 0 0 2 11 7 7 0 0 0 9 7.5A5 5 0 0 0 24 42Z"
        fill={PURPLE}
      />
      <path
        d="M24 9a6 6 0 0 1 11 1.5A6.5 6.5 0 0 1 40 21a7 7 0 0 1-2 11 7 7 0 0 1-9 7.5A5 5 0 0 1 24 42Z"
        fill={PURPLE}
      />
      <path d="M24 9v33" />
      <path d="M15 20c3 0 4 2 4 4M33 20c-3 0-4 2-4 4M14 31c2-1 4 0 5 2M34 31c-2-1-4 0-5 2" stroke="#01E576" />
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
