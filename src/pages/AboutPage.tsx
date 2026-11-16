import { Link } from 'react-router'
import heroColeccion from '../assets/editorial/hero-coleccion.webp'
import { HeroStats } from '../components/HeroExtras'
import { config } from '../config'

/** Nosotros: solo hechos confirmados por la tienda (cifras, materiales, origen). */
export function AboutPage() {
  return (
    <div className="grid gap-12 py-4 lg:grid-cols-12 lg:items-center lg:gap-10">
      <div className="lg:col-span-7">
        <h1 className="text-[clamp(2.75rem,6vw,4.75rem)] leading-[0.98] tracking-[-0.04em]">
          <span className="block font-light text-brand-muted">Somos</span>
          <span className="block font-bold text-brand-700">{config.storeName}.</span>
        </h1>
        <div className="mt-8 max-w-[38rem] space-y-4 text-[1.125rem] leading-relaxed text-ink-2">
          <p>
            Reunimos piezas <strong className="font-semibold text-ink">hechas a mano en el Perú</strong>: plata,
            alpaca, cerámica y textiles de telar.
          </p>
          <p>
            Trabajamos junto a talleres familiares y llevamos más de diez años en el mercado. Nuestras piezas vienen de
            regiones como Lima y Puno.
          </p>
        </div>
        <HeroStats className="mt-10 max-w-[34rem]" />
        <div className="mt-10 flex flex-wrap gap-3">
          <Link to="/productos" className="btn btn--lg btn--pill pr-5 pl-6">
            Ver catálogo
          </Link>
          <Link to="/contacto" className="btn btn--lg btn--ghost btn--pill px-7">
            Contacto
          </Link>
        </div>
      </div>
      <figure className="relative mx-auto lg:col-span-5">
        <img
          src={heroColeccion}
          alt="Piezas de la tienda sobre pedestales blancos"
          width={791}
          height={1400}
          loading="lazy"
          className="h-[28rem] w-auto drop-shadow-[0_26px_22px_rgb(23_22_43/0.18)] lg:h-[36rem]"
        />
        <figcaption className="absolute top-4 right-0 rounded-full bg-surface/85 px-2 py-0.5 text-[0.75rem] text-ink-3">
          Imagen ilustrativa
        </figcaption>
      </figure>
    </div>
  )
}
