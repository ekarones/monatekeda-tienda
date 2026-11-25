import type { PriceRange, UnitOfMeasure } from '../api/types'

const formatters = new Map<string, Intl.NumberFormat>()

export function formatMoney(amount: number, currency = 'PEN') {
  let fmt = formatters.get(currency)
  if (!fmt) {
    fmt = new Intl.NumberFormat('es-PE', { style: 'currency', currency, minimumFractionDigits: 2 })
    formatters.set(currency, fmt)
  }
  return fmt.format(amount)
}

/** Precio de una pieza: si el catálogo aún no lo tiene (0), se consulta en vez de mostrar "S/ 0.00". */
export const formatPrice = (amount: number, currency = 'PEN') =>
  amount > 0 ? formatMoney(amount, currency) : 'Precio a consultar'

/** "S/ 39.90" si el precio es único, "Desde S/ 25.00" si varía. */
export function formatPriceRange(range: PriceRange, currency = 'PEN') {
  if (range.min === range.max) return formatPrice(range.min, currency)
  return `Desde ${formatMoney(range.min, currency)}`
}

/** Limpia espacios dobles o sobrantes que vienen de la carga de datos. */
export const cleanName = (name: string) => name.replace(/\s+/g, ' ').trim()

const UNIT_LABELS: Record<UnitOfMeasure, string> = {
  unit: 'unidad',
  kg: 'kg',
  g: 'g',
  l: 'L',
  ml: 'ml',
  box: 'caja',
  pack: 'paquete',
}

/** Etiqueta de presentación, solo para unidades medibles (ej. "0.5 kg"). */
export function formatPresentation(value: number | null, unit: UnitOfMeasure) {
  if (!value || unit === 'unit' || unit === 'box' || unit === 'pack') return null
  return `${value} ${UNIT_LABELS[unit] ?? unit}`
}
