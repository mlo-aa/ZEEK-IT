export default function Trophy() {
  const rays = [-60, -30, 0, 30, 60, 120, 150, 210, 240]
  return (
    <div className="relative grid h-40 w-40 place-items-center" aria-hidden="true">
      {rays.map((deg, i) => (
        <span
          key={deg}
          className="absolute top-1/2 left-1/2 h-2 w-9"
          style={{ transform: `translate(-50%, -50%) rotate(${deg - 90}deg) translateX(76px)` }}
        >
          <span
            className={`animate-ray block h-full w-full rounded-full ${i % 2 ? 'bg-zeek' : 'bg-neon'}`}
            style={{ animationDelay: `${i * 0.12}s` }}
          />
        </span>
      ))}
      <svg viewBox="0 0 64 64" className="animate-trophy h-28 w-28 drop-shadow-[0_0_24px_rgb(1_229_118/0.55)]">
        <path d="M18 8h28v14a14 14 0 0 1-28 0Z" fill="#01E576" />
        <path d="M18 12H9v5a10 10 0 0 0 10 10M46 12h9v5a10 10 0 0 1-10 10" fill="none" stroke="#01E576" strokeWidth="4" strokeLinejoin="round" />
        <path d="M28 35h8v9h-8z" fill="#01E576" />
        <path d="M20 44h24v6H20zM16 50h32v6H16z" fill="#01E576" />
        <path d="M26 14l4 0M24 20l2 0" stroke="#000" strokeWidth="3" strokeLinecap="round" opacity=".35" />
      </svg>
    </div>
  )
}
