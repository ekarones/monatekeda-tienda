import { useMemo, useState } from 'react'
import Markdown from 'react-markdown'
import { Link, useParams, useSearchParams } from 'react-router'
import { ApiError } from '../api/client'
import { useProduct, useVariations } from '../api/store'
import type { ProductDetail, Variation } from '../api/types'
import { ProductImage } from '../components/ProductImage'
import { ErrorState, NotFound, Spinner } from '../components/States'
import { cleanName, formatPresentation, formatPrice, formatPriceRange } from '../lib/format'
import {
  findVariation,
  groupAttributes,
  initialSelection,
  optionState,
  selectValue,
  variantLabel,
  type Selection,
} from '../lib/variations'
import { useCart } from '../store/cart'

const Chevron = ({ dir }: { dir: 'left' | 'right' }) => (
  <svg viewBox="0 0 16 16" width={16} height={16} aria-hidden="true">
    <path
      d={dir === 'left' ? 'm10 3-5 5 5 5' : 'm6 3 5 5-5 5'}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

/**
 * Galería de la ficha (producto simple o padre): foto grande, flechas y contador, y miniaturas.
 * Si la variación elegida tiene su propia foto, se muestra esa; al tocar una miniatura se vuelve a la galería.
 */
function Gallery({ product, override }: { product: ProductDetail; override?: string | null }) {
  const images = product.images.length
    ? product.images
    : product.image_url
      ? [{ id: 0, url: product.image_url, thumb_url: product.image_thumb_url, is_featured: true }]
      : []
  // La API ya manda la galería ordenada (is_featured primero, luego sort_order). El orden estable
  // solo asegura que la principal quede primera si algún día no viniera así.
  const ordered = [...images].sort((a, b) => Number(b.is_featured) - Number(a.is_featured))
  const [active, setActive] = useState(0)
  // Foto de variación que la persona ya dejó atrás tocando la galería
  const [dismissed, setDismissed] = useState<string | null>(null)
  const name = cleanName(product.name)
  const showOverride = Boolean(override) && override !== dismissed
  const main = showOverride ? override! : (ordered[active]?.url ?? null)
  const many = ordered.length > 1

  const go = (i: number) => {
    setActive((i + ordered.length) % ordered.length)
    setDismissed(override ?? null)
  }

  return (
    <div>
      <div className="group relative">
        <ProductImage
          key={main ?? 'vacia'}
          src={main}
          alt={many && !showOverride ? `${name}, foto ${active + 1} de ${ordered.length}` : name}
          loading="eager"
          className="fade-in aspect-square w-full rounded-2xl"
        />
        {many && (
          <>
            {(['left', 'right'] as const).map((dir) => (
              <button
                key={dir}
                type="button"
                onClick={() => go(showOverride ? active : active + (dir === 'left' ? -1 : 1))}
                aria-label={dir === 'left' ? 'Foto anterior' : 'Foto siguiente'}
                className={`absolute top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-surface/90 text-ink shadow-[0_10px_22px_-14px_rgb(23_22_43/0.6)] backdrop-blur transition-[opacity,background-color,color] hover:bg-brand-600 hover:text-white sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100 ${
                  dir === 'left' ? 'left-3' : 'right-3'
                }`}
              >
                <Chevron dir={dir} />
              </button>
            ))}
            {!showOverride && (
              <span className="tnum absolute right-3 bottom-3 rounded-full bg-ink/75 px-2.5 py-1 text-[0.75rem] font-medium text-white">
                {active + 1} / {ordered.length}
              </span>
            )}
          </>
        )}
      </div>
      {many && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Fotos del producto">
          {ordered.map((img, i) => {
            const current = i === active && !showOverride
            return (
              <button
                key={img.id}
                type="button"
                onClick={() => go(i)}
                aria-label={`Ver foto ${i + 1}`}
                aria-current={current}
                className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-[border-color,opacity] sm:h-20 sm:w-20 ${
                  current ? 'border-brand-600' : 'border-transparent opacity-70 hover:opacity-100'
                }`}
              >
                <ProductImage src={img.thumb_url ?? img.url} alt="" className="h-full w-full" />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function VariationPicker({
  variations,
  selection,
  onChange,
}: {
  variations: Variation[]
  selection: Selection
  onChange: (s: Selection) => void
}) {
  const groups = useMemo(() => groupAttributes(variations), [variations])

  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <fieldset key={g.id}>
          <legend className="mb-2 text-sm font-medium text-stone-700">
            {g.name}
            {selection[g.id] && <span className="font-normal text-stone-500">: {selection[g.id]}</span>}
          </legend>
          <div className="flex flex-wrap gap-2">
            {g.values.map((value) => {
              const { exists, inStock } = optionState(variations, selection, g.id, value)
              const selected = selection[g.id] === value
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onChange(selectValue(variations, selection, g.id, value))}
                  title={!inStock ? 'Agotado' : undefined}
                  className={`min-w-12 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                    selected
                      ? 'border-brand-700 bg-brand-700 text-white'
                      : 'border-stone-300 bg-white text-stone-800 hover:border-stone-500'
                  } ${!exists || !inStock ? 'line-through decoration-1 opacity-50' : ''}`}
                >
                  {value}
                </button>
              )
            })}
          </div>
        </fieldset>
      ))}
    </div>
  )
}

function ProductView({ product, preselect }: { product: ProductDetail; preselect?: number }) {
  const isVariable = product.type === 'variable'
  const variations = useVariations(product.slug, isVariable)
  const list = useMemo(() => variations.data ?? [], [variations.data])
  const groups = useMemo(() => groupAttributes(list), [list])

  const [selection, setSelection] = useState<Selection | null>(null)
  const effectiveSelection = selection ?? initialSelection(list, groups, preselect)
  const variation = isVariable ? findVariation(list, groups, effectiveSelection) : undefined

  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const add = useCart((s) => s.add)

  const name = cleanName(product.name)
  const inStock = isVariable ? (variation ? variation.in_stock : product.in_stock) : product.in_stock
  const needsSelection = isVariable && list.length > 0 && !variation
  const canBuy = inStock && !needsSelection && !(isVariable && !variations.isSuccess)
  const presentation = formatPresentation(product.unit_value, product.unit_of_measure)

  const handleAdd = () => {
    const price = variation?.final_price ?? product.price_range.min
    add(
      {
        productId: product.id,
        variationId: variation?.id ?? null,
        slug: product.slug,
        code: variation?.code ?? product.code,
        name,
        variantLabel: variation ? variantLabel(variation) : null,
        price,
        currency: variation?.currency ?? product.currency,
        imageUrl: variation?.image_thumb_url ?? product.image_thumb_url ?? product.image_url,
      },
      qty,
    )
    setAdded(true)
    setTimeout(() => setAdded(false), 2500)
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Gallery product={product} override={variation?.image_url} />

      <div>
        {product.category && (
          <Link
            to={`/productos?categoria=${product.category.id}`}
            className="text-sm text-stone-500 hover:text-stone-800"
          >
            {product.category.name}
          </Link>
        )}
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{name}</h1>
        {presentation && <p className="mt-1 text-stone-500">{presentation}</p>}

        <p className="mt-4 text-2xl font-semibold text-brand-700">
          {variation
            ? formatPrice(variation.final_price, variation.currency)
            : formatPriceRange(product.price_range, product.currency)}
        </p>
        <p className={`mt-1 text-sm font-medium ${inStock ? 'text-emerald-700' : 'text-stone-500'}`}>
          {inStock ? 'Disponible' : 'Agotado'}
        </p>

        {product.short_description && <p className="mt-4 text-stone-700">{product.short_description}</p>}

        {isVariable && (
          <div className="mt-6">
            {variations.isPending ? (
              <div className="h-16 animate-pulse rounded-lg bg-stone-100" />
            ) : variations.isError ? (
              <ErrorState error={variations.error} onRetry={() => variations.refetch()} />
            ) : (
              <VariationPicker variations={list} selection={effectiveSelection} onChange={setSelection} />
            )}
          </div>
        )}

        <div className="mt-6 flex items-center gap-3">
          <div className="flex items-center rounded-full border border-stone-300 bg-white">
            <button
              className="h-11 w-11 text-lg disabled:opacity-30"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              disabled={qty <= 1}
              aria-label="Disminuir cantidad"
            >
              −
            </button>
            <span className="w-8 text-center font-medium" aria-live="polite">
              {qty}
            </span>
            <button
              className="h-11 w-11 text-lg disabled:opacity-30"
              onClick={() => setQty((q) => Math.min(99, q + 1))}
              disabled={qty >= 99}
              aria-label="Aumentar cantidad"
            >
              +
            </button>
          </div>
          <button
            onClick={handleAdd}
            disabled={!canBuy}
            className="h-11 flex-1 rounded-full bg-brand-700 px-6 font-semibold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:bg-stone-300"
          >
            {!inStock ? 'Agotado' : needsSelection ? 'Elige una opción' : 'Agregar al carrito'}
          </button>
        </div>
        {added && (
          <p className="mt-3 text-sm text-emerald-700" role="status">
            Agregado al carrito.{' '}
            <Link to="/carrito" className="font-medium underline">
              Ver carrito
            </Link>
          </p>
        )}

        {product.description && (
          <div className="prose-store mt-8 border-t border-stone-200 pt-6">
            {/* react-markdown no renderiza HTML crudo por defecto: seguro ante XSS. */}
            <Markdown>{product.description}</Markdown>
          </div>
        )}

        {product.tags.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-1.5">
            {product.tags.map((t) => (
              <Link
                key={t.id}
                to={`/productos?tag=${t.slug}`}
                className="rounded-full bg-stone-100 px-3 py-1 text-sm text-stone-600 hover:bg-stone-200"
              >
                {t.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function ProductDetailPage() {
  const { slug = '' } = useParams()
  const [params] = useSearchParams()
  const product = useProduct(slug)
  const preselect = Number(params.get('v')) || undefined

  if (product.isPending) return <Spinner />
  if (product.isError) {
    if (product.error instanceof ApiError && product.error.status === 404) {
      return <NotFound title="Producto no encontrado" />
    }
    return <ErrorState error={product.error} onRetry={() => product.refetch()} />
  }
  // key: reinicia selección/cantidad al navegar entre productos.
  return <ProductView key={product.data.id} product={product.data} preselect={preselect} />
}
