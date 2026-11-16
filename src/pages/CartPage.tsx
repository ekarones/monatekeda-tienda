import { Link } from 'react-router'
import { ProductImage } from '../components/ProductImage'
import { EmptyState } from '../components/States'
import { config } from '../config'
import { formatMoney } from '../lib/format'
import { buildWhatsAppUrl, cartTotal, useCart } from '../store/cart'

export function CartPage() {
  const { items, setQuantity, remove, clear } = useCart()

  if (items.length === 0) {
    return (
      <EmptyState title="Tu carrito está vacío">
        <Link
          to="/productos"
          className="mt-4 inline-block rounded-full bg-brand-700 px-5 py-2 font-medium text-white"
        >
          Ver catálogo
        </Link>
      </EmptyState>
    )
  }

  const currency = items[0].currency

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Carrito</h1>
          <button onClick={clear} className="text-sm text-stone-500 hover:text-red-700">
            Vaciar carrito
          </button>
        </div>
        <ul className="divide-y divide-stone-200 rounded-2xl border border-stone-200 bg-white">
          {items.map((item) => (
            <li key={item.key} className="flex gap-3 p-3 sm:gap-4 sm:p-4">
              <Link to={`/producto/${item.slug}`} className="shrink-0">
                <ProductImage src={item.imageUrl} alt={item.name} className="h-20 w-20 rounded-xl" />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <Link to={`/producto/${item.slug}`} className="font-medium hover:underline">
                  {item.name}
                </Link>
                {item.variantLabel && <span className="text-sm text-stone-500">{item.variantLabel}</span>}
                <span className="text-sm text-stone-500">{formatMoney(item.price, item.currency)} c/u</span>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <div className="flex items-center rounded-full border border-stone-300">
                    <button
                      className="h-8 w-8"
                      onClick={() => setQuantity(item.key, item.quantity - 1)}
                      aria-label={`Disminuir ${item.name}`}
                    >
                      −
                    </button>
                    <span className="w-7 text-center text-sm font-medium">{item.quantity}</span>
                    <button
                      className="h-8 w-8 disabled:opacity-30"
                      onClick={() => setQuantity(item.key, item.quantity + 1)}
                      disabled={item.quantity >= 99}
                      aria-label={`Aumentar ${item.name}`}
                    >
                      +
                    </button>
                  </div>
                  <span className="font-semibold">{formatMoney(item.price * item.quantity, item.currency)}</span>
                </div>
              </div>
              <button
                onClick={() => remove(item.key)}
                className="self-start p-1 text-stone-400 hover:text-red-700"
                aria-label={`Quitar ${item.name}`}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      </section>

      <aside className="h-fit rounded-2xl border border-stone-200 bg-white p-5 lg:sticky lg:top-24">
        <h2 className="text-lg font-semibold">Resumen</h2>
        <div className="mt-4 flex justify-between text-lg">
          <span>Total</span>
          <span className="font-bold">{formatMoney(cartTotal(items), currency)}</span>
        </div>
        {config.whatsappNumber ? (
          <>
            <p className="mt-2 text-xs text-stone-500">
              Precios referenciales. La disponibilidad y el envío se confirman por WhatsApp.
            </p>
            <a
              href={buildWhatsAppUrl(items)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 flex h-12 items-center justify-center gap-2 rounded-full bg-[#25D366] font-semibold text-white hover:brightness-95"
            >
              Pedir por WhatsApp
            </a>
          </>
        ) : (
          <p className="mt-4 text-sm text-stone-600">
            Los pedidos en línea estarán disponibles pronto. Mientras tanto, visítanos en tienda.
          </p>
        )}
        <Link to="/productos" className="mt-3 block text-center text-sm text-brand-700 hover:underline">
          Seguir comprando
        </Link>
      </aside>
    </div>
  )
}
