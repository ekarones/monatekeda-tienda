import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { apiTerms, categoryTokenMap, matchCategories, parseQuery, score, suggest, type Scored } from '../lib/search'
import { storeApi, useCategories } from './store'
import type { Paginated, ProductFilters, ProductSort, ProductSummary } from './types'

/** Páginas de 50 (el máximo de la API) que se piden por término: hasta 100 resultados cada uno. */
const PAGES_PER_TERM = 2
const MAX_CATEGORIES = 2

export type SearchSort = ProductSort | 'relevance'

export interface SearchResult extends Paginated<ProductSummary> {
  /** No hubo coincidencias con todas las palabras: se muestran las más parecidas */
  partial: boolean
  /** Palabra parecida de la tienda cuando no se encontró nada */
  suggestion: string | null
  /** Sin resultados para lo escrito, se muestran los de esta palabra parecida ("alpca" → "alpaca") */
  corrected: string | null
}

/** Filtros que respetan las consultas de búsqueda (categoría, etiqueta, precio). */
type Scope = Pick<ProductFilters, 'category_id' | 'include_descendants' | 'tag_id' | 'tag' | 'price_min' | 'price_max'>

async function fetchAll(filters: ProductFilters, signal: AbortSignal) {
  const first = await storeApi.products({ ...filters, per_page: 50, page: 1 }, signal)
  const rest = []
  for (let page = 2; page <= Math.min(first.meta.last_page, PAGES_PER_TERM); page++)
    rest.push(storeApi.products({ ...filters, per_page: 50, page }, signal))
  return [first, ...(await Promise.all(rest))].flatMap((r) => r.data)
}

const byPrice = (p: ProductSummary) => p.price_range.min

/**
 * Búsqueda inteligente para el catálogo: consulta la API con el singular de cada palabra, sus
 * sinónimos y las categorías que coinciden; une, puntúa y pagina en el navegador.
 */
export function useSmartSearch(raw: string, scope: Scope, sort: SearchSort, page: number, perPage: number) {
  const categories = useCategories()
  const q = parseQuery(raw)
  const enabled = q.tokens.length > 0 && !categories.isPending

  return useQuery({
    queryKey: ['smart-search', q.tokens, scope, sort, page, perPage],
    enabled,
    staleTime: 2 * 60_000,
    placeholderData: keepPreviousData,
    queryFn: async ({ signal }): Promise<SearchResult> => {
      const tree = categories.data ?? []
      const first = await run(q)
      if (first.total > 0) return first.result(null)
      // Nada con lo escrito: se prueba una vez con la palabra parecida de la tienda
      const alt = suggest(raw, tree)
      if (alt) {
        const second = await run(parseQuery(alt))
        if (second.total > 0) return second.result(alt)
      }
      return { ...first.result(null), suggestion: alt }

      async function run(q: ReturnType<typeof parseQuery>) {
        // Si ya hay una categoría elegida, no se suman otras por nombre
        const hits = scope.category_id ? [] : matchCategories(tree, q).slice(0, MAX_CATEGORIES)
        const catTokens = categoryTokenMap(hits)

        const batches = await Promise.all([
          ...apiTerms(q).map((term) => fetchAll({ ...scope, search: term }, signal)),
          ...hits.map((h) => fetchAll({ ...scope, category_id: h.category.id, include_descendants: true }, signal)),
        ])
        const unique = new Map<number, ProductSummary>()
        batches.flat().forEach((p) => unique.set(p.id, p))

        const scored = [...unique.values()].map((p) => score(p, q, catTokens)).filter((s) => s.score > 5)
        const full = scored.filter((s) => s.full)
        const partial = full.length === 0 && scored.length > 0
        const list: Scored[] = full.length ? full : scored

        const ordered = [...list].sort((a, b) => {
          if (sort === 'price_asc') return byPrice(a.product) - byPrice(b.product)
          if (sort === 'price_desc') return byPrice(b.product) - byPrice(a.product)
          if (sort === 'name_asc') return a.product.name.localeCompare(b.product.name, 'es')
          if (sort === 'newest') return b.product.id - a.product.id
          return b.score - a.score || b.product.id - a.product.id
        })

        const total = ordered.length
        const lastPage = Math.max(1, Math.ceil(total / perPage))
        const current = Math.min(page, lastPage)
        return {
          total,
          result: (corrected: string | null): SearchResult => ({
            data: ordered.slice((current - 1) * perPage, current * perPage).map((s) => s.product),
            meta: {
              current_page: current,
              last_page: lastPage,
              per_page: perPage,
              total,
              currency: 'PEN',
            },
            partial,
            suggestion: null,
            corrected,
          }),
        }
      }
    },
  })
}
