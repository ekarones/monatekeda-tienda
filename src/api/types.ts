export type UnitOfMeasure = 'unit' | 'kg' | 'g' | 'l' | 'ml' | 'box' | 'pack'

export interface Tag {
  id: number
  name: string
  slug: string
}

export interface CategoryRef {
  id: number
  name: string
  parent_id: number | null
}

export interface Category extends CategoryRef {
  children: Category[]
}

export interface PriceRange {
  min: number
  max: number
}

export interface ProductSummary {
  id: number
  code: string
  slug: string
  name: string
  short_description: string | null
  type: 'simple' | 'variable'
  final_price: number
  price_range: PriceRange
  currency: string
  unit_of_measure: UnitOfMeasure
  image_url: string | null
  image_thumb_url: string | null
  category: CategoryRef | null
  tags: Tag[]
  in_stock: boolean
}

export interface ProductImage {
  id: number
  url: string
  thumb_url: string | null
  is_featured: boolean
}

export interface ProductDetail extends ProductSummary {
  description: string | null
  unit_value: number | null
  images: ProductImage[]
}

export interface VariationAttribute {
  attribute_id: number
  attribute_name: string
  value: string
}

export interface Variation {
  id: number
  code: string
  final_price: number
  currency: string
  image_url: string | null
  image_thumb_url: string | null
  in_stock: boolean
  attributes: VariationAttribute[]
}

export interface PaginationMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
  currency: string
}

export interface Paginated<T> {
  data: T[]
  meta: PaginationMeta
}

export type LookupResult =
  | { kind: 'product'; code: string; slug: string }
  | { kind: 'variation'; variation_id: number; code: string; slug: string }

export type ProductSort = 'newest' | 'price_asc' | 'price_desc' | 'name_asc'

export interface ProductFilters {
  search?: string
  category_id?: number
  include_descendants?: boolean
  tag_id?: number
  /** Fallback por slug/nombre; preferir `tag_id`. */
  tag?: string
  price_min?: number
  price_max?: number
  sort?: ProductSort
  page?: number
  per_page?: number
}
