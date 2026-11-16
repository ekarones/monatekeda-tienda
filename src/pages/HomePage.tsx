import { useQueries } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import { storeApi, useCategories, useProducts } from '../api/store'
import type { Category, ProductFilters, ProductSummary } from '../api/types'
import heroCentro from '../assets/editorial/hero-centro.webp'
import heroCentroSm from '../assets/editorial/hero-centro-sm.webp'
import heroCentroCut from '../assets/editorial/hero-centro-cut.webp'
import heroCentroSmCut from '../assets/editorial/hero-centro-sm-cut.webp'
import heroColeccion from '../assets/editorial/hero-coleccion.webp'
import photoAlpaca from '../assets/editorial/material-alpaca.webp'
import photoPlata from '../assets/editorial/material-plata.webp'
import photoTextil from '../assets/editorial/material-textil.webp'
import photoRestore from '../assets/editorial/restauracion-plata.webp'
import photoRestoreSm from '../assets/editorial/restauracion-plata-sm.webp'
import { CategoryIcon } from '../components/Ornaments'
import { PlateSkeleton, ProductCard } from '../components/ProductCard'
import { ProductImage } from '../components/ProductImage'
import { HeroStats, SocialLinks } from '../components/HeroExtras'
import { ErrorState } from '../components/States'
import { TopProducts } from '../components/TopProducts'
import { cleanName, formatPriceRange } from '../lib/format'
import { useReveal } from '../lib/useReveal'
import { config } from '../config'

type CSSVars = React.CSSProperties & { '--d'?: string }
const delay = (ms: number): CSSVars => ({ '--d': `${ms}ms` })

/* ------------------------------------------------------------------ */
/* Datos: la serie de piezas reales                                    */
/* ------------------------------------------------------------------ */

/** Solo raíces de materiales nobles. Se filtra por categoría, no por nombre. */
const SERIES_ROOTS: RegExp[] = [/plater/i, /joyer/i, /textil/i, /peluch/i, /carter/i]
/** Subcategorías que no van en la portada: recuerdos de mostrador, ropa estampada, telas sueltas */
const EXCLUDED_CATEGORY = /llaver|im[aá]n|peruaniz|amulet|souvenir|posa|\btela\b|disfra|polos?\b|gorras/i
const EXCLUDED_NAME = /prueba|patagonia|cartier|gucci|louis|tiffany|pandora|swarovski|nike|adidas/i
const SERIES = 8
const cleanKey = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim()
const hasPhoto = (p: ProductSummary) => Boolean(p.image_thumb_url || p.image_url)
/** Nombres que son códigos de inventario ("PulPlata925 0265Trebol"): no van en la portada. */
const SKU_LIKE = /[A-Za-z]\d{2,}|\d{3,}[A-Za-z]|[a-z][A-Z]/

function rank(items: ProductSummary[]) {
  return items
    .filter(
      (p) =>
        hasPhoto(p) &&
        p.in_stock &&
        !SKU_LIKE.test(p.name) &&
        !EXCLUDED_NAME.test(p.name) &&
        !EXCLUDED_CATEGORY.test(p.category?.name ?? ''),
    )
    .map((p) => ({ p, score: (p.tags.length ? 2 : 0) + (p.type === 'simple' ? 1 : 0) }))
    .sort((a, b) => b.score - a.score)
    .map((x) => x.p)
}

function useSeries() {
  const categories = useCategories()
  const roots = useMemo(
    () =>
      SERIES_ROOTS.map((re) => categories.data?.find((c) => re.test(c.name))).filter(
        (c): c is Category => Boolean(c),
      ),
    [categories.data],
  )

  const results = useQueries({
    queries: roots.map((c) => ({
      queryKey: ['products', { category_id: c.id, include_descendants: true, per_page: 24 }],
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        storeApi.products({ category_id: c.id, include_descendants: true, per_page: 24 }, signal),
      staleTime: 5 * 60_000,
    })),
  })

  const pending = categories.isPending || results.some((r) => r.isPending)
  const error = categories.error ?? results.find((r) => r.error)?.error

  const series = useMemo(() => {
    if (pending) return []
    const ranked = results.map((r) => rank(r.data?.data ?? []))
    const picked: ProductSummary[] = []
    // Por nombre: "Baby alpaca" existe bajo Peluches y bajo Textiles con ids distintos.
    const leaf = (p: ProductSummary) => cleanKey(p.category?.name ?? `#${p.id}`)
    const fits = (p: ProductSummary) =>
      !picked.some((q) => q.id === p.id || leaf(q) === leaf(p) || cleanKey(q.name) === cleanKey(p.name))
    for (const list of ranked) {
      const next = list.find(fits)
      if (next && picked.length < SERIES) picked.push(next)
    }
    for (const list of ranked) {
      for (const p of list) if (picked.length < SERIES && fits(p)) picked.push(p)
    }
    // Si faltan, se permite repetir subcategoría (nunca la misma pieza ni el mismo nombre)
    const sameName = (p: ProductSummary) => picked.some((q) => q.id === p.id || cleanKey(q.name) === cleanKey(p.name))
    for (const list of ranked) {
      for (const p of list) if (picked.length < SERIES && !sameName(p)) picked.push(p)
    }
    // Rejilla de 4 columnas: múltiplo de 4 para no dejar huérfanas
    return picked.length >= 4 ? picked.slice(0, picked.length - (picked.length % 4)) : picked
  }, [pending, results])

  // Pieza destacada: se agrega directo (simple); si se puede, de alpaca como la pieza del hero
  const featured = useMemo(() => {
    if (pending) return undefined
    const simple = results.flatMap((r) => rank(r.data?.data ?? [])).filter((p) => p.type === 'simple')
    return simple.find((p) => /alpaca/i.test(`${p.category?.name ?? ''} ${p.name}`)) ?? simple[0] ?? series[0]
  }, [pending, results, series])

  return { series, featured, pending, error, retry: () => results.forEach((r) => r.refetch()) }
}

/* ------------------------------------------------------------------ */
/* Movimiento ligado al scroll y al cursor (sin librerías)             */
/* ------------------------------------------------------------------ */

/**
 * Escribe en el elemento las variables --sy (scroll en px, acotado a su alto) y
 * --px (cursor horizontal de -1 a 1). El CSS de cada capa decide cómo usarlas.
 */
function useStageMotion<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    let px = 0
    const write = () => {
      raf = 0
      const h = el.offsetHeight
      el.style.setProperty('--sy', String(Math.min(window.scrollY, h)))
      el.style.setProperty('--px', px.toFixed(3))
    }
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(write)
    }
    const onPointer = (e: PointerEvent) => {
      px = Math.max(-1, Math.min(1, (e.clientX / window.innerWidth) * 2 - 1))
      schedule()
    }
    write()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('pointermove', onPointer, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('pointermove', onPointer)
    }
  }, [])
  return ref
}

/** Desplazamiento suave de una foto dentro de su marco, ligado al scroll. */
function useParallax<T extends HTMLElement>(strength = 40) {
  const ref = useRef<T>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    const update = () => {
      raf = 0
      const rect = (el.parentElement ?? el).getBoundingClientRect()
      // Acotado a ±0.5: con escala 1.18 la foto nunca deja ver el borde del marco
      const progress = Math.max(-0.5, Math.min(0.5, (rect.top + rect.height / 2) / window.innerHeight - 0.5))
      el.style.transform = `translate3d(0, ${(-progress * strength).toFixed(1)}px, 0) scale(1.18)`
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [strength])
  return ref
}

function Arrow({ size = 16 }: { size?: number }) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} aria-hidden="true">
      <path
        d="M3 8h10m-4-4 4 4-4 4"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** El nombre de la tienda enorme, en blanco, detrás de todo. Decorativo. */
function Wordmark({
  text,
  className = '',
  tone = 'text-white',
  animate = true,
}: {
  text: string
  className?: string
  tone?: string
  animate?: boolean
}) {
  return (
    <p
      aria-hidden="true"
      className={`pointer-events-none leading-[0.78] font-semibold tracking-[-0.065em] whitespace-nowrap select-none ${tone} ${className}`}
    >
      {[...text].map((ch, i) => (
        // inline-block colapsa los espacios: se usa espacio duro
        <span key={i} className={animate ? 'mark-letter' : 'inline-block'} style={delay(i * 55)}>
          {ch === ' ' ? ' ' : ch}
        </span>
      ))}
    </p>
  )
}

/* ------------------------------------------------------------------ */
/* Secciones                                                           */
/* ------------------------------------------------------------------ */

/** Frase del hero: los materiales en rojo. "Hecho a mano" ya lo dice el titular. */
const TAGLINE = (
  <>
    <strong className="font-semibold text-brand-700">Plata</strong>,{' '}
    <strong className="font-semibold text-brand-700">alpaca</strong> y{' '}
    <strong className="font-semibold text-brand-700">telar</strong> de artesanos peruanos.
  </>
)

/** Tarjeta de pieza recomendada, una por fila: foto a la izquierda, nombre y precio, flecha. */
function PickCard({ product, wait, step = 0 }: { product: ProductSummary; wait: number; step?: number }) {
  const name = cleanName(product.name)
  return (
    <li
      // Escritorio bajo: la tercera fila se retira primero para que nada se superponga
      // Mismo ancho para todas: en escritorio solo se desplazan, no se encogen
      className="fade-up lg:w-[calc(100%-4rem)] lg:nth-3:[@media(max-height:819px)]:hidden"
      // Escalera (escritorio): cada fila se corre un escalón a la derecha
      style={{ ...delay(wait), marginLeft: `${step}rem` }}
    >
      <Link
        to={`/producto/${product.slug}`}
        className="group flex items-center gap-3.5 rounded-[1.25rem] bg-surface/70 p-2 pr-3 shadow-[0_16px_34px_-20px_rgb(23_22_43/0.5)] ring-1 ring-white/60 backdrop-blur-md backdrop-saturate-150 transition-[transform,box-shadow,background-color] duration-500 hover:bg-surface/90 ease-out-expo hover:-translate-y-1 hover:shadow-[0_24px_44px_-20px_rgb(23_22_43/0.55)]"
      >
        <span className="block h-16 w-16 shrink-0 overflow-hidden rounded-[0.875rem] bg-sunk">
          <ProductImage
            src={product.image_thumb_url ?? product.image_url}
            alt=""
            className="h-full w-full transition-transform duration-700 ease-out-expo group-hover:scale-110"
          />
        </span>
        <span className="min-w-0 flex-1">
          {product.category && (
            <span className="line-clamp-1 text-[0.75rem] leading-tight text-ink-3">{product.category.name}</span>
          )}
          <span className="mt-0.5 line-clamp-1 text-[0.9375rem] leading-snug font-semibold tracking-[-0.01em] text-ink">
            {name}
          </span>
          <span className="tnum mt-0.5 block text-[0.875rem] font-semibold text-brand-700">
            {formatPriceRange(product.price_range, product.currency)}
          </span>
        </span>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700 transition-colors duration-300 group-hover:bg-brand-600 group-hover:text-white">
          <span className="transition-transform duration-300 ease-out-expo group-hover:translate-x-0.5">
            <Arrow size={14} />
          </span>
        </span>
      </Link>
    </li>
  )
}

/**
 * Piezas recomendadas dentro del hero, una por fila.
 * - mobile: bajo la pieza.
 * - desktop: al pie de la columna izquierda (mismo flujo que el resto: no se pisan).
 */
function HeroPicks({ picks, variant }: { picks: ProductSummary[]; variant: 'mobile' | 'desktop' }) {
  if (picks.length === 0) return null
  const id = `recomendados-${variant}`
  return (
    <section
      aria-labelledby={id}
      className={
        variant === 'mobile'
          ? 'relative z-20 pt-5 lg:hidden'
          : // Pantallas muy bajas: no hay alto para tarjetas sin pisar el titular
            'relative z-20 max-w-[26rem] [@media(max-height:699px)]:hidden'
      }
    >
      <h2
        id={id}
        className="fade-up mb-3 text-[1rem] font-semibold tracking-[-0.01em] text-brand-700"
        style={delay(900)}
      >
        Te recomendamos
      </h2>
      <ul className="flex flex-col gap-2.5">
        {picks.map((p, i) => (
          <PickCard key={p.id} product={p} wait={1000 + i * 120} step={variant === 'desktop' ? i * 2 : 0} />
        ))}
      </ul>
    </section>
  )
}



function Hero({ picks }: { picks: ProductSummary[] }) {
  const stage = useStageMotion<HTMLElement>()
  const categories = useCategories()
  const cat = (re: RegExp, q: string) => {
    const c = categories.data?.find((x) => re.test(x.name))
    return c ? `/productos?categoria=${c.id}` : `/productos?q=${encodeURIComponent(q)}`
  }
  const materials = [
    { label: 'Platería', to: cat(/plater/i, 'plata') },
    { label: 'Joyería', to: cat(/joyer/i, 'joya') },
    { label: 'Alpaca', to: '/productos?q=alpaca' },
    { label: 'Textiles', to: cat(/textil/i, 'textil') },
    { label: 'Cerámica', to: cat(/cer[aá]m/i, 'cerámica') },
  ]

  return (
    <section
      ref={stage}
      className="relative isolate overflow-hidden bg-hero"
      style={{ '--sy': 0, '--px': 0 } as React.CSSProperties}
    >
      {/* Escritorio: la foto de productos como fondo de todo el hero, centrada y nítida (sin velos).
          Los elementos del hero van encima. */}
      {/* La entrada se anima en el grupo entero (foto · palabra · recorte): si cada capa se desvaneciera por su
          cuenta, durante la animación la palabra se vería a través de los productos semitransparentes. */}
      <div
        className="stage-in pointer-events-none absolute inset-0 -z-10 hidden overflow-hidden lg:block"
        style={delay(100)}
        aria-hidden="true"
      >
        <img
          src={heroCentro}
          alt=""
          width={1920}
          height={1280}
          fetchPriority="high"
          // Alto completo del hero, centrada entre las dos columnas. Solo el borde lateral del fondo vacío
          // se funde con el gris (mismo color de estudio); los productos quedan nítidos.
          className="absolute -bottom-6 left-[calc(50%-3rem)] h-[calc(100%+1.5rem)] w-auto max-w-none [mask-image:linear-gradient(to_right,transparent,#000_7%,#000_93%,transparent)] xl:left-[calc(50%-4.5rem)]"
          style={{ translate: 'calc(-50% + var(--px) * -8px) calc(var(--sy) * 0.12px)' }}
        />
        {/* La palabra va entre la foto y el recorte: queda detrás de los productos, sobre el fondo de estudio */}
        <div
          className="absolute inset-x-0 top-3 origin-top"
          style={{ transform: 'translate3d(calc(var(--sy) * -0.35px), 0, 0) scaleY(1.6)' }}
        >
          <Wordmark text="monatekeda" tone="text-white/45" className="-ml-[0.04em] text-[min(17vw,17rem)]" />
        </div>
        <img
          src={heroCentroCut}
          alt=""
          width={1920}
          height={1280}
          className="absolute -bottom-6 left-[calc(50%-3rem)] h-[calc(100%+1.5rem)] w-auto max-w-none [mask-image:linear-gradient(to_right,transparent,#000_7%,#000_93%,transparent)] xl:left-[calc(50%-4.5rem)]"
          style={{ translate: 'calc(-50% + var(--px) * -8px) calc(var(--sy) * 0.12px)' }}
        />
      </div>

      <div className="relative mx-auto max-w-[1360px] px-4 sm:px-8 lg:h-[min(860px,calc(100svh-4.5rem))] lg:min-h-[640px]">
        {/*
          Columna izquierda (escritorio: llena el alto del hero, un solo flujo)
          Titular · frase · botones · (al pie) recomendados
        */}
        <div className="relative z-10 pt-10 sm:pt-14 lg:absolute lg:inset-y-0 lg:left-8 lg:flex lg:w-[min(36rem,42%)] lg:flex-col lg:pt-[7vh] lg:pb-10">
          <h1 className="text-[clamp(3.25rem,7.4vw,6rem)] leading-[0.95] tracking-[-0.04em] lg:text-[clamp(3.25rem,5.4vw,5.5rem)] lg:whitespace-nowrap">
            <span className="line-mask">
              <span className="font-light text-brand-muted">Hecho a mano</span>
            </span>
            <span className="line-mask">
              <span className="font-bold text-brand-700" style={delay(130)}>
                en el Perú.
              </span>
            </span>
          </h1>

          <p
            className="fade-up mt-5 max-w-[24rem] text-[1.375rem] leading-[1.25] font-light tracking-[-0.02em] text-brand-muted lg:[@media(max-height:779px)]:hidden"
            style={delay(380)}
          >
            {TAGLINE}
          </p>

          <div className="fade-up mt-7 flex flex-wrap items-center gap-2.5 sm:gap-3" style={delay(480)}>
            <Link
              to="/productos"
              className="btn btn--pill min-h-12 pr-4 pl-5 sm:min-h-[3.25rem] sm:pr-5 sm:pl-6 sm:text-base"
            >
              Explorar piezas
              <Arrow />
            </Link>
            <a
              href="#categorias"
              className="btn btn--dark btn--pill min-h-12 pr-5 pl-4 sm:min-h-[3.25rem] sm:pr-6 sm:pl-5 sm:text-base"
            >
              {/* Ícono de cuadrícula: lleva a las categorías */}
              <svg viewBox="0 0 16 16" width={16} height={16} aria-hidden="true" fill="currentColor">
                <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.4" />
                <rect x="9" y="1.5" width="5.5" height="5.5" rx="1.4" />
                <rect x="1.5" y="9" width="5.5" height="5.5" rx="1.4" />
                <rect x="9" y="9" width="5.5" height="5.5" rx="1.4" opacity=".55" />
              </svg>
              Ver categorías
            </a>
          </div>

          {/* Escritorio: recomendados al pie. Entre lg y xl (sin columna derecha) también cifras y redes. */}
          <div className="hidden lg:mt-auto lg:flex lg:flex-col lg:gap-6 lg:pt-8">
            <HeroPicks picks={picks} variant="desktop" />
            <div className="fade-up flex flex-col gap-4 xl:hidden" style={delay(1100)}>
              <HeroStats className="max-w-[26rem]" />
            </div>
          </div>
        </div>

        {/* Móvil y tableta: la foto como bloque, recortada hacia los productos */}
        <figure className="relative -mx-4 mt-8 overflow-hidden bg-[#dfe1e6] sm:-mx-8 lg:hidden">
          <img
            src={heroCentroSm}
            alt="Piezas de la tienda sobre pedestales blancos: alpaca de peluche, manta tejida, cántaro de cerámica, vicuña, collar y brazalete de plata, cartera tejida"
            width={1024}
            height={683}
            className="aspect-[4/3] w-full object-cover object-center"
          />
          <div className="absolute inset-x-0 top-[6%] origin-top scale-y-[1.6]" aria-hidden="true">
            <Wordmark text="monatekeda" tone="text-white/45" className="-ml-[0.04em] text-[30vw] sm:text-[24vw]" />
          </div>
          <img
            src={heroCentroSmCut}
            alt=""
            width={1024}
            height={683}
            className="absolute inset-0 aspect-[4/3] h-full w-full object-cover object-center"
          />
          <figcaption className="absolute top-3 right-3 rounded-full bg-surface/85 px-2 py-0.5 text-[0.75rem] text-ink-3 backdrop-blur">
            Imagen ilustrativa
          </figcaption>
        </figure>
        <p className="sr-only hidden lg:block">
          Piezas de la tienda: alpaca de peluche, manta tejida, cántaro de cerámica, vicuña, collar y brazalete de plata,
          cartera tejida.
        </p>
        <span className="absolute bottom-4 left-1/2 z-10 hidden -translate-x-1/2 rounded-full bg-surface/85 px-2 py-0.5 text-[0.75rem] text-ink-3 backdrop-blur lg:block">
          Imagen ilustrativa
        </span>

        {/* Cifras (xl): fila de tres tarjetas rojas arriba, a la derecha del titular; se montan sobre la foto */}
        <HeroStats
          layout="row"
          className="fade-up absolute top-[calc(7vh+0.5rem)] right-8 z-10 hidden xl:flex"
        />

        {/* Columna derecha (xl), alineada al pie: índice de materiales, cifras y redes */}
        <div className="absolute right-8 bottom-[9rem] z-10 hidden w-[18.5rem] flex-col gap-6 xl:flex [@media(max-height:799px)]:bottom-[6.5rem] [@media(min-height:850px)_and_(max-height:949px)]:bottom-[11rem] [@media(min-height:950px)]:bottom-[11.5rem]">
          <nav aria-labelledby="por-material" className="fade-up" style={delay(650)}>
            <h2 id="por-material" className="text-[1.375rem] font-semibold tracking-[-0.02em] text-brand-700">
              Por material
            </h2>
            <ul className="mt-3 space-y-1.5">
              {materials.map((m) => (
                <li key={m.label}>
                  <Link
                    to={m.to}
                    className="group flex items-center justify-between border-b border-line-strong/70 py-1.5 text-[0.9375rem] text-ink-2 transition-colors hover:border-brand-600 hover:text-brand-700"
                  >
                    <span className="flex items-center gap-2.5">
                      <CategoryIcon
                        name={m.label}
                        size={24}
                        className="text-ink-3 transition-colors group-hover:text-brand-600"
                      />
                      {m.label}
                    </span>
                    <span className="transition-transform duration-300 ease-out-expo group-hover:translate-x-1">
                      <Arrow size={14} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Redes (xl): al pie del hero, alineadas con el borde inferior de los recomendados */}
        <SocialLinks
          align="right"
          className="fade-up absolute right-8 bottom-10 z-10 hidden w-[18.5rem] xl:block"
        />

        {/* Móvil y tableta: recomendados, cifras y redes al cierre del hero */}
        <HeroPicks picks={picks} variant="mobile" />
        <div className="flex flex-col gap-5 pt-6 pb-8 lg:hidden">
          <HeroStats />
          <SocialLinks

          />
        </div>
      </div>
    </section>
  )
}


/**
 * Categorías del catálogo (reemplaza la franja de búsqueda): tarjetas con ícono grabado,
 * nombre y número de subcategorías. Datos reales de /categories.
 */
function Categories() {
  const categories = useCategories()
  const list = categories.data ?? []
  const grid = useReveal<HTMLDivElement>(0.08)

  return (
    <section id="categorias" aria-labelledby="categorias-titulo" className="scroll-mt-24">
      <div className="mx-auto max-w-[1360px] px-4 pt-20 sm:px-8 lg:pt-28">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <h2
            id="categorias-titulo"
            className="text-[clamp(2.25rem,5vw,3.75rem)] leading-[1.02] font-light tracking-[-0.04em] text-brand-muted"
          >
            Explora por <span className="font-bold text-brand-700">categoría</span>
          </h2>
          <Link to="/productos" className="btn btn--ghost btn--pill px-5">
            Ver todo el catálogo
            <Arrow size={14} />
          </Link>
        </div>

        {categories.isPending ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4">
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-[1.25rem] bg-sunk" />
            ))}
          </div>
        ) : (
          <div
            ref={grid}
            className="cascade grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4"
          >
            {list.map((c, i) => (
              <Link
                key={c.id}
                to={`/productos?categoria=${c.id}`}
                style={delay(i * 50)}
                className="group relative flex min-h-40 flex-col rounded-[1.25rem] bg-surface p-4 shadow-[0_16px_34px_-24px_rgb(23_22_43/0.45)] transition-[transform,box-shadow] duration-500 ease-out-expo hover:-translate-y-1 hover:shadow-[0_26px_44px_-22px_rgb(23_22_43/0.5)] sm:p-5"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 transition-colors duration-300 group-hover:bg-brand-600 group-hover:text-white">
                  <CategoryIcon name={c.name} size={34} />
                </span>
                <span className="mt-auto pt-6 sm:pr-10">
                  <span className="block text-[1.0625rem] leading-snug font-semibold tracking-[-0.01em] text-ink">
                    {c.name}
                  </span>
                  <span className="mt-0.5 block text-[0.8125rem] text-ink-3">
                    {c.children.length > 0
                      ? `${c.children.length} ${c.children.length === 1 ? 'subcategoría' : 'subcategorías'}`
                      : 'Ver piezas'}
                  </span>
                </span>
                <span className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-sunk text-ink-2 transition-[background-color,color,transform] duration-300 ease-out-expo group-hover:translate-x-0.5 group-hover:bg-brand-600 group-hover:text-white sm:top-auto sm:right-5 sm:bottom-5">
                  <Arrow size={14} />
                </span>
              </Link>
            ))}
            {/* Cierre de la rejilla: acceso a todo el catálogo, en rojo de marca */}
            <Link
              to="/productos"
              style={delay(list.length * 50)}
              className="group relative flex min-h-40 flex-col rounded-[1.25rem] bg-brand-700 p-4 text-white shadow-[0_18px_36px_-20px_rgb(140_28_12/0.6)] transition-[transform,box-shadow,background-color] duration-500 ease-out-expo hover:-translate-y-1 hover:bg-brand-800 sm:p-5"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-brand-700">
                <svg viewBox="0 0 16 16" width={24} height={24} aria-hidden="true" fill="currentColor">
                  <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.4" />
                  <rect x="9" y="1.5" width="5.5" height="5.5" rx="1.4" />
                  <rect x="1.5" y="9" width="5.5" height="5.5" rx="1.4" />
                  <rect x="9" y="9" width="5.5" height="5.5" rx="1.4" opacity=".55" />
                </svg>
              </span>
              <span className="mt-auto pt-6 sm:pr-10">
                <span className="block text-[1.0625rem] leading-snug font-semibold tracking-[-0.01em]">Todo el catálogo</span>
                <span className="mt-0.5 block text-[0.8125rem] text-white/80">+3000 productos</span>
              </span>
              <span className="absolute right-4 bottom-4 flex h-9 w-9 items-center justify-center rounded-full bg-white text-brand-700 transition-transform duration-300 ease-out-expo group-hover:translate-x-0.5 sm:right-5 sm:bottom-5">
                <Arrow size={14} />
              </span>
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}


/* ------------------------------------------------------------------ */
/* Elige por material                                                  */
/* ------------------------------------------------------------------ */

/** Filtros por material. Comparten caché con la serie de portada: no gastan pedidos extra. */
function useMaterialFilters() {
  const categories = useCategories()
  const find = (re: RegExp) => categories.data?.find((x) => re.test(x.name))
  const byCat = (re: RegExp, q: string): MaterialSource => {
    const c = find(re)
    return {
      filters: c
        ? { category_id: c.id, include_descendants: true, per_page: 24 }
        : { search: q, per_page: 24 },
      to: c ? `/productos?categoria=${c.id}` : `/productos?q=${encodeURIComponent(q)}`,
    }
  }
  return {
    ready: !categories.isPending,
    plateria: byCat(/plater/i, 'plata'),
    joyeria: byCat(/joyer/i, 'joya'),
    textiles: byCat(/textil/i, 'textil'),
    alpaca: { filters: { search: 'alpaca', per_page: 24 }, to: '/productos?q=alpaca' } as MaterialSource,
  }
}

type MaterialSource = { filters: ProductFilters; to: string }

function MaterialTile({
  source,
  ready,
  title,
  line,
  img,
  alt,
  ratio,
  large = false,
  wait = 0,
}: {
  source: MaterialSource
  ready: boolean
  title: string
  line: string
  img: string
  alt: string
  /** Clases de tamaño del marco de la foto */
  ratio: string
  large?: boolean
  wait?: number
}) {
  const tile = useReveal<HTMLAnchorElement>()
  const media = useParallax<HTMLImageElement>(40)
  const count = useProducts(source.filters, ready).data?.meta.total

  return (
    <Link ref={tile} to={source.to} className="group block">
      <div
        className={`reveal-media relative isolate overflow-hidden rounded-[1.5rem] bg-sunk ${ratio}`}
        style={delay(wait)}
      >
        <img
          ref={media}
          src={img}
          alt={alt}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover transition-[scale] duration-[1200ms] ease-out-expo will-change-transform group-hover:scale-[1.04]"
        />
        {/* Velo inferior: da contraste al texto sin tapar la pieza */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[65%] bg-gradient-to-t from-[#120d14]/85 via-[#120d14]/35 to-transparent"
          aria-hidden="true"
        />

        <span className="absolute top-4 right-4 rounded-full bg-surface/85 px-2 py-0.5 text-[0.6875rem] text-ink-3 backdrop-blur">
          Imagen ilustrativa
        </span>
        {count !== undefined && count > 0 && (
          <span className="tnum absolute top-4 left-4 rounded-full bg-brand-700 px-3 py-1 text-[0.8125rem] font-semibold text-white shadow-[0_8px_18px_-8px_rgb(140_28_12/0.7)]">
            {count} {count === 1 ? 'pieza' : 'piezas'}
          </span>
        )}

        <div className={`absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 ${large ? 'p-6 sm:p-8' : 'p-5 sm:p-6'}`}>
          <div className="min-w-0 text-white">
            <h3
              className={`leading-[1] font-semibold tracking-[-0.035em] ${
                large ? 'text-[clamp(2.25rem,4vw,3.5rem)]' : 'text-[clamp(1.75rem,2.6vw,2.25rem)]'
              }`}
            >
              {title}
            </h3>
            <p className={`mt-2 max-w-[30ch] text-white/80 ${large ? 'text-[1rem]' : 'text-[0.9375rem]'}`}>{line}</p>
          </div>
          <span
            className={`flex shrink-0 items-center justify-center rounded-full bg-white text-ink transition-[background-color,color,transform] duration-500 ease-out-expo group-hover:translate-x-1 group-hover:bg-brand-600 group-hover:text-white ${
              large ? 'h-14 w-14' : 'h-12 w-12'
            }`}
          >
            <Arrow size={large ? 18 : 16} />
            <span className="sr-only">Ver {title}</span>
          </span>
        </div>
      </div>
    </Link>
  )
}

function Materials() {
  const m = useMaterialFilters()

  return (
    <section aria-labelledby="materiales" className="mx-auto max-w-[1360px] px-4 pt-24 sm:px-8 lg:pt-32">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
        <h2
          id="materiales"
          className="text-[clamp(2.25rem,5vw,3.75rem)] leading-[1.02] font-light tracking-[-0.04em] text-brand-muted"
        >
          Elige por <span className="font-bold text-brand-700">material</span>
        </h2>
        <p className="max-w-[34ch] text-[1rem] leading-relaxed text-ink-3">
          Cada material lleva directo a sus piezas en el catálogo, con el número de piezas que hay hoy.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-12 lg:gap-5">
        <div className="lg:col-span-7">
          <MaterialTile
            source={m.alpaca}
            ready={m.ready}
            title="Alpaca"
            line="Gorros, manoplas, chalinas y peluches"
            img={photoAlpaca}
            alt="Madejas de lana de alpaca teñida en rojo, ocre, violeta y crudo"
            ratio="aspect-[4/5] sm:aspect-[4/3] lg:aspect-auto lg:h-[44rem]"
            large
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-1 lg:gap-5">
          <MaterialTile
            source={m.plateria}
            ready={m.ready}
            title="Platería"
            line="Vicuñas, copas, bandejas y marcos"
            img={photoPlata}
            alt="Manos de un artesano grabando una pieza de plata con buril"
            ratio="aspect-[4/3] lg:aspect-auto lg:h-[21.5rem]"
            wait={120}
          />
          <MaterialTile
            source={m.textiles}
            ready={m.ready}
            title="Textiles"
            line="Mantas, ponchos y tejidos de telar"
            img={photoTextil}
            alt="Telar de cintura con un tejido andino a medio hacer"
            ratio="aspect-[4/3] lg:aspect-auto lg:h-[21.5rem]"
            wait={220}
          />
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Restauración de platería (servicio)                                 */
/* ------------------------------------------------------------------ */

const RESTORE_OBJECTS = ['Bandejas', 'Copas', 'Marcos', 'Cubiertos', 'Figuras', 'Piezas de familia']

/**
 * Servicio de restauración de objetos de plata. La foto (misma bandeja, mitad oxidada y mitad pulida)
 * cuenta el servicio de un vistazo; su fondo de estudio es el gris de la página, así que va sin marco.
 */
function Restoration() {
  const categories = useCategories()
  const plata = categories.data?.find((c) => /plater/i.test(c.name))
  const text = useReveal<HTMLDivElement>(0.2)
  const media = useReveal<HTMLDivElement>(0.2)
  const wa = config.whatsappNumber
    ? `https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent(
        `¡Hola ${config.storeName}! Quiero consultar por la restauración de una pieza de plata.`,
      )}`
    : ''

  return (
    <section
      id="restauracion"
      aria-labelledby="restauracion-titulo"
      className="mx-auto max-w-[1360px] scroll-mt-24 px-4 pt-24 sm:px-8 lg:pt-32"
    >
      <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-8">
        <div ref={text} className="reveal lg:col-span-5">
          <h2
            id="restauracion-titulo"
            className="text-[clamp(2.25rem,5vw,3.75rem)] leading-[1.02] font-light tracking-[-0.04em] text-brand-muted"
          >
            Restauramos tu <span className="font-bold text-brand-700">platería</span>
          </h2>
          <p className="mt-5 max-w-[38ch] text-[1.125rem] leading-relaxed text-ink-2">
            Además de vender piezas de plata, restauramos las tuyas: les devolvemos el brillo y el detalle del
            grabado.
          </p>

          <ul className="mt-6 flex flex-wrap gap-2" aria-label="Objetos que restauramos">
            {RESTORE_OBJECTS.map((o) => (
              <li
                key={o}
                className="rounded-full bg-surface px-3.5 py-1.5 text-[0.875rem] text-ink-2 shadow-[0_6px_16px_-12px_rgb(23_22_43/0.5)]"
              >
                {o}
              </li>
            ))}
          </ul>

          <p className="mt-6 max-w-[38ch] text-[0.9375rem] leading-relaxed text-ink-3">
            Escríbenos con una foto de tu pieza y te orientamos.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            {wa ? (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn--lg btn--pill px-6">
                Consultar restauración
                <Arrow />
              </a>
            ) : (
              <Link to="/contacto" className="btn btn--lg btn--pill px-6">
                Consultar restauración
                <Arrow />
              </Link>
            )}
            <Link
              to={plata ? `/productos?categoria=${plata.id}` : '/productos?q=plata'}
              className="btn btn--lg btn--ghost btn--pill px-6"
            >
              Ver platería
            </Link>
          </div>
        </div>

        <div ref={media} className="reveal relative lg:col-span-7" style={delay(120)}>
          <img
            src={photoRestoreSm}
            srcSet={`${photoRestoreSm} 900w, ${photoRestore} 1536w`}
            sizes="(min-width: 1024px) 760px, 100vw"
            alt="Bandeja de plata grabada a medio restaurar: la mitad izquierda oxidada y oscura, la derecha limpia y brillante"
            width={1536}
            height={1024}
            loading="lazy"
            decoding="async"
            // Bordes fundidos con el gris de la página: el fondo de estudio y la página casi coinciden
            className="h-auto w-full [mask-composite:intersect] [mask-image:linear-gradient(to_right,transparent,#000_9%,#000_91%,transparent),linear-gradient(to_bottom,transparent,#000_14%,#000_86%,transparent)]"
          />
          {/* Rótulos sobre cada mitad de la bandeja */}
          <span className="absolute top-[24%] left-[24%] rounded-full bg-ink/80 px-3 py-1 text-[0.8125rem] font-medium text-white backdrop-blur">
            Antes
          </span>
          <span className="absolute top-[24%] left-[58%] rounded-full bg-brand-700 px-3 py-1 text-[0.8125rem] font-medium text-white shadow-[0_8px_18px_-8px_rgb(140_28_12/0.7)]">
            Después
          </span>
          <span className="absolute right-[6%] bottom-[8%] rounded-full bg-surface/85 px-2 py-0.5 text-[0.6875rem] text-ink-3 backdrop-blur">
            Imagen ilustrativa
          </span>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Piezas disponibles, con filtro por material                         */
/* ------------------------------------------------------------------ */

type TabId = 'todo' | 'plateria' | 'joyeria' | 'alpaca' | 'textiles'
const TABS: { id: TabId; label: string }[] = [
  { id: 'todo', label: 'Todo' },
  { id: 'plateria', label: 'Platería' },
  { id: 'joyeria', label: 'Joyería' },
  { id: 'alpaca', label: 'Alpaca' },
  { id: 'textiles', label: 'Textiles' },
]

function SeriesGrid({ series, pending, error, retry }: ReturnType<typeof useSeries>) {
  const grid = useReveal<HTMLDivElement>(0.08)
  const m = useMaterialFilters()
  const [tab, setTab] = useState<TabId>('todo')
  const [switched, setSwitched] = useState(false)

  const source = tab === 'todo' ? null : m[tab]
  const filtered = useProducts(source?.filters ?? {}, Boolean(source) && m.ready)

  const items = useMemo(() => {
    if (!source) return series
    const seen = new Set<string>()
    const all = filtered.data?.data ?? []
    // Primero las piezas mejor presentadas; si no alcanzan, el resto disponible con foto
    const fallback = all.filter((p) => hasPhoto(p) && p.in_stock && !EXCLUDED_NAME.test(p.name))
    const list = [...rank(all), ...fallback].filter((p) => {
      const k = cleanKey(p.name)
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })
    const top = list.slice(0, SERIES)
    return top.length >= 4 ? top.slice(0, top.length - (top.length % 4)) : top
  }, [source, series, filtered.data])

  const loading = source ? filtered.isPending || (filtered.isPlaceholderData && filtered.isFetching) : pending
  const failed = source ? filtered.error : error
  const more = source?.to ?? '/productos'

  return (
    <section aria-labelledby="piezas" className="mx-auto max-w-[1360px] px-4 pt-24 sm:px-8 lg:pt-32">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <h2
          id="piezas"
          className="text-[clamp(2.25rem,5vw,3.75rem)] leading-[1.02] font-light tracking-[-0.04em] text-brand-muted"
        >
          Piezas <span className="font-bold text-brand-700">disponibles</span>
        </h2>
        <Link to={more} className="btn btn--ghost btn--pill px-5">
          {source ? `Ver todo en ${TABS.find((t) => t.id === tab)?.label}` : 'Ver todo el catálogo'}
          <Arrow size={14} />
        </Link>
      </div>

      {/* Filtro por material: píldoras que se desplazan en móvil */}
      <div
        role="tablist"
        aria-label="Filtrar piezas por material"
        className="-mx-4 mb-8 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0"
      >
        {TABS.map((t) => {
          const on = t.id === tab
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={on}
              aria-controls="piezas-panel"
              onClick={() => {
                setTab(t.id)
                setSwitched(true)
              }}
              className={`flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 text-[0.9375rem] font-medium transition-[background-color,color,box-shadow] duration-300 ${
                on
                  ? 'bg-ink text-white shadow-[0_10px_22px_-14px_rgb(23_22_43/0.7)]'
                  : 'bg-surface text-ink-2 hover:text-brand-700'
              }`}
            >
              {t.id !== 'todo' && (
                <CategoryIcon name={t.label} size={22} className={on ? 'text-white' : 'text-ink-3'} />
              )}
              {t.label}
            </button>
          )
        })}
      </div>

      <div id="piezas-panel" role="tabpanel" aria-labelledby="piezas" aria-busy={loading}>
        {failed ? (
          <ErrorState error={failed} onRetry={source ? () => filtered.refetch() : retry} />
        ) : !loading && items.length === 0 ? (
          <p className="rounded-[1.25rem] bg-surface px-6 py-12 text-center text-ink-3">
            Por ahora no hay piezas disponibles con foto en este material.{' '}
            <Link to={more} className="font-medium text-brand-700 underline underline-offset-4">
              Ver en el catálogo
            </Link>
          </p>
        ) : (
          <div ref={grid} className="cascade grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
            {loading
              ? Array.from({ length: SERIES }, (_, i) => <PlateSkeleton key={i} />)
              : items.map((p, i) => (
                  // Entrada en cascada al hacer scroll; al cambiar de filtro, cada pieza sube de nuevo
                  <div
                    key={`${tab}-${p.id}`}
                    className={`flex ${switched ? 'fade-up' : ''}`}
                    style={delay(i * (switched ? 45 : 70))}
                  >
                    <ProductCard product={p} eager={i < 4} />
                  </div>
                ))}
            {/* Con pocas piezas en un material, la fila se cierra con el acceso a su catálogo */}
            {!loading && source && items.length < SERIES && (
              <Link
                key={`${tab}-more`}
                to={more}
                className="group fade-up flex min-h-[16rem] flex-col justify-between rounded-[1.25rem] bg-brand-700 p-5 text-white shadow-[0_18px_36px_-20px_rgb(140_28_12/0.6)] transition-colors duration-300 hover:bg-brand-600 sm:p-6"
                style={delay(items.length * 45)}
              >
                <CategoryIcon name={TABS.find((t) => t.id === tab)?.label ?? ''} size={40} className="text-white/90" />
                <span>
                  <span className="block text-[1.375rem] leading-tight font-semibold tracking-[-0.02em]">
                    {filtered.data?.meta.total
                      ? `Ver las ${filtered.data.meta.total} piezas`
                      : 'Ver todas las piezas'}
                  </span>
                  <span className="mt-1 block text-[0.9375rem] text-white/80">
                    de {TABS.find((t) => t.id === tab)?.label} en el catálogo
                  </span>
                  <span className="mt-5 flex h-11 w-11 items-center justify-center rounded-full bg-white text-brand-700 transition-transform duration-300 ease-out-expo group-hover:translate-x-1">
                    <Arrow size={16} />
                  </span>
                </span>
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  )
}


/**
 * Banner de cierre: panel rojo con la colección recortada que sale por encima del borde.
 * La marca de agua queda recortada dentro del panel; la foto no.
 */
function Closing() {
  const panel = useReveal<HTMLDivElement>(0.2)
  return (
    <section aria-labelledby="cierre-titulo" className="mx-auto max-w-[1360px] px-4 pt-40 sm:px-8 lg:pt-56">
      <div ref={panel} className="relative isolate">
        {/* Fondo del panel y marca de agua (recortados) */}
        <div className="absolute inset-0 -z-10 overflow-hidden rounded-[2rem] bg-brand-700" aria-hidden="true">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_85%_100%,rgb(255_255_255/0.14),transparent_60%)]" />
          <div className="absolute inset-x-0 -bottom-[0.2em] left-6 text-[clamp(5rem,17vw,16rem)]">
            <Wordmark text="monatekeda" tone="text-white/[0.07]" animate={false} />
          </div>
        </div>

        <div className="grid items-end lg:grid-cols-12">
          <div className="relative z-10 px-6 pt-12 pb-10 sm:px-12 sm:pt-16 lg:col-span-7 lg:py-20 lg:pr-0 lg:pl-16">
            <h2
              id="cierre-titulo"
              className="max-w-[16ch] text-[clamp(2.5rem,5.6vw,4.75rem)] leading-[0.98] font-light tracking-[-0.04em] text-white"
            >
              Piezas de Lima y <span className="font-semibold">Puno</span>, en un solo lugar.
            </h2>
            <p className="mt-5 max-w-[34ch] text-[1.125rem] leading-snug text-white/80">
              Plata, alpaca y telar de artesanos peruanos.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/productos" className="btn btn--lg btn--light btn--pill px-7">
                Explorar piezas
                <Arrow />
              </Link>
              <Link
                to="/contacto"
                className="btn btn--lg btn--pill btn--outline-light px-7"
              >
                Escríbenos
              </Link>
            </div>
          </div>

          {/* La colección: en escritorio sube por encima del panel */}
          <figure className="relative mx-auto -mt-2 w-[min(78%,22rem)] lg:absolute lg:-top-44 lg:right-[6%] lg:bottom-0 lg:mt-0 lg:w-auto">
            <img
              src={heroColeccion}
              alt="Alpaca de peluche, manta tejida, cántaro de cerámica, vicuña de plata, brazalete y collar sobre pedestales"
              width={791}
              height={1400}
              loading="lazy"
              decoding="async"
              className="reveal-rise block h-auto w-full drop-shadow-[0_30px_40px_rgb(60_8_2/0.45)] lg:h-full lg:w-auto"
            />
            <figcaption className="absolute top-3 right-0 rounded-full bg-surface/85 px-2 py-0.5 text-[0.6875rem] text-ink-3 backdrop-blur lg:top-auto lg:right-auto lg:bottom-4 lg:-left-28">
              Imagen ilustrativa
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  )
}

export function HomePage() {
  const data = useSeries()
  return (
    <div>
      {/* Recomendados del hero: piezas reales de la serie, sin repetir la destacada */}
      <Hero picks={data.series.filter((p) => p.id !== data.featured?.id).slice(0, 3)} />
      <Categories />
      <TopProducts />
      <Materials />
      <Restoration />
      <SeriesGrid {...data} />
      <Closing />
    </div>
  )
}
