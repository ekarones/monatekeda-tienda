import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useSmartSearch, type SearchSort } from '../api/search'
import { useCategories, useProducts, useTags } from '../api/store'
import type { Category, ProductFilters, ProductSort } from '../api/types'
import { Pagination } from '../components/Pagination'
import { ProductCard, ProductGrid, ProductGridSkeleton } from '../components/ProductCard'
import { EmptyState, ErrorState } from '../components/States'

const PER_PAGE = 24

const SORTS: { value: SearchSort; label: string }[] = [
  { value: 'relevance', label: 'Más relevantes' },
  { value: 'newest', label: 'Más recientes' },
  { value: 'price_asc', label: 'Precio: menor a mayor' },
  { value: 'price_desc', label: 'Precio: mayor a menor' },
  { value: 'name_asc', label: 'Nombre (A-Z)' },
]

const toNumber = (v: string | null) => {
  if (v === null || v.trim() === '') return undefined
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 ? n : undefined
}

/** Busca una categoría en el árbol y devuelve la ruta desde la raíz. */
function findPath(tree: Category[], id: number, path: Category[] = []): Category[] | null {
  for (const node of tree) {
    const next = [...path, node]
    if (node.id === id) return next
    const found = findPath(node.children, id, next)
    if (found) return found
  }
  return null
}

function CategoryFilter({
  tree,
  selected,
  onSelect,
}: {
  tree: Category[]
  selected?: number
  onSelect: (id?: number) => void
}) {
  const path = selected ? findPath(tree, selected) : null
  const activeRoot = path?.[0]?.id

  const item = (active: boolean) =>
    `block w-full rounded-lg px-2.5 py-1.5 text-left text-sm ${
      active ? 'bg-brand-50 font-medium text-brand-800' : 'text-stone-600 hover:bg-stone-100'
    }`

  return (
    <ul className="space-y-0.5">
      <li>
        <button className={item(!selected)} onClick={() => onSelect(undefined)}>
          Todas
        </button>
      </li>
      {tree.map((root) => (
        <li key={root.id}>
          <button className={item(selected === root.id)} onClick={() => onSelect(root.id)}>
            {root.name}
          </button>
          {activeRoot === root.id && root.children.length > 0 && (
            <ul className="mt-0.5 ml-3 space-y-0.5 border-l border-stone-200 pl-2">
              {root.children.map((child) => (
                <li key={child.id}>
                  <button className={item(selected === child.id)} onClick={() => onSelect(child.id)}>
                    {child.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  )
}

function PriceFilter({
  min,
  max,
  onApply,
}: {
  min?: number
  max?: number
  onApply: (min?: number, max?: number) => void
}) {
  const [localMin, setLocalMin] = useState(min?.toString() ?? '')
  const [localMax, setLocalMax] = useState(max?.toString() ?? '')
  const input =
    'w-full rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-brand-500'

  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        onApply(toNumber(localMin), toNumber(localMax))
      }}
    >
      <input
        className={input}
        inputMode="decimal"
        placeholder="Mín"
        aria-label="Precio mínimo"
        value={localMin}
        onChange={(e) => setLocalMin(e.target.value)}
      />
      <span className="text-stone-400">–</span>
      <input
        className={input}
        inputMode="decimal"
        placeholder="Máx"
        aria-label="Precio máximo"
        value={localMax}
        onChange={(e) => setLocalMax(e.target.value)}
      />
      <button className="rounded-lg bg-stone-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-stone-900">
        Ir
      </button>
    </form>
  )
}

export function ProductsPage() {
  const [params, setParams] = useSearchParams()
  const categories = useCategories()
  const tags = useTags()
  const [filtersOpen, setFiltersOpen] = useState(false)

  const q = params.get('q') ?? ''
  const categoryId = toNumber(params.get('categoria'))
  const tagSlug = params.get('tag') ?? undefined
  const priceMin = toNumber(params.get('min'))
  const priceMax = toNumber(params.get('max'))
  // Con búsqueda, el orden por defecto es por relevancia; sin búsqueda, los más recientes
  const defaultSort: SearchSort = q ? 'relevance' : 'newest'
  const sortParam = params.get('orden')
  const sort = (
    SORTS.some((s) => s.value === sortParam) && (q || sortParam !== 'relevance') ? sortParam : defaultSort
  ) as SearchSort
  const page = Math.max(1, toNumber(params.get('page')) ?? 1)

  const tag = tagSlug ? tags.data?.find((t) => t.slug === tagSlug) : undefined

  const filters: ProductFilters = {
    search: q || undefined,
    category_id: categoryId,
    include_descendants: categoryId ? true : undefined,
    // En la URL va el slug (amigable); a la API se manda tag_id (match exacto).
    // Si /tags aún no cargó o el slug no existe, se usa el slug como fallback.
    tag_id: tag?.id,
    tag: tagSlug && !tag && !tags.isPending ? tagSlug : undefined,
    price_min: priceMin,
    price_max: priceMax,
    sort: sort === 'relevance' ? undefined : (sort as ProductSort),
    page,
    per_page: PER_PAGE,
  }
  const listing = useProducts(filters, !q && !(tagSlug && tags.isPending))
  // Con texto de búsqueda: búsqueda inteligente (plurales, sinónimos, categorías, relevancia)
  const search = useSmartSearch(
    q,
    {
      category_id: categoryId,
      include_descendants: categoryId ? true : undefined,
      tag_id: tag?.id,
      tag: filters.tag,
      price_min: priceMin,
      price_max: priceMax,
    },
    sort,
    page,
    PER_PAGE,
  )
  const products = q ? search : listing

  const categoryPath = useMemo(
    () => (categoryId && categories.data ? findPath(categories.data, categoryId) : null),
    [categoryId, categories.data],
  )

  /** Actualiza query params; cualquier cambio de filtro vuelve a la página 1. */
  const update = (changes: Record<string, string | number | undefined>, resetPage = true) => {
    const next = new URLSearchParams(params)
    for (const [key, value] of Object.entries(changes)) {
      if (value === undefined || value === '') next.delete(key)
      else next.set(key, String(value))
    }
    if (resetPage) next.delete('page')
    setParams(next)
  }

  const hasFilters = Boolean(q || categoryId || tagSlug || priceMin !== undefined || priceMax !== undefined)
  const title = q ? `Resultados para “${q}”` : (categoryPath?.at(-1)?.name ?? (tag ? tag.name : 'Catálogo'))

  const sidebar = (
    <div className="space-y-6">
      {categories.data && categories.data.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-semibold tracking-wide text-stone-500 uppercase">Categorías</h3>
          <CategoryFilter tree={categories.data} selected={categoryId} onSelect={(id) => update({ categoria: id })} />
        </div>
      )}
      {tags.data && tags.data.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-semibold tracking-wide text-stone-500 uppercase">Etiquetas</h3>
          <div className="flex flex-wrap gap-1.5">
            {tags.data.map((t) => {
              const active = t.slug === tagSlug
              return (
                <button
                  key={t.id}
                  onClick={() => update({ tag: active ? undefined : t.slug })}
                  aria-pressed={active}
                  className={`rounded-full border px-3 py-1 text-sm ${
                    active
                      ? 'border-brand-700 bg-brand-700 text-white'
                      : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300'
                  }`}
                >
                  {t.name}
                </button>
              )
            })}
          </div>
        </div>
      )}
      <div>
        <h3 className="mb-2 text-xs font-semibold tracking-wide text-stone-500 uppercase">Precio (S/)</h3>
        <PriceFilter
          key={`${priceMin}-${priceMax}`}
          min={priceMin}
          max={priceMax}
          onApply={(min, max) => update({ min, max })}
        />
      </div>
      {hasFilters && (
        <button
          onClick={() => setParams(new URLSearchParams(sort !== defaultSort && sort !== 'relevance' ? { orden: sort } : {}))}
          className="text-sm font-medium text-brand-700 hover:underline"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  )

  return (
    <div>
      {categoryPath && categoryPath.length > 1 && (
        <nav className="mb-2 text-sm text-stone-500" aria-label="Ruta">
          {categoryPath.map((c, i) => (
            <span key={c.id}>
              {i > 0 && ' › '}
              <Link to={`/productos?categoria=${c.id}`} className="hover:text-stone-800">
                {c.name}
              </Link>
            </span>
          ))}
        </nav>
      )}

      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {products.data && (
            <p className="mt-1 text-sm text-stone-500">
              {products.data.meta.total} {products.data.meta.total === 1 ? 'producto' : 'productos'}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFiltersOpen((o) => !o)}
            aria-expanded={filtersOpen}
            className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium lg:hidden"
          >
            Filtros
          </button>
          <select
            value={sort}
            onChange={(e) => update({ orden: e.target.value === defaultSort ? undefined : e.target.value })}
            aria-label="Ordenar por"
            className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm outline-none focus:border-brand-500"
          >
            {SORTS.filter((s) => q || s.value !== 'relevance').map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside
          className={`${filtersOpen ? 'block' : 'hidden'} rounded-2xl border border-stone-200 bg-white p-4 lg:block lg:self-start`}
        >
          {sidebar}
        </aside>

        <div className={products.isPlaceholderData ? 'opacity-60 transition-opacity' : ''}>
          {products.isPending ? (
            <ProductGridSkeleton count={12} />
          ) : products.isError ? (
            <ErrorState error={products.error} onRetry={() => products.refetch()} />
          ) : products.data.data.length === 0 ? (
            <EmptyState title="No encontramos productos">
              {q && search.data?.suggestion ? (
                <p>
                  ¿Quisiste decir{' '}
                  <Link
                    to={`/productos?q=${encodeURIComponent(search.data.suggestion)}`}
                    className="font-semibold text-brand-700 underline underline-offset-4"
                  >
                    {search.data.suggestion}
                  </Link>
                  ?
                </p>
              ) : (
                <p>Prueba con otra búsqueda o quita algunos filtros.</p>
              )}
            </EmptyState>
          ) : (
            <>
              {q && search.data?.corrected && (
                <p className="mb-4 rounded-xl bg-surface px-4 py-3 text-[0.9375rem] text-ink-2">
                  No encontramos «{q}». Te mostramos resultados para{' '}
                  <strong className="font-semibold text-ink">{search.data.corrected}</strong>.
                </p>
              )}
              {q && search.data?.partial && !search.data.corrected && (
                <p className="mb-4 rounded-xl bg-surface px-4 py-3 text-[0.9375rem] text-ink-2">
                  No encontramos piezas con todas las palabras de «{q}». Te mostramos las más parecidas.
                </p>
              )}
              <ProductGrid>
                {products.data.data.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </ProductGrid>
              <Pagination
                page={products.data.meta.current_page}
                lastPage={products.data.meta.last_page}
                onChange={(p) => {
                  update({ page: p === 1 ? undefined : p }, false)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
