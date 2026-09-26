const VARIANTS = {
  neon: 'bg-neon text-ink hover:brightness-110 animate-glow',
  purple: 'bg-zeek text-white hover:bg-zeek-light shadow-[0_8px_30px_rgb(99_53_237/0.45)]',
}

export default function Button({ variant = 'neon', className = '', children, ...props }) {
  return (
    <button
      type="button"
      className={`font-display w-full rounded-full px-8 py-5 text-xl tracking-wide transition active:scale-95 sm:text-2xl ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
