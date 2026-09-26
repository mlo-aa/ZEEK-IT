// "ZEEK IT" en grande, con el IT en morado y rayitas tipo flyer.
export default function Logotype({ className = '' }) {
  return (
    <h1 className={`font-display relative select-none text-center ${className}`}>
      <span className="block -rotate-3 text-[clamp(4.2rem,22vw,8rem)] text-neon drop-shadow-[0_6px_0_#6335ED]">
        ZEEK
      </span>
      <span className="relative mt-1 inline-block rotate-2 text-[clamp(3.6rem,19vw,7rem)] text-zeek drop-shadow-[0_5px_0_#01E576]">
        <span aria-hidden="true" className="absolute top-1/2 -left-12 flex -translate-y-1/2 flex-col gap-2">
          <i className="block h-1.5 w-8 -rotate-12 rounded-full bg-white/90" />
          <i className="block h-1.5 w-6 rotate-6 rounded-full bg-neon" />
        </span>
        IT
        <span aria-hidden="true" className="absolute top-1/2 -right-12 flex -translate-y-1/2 flex-col gap-2">
          <i className="block h-1.5 w-8 rotate-12 rounded-full bg-neon" />
          <i className="block h-1.5 w-6 -rotate-6 rounded-full bg-white/90" />
        </span>
      </span>
    </h1>
  )
}
