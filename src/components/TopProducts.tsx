import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { storeApi } from '../api/store'
import type { ProductSummary } from '../api/types'
import { cleanName, formatPriceRange } from '../lib/format'
import { useCart } from '../store/cart'
import { CartIcon } from './Ornaments'
import { ProductImage } from './ProductImage'

const TOP = 10
/** Nombres que son códigos de inventario: no van en la portada. */
const SKU_LIKE = /[A-Za-z]\d{2,}|\d{3,}[A-Za-z]|[a-z][A-Z]/
const EXCLUDED = /prueba|patagonia|cartier|gucci|louis|tiffany|pandora|swarovski|nike|adidas|camiseta|polo\b/i
const EXCLUDED_CATEGORY = /llaver|im[aá]n|peruaniz|amulet|souvenir|posa|\btela\b|disfra|polos?\b|gorras/i

/**
 * Fuente de los "Top productos".
 * TEMPORAL: mientras no exista un endpoint de ranking en la API, toma piezas
 * disponibles y con foto del catálogo. Cuando la API lo tenga, reemplazar
 * solo el queryFn (p. ej. storeApi.top()) y quitar el filtro.
 */
function useTopProducts() {
  return useQuery({
    queryKey: ['top-products'],
    queryFn: async ({ signal }) => {
      const pages = await Promise.all(
        [1, 2, 3].map((page) => storeApi.products({ per_page: 50, page, sort: 'price_desc' }, signal)),
      )
      const seen = new Set<string>()
      return pages
        .flatMap((r) => r.data)
        .filter((p) => {
          const key = cleanName(p.name).toLowerCase()
          const ok =
            p.in_stock &&
            Boolean(p.image_thumb_url || p.image_url) &&
            !SKU_LIKE.test(p.name) &&
            !EXCLUDED.test(p.name) &&
            !EXCLUDED_CATEGORY.test(p.category?.name ?? '') &&
            !seen.has(key)
          if (ok) seen.add(key)
          return ok
        })
        .slice(0, TOP)
    },
    staleTime: 5 * 60_000,
  })
}

function Arrow({ size = 14 }: { size?: number }) {
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

/** Botón de compra: agrega directo si es simple; si tiene variaciones, lleva a elegir. */
function BuyButton({ product, large = false }: { product: ProductSummary; large?: boolean }) {
  const add = useCart((s) => s.add)
  const [added, setAdded] = useState(false)
  const href = `/producto/${product.slug}`
  const size = large ? 'btn--lg' : ''
  if (product.type === 'variable') {
    return (
      <Link to={href} className={`btn btn--pill btn--dark ${size} shrink-0 px-5`}>
        Elegir
        <Arrow />
      </Link>
    )
  }
  return (
    <button
      className={`btn btn--pill ${size} shrink-0 px-5`}
      aria-live="polite"
      onClick={(e) => {
        e.preventDefault()
        add({
          productId: product.id,
          variationId: null,
          slug: product.slug,
          code: product.code,
          name: cleanName(product.name),
          variantLabel: null,
          price: product.price_range.min,
          currency: product.currency,
          imageUrl: product.image_thumb_url ?? product.image_url,
        })
        setAdded(true)
        setTimeout(() => setAdded(false), 2000)
      }}
    >
      <CartIcon size={18} />
      {added ? 'Agregado' : 'Agregar'}
    </button>
  )
}

function RankBadge({ rank, large = false }: { rank: number; large?: boolean }) {
  return (
    <span
      className={`absolute top-3 left-3 z-10 flex items-center justify-center rounded-full bg-brand-700 font-bold text-white shadow-[0_8px_18px_-8px_rgb(140_28_12/0.7)] ${
        large ? 'h-12 min-w-12 px-3 text-[1.125rem]' : 'h-9 min-w-9 px-2.5 text-[0.875rem]'
      }`}
    >
      <span className="sr-only">Puesto </span>#{rank}
    </span>
  )
}


/** Tarjeta del carrusel: foto alta, puesto, datos y compra. */
function SlideCard({ product, rank }: { product: ProductSummary; rank: number }) {
  const name = cleanName(product.name)
  const href = `/producto/${product.slug}`
  return (
    <article className="group relative flex h-full flex-col rounded-[1.5rem] bg-surface p-2 shadow-[0_16px_34px_-26px_rgb(23_22_43/0.45)] transition-[transform,box-shadow] duration-500 ease-out-expo hover:-translate-y-1 hover:shadow-[0_26px_44px_-24px_rgb(23_22_43/0.5)]">
      <Link to={href} className="relative block overflow-hidden rounded-[1.125rem] bg-sunk" tabIndex={-1} aria-hidden="true">
        <ProductImage
          src={product.image_url ?? product.image_thumb_url}
          alt={name}
          className="aspect-[4/5] w-full transition-transform duration-[900ms] ease-out-expo group-hover:scale-[1.05]"
        />
      </Link>
      <RankBadge rank={rank} large={rank === 1} />
      <div className="flex flex-1 flex-col px-2.5 pt-3.5 pb-2.5">
        {product.category && <p className="truncate text-[0.75rem] text-ink-3">{product.category.name}</p>}
        <h3 className="mt-0.5 line-clamp-2 text-[1.0625rem] leading-snug font-semibold tracking-[-0.01em] text-ink">
          <Link to={href} className="hover:text-brand-700">
            {name}
          </Link>
        </h3>
        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <p className="tnum min-w-0 text-[1rem] font-semibold whitespace-nowrap text-brand-700">
            {formatPriceRange(product.price_range, product.currency)}
          </p>
          <BuyButton product={product} />
        </div>
      </div>
    </article>
  )
}

const AUTOPLAY_MS = 4500
/** Ancho de la tarjeta del carrusel (el resto se calcula a partir de él). */
const CARD_W = 'w-[min(74vw,19rem)]'

/** Distancia circular más corta entre dos posiciones: el carrusel da la vuelta. */
const offsetOf = (i: number, active: number, n: number) => {
  let d = i - active
  if (d > n / 2) d -= n
  if (d < -n / 2) d += n
  return d
}

/**
 * Carrusel 3D tipo "coverflow": la pieza activa al frente y de cara; las vecinas giran sobre su eje,
 * retroceden en profundidad y se oscurecen. Da la vuelta (tras la #10 vuelve la #1).
 * Controles: flechas, puntos, teclado (←/→), arrastre o deslizamiento, y clic en una tarjeta lateral.
 * Avance automático suave que se detiene al interactuar y se pausa fuera de pantalla o con movimiento reducido.
 */
function Carousel({ items }: { items: ProductSummary[] }) {
  const n = items.length
  const [active, setActive] = useState(0)
  const [stopped, setStopped] = useState(false)
  const [narrow, setNarrow] = useState(() => window.matchMedia('(max-width: 639px)').matches)
  const [reduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const stage = useRef<HTMLDivElement>(null)
  const paused = useRef(false)
  const visible = useRef(false)
  const drag = useRef<{ x: number; moved: boolean } | null>(null)

  const go = useCallback((dir: number) => setActive((a) => (a + dir + n) % n), [n])
  const stop = () => setStopped(true)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)')
    const on = () => setNarrow(mq.matches)
    mq.addEventListener('change', on)
    const el = stage.current
    const io = el
      ? new IntersectionObserver(
          ([e]) => {
            visible.current = e.isIntersecting
          },
          { threshold: 0.4 },
        )
      : null
    if (el && io) io.observe(el)
    return () => {
      mq.removeEventListener('change', on)
      io?.disconnect()
    }
  }, [])

  useEffect(() => {
    if (stopped || reduced) return
    const id = window.setInterval(() => {
      if (!paused.current && visible.current && !document.hidden) go(1)
    }, AUTOPLAY_MS)
    return () => window.clearInterval(id)
  }, [stopped, go, reduced])

  // Geometría: separación lateral, giro y profundidad por cada paso desde el centro
  const step = narrow ? 52 : 64 // % del ancho de la tarjeta
  const turn = narrow ? 32 : 38 // grados
  const depth = narrow ? 140 : 190 // px
  const reach = narrow ? 1 : 3 // tarjetas visibles a cada lado

  return (
    <div
      role="region"
      aria-roledescription="carrusel"
      aria-label="Top productos"
      onMouseEnter={() => {
        paused.current = true
      }}
      onMouseLeave={() => {
        paused.current = false
      }}
      onFocus={() => {
        paused.current = true
      }}
      onBlur={() => {
        paused.current = false
      }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault()
          stop()
          go(e.key === 'ArrowRight' ? 1 : -1)
        }
      }}
    >
      <div
        ref={stage}
        className="relative mx-auto flex touch-pan-y justify-center select-none [perspective:1600px]"
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, moved: false }
        }}
        onPointerMove={(e) => {
          if (drag.current && Math.abs(e.clientX - drag.current.x) > 8) drag.current.moved = true
        }}
        onPointerUp={(e) => {
          const d = drag.current
          drag.current = null
          if (!d) return
          const dx = e.clientX - d.x
          if (Math.abs(dx) > 40) {
            stop()
            go(dx < 0 ? 1 : -1)
          }
        }}
        onPointerCancel={() => {
          drag.current = null
        }}
      >
        {/* Ocupa el alto de la tarjeta activa; las demás se apilan encima en absoluto */}
        <div className={`${CARD_W} invisible`} aria-hidden="true">
          <SlideCard product={items[0]} rank={1} />
        </div>

        {items.map((p, i) => {
          const off = offsetOf(i, active, n)
          const abs = Math.abs(off)
          const isActive = off === 0
          const hidden = abs > reach
          return (
            <div
              key={p.id}
              aria-roledescription="diapositiva"
              aria-label={`${i + 1} de ${n}`}
              aria-hidden={!isActive}
              onClickCapture={(e) => {
                // Si el gesto fue un arrastre, no seguir el enlace de la tarjeta
                if (drag.current?.moved) e.preventDefault()
              }}
              className={`absolute top-0 ${CARD_W} ${isActive ? '' : 'cursor-pointer'} ${
                reduced ? '' : 'transition-[transform,opacity] duration-700 ease-out-expo'
              }`}
              style={{
                transform: `translateX(${off * step}%) translateZ(${-abs * depth}px) rotateY(${off * -turn}deg)`,
                zIndex: 50 - abs,
                opacity: hidden ? 0 : 1,
                pointerEvents: hidden ? 'none' : undefined,
              }}
            >
              {/* Las laterales no son interactivas; la capa de encima recoge el clic y las trae al frente */}
              <div inert={!isActive}>
                <SlideCard product={p} rank={i + 1} />
              </div>
              <span
                aria-hidden="true"
                onClick={() => {
                  if (isActive || drag.current?.moved) return
                  stop()
                  setActive(i)
                }}
                className={`absolute inset-0 rounded-[1.5rem] bg-ink transition-opacity duration-700 ${
                  isActive ? 'pointer-events-none opacity-0' : abs === 1 ? 'opacity-15' : 'opacity-30'
                }`}
              />
            </div>
          )
        })}
      </div>

      {/* Anuncio para lectores de pantalla */}
      <p className="sr-only" aria-live="polite">
        {`Pieza ${active + 1} de ${n}: ${cleanName(items[active].name)}`}
      </p>

      <div className="mt-10 flex items-center justify-center gap-5">
        <button
          type="button"
          onClick={() => {
            stop()
            go(-1)
          }}
          aria-label="Anterior"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-ink shadow-[0_10px_22px_-16px_rgb(23_22_43/0.6)] transition-colors duration-300 hover:bg-brand-600 hover:text-white"
        >
          <span className="flex rotate-180">
            <Arrow size={16} />
          </span>
        </button>
        <p className="tnum min-w-[4.5rem] text-center text-[0.9375rem] font-semibold text-ink sm:hidden" aria-hidden="true">
          {active + 1} <span className="font-normal text-ink-3">/ {n}</span>
        </p>
        <div className="hidden items-center gap-1.5 sm:flex" role="group" aria-label="Elegir pieza">
          {items.map((p, i) => (
            <button
              key={p.id}
              type="button"
              aria-label={`Ver pieza ${i + 1}`}
              aria-current={i === active}
              onClick={() => {
                stop()
                setActive(i)
              }}
              className="flex h-6 items-center justify-center"
            >
              <span
                className={`block h-1.5 rounded-full transition-[width,background-color] duration-500 ease-out-expo ${
                  i === active ? 'w-7 bg-brand-600' : 'w-1.5 bg-line-strong hover:bg-ink-3'
                }`}
              />
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            stop()
            go(1)
          }}
          aria-label="Siguiente"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-ink shadow-[0_10px_22px_-16px_rgb(23_22_43/0.6)] transition-colors duration-300 hover:bg-brand-600 hover:text-white"
        >
          <Arrow size={16} />
        </button>
      </div>
    </div>
  )
}

export function TopProducts() {
  const top = useTopProducts()
  const items = top.data ?? []

  if (top.isError || (!top.isPending && items.length === 0)) return null

  return (
    <section aria-labelledby="top-titulo" className="mx-auto max-w-[1360px] overflow-x-clip px-4 pt-20 sm:px-8 lg:pt-28">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <h2
          id="top-titulo"
          className="text-[clamp(2.25rem,5vw,3.75rem)] leading-[1.02] font-light tracking-[-0.04em] text-brand-muted"
        >
          Top <span className="font-bold text-brand-700">productos</span>
        </h2>
        <Link to="/productos" className="btn btn--ghost btn--pill px-5">
          Ver todo el catálogo
          <Arrow />
        </Link>
      </div>

      {top.isPending ? (
        <div className="flex justify-center">
          <div className={`${CARD_W} h-[30rem] animate-pulse rounded-[1.5rem] bg-sunk`} />
        </div>
      ) : (
        <Carousel items={items} />
      )}
    </section>
  )
}
