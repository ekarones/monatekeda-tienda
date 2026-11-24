import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router'
import { storeApi } from '../api/store'
import type { ProductSummary } from '../api/types'
import { cleanName, formatPriceRange } from '../lib/format'
import { useCart } from '../store/cart'
import { useReveal } from '../lib/useReveal'
import { StepBand } from './Andean'
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

const pad = (n: number) => String(n).padStart(2, '0')

/** #1: pieza protagonista. Foto alta, número grande sobre la foto, datos y compra al pie. */
function FeatureCard({ product }: { product: ProductSummary }) {
  const name = cleanName(product.name)
  const href = `/producto/${product.slug}`
  return (
    <article className="group relative isolate flex h-full min-h-[30rem] flex-col justify-end overflow-hidden rounded-[1.75rem] bg-sunk lg:min-h-[40rem]">
      <Link to={href} className="absolute inset-0 -z-10" tabIndex={-1} aria-hidden="true">
        <ProductImage
          src={product.image_url ?? product.image_thumb_url}
          alt={name}
          className="h-full w-full transition-transform duration-[1200ms] ease-out-expo group-hover:scale-[1.04]"
        />
      </Link>
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-t from-[#120d14]/90 via-[#120d14]/25 to-[#120d14]/30"
        aria-hidden="true"
      />
      {/* Puesto: numeral grande con la greca debajo */}
      <div className="absolute top-5 left-5 text-white sm:top-7 sm:left-7">
        <p className="tnum text-[clamp(4.5rem,9vw,7.5rem)] leading-[0.8] font-bold tracking-[-0.06em]">
          <span className="sr-only">Puesto </span>01
        </p>
        <StepBand className="mt-3 w-28 text-white/80" height={10} />
      </div>
      <div className="flex flex-wrap items-end justify-between gap-4 p-5 text-white sm:p-7">
        <div className="min-w-0">
          {product.category && <p className="text-[0.875rem] text-white/75">{product.category.name}</p>}
          <h3 className="mt-1 max-w-[18ch] text-[clamp(1.75rem,3vw,2.5rem)] leading-[1.02] font-semibold tracking-[-0.035em]">
            <Link to={href} className="hover:underline hover:underline-offset-4">
              {name}
            </Link>
          </h3>
          <p className="tnum mt-2 text-[1.25rem] font-semibold">{formatPriceRange(product.price_range, product.currency)}</p>
        </div>
        <BuyButton product={product} large />
      </div>
    </article>
  )
}

/** #2 en adelante: fila de ranking con numeral, miniatura, datos y precio. */
function RankRow({ product, rank, wait }: { product: ProductSummary; rank: number; wait: number }) {
  const name = cleanName(product.name)
  return (
    <li style={{ '--d': `${wait}ms` } as React.CSSProperties}>
      {rank > 2 && <StepBand className="mx-3 my-1 w-[calc(100%-1.5rem)] text-ink/10" height={8} />}
      <Link
        to={`/producto/${product.slug}`}
        className="group flex items-center gap-3 rounded-[1.25rem] p-2 pr-3 transition-[background-color,box-shadow] duration-300 hover:bg-surface hover:shadow-[0_16px_34px_-26px_rgb(23_22_43/0.45)] sm:gap-4 sm:pr-4"
      >
        <span className="tnum w-11 shrink-0 text-center text-[1.75rem] leading-none font-light tracking-[-0.04em] text-brand-muted transition-colors group-hover:font-bold group-hover:text-brand-700 sm:w-14 sm:text-[2.25rem]">
          <span className="sr-only">Puesto </span>
          {pad(rank)}
        </span>
        <ProductImage
          src={product.image_thumb_url ?? product.image_url}
          alt=""
          className="h-16 w-16 shrink-0 rounded-[0.875rem] sm:h-[4.5rem] sm:w-[4.5rem]"
        />
        <span className="min-w-0 flex-1">
          {product.category && <span className="block truncate text-[0.75rem] text-ink-3">{product.category.name}</span>}
          <span className="block truncate text-[0.9375rem] font-semibold text-ink sm:text-[1rem]">{name}</span>
          <span className="tnum mt-0.5 block text-[0.875rem] font-semibold text-brand-700 sm:hidden">
            {formatPriceRange(product.price_range, product.currency)}
          </span>
        </span>
        <span className="tnum hidden shrink-0 text-[1rem] font-semibold text-brand-700 sm:block">
          {formatPriceRange(product.price_range, product.currency)}
        </span>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface text-ink-2 transition-colors duration-300 group-hover:bg-brand-600 group-hover:text-white">
          <Arrow />
        </span>
      </Link>
    </li>
  )
}

/**
 * Top productos como ranking editorial: el #1 protagonista a la izquierda; del #2 al #7 una lista
 * numerada a la derecha, con divisiones escalonadas. Todo visible de un vistazo, sin carrusel.
 */
export function TopProducts() {
  const top = useTopProducts()
  const items = (top.data ?? []).slice(0, 7)
  const list = useReveal<HTMLOListElement>(0.1)

  if (top.isError || (!top.isPending && items.length === 0)) return null

  return (
    <section aria-labelledby="top-titulo" className="mx-auto max-w-[1360px] px-4 pt-24 sm:px-8 lg:pt-32">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2
            id="top-titulo"
            className="text-[clamp(2.25rem,5vw,3.75rem)] leading-[1.02] font-light tracking-[-0.04em] text-brand-muted"
          >
            Top <span className="font-bold text-brand-700">productos</span>
          </h2>
          <p className="mt-2 text-[1rem] text-ink-3">Las piezas más destacadas de la tienda.</p>
        </div>
        <Link to="/productos" className="btn btn--ghost btn--pill px-5">
          Ver todo el catálogo
          <Arrow />
        </Link>
      </div>

      {top.isPending ? (
        <div className="grid gap-5 lg:grid-cols-12">
          <div className="h-[30rem] animate-pulse rounded-[1.75rem] bg-sunk lg:col-span-6 lg:h-[40rem]" />
          <div className="space-y-3 lg:col-span-6">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="h-[5.25rem] animate-pulse rounded-[1.25rem] bg-sunk" />
            ))}
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="min-w-0 lg:col-span-6">
            <FeatureCard product={items[0]} />
          </div>
          <div className="min-w-0 lg:col-span-6">
            <ol ref={list} className="cascade" aria-label="Del puesto 2 al 7">
              {items.slice(1).map((p, i) => (
                <RankRow key={p.id} product={p} rank={i + 2} wait={i * 60} />
              ))}
            </ol>
          </div>
        </div>
      )}
    </section>
  )
}
