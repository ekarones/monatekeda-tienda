import { useState } from 'react'
import { Link } from 'react-router'
import type { ProductSummary } from '../api/types'
import { cleanName, formatPriceRange } from '../lib/format'
import { useCart } from '../store/cart'
import { CartIcon } from './Ornaments'
import { ProductImage } from './ProductImage'

interface CardProps {
  product: ProductSummary
  eager?: boolean
  /** Compatibilidad con llamadas anteriores; el origen se muestra solo si existe. */
  showOrigin?: boolean
  /** Compatibilidad: ya no se usa subgrid. */
  registered?: boolean
}

const Arrow = () => (
  <svg viewBox="0 0 16 16" width={15} height={15} aria-hidden="true">
    <path d="M3 8h10m-4-4 4 4-4 4" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const Check = () => (
  <svg viewBox="0 0 16 16" width={16} height={16} aria-hidden="true">
    <path d="m3.5 8.5 3 3 6-7" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const round =
  'ml-auto flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full transition-[background-color,color,transform] duration-300 ease-out-expo'

/**
 * Tarjeta de pieza: placa blanca con la foto cuadrada enmarcada, datos en tres niveles
 * (categoría · nombre · precio) y una acción redonda a la derecha del precio.
 */
export function ProductCard({ product, eager = false }: CardProps) {
  const name = cleanName(product.name)
  const origin = product.tags[0]?.name
  const add = useCart((s) => s.add)
  const [added, setAdded] = useState(false)
  const href = `/producto/${product.slug}`

  const addSimple = () => {
    add({
      productId: product.id,
      variationId: null,
      slug: product.slug,
      code: product.code,
      name,
      variantLabel: null,
      price: product.price_range.min,
      currency: product.currency,
      imageUrl: product.image_thumb_url ?? product.image_url,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <article className="group flex w-full flex-col rounded-[1.25rem] bg-surface p-2 shadow-[0_16px_34px_-26px_rgb(23_22_43/0.45)] transition-[transform,box-shadow] duration-500 ease-out-expo hover:-translate-y-1 hover:shadow-[0_26px_44px_-24px_rgb(23_22_43/0.5)]">
      <Link to={href} className="relative block overflow-hidden rounded-[0.875rem] bg-sunk" tabIndex={-1} aria-hidden="true">
        <ProductImage
          src={product.image_thumb_url ?? product.image_url}
          alt={name}
          loading={eager ? 'eager' : 'lazy'}
          className={`aspect-square w-full transition-transform duration-[900ms] ease-out-expo group-hover:scale-[1.05] ${
            product.in_stock ? '' : 'opacity-60 grayscale'
          }`}
        />
        {!product.in_stock && (
          <span className="absolute top-2.5 left-2.5 rounded-full bg-ink/80 px-2.5 py-1 text-[0.75rem] font-medium text-white">
            Agotado
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col px-1.5 pt-3 pb-1.5 sm:px-2 sm:pb-2">
        <p className="truncate text-[0.75rem] text-ink-3">
          {product.category?.name ?? 'Artesanía'}
          {origin && <> · {origin}</>}
        </p>
        <h3 className="mt-0.5 line-clamp-2 text-[0.9375rem] leading-snug font-semibold tracking-[-0.01em] text-ink sm:text-[1rem]">
          <Link to={href} className="hover:text-brand-700">
            {name}
          </Link>
        </h3>

        {/* mt-auto: precio y acción alineados en la fila aunque un nombre ocupe dos líneas */}
        {/* En tarjetas angostas (móvil de 320px) el botón baja a su propia línea en vez de tapar el precio */}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-2 gap-y-2 pt-3">
          <p className="tnum min-w-0 text-[0.8125rem] font-semibold whitespace-nowrap text-brand-700 min-[400px]:text-[0.875rem] sm:text-[1rem]">
            {formatPriceRange(product.price_range, product.currency)}
          </p>
          {!product.in_stock ? (
            <span className={`${round} bg-sunk text-ink-3`} aria-label="Agotado" role="img">
              <CartIcon size={17} />
            </span>
          ) : product.type === 'variable' ? (
            <Link
              to={href}
              aria-label={`Elegir opción de ${name}`}
              title="Elegir opción"
              className={`${round} bg-ink text-white hover:translate-x-0.5 hover:bg-brand-600`}
            >
              <Arrow />
            </Link>
          ) : (
            <button
              onClick={addSimple}
              aria-label={added ? `${name} agregado al carrito` : `Agregar ${name} al carrito`}
              title={added ? 'Agregado' : 'Agregar al carrito'}
              aria-live="polite"
              className={`${round} ${added ? 'bg-[#1f8a4c] text-white' : 'bg-brand-600 text-white hover:scale-105 hover:bg-brand-700'}`}
            >
              {added ? <Check /> : <CartIcon size={17} />}
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

export function ProductGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">{children}</div>
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <ProductGrid>
      {Array.from({ length: count }, (_, i) => <PlateSkeleton key={i} />)}
    </ProductGrid>
  )
}

export function PlateSkeleton() {
  return (
    <div className="flex animate-pulse flex-col rounded-[1.25rem] bg-surface p-2">
      <div className="aspect-square rounded-[0.875rem] bg-sunk" />
      <div className="px-2 pt-3 pb-2">
        <div className="h-3 w-1/3 rounded bg-sunk" />
        <div className="mt-2 h-4 w-3/4 rounded bg-sunk" />
        <div className="mt-4 flex items-center justify-between">
          <div className="h-4 w-1/3 rounded bg-sunk" />
          <div className="h-10 w-10 rounded-full bg-sunk" />
        </div>
      </div>
    </div>
  )
}
