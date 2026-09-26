// Garabatos decorativos al estilo del flyer. Puramente visuales.
function Sparkle({ className, color }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round">
      <path d="M20 3v34M3 20h34M8 8l24 24M32 8L8 32" />
    </svg>
  )
}

function Dashes({ className, color }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round">
      <path d="M6 30l8-8M16 34l4-12M28 32l2-10" />
    </svg>
  )
}

export default function Decorations() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      <div className="bg-grid absolute inset-0" />
      <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-zeek/30 blur-3xl md:h-[32rem] md:w-[32rem]" />
      <div className="absolute -right-24 -bottom-24 h-72 w-72 rounded-full bg-neon/15 blur-3xl md:h-[32rem] md:w-[32rem]" />
      <Sparkle className="animate-float absolute top-[42%] left-[2%] h-7 w-7 opacity-80" color="#6335ED" />
      <Sparkle className="animate-float absolute right-[8%] bottom-[22%] h-6 w-6 opacity-70 [animation-delay:1.2s]" color="#01E576" />
      <Dashes className="animate-float absolute right-[22%] bottom-[3%] h-10 w-10 [--rot:20deg] [animation-delay:0.6s]" color="#01E576" />
      <Dashes className="animate-float absolute bottom-[12%] left-[8%] h-9 w-9 [--rot:-150deg] [animation-delay:2s]" color="#6335ED" />
    </div>
  )
}
