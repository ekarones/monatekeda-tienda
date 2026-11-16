import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { apiGet, seg } from './client'
import type {
  Category,
  LookupResult,
  Paginated,
  ProductDetail,
  ProductFilters,
  ProductSummary,
  Tag,
  Variation,
} from './types'

type Data<T> = { data: T }

const MINUTE = 60_000

export const storeApi = {
  products: (filters: ProductFilters, signal?: AbortSignal) =>
    apiGet<Paginated<ProductSummary>>('/products', { ...filters }, signal),
  featured: (signal?: AbortSignal) =>
    apiGet<Data<ProductSummary[]>>('/products/featured', undefined, signal).then((r) => r.data),
  product: (codeOrSlug: string, signal?: AbortSignal) =>
    apiGet<Data<ProductDetail>>(`/products/${seg(codeOrSlug)}`, undefined, signal).then((r) => r.data),
  variations: (codeOrSlug: string, signal?: AbortSignal) =>
    apiGet<Data<Variation[]>>(`/products/${seg(codeOrSlug)}/variations`, undefined, signal).then((r) => r.data),
  categories: (signal?: AbortSignal) =>
    apiGet<Data<Category[]>>('/categories', undefined, signal).then((r) => r.data),
  tags: (signal?: AbortSignal) => apiGet<Data<Tag[]>>('/tags', undefined, signal).then((r) => r.data),
  lookup: (code: string, signal?: AbortSignal) =>
    apiGet<Data<LookupResult>>(`/lookup/${seg(code)}`, undefined, signal).then((r) => r.data),
}

// Categorías y tags cambian poco: se cachean largo para ahorrar rate limit.
export const useCategories = () =>
  useQuery({
    queryKey: ['categories'],
    queryFn: ({ signal }) => storeApi.categories(signal),
    staleTime: 30 * MINUTE,
  })

export const useTags = () =>
  useQuery({
    queryKey: ['tags'],
    queryFn: ({ signal }) => storeApi.tags(signal),
    staleTime: 30 * MINUTE,
  })

export const useProducts = (filters: ProductFilters, enabled = true) =>
  useQuery({
    queryKey: ['products', filters],
    queryFn: ({ signal }) => storeApi.products(filters, signal),
    staleTime: 2 * MINUTE,
    placeholderData: keepPreviousData,
    enabled,
  })

export const useProduct = (slug: string) =>
  useQuery({
    queryKey: ['product', slug],
    queryFn: ({ signal }) => storeApi.product(slug, signal),
    staleTime: 2 * MINUTE,
  })

export const useVariations = (slug: string, enabled: boolean) =>
  useQuery({
    queryKey: ['variations', slug],
    queryFn: ({ signal }) => storeApi.variations(slug, signal),
    staleTime: 2 * MINUTE,
    enabled,
  })

export const useLookup = (code: string) =>
  useQuery({
    queryKey: ['lookup', code],
    queryFn: ({ signal }) => storeApi.lookup(code, signal),
    staleTime: 10 * MINUTE,
  })
