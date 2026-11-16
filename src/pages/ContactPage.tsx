import { Link } from 'react-router'
import { SocialLinks } from '../components/HeroExtras'
import { config } from '../config'

/** Contacto: WhatsApp y redes configurados en config.js. Sin datos inventados. */
export function ContactPage() {
  const wa = config.whatsappNumber
    ? `https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent(`¡Hola ${config.storeName}! Tengo una consulta.`)}`
    : ''

  return (
    <div className="mx-auto max-w-[44rem] py-4">
      <h1 className="text-[clamp(2.75rem,6vw,4.75rem)] leading-[0.98] tracking-[-0.04em]">
        <span className="block font-light text-brand-muted">Hablemos</span>
        <span className="block font-bold text-brand-700">por WhatsApp.</span>
      </h1>
      <p className="mt-6 max-w-[34rem] text-[1.125rem] leading-relaxed text-ink-2">
        Escríbenos para consultar disponibilidad, precios o hacer tu pedido. También puedes seguirnos en redes.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <section className="rounded-3xl bg-surface p-6 shadow-[0_24px_50px_-34px_rgb(23_22_43/0.45)]">
          <h2 className="text-[1.25rem] font-semibold tracking-[-0.02em] text-ink">WhatsApp</h2>
          <p className="mt-1 text-[0.9375rem] text-ink-3">Respuesta directa de la tienda.</p>
          {wa ? (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn--lg btn--pill mt-5 px-6">
              Escribir por WhatsApp
            </a>
          ) : (
            <p className="mt-5 text-[0.9375rem] text-ink-2">Muy pronto podrás escribirnos por aquí.</p>
          )}
        </section>
        <section className="rounded-3xl bg-surface p-6 shadow-[0_24px_50px_-34px_rgb(23_22_43/0.45)]">
          <h2 className="text-[1.25rem] font-semibold tracking-[-0.02em] text-ink">Redes sociales</h2>
          <p className="mt-1 text-[0.9375rem] text-ink-3">Novedades y piezas nuevas.</p>
          <SocialLinks className="mt-5" />
        </section>
      </div>

      <Link to="/productos" className="mt-10 inline-block text-[0.9375rem] font-medium text-brand-700 hover:underline">
        Ver el catálogo →
      </Link>
    </div>
  )
}
