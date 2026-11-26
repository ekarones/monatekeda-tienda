import { useQueries } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import { storeApi, useCategories, useProducts } from '../api/store'
import type { Category, ProductFilters, ProductSummary } from '../api/types'
import heroVitrina from '../assets/editorial/hero-vitrina.webp'
import heroVitrinaSm from '../assets/editorial/hero-vitrina-sm.webp'
import heroColeccion from '../assets/editorial/hero-coleccion.webp'
import photoAlpaca from '../assets/editorial/material-alpaca.webp'
import photoPlata from '../assets/editorial/material-plata.webp'
import photoTextil from '../assets/editorial/material-textil.webp'
import photoLima from '../assets/editorial/lugar-lima.webp'
import photoPuno from '../assets/editorial/lugar-puno.webp'
import photoRestore from '../assets/editorial/restauracion-plata.webp'
import photoRestoreSm from '../assets/editorial/restauracion-plata-sm.webp'
import { StepBand, StepDiamondField, StepHem } from '../components/Andean'
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
        className="group flex items-center gap-3.5 rounded-[1.25rem] bg-surface p-2 pr-3 shadow-[0_22px_40px_-22px_rgb(60_8_2/0.7)] transition-[transform,box-shadow] duration-500 ease-out-expo hover:-translate-y-1 hover:shadow-[0_30px_50px_-22px_rgb(60_8_2/0.8)]"
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
        className="fade-up mb-3 text-[1rem] font-semibold tracking-[-0.01em] text-white"
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



/**
 * Hero "Escaparate rojo": el rojo de la marca a todo el ancho con la trama andina en blanco, un foco de luz
 * detrás de las piezas recortadas (como una vitrina iluminada), titular en blanco y tarjetas blancas.
 * Termina en la orilla escalonada sobre el gris de la página.
 */
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
      className="andean-tex-light relative isolate overflow-hidden bg-brand-700 text-white"
      style={{ '--sy': 0, '--px': 0 } as React.CSSProperties}
    >
      {/* Foco de luz de vitrina detrás de las piezas */}
      <div
        className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(ellipse_48%_62%_at_50%_70%,rgb(255_255_255/0.2),transparent_70%)] lg:bg-[radial-gradient(ellipse_32%_50%_at_57%_62%,rgb(255_255_255/0.2),transparent_72%)]"
        aria-hidden="true"
      />

      {/* Escritorio: el bodegón de piezas, grande, al centro de la vitrina, apoyado sobre su sombra */}
      <div className="stage-in pointer-events-none absolute inset-0 -z-10 hidden lg:block" style={delay(100)} aria-hidden="true">
        {/* Ancho W: xl se ancla al índice "Por material" (su borde derecho queda 1.5rem antes) y crece hacia la
            izquierda; su parte baja pasa detrás de las tarjetas de recomendados, que van encima */}
        <div className="absolute bottom-[7%] left-[calc(50%+8rem)] h-16 w-[calc(var(--w)*0.9)] -translate-x-1/2 rounded-[50%] bg-[#3a0702]/55 blur-2xl [--w:min(42vw,calc((100svh-4.5rem)*0.95),760px)] xl:left-[calc(100%-max(0px,(100%-1360px)/2)-22rem-var(--w)/2)] xl:[--w:min(46vw,calc((100svh-4.5rem)*0.95),740px)]" />
        <img
          src={heroVitrina}
          alt=""
          width={1200}
          height={877}
          fetchPriority="high"
          className="absolute bottom-[8%] left-[calc(50%+8rem)] h-auto w-[var(--w)] max-w-none drop-shadow-[0_28px_34px_rgb(50_6_2/0.5)] [--w:min(42vw,calc((100svh-4.5rem)*0.95),760px)] xl:left-[calc(100%-max(0px,(100%-1360px)/2)-22rem-var(--w)/2)] xl:[--w:min(46vw,calc((100svh-4.5rem)*0.95),740px)]"
          style={{ translate: 'calc(-50% + var(--px) * -8px) calc(var(--sy) * 0.12px)' }}
        />
      </div>

      <div className="relative mx-auto max-w-[1360px] px-4 sm:px-8 lg:h-[min(860px,calc(100svh-4.5rem))] lg:min-h-[640px]">
        {/* Columna izquierda: titular · frase · botones · (al pie) recomendados */}
        <div className="relative z-10 pt-10 sm:pt-14 lg:absolute lg:inset-y-0 lg:left-8 lg:flex lg:w-[min(36rem,42%)] lg:flex-col lg:pt-[7vh] lg:pb-14">
          <h1 className="text-[clamp(3.25rem,7.4vw,6rem)] leading-[0.95] tracking-[-0.04em] lg:text-[clamp(3.25rem,5.4vw,5.5rem)] lg:whitespace-nowrap">
            <span className="line-mask">
              <span className="font-light text-white/80">Hecho a mano</span>
            </span>
            <span className="line-mask">
              <span className="font-bold text-white" style={delay(130)}>
                en el Perú.
              </span>
            </span>
          </h1>
          <StepBand className="fade-up mt-5 w-40 text-white/70" height={12} />

          <p
            className="fade-up mt-5 max-w-[24rem] text-[1.375rem] leading-[1.25] font-light tracking-[-0.02em] text-white/80 lg:[@media(max-height:779px)]:hidden"
            style={delay(380)}
          >
            <strong className="font-semibold text-white">Plata</strong>,{' '}
            <strong className="font-semibold text-white">alpaca</strong> y{' '}
            <strong className="font-semibold text-white">telar</strong> de artesanos peruanos.
          </p>

          <div className="fade-up mt-7 flex flex-wrap items-center gap-2.5 sm:gap-3" style={delay(480)}>
            <Link
              to="/productos"
              className="btn btn--light btn--pill min-h-12 pr-4 pl-5 sm:min-h-[3.25rem] sm:pr-5 sm:pl-6 sm:text-base"
            >
              Explorar piezas
              <Arrow />
            </Link>
            <a
              href="#categorias"
              className="btn btn--outline-light btn--pill min-h-12 pr-5 pl-4 sm:min-h-[3.25rem] sm:pr-6 sm:pl-5 sm:text-base"
            >
              <svg viewBox="0 0 16 16" width={16} height={16} aria-hidden="true" fill="currentColor">
                <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.4" />
                <rect x="9" y="1.5" width="5.5" height="5.5" rx="1.4" />
                <rect x="1.5" y="9" width="5.5" height="5.5" rx="1.4" />
                <rect x="9" y="9" width="5.5" height="5.5" rx="1.4" opacity=".55" />
              </svg>
              Ver categorías
            </a>
          </div>

          {/* Escritorio: recomendados al pie. Entre lg y xl (sin columna derecha) también cifras. */}
          <div className="hidden lg:mt-auto lg:flex lg:flex-col lg:gap-6 lg:pt-8">
            <HeroPicks picks={picks} variant="desktop" />
            <div className="fade-up flex flex-col gap-4 xl:hidden" style={delay(1100)}>
              <HeroStats tone="light" className="max-w-[26rem]" />
            </div>
          </div>
        </div>

        {/* Móvil y tableta: las piezas recortadas bajo el titular, con su foco de luz */}
        <figure className="relative mx-auto mt-10 max-w-[34rem] px-2 lg:hidden">
          <div
            className="pointer-events-none absolute inset-x-[8%] bottom-[2%] h-8 rounded-[50%] bg-[#3a0702]/55 blur-xl"
            aria-hidden="true"
          />
          <img
            src={heroVitrinaSm}
            alt="Piezas de la tienda: manta tejida, alpaca de peluche, vicuña de plata, cántaro de cerámica pintado, collar y brazalete de plata, cartera de cuero tejido"
            width={720}
            height={526}
            className="relative h-auto w-full drop-shadow-[0_20px_26px_rgb(50_6_2/0.5)]"
          />
          <figcaption className="absolute -top-6 right-2 rounded-full bg-surface/85 px-2 py-0.5 text-[0.75rem] text-ink-3 backdrop-blur">
            Imagen ilustrativa
          </figcaption>
        </figure>
        <p className="sr-only hidden lg:block">
          Piezas de la tienda: manta tejida, alpaca de peluche, vicuña de plata, cántaro de cerámica pintado, collar y
          brazalete de plata, cartera de cuero tejido.
        </p>
        <span className="absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 rounded-full bg-surface/85 px-2 py-0.5 text-[0.75rem] text-ink-3 backdrop-blur lg:block">
          Imagen ilustrativa
        </span>

        {/* Cifras (xl): tres tarjetas blancas en escalera, arriba a la derecha */}
        <HeroStats
          layout="row"
          tone="light"
          className="fade-up absolute top-[calc(7vh+0.5rem)] right-8 z-10 hidden xl:flex"
        />

        {/* Columna derecha (xl): índice de materiales en blanco */}
        <div className="absolute right-8 bottom-[9rem] z-10 hidden w-[18.5rem] flex-col gap-6 xl:flex [@media(max-height:799px)]:bottom-[6.5rem] [@media(min-height:850px)_and_(max-height:949px)]:bottom-[11rem] [@media(min-height:950px)]:bottom-[11.5rem]">
          <nav aria-labelledby="por-material" className="fade-up" style={delay(650)}>
            <h2 id="por-material" className="text-[1.375rem] font-semibold tracking-[-0.02em] text-white">
              Por material
            </h2>
            <ul className="mt-3 space-y-1.5">
              {materials.map((m) => (
                <li key={m.label}>
                  <Link
                    to={m.to}
                    className="group flex items-center justify-between border-b border-white/25 py-1.5 text-[0.9375rem] text-white/85 transition-colors hover:border-white hover:text-white"
                  >
                    <span className="flex items-center gap-2.5">
                      <CategoryIcon name={m.label} size={24} className="text-white/70 transition-colors group-hover:text-white" />
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

        {/* Redes (xl): al pie, a la derecha */}
        <SocialLinks tone="dark" align="right" className="fade-up absolute right-8 bottom-12 z-10 hidden w-[18.5rem] xl:block" />

        {/* Móvil y tableta: recomendados, cifras y redes al cierre del hero */}
        <HeroPicks picks={picks} variant="mobile" />
        <div className="flex flex-col gap-5 pt-6 pb-12 lg:hidden">
          <HeroStats tone="light" />
          <SocialLinks tone="dark" />
        </div>
      </div>
      {/* Orilla escalonada: el rojo termina en peldaños sobre el gris de la página, como el remate de un tejido */}
      <StepHem className="pointer-events-none absolute inset-x-0 -bottom-px z-20 text-ground" height={16} />
    </section>
  )
}


/**
 * Categorías como directorio: panel blanco con el título y el acceso a todo el catálogo a la izquierda,
 * y las categorías reales en columnas (ícono, nombre, subcategorías) a la derecha.
 */
function Categories() {
  const categories = useCategories()
  const list = categories.data ?? []
  const grid = useReveal<HTMLUListElement>(0.08)

  return (
    <section id="categorias" aria-labelledby="categorias-titulo" className="scroll-mt-24">
      <div className="mx-auto max-w-[1360px] px-4 pt-20 sm:px-8 lg:pt-28">
        <div className="relative isolate overflow-hidden rounded-[2rem] bg-surface p-5 shadow-[0_30px_60px_-44px_rgb(23_22_43/0.5)] sm:p-8 lg:p-10">
          <StepDiamondField className="-z-10 text-ink/[0.03]" />
          <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
            {/* Título y acceso a todo */}
            <div className="flex min-w-0 flex-col lg:col-span-4">
              <h2
                id="categorias-titulo"
                className="text-[clamp(2.25rem,4.4vw,3.5rem)] leading-[1.02] font-light tracking-[-0.04em] text-brand-muted"
              >
                Explora por <span className="font-bold text-brand-700">categoría</span>
              </h2>
              <p className="mt-3 max-w-[30ch] text-[1rem] leading-relaxed text-ink-3">
                {list.length ? `${list.length} categorías` : 'Categorías'} de artesanía, del telar a la platería.
              </p>
              <StepBand className="mt-6 w-36 text-brand-600" />
              <Link
                to="/productos"
                className="group mt-8 flex items-center justify-between gap-4 rounded-[1.25rem] bg-brand-700 p-5 text-white shadow-[0_18px_36px_-18px_rgb(140_28_12/0.6)] transition-colors hover:bg-brand-600 lg:mt-auto"
              >
                <span>
                  <span className="block text-[1.25rem] font-semibold tracking-[-0.02em]">Todo el catálogo</span>
                  <span className="mt-0.5 block text-[0.875rem] text-white/80">+3000 productos</span>
                </span>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-brand-700 transition-transform duration-300 ease-out-expo group-hover:translate-x-1">
                  <Arrow size={16} />
                </span>
              </Link>
            </div>

            {/* Directorio de categorías */}
            <div className="min-w-0 lg:col-span-8">
              {categories.isPending ? (
                <div className="grid gap-x-6 sm:grid-cols-2">
                  {Array.from({ length: 8 }, (_, i) => (
                    <div key={i} className="my-2 h-14 animate-pulse rounded-xl bg-sunk" />
                  ))}
                </div>
              ) : (
                <ul ref={grid} className="cascade grid gap-x-8 sm:grid-cols-2">
                  {list.map((c, i) => (
                    <li key={c.id} style={delay(i * 40)} className="border-b border-line/80">
                      <Link
                        to={`/productos?categoria=${c.id}`}
                        className="group -mx-2 flex items-center gap-4 rounded-xl px-2 py-3.5 transition-colors hover:bg-ground"
                      >
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 transition-colors duration-300 group-hover:bg-brand-600 group-hover:text-white">
                          <CategoryIcon name={c.name} size={30} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[1.0625rem] font-semibold tracking-[-0.01em] text-ink group-hover:text-brand-700">
                            {c.name}
                          </span>
                          <span className="block text-[0.8125rem] text-ink-3">
                            {c.children.length > 0
                              ? `${c.children.length} ${c.children.length === 1 ? 'subcategoría' : 'subcategorías'}`
                              : 'Ver piezas'}
                          </span>
                        </span>
                        <span className="text-ink-3 transition-[color,transform] duration-300 ease-out-expo group-hover:translate-x-1 group-hover:text-brand-700">
                          <Arrow size={16} />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
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

type MaterialKey = 'alpaca' | 'plateria' | 'textiles'
const MATERIALS: { key: MaterialKey; name: string; line: string; img: string; alt: string }[] = [
  {
    key: 'alpaca',
    name: 'Alpaca',
    line: 'Gorros, manoplas, chalinas y peluches',
    img: photoAlpaca,
    alt: 'Madejas de lana de alpaca teñida en rojo, ocre, violeta y crudo',
  },
  {
    key: 'plateria',
    name: 'Platería',
    line: 'Vicuñas, copas, bandejas y marcos',
    img: photoPlata,
    alt: 'Manos de un artesano grabando una pieza de plata con buril',
  },
  {
    key: 'textiles',
    name: 'Textiles',
    line: 'Mantas, ponchos y tejidos de telar',
    img: photoTextil,
    alt: 'Telar de cintura con un tejido andino a medio hacer',
  },
]

/** Fila del índice: nombre grande, cuenta real de piezas; activa en rojo con la greca debajo. */
function MaterialRow({
  m,
  source,
  ready,
  active,
  onSelect,
}: {
  m: (typeof MATERIALS)[number]
  source: MaterialSource
  ready: boolean
  active: boolean
  onSelect: () => void
}) {
  const count = useProducts(source.filters, ready).data?.meta.total
  return (
    <li>
      <button
        type="button"
        role="tab"
        id={`mat-tab-${m.key}`}
        aria-selected={active}
        aria-controls="mat-panel"
        onClick={onSelect}
        onMouseEnter={onSelect}
        onFocus={onSelect}
        className="group relative flex w-full items-center justify-between gap-4 py-4 text-left lg:py-5"
      >
        <span
          className={`text-[clamp(2.5rem,5vw,4.25rem)] leading-[0.95] tracking-[-0.045em] transition-[color,font-weight] duration-300 ${
            active ? 'font-bold text-brand-700' : 'font-light text-brand-muted group-hover:text-brand-700'
          }`}
        >
          {m.name}
        </span>
        <span
          className={`tnum shrink-0 rounded-full px-3 py-1 text-[0.8125rem] font-semibold transition-colors duration-300 ${
            active ? 'bg-brand-700 text-white' : 'bg-surface text-ink-2'
          }`}
        >
          {count !== undefined ? `${count} ${count === 1 ? 'pieza' : 'piezas'}` : '…'}
        </span>
        {/* Greca escalonada bajo la fila activa; las demás llevan una línea fina */}
        <span className="absolute inset-x-0 bottom-0" aria-hidden="true">
          {active ? <StepBand className="w-full text-brand-600" height={10} /> : <span className="block h-px bg-line-strong/60" />}
        </span>
      </button>
    </li>
  )
}

/**
 * Elige por material: índice tipográfico a la izquierda; a la derecha, un escenario que cambia con el
 * material elegido (foto con fundido cruzado, piezas reales de ese material y acceso al catálogo).
 * Hover, foco o toque eligen; la elección se recuerda mientras la página está abierta.
 */
function Materials() {
  const m = useMaterialFilters()
  const [active, setActive] = useState<MaterialKey>('alpaca')
  const current = MATERIALS.find((x) => x.key === active)!
  const source = m[active]
  const res = useProducts(source.filters, m.ready)
  const count = res.data?.meta.total
  const picks = useMemo(() => {
    const seen = new Set<string>()
    const all = res.data?.data ?? []
    // Primero las mejor presentadas; si no llegan a 4, el resto disponible con foto
    const fallback = all.filter((p) => hasPhoto(p) && p.in_stock && !EXCLUDED_NAME.test(p.name))
    return [...rank(all), ...fallback]
      .filter((p) => {
        const k = cleanKey(p.name)
        if (seen.has(k)) return false
        seen.add(k)
        return true
      })
      .slice(0, 4)
  }, [res.data])
  const head = useReveal<HTMLDivElement>(0.2)

  return (
    <section aria-labelledby="materiales" className="mx-auto max-w-[1360px] px-4 pt-24 sm:px-8 lg:pt-32">
      <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
        {/* Índice */}
        <div ref={head} className="reveal lg:col-span-5 lg:pt-2">
          <h2
            id="materiales"
            className="text-[clamp(1.5rem,2.4vw,2rem)] leading-[1.1] font-light tracking-[-0.03em] text-brand-muted"
          >
            Elige por <span className="font-bold text-brand-700">material</span>
          </h2>
          <p className="mt-2 max-w-[36ch] text-[0.9375rem] leading-relaxed text-ink-3">
            Pasa el cursor o toca un material para ver sus piezas.
          </p>
          <ul role="tablist" aria-labelledby="materiales" aria-orientation="vertical" className="mt-6">
            {MATERIALS.map((x) => (
              <MaterialRow
                key={x.key}
                m={x}
                source={m[x.key]}
                ready={m.ready}
                active={x.key === active}
                onSelect={() => setActive(x.key)}
              />
            ))}
          </ul>
          <p className="mt-6 hidden text-[1.0625rem] leading-relaxed text-ink-2 lg:block" aria-live="polite">
            {current.line}.
          </p>
        </div>

        {/* Escenario */}
        <div
          id="mat-panel"
          role="tabpanel"
          aria-labelledby={`mat-tab-${active}`}
          className="relative isolate overflow-hidden rounded-[1.75rem] bg-sunk lg:col-span-7"
        >
          <div className="relative aspect-[4/5] sm:aspect-[4/3] lg:aspect-auto lg:h-full lg:min-h-[40rem]">
            {/* Las tres fotos apiladas; la activa aparece con fundido y un leve acercamiento */}
            {MATERIALS.map((x) => (
              <img
                key={x.key}
                src={x.img}
                alt={x.key === active ? x.alt : ''}
                aria-hidden={x.key !== active}
                loading="lazy"
                decoding="async"
                className={`absolute inset-0 h-full w-full object-cover transition-[opacity,scale] duration-[900ms] ease-out-expo ${
                  x.key === active ? 'scale-100 opacity-100' : 'scale-[1.06] opacity-0'
                }`}
              />
            ))}
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-[#120d14]/90 via-[#120d14]/40 to-transparent"
              aria-hidden="true"
            />
            <span className="absolute top-4 right-4 rounded-full bg-surface/85 px-2 py-0.5 text-[0.6875rem] text-ink-3 backdrop-blur">
              Imagen ilustrativa
            </span>

            <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6 lg:p-7">
              <div className="flex items-end justify-between gap-4 text-white">
                <div className="min-w-0">
                  <p className="text-[clamp(1.75rem,3vw,2.5rem)] leading-none font-semibold tracking-[-0.035em]">
                    {current.name}
                  </p>
                  <p className="mt-1.5 text-[0.9375rem] text-white/80 lg:hidden">{current.line}</p>
                </div>
                <Link
                  to={source.to}
                  className="btn btn--pill shrink-0 bg-white px-4 text-ink hover:!bg-brand-600 hover:text-white sm:px-5"
                >
                  {count ? `Ver las ${count}` : 'Ver todas'}
                  <Arrow size={14} />
                </Link>
              </div>

              {/* Piezas reales del material */}
              <ul className="mt-4 grid grid-cols-4 gap-2 sm:gap-3" aria-label={`Piezas de ${current.name}`}>
                {(res.isPending ? Array.from({ length: 4 }, () => null) : picks).map((p, i) => (
                  <li key={p?.id ?? `s${i}`}>
                    {p ? (
                      <Link
                        to={`/producto/${p.slug}`}
                        className="group/p block overflow-hidden rounded-[0.875rem] bg-surface p-1 shadow-[0_14px_26px_-18px_rgb(0_0_0/0.6)] transition-transform duration-300 ease-out-expo hover:-translate-y-1"
                        title={cleanName(p.name)}
                      >
                        <ProductImage
                          src={p.image_thumb_url ?? p.image_url}
                          alt={cleanName(p.name)}
                          className="aspect-square w-full rounded-[0.625rem]"
                        />
                        <span className="tnum block truncate px-1 pt-1 pb-0.5 text-[0.6875rem] font-semibold text-brand-700 sm:text-[0.75rem]">
                          {formatPriceRange(p.price_range, p.currency)}
                        </span>
                      </Link>
                    ) : (
                      <span className="block aspect-[4/5] animate-pulse rounded-[0.875rem] bg-white/20" />
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Ruraq maki: de dónde vienen las piezas (Puno y Lima)                */
/* ------------------------------------------------------------------ */

const ORIGINS = [
  {
    slug: 'puno',
    name: 'Puno',
    line: 'A orillas del lago Titicaca, a más de 3800 metros de altura.',
    img: photoPuno,
    alt: 'Orilla del lago Titicaca con totorales y un bote de totora sobre el agua, montañas del altiplano al fondo',
  },
  {
    slug: 'lima',
    name: 'Lima',
    line: 'La capital, frente al océano Pacífico, con sus balcones de madera tallada.',
    img: photoLima,
    alt: 'Balcones limeños de madera tallada sobre una fachada colonial ocre del centro de Lima',
  },
]

function OriginCard({ origin, wait }: { origin: (typeof ORIGINS)[number]; wait: number }) {
  const card = useReveal<HTMLAnchorElement>()
  const media = useParallax<HTMLImageElement>(36)

  return (
    <Link ref={card} to={`/productos?tag=${origin.slug}`} className="group block">
      <div className="reveal-media relative isolate aspect-[4/5] overflow-hidden rounded-[1.5rem] bg-sunk" style={delay(wait)}>
        <img
          ref={media}
          src={origin.img}
          alt={origin.alt}
          width={800}
          height={1200}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover transition-[scale] duration-[1200ms] ease-out-expo will-change-transform group-hover:scale-[1.04]"
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-[#120d14]/85 via-[#120d14]/30 to-transparent"
          aria-hidden="true"
        />
        <span className="absolute top-4 right-4 rounded-full bg-surface/85 px-2 py-0.5 text-[0.6875rem] text-ink-3 backdrop-blur">
          Imagen ilustrativa
        </span>
        <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-7">
          {/* Orilla escalonada blanca: el remate de tejido que separa la foto del texto */}
          <StepBand className="mb-5 w-24 text-white/70" height={10} />
          <h3 className="text-[clamp(2.25rem,4vw,3.25rem)] leading-none font-semibold tracking-[-0.04em]">{origin.name}</h3>
          <p className="mt-2 max-w-[32ch] text-[0.9375rem] leading-snug text-white/80">{origin.line}</p>
          <span className="mt-5 inline-flex items-center gap-2.5 rounded-full bg-white py-1.5 pr-2 pl-4 text-[0.875rem] font-semibold text-ink transition-colors duration-300 group-hover:bg-brand-600 group-hover:text-white">
            Ver piezas de {origin.name}
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-white transition-colors duration-300 group-hover:bg-white group-hover:text-brand-700">
              <Arrow size={13} />
            </span>
          </span>
        </div>
      </div>
    </Link>
  )
}

/**
 * Origen de las piezas. La palabra quechua "Ruraq maki" (manos que hacen) da el título;
 * su traducción va al lado, siempre en español claro.
 */
function Origins() {
  const text = useReveal<HTMLDivElement>(0.2)
  return (
    <section aria-labelledby="origen-titulo" className="mx-auto max-w-[1360px] px-4 pt-24 sm:px-8 lg:pt-32">
      <div className="grid gap-8 lg:grid-cols-12 lg:gap-8">
        <div ref={text} className="reveal lg:col-span-4 lg:pt-6">
          <p lang="qu" className="text-[clamp(2.75rem,5.6vw,4.5rem)] leading-[0.95] font-bold tracking-[-0.045em] text-brand-700">
            Ruraq maki
          </p>
          <h2
            id="origen-titulo"
            className="mt-3 text-[clamp(1.5rem,2.4vw,2rem)] leading-[1.1] font-light tracking-[-0.03em] text-brand-muted"
          >
            «Manos que hacen», en quechua.
          </h2>
          <StepBand className="mt-7 w-40 text-brand-600" />
          <p className="mt-7 max-w-[36ch] text-[1.0625rem] leading-relaxed text-ink-2">
            Trabajamos con talleres familiares. Nuestras piezas vienen de regiones como Puno y Lima: elige un origen y
            mira lo que llega de allí.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-8 lg:gap-5">
          {ORIGINS.map((o, i) => (
            <div key={o.slug} className={i === 1 ? 'sm:mt-16' : ''}>
              <OriginCard origin={o} wait={i * 120} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Restauración de platería (servicio)                                 */
/* ------------------------------------------------------------------ */

const RESTORE_OBJECTS = ['Bandejas', 'Copas', 'Marcos', 'Cubiertos', 'Figuras', 'Piezas de familia']
const RESTORE_STEPS = [
  { title: 'Envíanos una foto', body: 'Por WhatsApp, de la pieza que quieres restaurar.' },
  { title: 'Te orientamos', body: 'Te contamos qué se puede hacer con tu pieza.' },
  { title: 'Recupera su brillo', body: 'Le devolvemos el brillo y el detalle del grabado.' },
]

/**
 * Servicio de restauración de platería, en un panel oscuro (el único de la página): la bandeja
 * mitad oxidada y mitad pulida cuenta el servicio; tres pasos dicen cómo pedirlo.
 */
function Restoration() {
  const categories = useCategories()
  const plata = categories.data?.find((c) => /plater/i.test(c.name))
  const panel = useReveal<HTMLDivElement>(0.15)
  const wa = config.whatsappNumber
    ? `https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent(
        `¡Hola ${config.storeName}! Quiero consultar por la restauración de una pieza de plata.`,
      )}`
    : ''
  const cta = 'btn btn--lg btn--pill px-6'

  return (
    <section
      id="restauracion"
      aria-labelledby="restauracion-titulo"
      className="mx-auto max-w-[1360px] scroll-mt-24 px-4 pt-24 sm:px-8 lg:pt-32"
    >
      <div ref={panel} className="reveal relative isolate overflow-hidden rounded-[2rem] bg-ink text-white">
        <StepDiamondField className="-z-10 text-white/[0.04]" />
        <div className="grid lg:grid-cols-12">
          {/* Foto: sobre un fondo claro, como en el estudio */}
          <div className="relative bg-[#e4e5e9] lg:order-2 lg:col-span-7">
            <img
              src={photoRestoreSm}
              srcSet={`${photoRestoreSm} 900w, ${photoRestore} 1536w`}
              sizes="(min-width: 1024px) 760px, 100vw"
              alt="Bandeja de plata grabada a medio restaurar: la mitad izquierda oxidada y oscura, la derecha limpia y brillante"
              width={1536}
              height={1024}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
            <span className="absolute top-[22%] left-[22%] rounded-full bg-ink/85 px-3 py-1 text-[0.8125rem] font-medium text-white backdrop-blur">
              Antes
            </span>
            <span className="absolute top-[22%] left-[56%] rounded-full bg-brand-700 px-3 py-1 text-[0.8125rem] font-medium text-white shadow-[0_8px_18px_-8px_rgb(140_28_12/0.7)]">
              Después
            </span>
            <span className="absolute right-4 bottom-4 rounded-full bg-surface/85 px-2 py-0.5 text-[0.6875rem] text-ink-3 backdrop-blur">
              Imagen ilustrativa
            </span>
          </div>

          {/* Texto, pasos y acciones */}
          <div className="p-6 sm:p-10 lg:order-1 lg:col-span-5 lg:p-12">
            <h2
              id="restauracion-titulo"
              className="text-[clamp(2.25rem,4.4vw,3.5rem)] leading-[1.02] font-light tracking-[-0.04em] text-white/70"
            >
              Restauramos tu <span className="font-bold text-white">platería</span>
            </h2>
            <p className="mt-4 max-w-[38ch] text-[1.0625rem] leading-relaxed text-white/75">
              Además de vender piezas de plata, restauramos las tuyas.
            </p>
            <StepBand className="mt-6 w-36 text-brand-500" />

            <ol className="mt-8 space-y-5">
              {RESTORE_STEPS.map((s, i) => (
                <li key={s.title} className="flex gap-4">
                  <span className="tnum flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-[0.9375rem] font-semibold text-white ring-1 ring-white/15">
                    {i + 1}
                  </span>
                  <span className="pt-1.5">
                    <span className="block text-[1rem] font-semibold">{s.title}</span>
                    <span className="mt-0.5 block text-[0.9375rem] leading-snug text-white/65">{s.body}</span>
                  </span>
                </li>
              ))}
            </ol>

            <ul className="mt-8 flex flex-wrap gap-2" aria-label="Objetos que restauramos">
              {RESTORE_OBJECTS.map((o) => (
                <li key={o} className="rounded-full bg-white/8 px-3 py-1 text-[0.8125rem] text-white/80 ring-1 ring-white/12">
                  {o}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap gap-3">
              {wa ? (
                <a href={wa} target="_blank" rel="noopener noreferrer" className={cta}>
                  Consultar restauración
                  <Arrow />
                </a>
              ) : (
                <Link to="/contacto" className={cta}>
                  Consultar restauración
                  <Arrow />
                </Link>
              )}
              <Link
                to={plata ? `/productos?categoria=${plata.id}` : '/productos?q=plata'}
                className="btn btn--lg btn--pill btn--outline-light px-6"
              >
                Ver platería
              </Link>
            </div>
          </div>
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
      <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
      {/* Columna lateral (fija al hacer scroll en escritorio): título, filtros y acceso al catálogo */}
      <div className="min-w-0 lg:col-span-3">
      <div className="lg:sticky lg:top-28">
        <h2
          id="piezas"
          className="text-[clamp(2.25rem,4vw,3.25rem)] leading-[1.02] font-light tracking-[-0.04em] text-brand-muted"
        >
          Piezas <span className="font-bold text-brand-700">disponibles</span>
        </h2>
        <p className="mt-3 text-[1rem] text-ink-3">En stock y con foto, listas para pedir.</p>
        <StepBand className="mt-6 hidden w-32 text-brand-600 lg:block" />

      {/* Filtro por material: píldoras que se desplazan en móvil; lista vertical en escritorio */}
      <div
        role="tablist"
        aria-label="Filtrar piezas por material"
        aria-orientation="vertical"
        className="-mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0 lg:mt-8 lg:flex-col lg:overflow-visible"
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
              className={`flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 text-[0.9375rem] font-medium transition-[background-color,color,box-shadow] duration-300 lg:min-h-12 lg:w-full lg:rounded-xl ${
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
        {/* .btn fija su propio display: se oculta con un contenedor */}
        <div className="mt-6 hidden lg:block">
          <Link to={more} className="btn btn--ghost btn--pill px-5">
            {source ? `Ver todo en ${TABS.find((t) => t.id === tab)?.label}` : 'Ver todo el catálogo'}
            <Arrow size={14} />
          </Link>
        </div>
      </div>
      </div>

      <div id="piezas-panel" role="tabpanel" aria-labelledby="piezas" aria-busy={loading} className="min-w-0 lg:col-span-9">
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
          <div ref={grid} className="cascade grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 xl:grid-cols-4">
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
      </div>
      <div className="mt-8 lg:hidden">
        <Link to={more} className="btn btn--ghost btn--pill px-5">
          {source ? `Ver todo en ${TABS.find((t) => t.id === tab)?.label}` : 'Ver todo el catálogo'}
          <Arrow size={14} />
        </Link>
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
          <StepDiamondField className="text-white/[0.07]" />
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
      <Origins />
      <Restoration />
      <SeriesGrid {...data} />
      <Closing />
    </div>
  )
}
