import type { Category, ProductSummary } from '../api/types'

/*
 * Búsqueda de la tienda, encima de la API (que solo busca la frase tal cual):
 * - plurales ("aretes" → arete, "collares" → collar), sin importar tildes ni mayúsculas;
 * - varias palabras en cualquier orden ("alpaca gorro");
 * - sinónimos de la tienda (platería → plata, bolso ↔ cartera…);
 * - nombres de categoría ("platería" trae la categoría Platería);
 * - orden por relevancia y sugerencia si no hay resultados ("¿Quisiste decir…?").
 * Todo es puro: la parte que consulta la API está en api/search.ts.
 */

/** minúsculas, sin tildes, solo letras y números separados por espacios */
export const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

const STOPWORDS = new Set([
  'de',
  'del',
  'la',
  'el',
  'los',
  'las',
  'y',
  'e',
  'o',
  'u',
  'con',
  'para',
  'por',
  'en',
  'un',
  'una',
  'unos',
  'unas',
  'al',
  'a',
])

/** Singular aproximado en español, suficiente para buscar por prefijo de palabra. */
export function stem(word: string) {
  if (word.length <= 3 || /\d/.test(word)) return word
  if (word.endsWith('ces')) return word.slice(0, -3) + 'z' // lápices → lápiz
  // collares → collar, bolsos → bolso, aretes → arete, mantas → manta
  if (word.endsWith('es') && /[rlndzj]es$/.test(word) && word.length > 4) return word.slice(0, -2)
  if (word.endsWith('s')) return word.slice(0, -1)
  return word
}

/** Sinónimos y variantes que usa la tienda (en forma normalizada y en singular). */
const SYNONYMS: Record<string, string[]> = {
  plateria: ['plata'],
  joyeria: ['joya'],
  joya: ['joyeria'],
  bolso: ['cartera'],
  cartera: ['bolso'],
  chompa: ['sueter'],
  sueter: ['chompa'],
  sweater: ['chompa', 'sueter'],
  pendiente: ['arete'],
  zarcillo: ['arete'],
  llama: ['llamita'],
  llamita: ['llama'],
  peluche: ['peluche'],
  ceramica: ['ceramica'],
  mantel: ['mantel'],
}

export interface ParsedQuery {
  raw: string
  /** La búsqueda parece un código de producto ("WC-1405", "J0082"): se compara contra el código */
  code: string | null
  /** Palabras útiles, en singular */
  tokens: string[]
  /** Por palabra: formas que cuentan como coincidencia (ella misma + sinónimos) */
  variants: string[][]
}

export function parseQuery(raw: string): ParsedQuery {
  const words = normalize(raw).split(' ').filter(Boolean)
  const useful = words.filter((w) => !STOPWORDS.has(w))
  const tokens = [...new Set((useful.length ? useful : words).map(stem))]
  const compact = raw.trim()
  const code =
    !/\s/.test(compact) && /\d/.test(compact) && /[a-z]/i.test(compact) ? normalize(compact).replace(/ /g, '') : null
  return {
    raw,
    code,
    tokens,
    variants: tokens.map((t) => [t, ...(SYNONYMS[t] ?? []).filter((s) => s !== t)]),
  }
}

/**
 * Términos que se mandan a la API. La API busca subcadenas: con el singular ya basta
 * ("arete" encuentra "aretes"). Se consultan las 2 palabras más largas (más selectivas) y sus sinónimos.
 */
export function apiTerms(q: ParsedQuery) {
  if (q.tokens.length === 0) return []
  if (q.code) return [q.raw.trim()]
  const order = q.tokens.map((t, i) => ({ t, i })).sort((a, b) => b.t.length - a.t.length)
  const picked = order.slice(0, 2).map((x) => q.variants[x.i])
  const terms = picked.flat().filter((t) => t.length >= 2)
  // La frase completa (más de una palabra) suele dar los mejores resultados
  if (q.tokens.length > 1) terms.unshift(q.tokens.join(' '))
  return [...new Set(terms)]
}

/** Categoría cuyo nombre coincide con palabras de la búsqueda, con los índices de esas palabras. */
export interface CategoryHit {
  category: Category
  tokens: number[]
}

/** Categorías (o subcategorías) cuyo nombre coincide con alguna palabra de la búsqueda. */
export function matchCategories(tree: Category[], q: ParsedQuery): CategoryHit[] {
  const out: CategoryHit[] = []
  const walk = (nodes: Category[]) => {
    for (const c of nodes) {
      const words = normalize(c.name).split(' ').map(stem)
      const tokens = q.variants
        .map((vs, i) =>
          vs.some((v) => v.length >= 3 && words.some((w) => w.startsWith(v) || (w.length >= 4 && v.startsWith(w))))
            ? i
            : -1,
        )
        .filter((i) => i >= 0)
      if (tokens.length) out.push({ category: c, tokens })
      // Si coincide la categoría madre, sus hijas ya vienen incluidas (include_descendants)
      else walk(c.children)
    }
  }
  walk(tree)
  return out
}

/** Para cada categoría (incluidas las hijas de las que coinciden): qué palabras de la búsqueda cubre. */
export function categoryTokenMap(hits: CategoryHit[]) {
  const map = new Map<number, Set<number>>()
  const add = (c: Category, tokens: number[]) => {
    const set = map.get(c.id) ?? new Set<number>()
    tokens.forEach((t) => set.add(t))
    map.set(c.id, set)
    c.children.forEach((h) => add(h, tokens))
  }
  hits.forEach((h) => add(h.category, h.tokens))
  return map
}

const wordsOf = (s: string | null | undefined) => (s ? normalize(s).split(' ').filter(Boolean) : [])

/** ¿Alguna palabra del texto empieza con la forma buscada? ("arete" ≈ "aretes", "plata" ≈ "plata950") */
const hit = (words: string[], v: string) => words.some((w) => w.startsWith(v) || (w.length > 4 && v.startsWith(w)))

export interface Scored {
  product: ProductSummary
  score: number
  /** Coincide con todas las palabras de la búsqueda */
  full: boolean
}

/** Puntaje de relevancia de un producto para la búsqueda. */
export function score(p: ProductSummary, q: ParsedQuery, categoryTokens: Map<number, Set<number>>): Scored {
  const name = wordsOf(p.name)
  const cat = wordsOf(p.category?.name)
  const desc = wordsOf(p.short_description)
  const tags = p.tags.flatMap((t) => wordsOf(t.name))
  const code = normalize(p.code).replace(/ /g, '')
  if (q.code && code === q.code) return { product: p, score: 100, full: true }
  if (q.code && code.includes(q.code)) return { product: p, score: 60, full: true }
  let s = 0
  let matched = 0
  q.variants.forEach((vs, i) => {
    let best = 0
    for (const v of vs) {
      const primary = v === q.tokens[i]
      const k = primary ? 1 : 0.8 // un sinónimo vale un poco menos
      if (name.includes(v)) best = Math.max(best, 12 * k)
      else if (hit(name, v)) best = Math.max(best, 9 * k)
      if (hit(cat, v)) best = Math.max(best, 7 * k)
      if (hit(tags, v)) best = Math.max(best, 5 * k)
      if (hit(desc, v)) best = Math.max(best, 3 * k)
      if (v.length >= 3 && code.includes(v.replace(/ /g, ''))) best = Math.max(best, 20)
    }
    // Subcategoría de una categoría que nombró esta misma palabra (p. ej. «platería» → Vicuñas)
    if (!best && p.category && categoryTokens.get(p.category.id)?.has(i)) best = 6
    if (best) matched++
    s += best
  })
  const full = q.tokens.length > 0 && matched === q.tokens.length
  if (full && q.tokens.length > 1) s += 8
  // La frase tal cual en el nombre
  const phrase = q.tokens.join(' ')
  if (q.tokens.length > 1 && normalize(p.name).includes(phrase)) s += 10
  if (name[0] && q.tokens[0] && name[0].startsWith(q.tokens[0])) s += 3
  // Desempates: lo que se puede pedir ya y lo que tiene foto
  if (p.in_stock) s += 4
  if (p.image_url || p.image_thumb_url) s += 1
  return { product: p, score: s, full }
}

/** Distancia de edición (para "¿Quisiste decir…?") */
function distance(a: string, b: string) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 1; j <= b.length; j++) d[0][j] = j
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
  return d[a.length][b.length]
}

/** Vocabulario de la tienda para sugerencias: categorías, sinónimos y palabras de uso común. */
const COMMON = [
  'alpaca',
  'baby alpaca',
  'plata',
  'peluche',
  'llama',
  'vicuna',
  'chalina',
  'gorro',
  'manopla',
  'chullo',
  'poncho',
  'manta',
  'arete',
  'collar',
  'pulsera',
  'anillo',
  'dije',
  'cadena',
  'cartera',
  'bolso',
  'monedero',
  'ceramica',
  'marinera',
  'chalan',
  'caballo',
  'cuadro',
  'textil',
  'tejido',
  'piedra',
  'llavero',
  'iman',
]

/** Sugiere una palabra parecida (de la tienda) cuando la búsqueda no encontró nada. */
export function suggest(raw: string, categories: Category[]) {
  const q = normalize(raw)
  if (q.length < 3) return null
  const names = new Map<string, string>()
  const walk = (nodes: Category[]) => nodes.forEach((c) => (names.set(normalize(c.name), c.name), walk(c.children)))
  walk(categories)
  COMMON.forEach((w) => names.has(w) || names.set(w, w))
  let best: { word: string; d: number } | null = null
  for (const [norm, label] of names) {
    const d = distance(q, norm)
    const limit = q.length <= 5 ? 1 : 2
    if (d > 0 && d <= limit && (!best || d < best.d)) best = { word: label, d }
  }
  return best?.word ?? null
}
