import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { config } from '../config'
import { formatMoney } from '../lib/format'

export interface CartItem {
  /** `${productId}` o `${productId}:${variationId}` */
  key: string
  productId: number
  variationId: number | null
  slug: string
  code: string
  name: string
  /** Ej. "Talla: M · Color: Gris" */
  variantLabel: string | null
  price: number
  currency: string
  imageUrl: string | null
  quantity: number
}

type NewItem = Omit<CartItem, 'key' | 'quantity'>

interface CartState {
  items: CartItem[]
  add: (item: NewItem, quantity?: number) => void
  setQuantity: (key: string, quantity: number) => void
  remove: (key: string) => void
  clear: () => void
}

const MAX_QTY = 99

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (item, quantity = 1) =>
        set((state) => {
          const key = item.variationId ? `${item.productId}:${item.variationId}` : String(item.productId)
          const existing = state.items.find((i) => i.key === key)
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.key === key ? { ...i, ...item, quantity: Math.min(MAX_QTY, i.quantity + quantity) } : i,
              ),
            }
          }
          return { items: [...state.items, { ...item, key, quantity: Math.min(MAX_QTY, quantity) }] }
        }),
      setQuantity: (key, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.key !== key)
              : state.items.map((i) => (i.key === key ? { ...i, quantity: Math.min(MAX_QTY, quantity) } : i)),
        })),
      remove: (key) => set((state) => ({ items: state.items.filter((i) => i.key !== key) })),
      clear: () => set({ items: [] }),
    }),
    {
      name: 'mona-cart',
      version: 1,
      // localStorage puede fallar (modo privado, bloqueado): zustand cae a memoria.
      storage: createJSONStorage(() => localStorage),
    },
  ),
)

export const cartCount = (items: CartItem[]) => items.reduce((n, i) => n + i.quantity, 0)
export const cartTotal = (items: CartItem[]) => items.reduce((n, i) => n + i.price * i.quantity, 0)

/** Mensaje del pedido tal como llega al WhatsApp de la tienda (texto plano con *negritas* de WhatsApp). */
export function buildOrderMessage(items: CartItem[]) {
  const currency = items[0]?.currency ?? 'PEN'
  const count = cartCount(items)
  const lines = items.map((i) => {
    const variant = i.variantLabel ? ` (${i.variantLabel})` : ''
    return `• ${i.quantity} x ${i.name}${variant}\n   Cód. ${i.code} · ${formatMoney(i.price * i.quantity, i.currency)}`
  })
  return [
    `¡Hola ${config.storeName}! Quiero hacer este pedido:`,
    '',
    ...lines,
    '',
    `*Total: ${formatMoney(cartTotal(items), currency)}* (${count} ${count === 1 ? 'pieza' : 'piezas'})`,
  ].join('\n')
}

export function buildWhatsAppUrl(items: CartItem[]) {
  return `https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent(buildOrderMessage(items))}`
}
