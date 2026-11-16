import type { Variation } from '../api/types'

export interface AttributeGroup {
  id: number
  name: string
  /** Valores en el orden en que los manda la API (respeta el orden del admin: S, M, L, XL…). */
  values: string[]
}

export type Selection = Record<number, string>

export function groupAttributes(variations: Variation[]): AttributeGroup[] {
  const groups = new Map<number, AttributeGroup>()
  for (const v of variations) {
    for (const a of v.attributes) {
      let g = groups.get(a.attribute_id)
      if (!g) {
        g = { id: a.attribute_id, name: a.attribute_name, values: [] }
        groups.set(a.attribute_id, g)
      }
      if (!g.values.includes(a.value)) g.values.push(a.value)
    }
  }
  return [...groups.values()]
}

const valueOf = (v: Variation, attrId: number) => v.attributes.find((a) => a.attribute_id === attrId)?.value

/** ¿La variación es compatible con la selección parcial? */
export const matches = (v: Variation, selection: Selection) =>
  Object.entries(selection).every(([id, value]) => valueOf(v, Number(id)) === value)

/** Variación exacta cuando todos los grupos tienen valor elegido. */
export function findVariation(variations: Variation[], groups: AttributeGroup[], selection: Selection) {
  if (groups.some((g) => selection[g.id] === undefined)) return undefined
  return variations.find((v) => matches(v, selection))
}

/** Estado de un valor dado lo elegido en los *otros* grupos. */
export function optionState(variations: Variation[], selection: Selection, attrId: number, value: string) {
  const others: Selection = { ...selection, [attrId]: value }
  const candidates = variations.filter((v) => matches(v, others))
  return {
    exists: candidates.length > 0,
    inStock: candidates.some((v) => v.in_stock),
  }
}

/**
 * Elige un valor; si deja combinaciones imposibles, limpia los grupos en conflicto
 * en vez de bloquear al usuario.
 */
export function selectValue(variations: Variation[], selection: Selection, attrId: number, value: string): Selection {
  const next: Selection = { ...selection, [attrId]: value }
  if (variations.some((v) => matches(v, next))) return next
  return { [attrId]: value }
}

export function initialSelection(variations: Variation[], groups: AttributeGroup[], preselectId?: number): Selection {
  const pre = preselectId ? variations.find((v) => v.id === preselectId) : undefined
  const base = pre ?? (variations.length === 1 ? variations[0] : undefined)
  if (base) return Object.fromEntries(base.attributes.map((a) => [a.attribute_id, a.value]))
  // Grupos con un único valor posible se preseleccionan.
  return Object.fromEntries(groups.filter((g) => g.values.length === 1).map((g) => [g.id, g.values[0]]))
}

export const variantLabel = (v: Variation) => v.attributes.map((a) => `${a.attribute_name}: ${a.value}`).join(' · ')
