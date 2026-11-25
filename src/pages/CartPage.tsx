import { useState } from 'react'
import { Link } from 'react-router'
import { WhatsAppGlyph } from '../components/HeroExtras'
import { CartIcon } from '../components/Ornaments'
import { ProductImage } from '../components/ProductImage'
import { config } from '../config'
import { formatMoney } from '../lib/format'
import { buildWhatsAppUrl, cartCount, cartTotal, useCart } from '../store/cart'

const Arrow = ({ flip = false }: { flip?: boolean }) => (
  <svg viewBox="0 0 16 16" width={15} height={15} aria-hidden="true" className={flip ? 'rotate-180' : ''}>
    <path d="M3 8h10m-4-4 4 4-4 4" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export function CartPage() {
  const { items, setQuantity, remove, clear } = useCart()
  const [sent, setSent] = useState(false)

  // Después de enviar: confirmación con opción de vaciar el carrito
  if (sent) {
    return (
      <div className="mx-auto max-w-[34rem] py-12 text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#25D366] text-white">
          <svg viewBox="0 0 24 24" width={30} height={30} aria-hidden="true">
            <WhatsAppGlyph />
          </svg>
        </span>
        <p className="mt-6 text-[0.9375rem] text-ink-3">
          <span lang="qu" className="font-semibold text-brand-700">
            ¡Sulpayki!
          </span>{' '}
          «Gracias», en quechua.
        </p>
        <h1 className="mt-2 text-[clamp(2rem,5vw,2.75rem)] leading-[1.05] font-light tracking-[-0.04em] text-brand-muted">
          Tu pedido está <span className="font-bold text-brand-700">en WhatsApp</span>
        </h1>
        <p className="mt-4 text-[1.0625rem] leading-relaxed text-ink-2">
          Si el chat no se abrió o aún no lo enviaste, puedes intentarlo de nuevo. Te responderemos por ahí para
          confirmar disponibilidad, precio y entrega.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a
            href={buildWhatsAppUrl(items)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn--pill btn--ghost px-5"
          >
            Abrir WhatsApp otra vez
          </a>
          <button
            type="button"
            onClick={() => {
              clear()
              setSent(false)
            }}
            className="btn btn--pill px-5"
          >
            Ya lo envié, vaciar carrito
          </button>
        </div>
        <button type="button" onClick={() => setSent(false)} className="mt-6 text-[0.9375rem] text-ink-3 hover:text-ink">
          Volver al carrito
        </button>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-[30rem] py-16 text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-surface text-ink-3 shadow-[0_16px_34px_-26px_rgb(23_22_43/0.45)]">
          <CartIcon size={28} />
        </span>
        <h1 className="mt-6 text-[clamp(2rem,5vw,2.75rem)] leading-[1.05] font-light tracking-[-0.04em] text-brand-muted">
          Tu carrito está <span className="font-bold text-brand-700">vacío</span>
        </h1>
        <p className="mt-3 text-ink-2">Agrega piezas desde el catálogo y aquí podrás enviar tu pedido por WhatsApp.</p>
        <Link to="/productos" className="btn btn--lg btn--pill mt-7 px-7">
          Ver catálogo
          <Arrow />
        </Link>
      </div>
    )
  }

  const currency = items[0].currency
  const count = cartCount(items)

  return (
    <div className="pb-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-[clamp(2.25rem,5vw,3.25rem)] leading-[1.02] font-light tracking-[-0.04em] text-brand-muted">
          Tu <span className="font-bold text-brand-700">carrito</span>
        </h1>
        <p className="text-[0.9375rem] text-ink-3">
          {count} {count === 1 ? 'pieza' : 'piezas'}
        </p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_24rem] lg:gap-8">
        {/* Piezas */}
        <section aria-label="Piezas del pedido">
          <ul className="space-y-3">
            {items.map((item) => (
              <li
                key={item.key}
                className="flex gap-3 rounded-[1.25rem] bg-surface p-2 pr-3 shadow-[0_16px_34px_-26px_rgb(23_22_43/0.45)] sm:gap-4 sm:pr-4"
              >
                <Link to={`/producto/${item.slug}`} className="shrink-0" tabIndex={-1} aria-hidden="true">
                  <ProductImage src={item.imageUrl} alt={item.name} className="h-24 w-24 rounded-[0.875rem] sm:h-28 sm:w-28" />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col py-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link
                        to={`/producto/${item.slug}`}
                        className="line-clamp-2 text-[1rem] leading-snug font-semibold text-ink hover:text-brand-700"
                      >
                        {item.name}
                      </Link>
                      {item.variantLabel && <p className="mt-0.5 text-[0.8125rem] text-ink-3">{item.variantLabel}</p>}
                      <p className="tnum mt-0.5 text-[0.8125rem] text-ink-3">{item.price > 0 ? `${formatMoney(item.price, item.currency)} c/u` : 'Precio a consultar'}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(item.key)}
                      className="-mt-0.5 -mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-3 transition-colors hover:bg-brand-50 hover:text-brand-700"
                      aria-label={`Quitar ${item.name}`}
                    >
                      <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden="true">
                        <path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                  <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                    <div className="flex items-center rounded-full bg-ground">
                      <button
                        type="button"
                        className="h-10 w-10 rounded-full text-[1.125rem] text-ink-2 hover:text-brand-700"
                        onClick={() => setQuantity(item.key, item.quantity - 1)}
                        aria-label={`Disminuir ${item.name}`}
                      >
                        −
                      </button>
                      <span className="tnum w-7 text-center text-[0.9375rem] font-semibold" aria-live="polite">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        className="h-10 w-10 rounded-full text-[1.125rem] text-ink-2 hover:text-brand-700 disabled:opacity-30"
                        onClick={() => setQuantity(item.key, item.quantity + 1)}
                        disabled={item.quantity >= 99}
                        aria-label={`Aumentar ${item.name}`}
                      >
                        +
                      </button>
                    </div>
                    <span className="tnum text-[1.0625rem] font-semibold text-brand-700">
                      {item.price > 0 ? formatMoney(item.price * item.quantity, item.currency) : 'A consultar'}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <Link to="/productos" className="inline-flex items-center gap-2 text-[0.9375rem] font-medium text-brand-700 hover:underline">
              <Arrow flip />
              Seguir comprando
            </Link>
            <button type="button" onClick={clear} className="text-[0.875rem] text-ink-3 hover:text-brand-700">
              Vaciar carrito
            </button>
          </div>
        </section>

        {/* Pedido por WhatsApp */}
        <aside
          aria-labelledby="pedido-titulo"
          className="rounded-[1.5rem] bg-surface p-5 shadow-[0_24px_50px_-34px_rgb(23_22_43/0.5)] sm:p-6 lg:sticky lg:top-24"
        >
          <h2 id="pedido-titulo" className="text-[1.375rem] font-semibold tracking-[-0.02em] text-ink">
            Tu pedido
          </h2>
          <dl className="mt-4 space-y-2 border-b border-line pb-4 text-[0.9375rem]">
            <div className="flex justify-between text-ink-2">
              <dt>
                Subtotal ({count} {count === 1 ? 'pieza' : 'piezas'})
              </dt>
              <dd className="tnum">{formatMoney(cartTotal(items), currency)}</dd>
            </div>
            <div className="flex justify-between text-ink-2">
              <dt>Entrega</dt>
              <dd>Se coordina por WhatsApp</dd>
            </div>
          </dl>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-[1rem] font-semibold text-ink">Total</span>
            <span className="tnum text-[1.5rem] font-bold tracking-[-0.02em] text-brand-700">
              {formatMoney(cartTotal(items), currency)}
            </span>
          </div>
          {items.some((i) => !(i.price > 0)) && (
            <p className="mt-1 text-right text-[0.8125rem] text-ink-3">+ piezas con precio a consultar</p>
          )}

          {config.whatsappNumber ? (
            <div className="mt-6">
              <a
                href={buildWhatsAppUrl(items)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  setSent(true)
                  window.scrollTo({ top: 0 })
                }}
                className="flex h-14 w-full items-center justify-center gap-2.5 rounded-full bg-[#25D366] text-[1rem] font-semibold text-[#062a14] shadow-[0_14px_28px_-16px_rgb(18_140_70/0.8)] transition-[background-color,transform] duration-200 hover:bg-[#1fbd5a] active:translate-y-px"
              >
                <svg viewBox="0 0 24 24" width={22} height={22} aria-hidden="true">
                  <WhatsAppGlyph />
                </svg>
                Enviar pedido por WhatsApp
              </a>
              <p className="mt-3 text-center text-[0.8125rem] leading-snug text-ink-3">
                Se abrirá WhatsApp con tu lista de compras. Confirmamos disponibilidad, precio y entrega por ahí. No se
                cobra nada en la web.
              </p>
            </div>
          ) : (
            <p className="mt-5 rounded-xl bg-ground p-4 text-[0.9375rem] text-ink-2">
              Los pedidos en línea estarán disponibles pronto. Mientras tanto,{' '}
              <Link to="/contacto" className="font-medium text-brand-700 underline underline-offset-4">
                escríbenos
              </Link>
              .
            </p>
          )}
        </aside>
      </div>
    </div>
  )
}
