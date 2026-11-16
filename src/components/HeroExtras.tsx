import { useEffect, useRef, useState } from 'react'
import { config } from '../config'

/* ------------------------------------------------------------------ */
/* Cifras de la tienda (dato del propietario)                          */
/* ------------------------------------------------------------------ */

/* Íconos de línea, mismo trazo que el resto del sitio */
const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' } as const
const STAT_ICONS = {
  // Calendario: años en el mercado
  years: (
    <g {...stroke}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
      <path d="m9 14.5 2 2 4-4" />
    </g>
  ),
  // Caja: productos
  products: (
    <g {...stroke}>
      <path d="M12 3 20 7.2v9.6L12 21 4 16.8V7.2Z" />
      <path d="M4 7.2 12 11.4l8-4.2M12 11.4V21" />
      <path d="m8 5.1 8 4.2" />
    </g>
  ),
  // Taller: casa con techo a dos aguas y puerta
  workshops: (
    <g {...stroke}>
      <path d="M3 10.5 12 4l9 6.5" />
      <path d="M5 9v11h14V9" />
      <path d="M10 20v-5.5h4V20" />
      <path d="M8 12.5h.01M16 12.5h.01" />
    </g>
  ),
} as const

const STATS = [
  { icon: 'years', prefix: '+', value: 10, label: 'años en el mercado' },
  { icon: 'products', prefix: '+', value: 3000, label: 'productos' },
  { icon: 'workshops', prefix: '', value: 24, label: 'talleres familiares aliados' },
] as const

// Sin separador de miles: el propietario escribe "3000"
const fmt = (n: number) => String(n)

/** Cuenta de 0 al valor cuando entra en pantalla. El valor final está en el HTML desde el inicio. */
function CountUp({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [shown, setShown] = useState(value)

  useEffect(() => {
    const el = ref.current
    if (!el || !('IntersectionObserver' in window)) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      io.disconnect()
      const t0 = performance.now()
      const dur = 1400
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / dur)
        const eased = 1 - Math.pow(1 - p, 4)
        setShown(Math.round(value * eased))
        if (p < 1) raf = requestAnimationFrame(tick)
      }
      setShown(0)
      raf = requestAnimationFrame(tick)
    })
    io.observe(el)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [value])

  return <span ref={ref}>{fmt(shown)}</span>
}

/** Cifras en tarjetas separadas: número grande arriba, texto debajo. */
/**
 * Cifras en tarjetas separadas, en rojo de marca, una al lado de la otra.
 * - grid: número arriba, texto debajo (columnas angostas: móvil, tableta).
 * - row: tarjetas anchas horizontales (ícono · número + texto), para el hero de escritorio.
 */
export function HeroStats({ className = '', layout = 'grid' }: { className?: string; layout?: 'grid' | 'row' }) {
  const row = layout === 'row'
  return (
    <ul className={`${row ? 'flex items-start justify-end gap-2.5' : 'grid grid-cols-3 gap-2.5'} ${className}`} aria-label="La tienda en cifras">
      {STATS.map((s, i) => (
        <li
          key={s.label}
          // Escalera: cada tarjeta baja un escalón respecto de la anterior
          style={row ? { marginTop: `${i * 1.25}rem` } : undefined}
          className={`min-w-0 rounded-[1.25rem] bg-brand-700/90 text-white shadow-[0_18px_36px_-18px_rgb(140_28_12/0.6)] ring-1 ring-white/15 backdrop-blur-md ${
            row ? 'flex w-[9.5rem] flex-col items-start p-3.5' : 'px-2.5 pt-3 pb-3.5 min-[400px]:px-3'
          }`}
        >
          <span
            className={`flex shrink-0 items-center justify-center rounded-full bg-white text-brand-700 ${
              row ? 'mb-3 h-9 w-9' : 'mb-2.5 h-8 w-8'
            }`}
          >
            <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden="true">
              {STAT_ICONS[s.icon]}
            </svg>
          </span>
          <span className="min-w-0">
            <span
              className={`tnum block leading-none font-bold tracking-[-0.03em] ${row ? 'text-[1.875rem]' : 'text-[1.375rem] min-[400px]:text-[1.75rem]'}`}
            >
              {s.prefix}
              <CountUp value={s.value} />
            </span>
            <span className={`mt-0.5 block leading-tight text-white/85 ${row ? 'mt-1 text-[0.8125rem]' : 'text-[0.75rem] min-[400px]:text-[0.8125rem]'}`}>
              {s.label}
            </span>
          </span>
        </li>
      ))}
    </ul>
  )
}

/* ------------------------------------------------------------------ */
/* Redes sociales                                                      */
/* ------------------------------------------------------------------ */

const ICONS = {
  instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.4" cy="6.6" r="1.2" fill="currentColor" />
    </>
  ),
  facebook: (
    <path
      d="M13.5 21v-7.6h2.6l.4-3h-3V8.5c0-.9.3-1.5 1.5-1.5h1.6V4.3c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H7.8v3h2.6V21h3.1Z"
      fill="currentColor"
    />
  ),
  tiktok: (
    <path
      d="M16.6 3c.3 2.2 1.6 3.6 3.9 3.8v3a7 7 0 0 1-3.8-1.2v6.2a5.6 5.6 0 1 1-5.6-5.6c.3 0 .6 0 .9.1v3.1a2.6 2.6 0 1 0 1.8 2.5V3h2.8Z"
      fill="currentColor"
    />
  ),
} as const

/** Ícono de WhatsApp (botón flotante de contacto). */
export const WhatsAppGlyph = () => (
    <>
      <path
        d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M8.6 7.9c.2-.4.4-.4.6-.4h.5c.2 0 .4 0 .5.4l.7 1.7c.1.2 0 .4-.1.6l-.5.6c-.1.1-.2.3 0 .5.4.7 1 1.4 1.7 1.9.5.4 1 .6 1.3.7.2.1.3 0 .5-.1l.6-.8c.1-.2.3-.2.5-.1l1.6.8c.2.1.4.2.4.3 0 .2 0 .9-.4 1.4-.4.5-1.3.9-1.8.9-.6 0-1.3-.1-2.5-.7a9.6 9.6 0 0 1-3.6-3.3c-.5-.8-.8-1.6-.8-2.3 0-.8.4-1.3.6-1.5"
        fill="currentColor"
      />
    </>
)

type Network = keyof typeof ICONS
const LABELS: Record<Network, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  tiktok: 'TikTok',
}

/**
 * Redes sociales, estilo discreto: círculos de contorno tenue con íconos grises.
 * Al pasar el cursor cada ícono toma el color de su red y sube un poco.
 * `title` + `message` añaden un encabezado en dos niveles; `rule` prolonga una línea fina a la derecha.
 */
export function SocialLinks({
  className = '',
  title,
  message,
  rule = false,
  align = 'left',
  tone = 'light',
}: {
  className?: string
  title?: string
  message?: string
  rule?: boolean
  /** right: textos a la derecha y la línea fina a la izquierda de los íconos */
  align?: 'left' | 'right'
  /** dark: sobre fondo oscuro (pie de página) */
  tone?: 'light' | 'dark'
}) {
  const right = align === 'right'
  const links: Record<Network, string> = config.socials
  const HOVER: Record<Network, string> = {
    instagram: 'hover:text-[#E1306C] hover:border-[#E1306C]/40',
    facebook: 'hover:text-[#1877F2] hover:border-[#1877F2]/40',
    tiktok: 'hover:text-[#010101] hover:border-[#010101]/40',
  }
  const circle = `flex h-10 w-10 items-center justify-center rounded-full border transition-[color,border-color,background-color,transform,box-shadow] duration-300 ease-out-expo ${
    tone === 'dark'
      ? 'border-white/15 text-white/70 hover:!border-white hover:!bg-white'
      : 'border-ink/10 bg-surface/40 text-ink-3/70 backdrop-blur'
  }`

  return (
    <div className={className}>
      {(title || message) && (
        <div className={`mb-3 ${right ? 'text-right' : ''}`}>
          {title && <p className="text-[0.9375rem] font-semibold tracking-[-0.01em] text-ink">{title}</p>}
          {message && <p className="mt-0.5 text-[0.8125rem] leading-snug text-ink-3">{message}</p>}
        </div>
      )}
      <div className={`flex items-center gap-3 ${right ? 'flex-row-reverse' : ''}`}>
        <ul className="flex items-center gap-2" aria-label="Redes sociales">
          {(Object.keys(ICONS) as Network[]).map((n) => {
            const icon = (
              <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden="true">
                {ICONS[n]}
              </svg>
            )
            return (
              <li key={n}>
                {links[n] ? (
                  <a
                    href={links[n]}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${LABELS[n]} de ${config.storeName}`}
                    className={`${circle} ${HOVER[n]} hover:-translate-y-0.5 hover:bg-surface hover:shadow-[0_10px_20px_-12px_rgb(23_22_43/0.5)]`}
                  >
                    {icon}
                  </a>
                ) : (
                  // Enlace aún no configurado (config.js): se ve y reacciona, pero no lleva a ningún lado
                  <span
                    title={`${LABELS[n]}: próximamente`}
                    aria-label={`${LABELS[n]}: próximamente`}
                    role="img"
                    className={`${circle} ${HOVER[n]} hover:-translate-y-0.5 hover:bg-surface`}
                  >
                    {icon}
                  </span>
                )}
              </li>
            )
          })}
        </ul>
        {rule && <span className="h-px flex-1 bg-ink/10" aria-hidden="true" />}
      </div>
    </div>
  )
}
