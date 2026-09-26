import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import QRCode from 'qrcode'
import { PRIZE_QR } from '../lib/constants'

function GiftIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5" />
    </svg>
  )
}

const isLink = /^https?:\/\//i.test(PRIZE_QR)
const prettyUrl = (url) => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')

// Botón "Ver QR del premio" + ventana con el QR grande y el link.
export default function PrizeQr({ className = '' }) {
  const [open, setOpen] = useState(false)
  const [svg, setSvg] = useState('')
  const closeRef = useRef(null)

  useEffect(() => {
    QRCode.toString(PRIZE_QR, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#000000', light: '#ffffff' } })
      .then(setSvg)
      .catch(() => setSvg(''))
  }, [])

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`font-display flex w-full items-center justify-center gap-2 rounded-full border-2 border-neon bg-ink/70 px-6 py-4 text-lg tracking-wide text-neon transition hover:bg-neon hover:text-ink active:scale-95 ${className}`}
      >
        <GiftIcon className="h-6 w-6" />
        Ver QR del premio
      </button>

      {open &&
        createPortal(
        <div
          className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-ink/90 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="prize-qr-title"
            onClick={(e) => e.stopPropagation()}
            className="animate-fade-up flex w-full max-w-sm flex-col items-center gap-4 rounded-3xl border-2 border-neon bg-ink p-6 text-center shadow-[0_0_40px_rgb(1_229_118/0.35)] md:max-w-md"
          >
            <h2 id="prize-qr-title" className="font-display text-3xl text-neon">
              Tu premio
            </h2>
            <p className="text-sm leading-relaxed text-white/85">
              {isLink ? (
                'Escaneá este código con tu celular para reclamar tu premio.'
              ) : (
                <>
                  Escaneá este código con la app de <strong className="text-white">Lyfter Connect</strong> para ganar tu
                  insignia de ZEEK.
                </>
              )}
            </p>
            {svg ? (
              <div
                role="img"
                aria-label={isLink ? `Código QR que abre ${PRIZE_QR}` : 'Código QR de la insignia de ZEEK en Lyfter Connect'}
                className="w-full max-w-[18rem] rounded-2xl bg-white p-3 md:max-w-[22rem] [&>svg]:h-auto [&>svg]:w-full"
                dangerouslySetInnerHTML={{ __html: svg }}
              />
            ) : (
              <div className="grid aspect-square w-full max-w-[18rem] place-items-center rounded-2xl bg-white/10 text-sm text-white/60">
                Generando QR…
              </div>
            )}
            {isLink ? (
              <>
              <a
                href={PRIZE_QR}
                target="_blank"
                rel="noopener noreferrer"
                className="font-display flex w-full items-center justify-center gap-2 rounded-full bg-neon px-5 py-3.5 text-base tracking-wide text-ink transition active:scale-95"
              >
                Abrir link
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M7 17L17 7M9 7h8v8" />
                </svg>
              </a>
              <p className="-mt-1 text-xs break-all text-white/50">{prettyUrl(PRIZE_QR)}</p>
              </>
            ) : (
              <p className="text-xs leading-relaxed text-white/60">
                ¿Jugaste en tu propio celular? Escaneá el QR impreso en el stand de ZEEK.
              </p>
            )}
            <button
              ref={closeRef}
              type="button"
              onClick={() => setOpen(false)}
              className="text-sm font-bold text-white/70 underline underline-offset-4"
            >
              Cerrar
            </button>
          </div>
        </div>,
        // Fuera del árbol animado: un ancestro con transform rompe position: fixed.
        document.body,
      )}
    </>
  )
}
