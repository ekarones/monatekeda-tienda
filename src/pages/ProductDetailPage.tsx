import { useMemo, useState } from 'react'
import Markdown from 'react-markdown'
import { Link, useParams, useSearchParams } from 'react-router'
import { ApiError } from '../api/client'
import { useProduct, useVariations } from '../api/store'
import type { ProductDetail, Variation } from '../api/types'
import { ProductImage } from '../components/ProductImage'
import { ErrorState, NotFound, Spinner } from '../components/States'
import { cleanName, formatMoney, formatPresentation, formatPriceRange } from '../lib/format'
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

function Gallery({ product, override }: { product: ProductDetail; override?: string | null }) {
  const images = product.images.length
    ? product.images
    : product.image_url
      ? [{ id: 0, url: product.image_url, thumb_url: product.image_thumb_url, is_featured: true }]
      : []
  const [active, setActive] = useState(0)
  const name = cleanName(product.name)
  const main = override ?? images[active]?.url ?? null

  return (
    <div>
      <ProductImage src={main} alt={name} loading="eager" className="aspect-square w-full rounded-2xl" />
      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActive(i)}
              aria-label={`Ver imagen ${i + 1}`}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${
                i === active && !override ? 'border-brand-700' : 'border-transparent'
              }`}
            >
              <ProductImage src={img.thumb_url ?? img.url} alt="" className="h-full w-full" />
            </button>
          ))}
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
  const canBuy = inStock && !needsSelection && !(isVariable && variations.isPending)
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
            ? formatMoney(variation.final_price, variation.currency)
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
