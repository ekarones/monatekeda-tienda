import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, ScrollRestoration, useLocation, useNavigate, useSearchParams } from 'react-router'
import { ApiError } from '../api/client'
import { useCategories } from '../api/store'
import { config } from '../config'
import { cartCount, useCart } from '../store/cart'
import { StepBand, StepDiamondField } from './Andean'
import { SocialLinks, WhatsAppGlyph } from './HeroExtras'
import { CartIcon, CategoryIcon, SearchIcon } from './Ornaments'
import { StoreUnavailable } from './States'
import { WhatsAppFab } from './WhatsAppFab'

const YEAR = new Date().getFullYear()

/** true cuando la página bajó un poco: la cabecera se vuelve blanca y más baja. */
function useScrolled(offset = 24) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > offset)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [offset])
  return scrolled
}

/**
 * Buscar: bloque cuadrado oscuro junto al carrito. Abre un panel bajo la cabecera
 * con el campo grande y accesos rápidos a categorías. Escape o clic fuera lo cierran.
 */
function SearchPanel({ open, onClose, initial }: { open: boolean; onClose: () => void; initial: string }) {
  const navigate = useNavigate()
  const categories = useCategories().data ?? []
  const [value, setValue] = useState(initial)
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    input.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <>
      {/* Velo: clic fuera cierra */}
      <div className="fade-in absolute inset-x-0 top-full h-[100svh] bg-ink/30" onClick={onClose} aria-hidden="true" />
      <div id="panel-busqueda" className="drop-in absolute inset-x-0 top-full bg-surface shadow-[0_30px_50px_-30px_rgb(23_22_43/0.5)]">
        <div className="mx-auto max-w-[1360px] px-4 py-6 sm:px-8 sm:py-8">
          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault()
              const q = value.trim()
              navigate(q ? `/productos?q=${encodeURIComponent(q)}` : '/productos')
              onClose()
            }}
            className="flex items-stretch gap-2"
          >
            <label className="flex h-14 flex-1 items-center gap-3 rounded-full bg-ground px-5 ring-ink transition-shadow focus-within:ring-2">
              <SearchIcon size={20} className="shrink-0 text-ink-3" />
              <input
                ref={input}
                type="search"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="¿Qué pieza buscas? Ej.: chalina, vicuña, pulsera"
                aria-label="Buscar productos"
                className="w-full bg-transparent text-[1.0625rem] text-ink outline-none placeholder:text-ink-3 search-field"
              />
            </label>
            <button type="submit" className="btn btn--pill h-14 px-6 text-base">
              Buscar
            </button>
          </form>
          {categories.length > 0 && (
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="mr-1 text-[0.8125rem] text-ink-3">Categorías:</span>
              {categories.slice(0, 8).map((c) => (
                <Link
                  key={c.id}
                  to={`/productos?categoria=${c.id}`}
                  onClick={onClose}
                  className="flex min-h-9 items-center gap-1.5 rounded-full bg-ground px-3 text-[0.875rem] text-ink-2 transition-colors hover:bg-brand-50 hover:text-brand-700"
                >
                  <CategoryIcon name={c.name} size={18} className="text-brand-700" />
                  {c.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

/**
 * Buscar, junto al carrito y a su misma altura, en blanco.
 * - xl: campo de texto real con placeholder "Buscar…"; Enter lleva al catálogo con la búsqueda.
 * - Menos ancho: cuadrado blanco con la lupa que abre el panel de búsqueda.
 */
function SearchBlock({
  open,
  onToggle,
  initial,
  className = '',
}: {
  open: boolean
  onToggle: () => void
  initial: string
  className?: string
}) {
  const navigate = useNavigate()
  const [value, setValue] = useState(initial)
  return (
    <div className={`absolute top-0 flex bg-surface text-ink shadow-[inset_1px_0_0_var(--color-hero)] ${className}`}>
      {/* Escritorio grande: campo en línea */}
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault()
          const q = value.trim()
          navigate(q ? `/productos?q=${encodeURIComponent(q)}` : '/productos')
        }}
        className="group/s relative hidden h-full w-[13rem] items-center gap-3 px-5 xl:flex"
      >
        <SearchIcon size={20} className="shrink-0 text-ink-3 transition-colors group-focus-within/s:text-brand-700" />
        <input
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Buscar…"
          aria-label="Buscar productos"
          className="search-field w-full min-w-0 bg-transparent text-[0.9375rem] font-medium text-ink outline-none placeholder:font-normal placeholder:text-ink-3"
        />
        {/* Línea roja al enfocar: el anillo del navegador no encaja en un bloque a sangre */}
        <span className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-brand-600 transition-transform duration-300 group-focus-within/s:scale-x-100" />
      </form>

      {/* Hasta lg: cuadrado con la lupa que abre el panel */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls="panel-busqueda"
        aria-label={open ? 'Cerrar búsqueda' : 'Buscar productos'}
        className={`flex aspect-square h-full items-center justify-center transition-colors xl:hidden ${
          open ? 'bg-sunk' : 'hover:bg-sunk'
        }`}
      >
        {open ? (
          <svg viewBox="0 0 24 24" width={22} height={22} aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
          </svg>
        ) : (
          <SearchIcon size={22} />
        )}
      </button>
    </div>
  )
}

/** Carrito: bloque rojo cuadrado pegado al borde derecho, a la altura de la barra. */
function CartButton({ className = '' }: { className?: string }) {
  const count = useCart((s) => cartCount(s.items))
  const badge = useRef<HTMLSpanElement>(null)
  const prev = useRef(count)

  // Cada pieza agregada se nota: el contador da un pequeño salto
  useEffect(() => {
    if (count > prev.current && badge.current) {
      badge.current.classList.remove('bump')
      void badge.current.offsetWidth
      badge.current.classList.add('bump')
    }
    prev.current = count
  }, [count])

  return (
    <Link
      to="/carrito"
      className={`absolute top-0 right-0 flex aspect-square items-center justify-center gap-4 bg-brand-600 text-[0.9375rem] font-semibold text-white transition-colors hover:bg-brand-700 xl:aspect-auto xl:w-[10.5rem] ${className}`}
      aria-label={`Carrito, ${count} ${count === 1 ? 'pieza' : 'piezas'}`}
    >
      <span className="relative flex">
        <CartIcon size={24} />
        {count > 0 && (
          <span
            ref={badge}
            className="tnum absolute -top-2 -right-2.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[0.6875rem] font-bold text-brand-700"
          >
            {count}
          </span>
        )}
      </span>
      <span className="hidden xl:inline">Carrito</span>
    </Link>
  )
}

const NAV = [
  { label: 'Inicio', to: '/' },
  { label: 'Catálogo', to: '/productos' },
  { label: 'Nosotros', to: '/nosotros' },
  { label: 'Contacto', to: '/contacto' },
]

const Arrow = ({ size = 16 }: { size?: number }) => (
  <svg viewBox="0 0 16 16" width={size} height={size} aria-hidden="true">
    <path d="M3 8h10m-4-4 4 4-4 4" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const linkClass = (isActive: boolean) =>
  `relative flex items-center gap-1 rounded-full px-3 py-2 text-[0.9375rem] transition-colors after:absolute after:inset-x-3 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-brand-600 after:transition-transform after:duration-300 hover:text-brand-600 hover:after:scale-x-100 group-data-[onred=true]/h:text-white/85 group-data-[onred=true]/h:after:bg-white group-data-[onred=true]/h:hover:text-white ${
    isActive ? 'font-semibold text-brand-700 after:scale-x-100 group-data-[onred=true]/h:text-white' : 'text-brand-700 after:scale-x-0'
  }`

/**
 * Catálogo con panel desplegable: las categorías reales con su ícono.
 * Se abre al pasar el cursor o con el botón de la flecha (teclado); Escape lo cierra.
 */
function CatalogMenu() {
  const categories = useCategories()
  const [open, setOpen] = useState(false)
  const timer = useRef<number>(0)
  const { pathname } = useLocation()
  const list = categories.data ?? []

  const show = () => {
    window.clearTimeout(timer.current)
    setOpen(true)
  }
  const hide = () => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setOpen(false), 140)
  }

  return (
    <div
      className="relative"
      onMouseEnter={show}
      onMouseLeave={hide}
      onKeyDown={(e) => {
        if (e.key === 'Escape') setOpen(false)
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false)
      }}
    >
      <div className="flex items-center">
        <Link to="/productos" onClick={() => setOpen(false)} className={linkClass(pathname.startsWith('/producto'))}>
          Catálogo
        </Link>
        <button
          type="button"
          aria-expanded={open}
          aria-controls="menu-catalogo"
          aria-label={open ? 'Cerrar categorías' : 'Ver categorías'}
          // Con el mouse el panel ya se abrió al pasar; el clic no lo cierra. Con teclado (detail 0) alterna.
          onClick={(e) => setOpen((o) => (e.detail === 0 ? !o : true))}
          className="-ml-2 flex h-8 w-6 items-center justify-center rounded-full text-brand-700 hover:text-brand-600 group-data-[onred=true]/h:text-white"
        >
          <svg
            viewBox="0 0 16 16"
            width={12}
            height={12}
            aria-hidden="true"
            className={`transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          >
            <path d="m4 6 4 4 4-4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div
        id="menu-catalogo"
        className={`absolute top-full left-1/2 z-40 w-[min(46rem,calc(100vw-4rem))] -translate-x-1/2 pt-3 transition-[opacity,transform,visibility] duration-300 ease-out-expo ${
          open ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-1 opacity-0'
        }`}
      >
        <div className="grid grid-cols-[1fr_13rem] gap-2 rounded-[1.5rem] bg-surface p-2 shadow-[0_30px_60px_-28px_rgb(23_22_43/0.45),0_2px_6px_-2px_rgb(23_22_43/0.08)]">
          <ul className="grid grid-cols-2 gap-0.5 p-2">
            {list.map((c) => (
              <li key={c.id}>
                <Link
                  to={`/productos?categoria=${c.id}`}
                  onClick={() => setOpen(false)}
                  className="group flex items-center gap-3 rounded-xl px-2.5 py-2 transition-colors hover:bg-ground"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                    <CategoryIcon name={c.name} size={26} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[0.9375rem] font-medium text-ink">{c.name}</span>
                    {c.children.length > 0 && (
                      <span className="block text-[0.75rem] text-ink-3">
                        {c.children.length} {c.children.length === 1 ? 'subcategoría' : 'subcategorías'}
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <Link
            to="/productos"
            onClick={() => setOpen(false)}
            className="group flex flex-col justify-between rounded-[1.125rem] bg-brand-700 p-5 text-white transition-colors hover:bg-brand-600"
          >
            <span className="text-[1.375rem] leading-tight font-semibold tracking-[-0.02em]">Todo el catálogo</span>
            <span className="flex items-center justify-between text-[0.875rem] text-white/80">
              Ver todas las piezas
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-brand-700 transition-transform duration-300 group-hover:translate-x-0.5">
                <Arrow size={14} />
              </span>
            </span>
          </Link>
        </div>
      </div>
    </div>
  )
}

/** Navegación principal. El enlace activo lleva una línea roja debajo. */
function MainNav() {
  return (
    <nav aria-label="Principal" className="hidden items-center gap-5 lg:flex xl:gap-8">
      <NavLink to="/" end className={({ isActive }) => linkClass(isActive)}>
        Inicio
      </NavLink>
      <CatalogMenu />
      {NAV.slice(2).map((l) => (
        <NavLink key={l.to} to={l.to} end className={({ isActive }) => linkClass(isActive)}>
          {l.label}
        </NavLink>
      ))}
    </nav>
  )
}

/** Menú móvil: los enlaces, las categorías y las redes bajo la cabecera. */
function MobileNav() {
  const [open, setOpen] = useState(false)
  const categories = useCategories().data ?? []
  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="menu-movil"
        aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
        className="flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-sunk group-data-[onred=true]/h:text-white group-data-[onred=true]/h:hover:bg-white/10"
      >
        <svg viewBox="0 0 24 24" width={22} height={22} aria-hidden="true">
          <path
            d={open ? 'M6 6l12 12M18 6 6 18' : 'M4 7h16M4 12h16M4 17h16'}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
          />
        </svg>
      </button>
      {open && (
        <nav
          id="menu-movil"
          aria-label="Principal"
          className="absolute inset-x-0 top-full max-h-[calc(100svh-4rem)] overflow-y-auto bg-ground px-4 pt-2 pb-6 shadow-[0_24px_40px_-24px_rgb(23_22_43/0.45)] sm:px-8"
        >
          <ul className="flex flex-col">
            {NAV.map((l) => (
              <li key={l.to}>
                <NavLink
                  to={l.to}
                  end
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `block rounded-xl px-3 py-3 text-[1.0625rem] ${isActive ? 'bg-surface font-semibold text-brand-700' : 'text-brand-700'}`
                  }
                >
                  {l.label}
                </NavLink>
              </li>
            ))}
          </ul>
          {categories.length > 0 && (
            <>
              <p className="mt-4 px-3 text-[0.8125rem] font-medium text-ink-3">Categorías</p>
              <ul className="mt-1 grid grid-cols-2 gap-1">
                {categories.slice(0, 8).map((c) => (
                  <li key={c.id}>
                    <Link
                      to={`/productos?categoria=${c.id}`}
                      onClick={() => setOpen(false)}
                      className="flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 text-[0.9375rem] text-ink-2 hover:bg-surface"
                    >
                      <CategoryIcon name={c.name} size={22} className="shrink-0 text-brand-700" />
                      <span className="truncate">{c.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
          <SocialLinks className="mt-4 border-t border-line px-3 pt-4" />
        </nav>
      )}
    </div>
  )
}

/**
 * Pie de página en gris (un tono más profundo que la página): marca y frase, tarjeta blanca de contacto
 * por WhatsApp, enlaces en tres columnas, redes, y el nombre en blanco a todo el ancho como un relieve.
 */
function Footer() {
  const categories = useCategories().data ?? []
  const wa = config.whatsappNumber
    ? `https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent(`¡Hola ${config.storeName}! Tengo una consulta.`)}`
    : ''
  // "51912968105" → "+51 912 968 105"
  const phone = config.whatsappNumber.replace(/^(\d{2})(\d{3})(\d{3})(\d{3})$/, '+$1 $2 $3 $4')
  const heading = 'text-[0.8125rem] font-semibold text-ink'
  const item = 'inline-block py-1.5 text-[0.9375rem] text-ink-2 transition-colors hover:text-brand-700 sm:py-1'

  return (
    <footer className="relative isolate mt-28 overflow-hidden rounded-t-[2rem] bg-footer text-ink lg:mt-36 lg:rounded-t-[2.5rem]">
      <StepDiamondField className="-z-10 text-ink/[0.025]" />
      <div className="mx-auto max-w-[1360px] px-4 pt-14 sm:px-8 lg:pt-20">
        {/* Fila superior: marca a la izquierda, contacto a la derecha */}
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end lg:gap-8">
          <div className="lg:col-span-6">
            <Link to="/" className="inline-flex items-center gap-3" aria-label={`${config.storeName}, inicio`}>
              <img src={`${import.meta.env.BASE_URL}logo.png`} alt="" width={48} height={48} className="h-12 w-12" />
              <span className="text-[1.75rem] font-semibold tracking-[-0.03em]">{config.storeName}</span>
            </Link>
            <p className="mt-5 max-w-[20ch] text-[clamp(1.75rem,3.2vw,2.5rem)] leading-[1.05] font-light tracking-[-0.04em] text-brand-muted">
              Hecho a mano <span className="font-bold text-brand-700">en el Perú.</span>
            </p>
            <p className="mt-4 text-[0.9375rem] text-ink-2">
              <span lang="qu" className="font-semibold text-ink">
                Sulpayki
              </span>{' '}
              («gracias», en quechua) por visitarnos.
            </p>
          </div>

          <div className="rounded-[1.5rem] bg-surface p-5 shadow-[0_24px_50px_-34px_rgb(23_22_43/0.5)] sm:p-6 lg:col-span-5 lg:col-start-8">
            <p className="text-[1.125rem] font-semibold tracking-[-0.01em] text-ink">Pedidos y consultas</p>
            <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-ink-2">
              Arma tu pedido en el carrito y envíalo por WhatsApp, o escríbenos para consultar disponibilidad.
            </p>
            {wa ? (
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="group mt-5 flex items-center gap-3 rounded-2xl bg-ground p-2 pr-4 transition-colors hover:bg-[#25D366]/15"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#25D366] text-white">
                  <svg viewBox="0 0 24 24" width={24} height={24} aria-hidden="true">
                    <WhatsAppGlyph />
                  </svg>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[0.8125rem] text-ink-3">WhatsApp</span>
                  <span className="tnum block text-[1.0625rem] font-semibold text-ink">{phone}</span>
                </span>
                <span className="text-ink-3 transition-[color,transform] duration-300 group-hover:translate-x-0.5 group-hover:text-ink">
                  <Arrow size={16} />
                </span>
              </a>
            ) : (
              <Link to="/contacto" className="btn btn--pill mt-5 px-5">
                Ir a contacto
                <Arrow size={14} />
              </Link>
            )}
          </div>
        </div>

        {/* Enlaces */}
        <StepBand className="mt-12 w-full text-ink/20 lg:mt-16" />
        <div className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <nav aria-label="Tienda" className="lg:col-span-3">
            <p className={heading}>Tienda</p>
            <ul className="mt-3 space-y-1">
              {NAV.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className={item}>
                    {l.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/carrito" className={item}>
                  Carrito
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="Categorías" className="lg:col-span-5">
            <p className={heading}>Categorías</p>
            <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1">
              {categories.slice(0, 9).map((c) => (
                <li key={c.id}>
                  <Link to={`/productos?categoria=${c.id}`} className={item}>
                    {c.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/productos" className="inline-block py-1.5 text-[0.9375rem] font-semibold text-brand-700 transition-colors hover:text-brand-600 sm:py-1">
                  Ver todo →
                </Link>
              </li>
            </ul>
          </nav>

          <div className="sm:col-span-2 lg:col-span-4">
            <p className={heading}>Síguenos</p>
            <p className="mt-3 max-w-[30ch] text-[0.9375rem] leading-relaxed text-ink-2">
              {config.storeTagline || 'Novedades y piezas nuevas.'}
            </p>
            <SocialLinks className="mt-4" />
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-ink/10 py-6 text-[0.8125rem] text-ink-3 sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {YEAR} {config.storeName}. Precios en soles.
          </span>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="-my-2 inline-flex items-center gap-2 self-start py-2 font-medium text-ink-2 transition-colors hover:text-brand-700 sm:self-auto"
          >
            Volver arriba
            <svg viewBox="0 0 16 16" width={14} height={14} aria-hidden="true">
              <path d="M8 13V3m-4 4 4-4 4 4" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* El nombre en blanco a todo el ancho, como un relieve sobre el gris, recortado por el borde inferior */}
      <p
        aria-hidden="true"
        className="pointer-events-none -mb-[0.24em] px-2 text-center text-[clamp(4rem,16.5vw,19rem)] leading-[0.8] font-semibold tracking-[-0.065em] whitespace-nowrap text-white/70 select-none"
      >
        {config.storeName.toLowerCase()}
      </p>
    </footer>
  )
}

export function Layout() {
  const categories = useCategories()
  const [params] = useSearchParams()
  const q = params.get('q') ?? ''
  const { pathname } = useLocation()
  // El panel queda abierto solo en la página donde se abrió: navegar lo cierra solo
  const [searchAt, setSearchAt] = useState<string | null>(null)
  const searching = searchAt === pathname
  const closeSearch = useCallback(() => setSearchAt(null), [])
  const scrolled = useScrolled()

  if (categories.error instanceof ApiError && categories.error.isStoreUnavailable) {
    return <StoreUnavailable />
  }

  return (
    <div className="andean-ground flex min-h-screen flex-col overflow-x-clip">
      <header
        // En la portada, arriba del todo, la cabecera es parte del hero rojo (texto en blanco)
        data-onred={pathname === '/' && !scrolled}
        className={`group/h sticky top-0 z-30 transition-[background-color,box-shadow] duration-500 ease-out-expo ${
          scrolled
            ? 'bg-surface/90 shadow-[0_12px_30px_-22px_rgb(23_22_43/0.45)] backdrop-blur-md'
            : pathname === '/'
              ? 'andean-tex-light bg-brand-700'
              : 'bg-ground/85 backdrop-blur-md'
        }`}
      >
        {/* Misma altura que la barra (no incluye la búsqueda móvil de abajo) */}
        <CartButton className={`transition-[height] duration-500 ease-out-expo ${scrolled ? 'h-16' : 'h-16 sm:h-[4.5rem]'}`} />
        <SearchBlock
          key={`busca-${q}`}
          initial={q}
          open={searching}
          onToggle={() => setSearchAt(searching ? null : pathname)}
          className={`transition-[height,right] duration-500 ease-out-expo xl:right-[10.5rem] ${
            scrolled ? 'right-16 h-16' : 'right-16 h-16 sm:right-[4.5rem] sm:h-[4.5rem]'
          }`}
        />
        <div
          className={`mx-auto flex max-w-[1360px] items-center gap-4 px-4 transition-[height] duration-500 ease-out-expo sm:px-8 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:gap-6 ${
            scrolled ? 'h-16' : 'h-16 sm:h-[4.5rem]'
          }`}
        >
          <Link to="/" className="flex shrink-0 items-center gap-2.5 justify-self-start" aria-label={`${config.storeName}, inicio`}>
            <img src={`${import.meta.env.BASE_URL}logo.png`} alt="" width={40} height={40} className="h-8 w-8 sm:h-10 sm:w-10" />
            <span className="text-[1.25rem] font-semibold tracking-[-0.02em] text-ink transition-colors sm:text-[1.375rem] group-data-[onred=true]/h:text-white">
              {config.storeName}
            </span>
          </Link>
          <MainNav />
          {/* Deja libre el ancho de los dos bloques (buscar + carrito) */}
          <div className="mr-[7.5rem] ml-auto flex items-center justify-self-end lg:hidden">
            <MobileNav />
          </div>
        </div>
        {/* key: al cambiar la búsqueda o la página el campo se reinicia */}
        <SearchPanel key={`${pathname}-${q}`} open={searching} onClose={closeSearch} initial={q} />
      </header>

      <main className="min-w-0 flex-1">
        <Outlet />
      </main>

      <Footer />
      <WhatsAppFab />
      <ScrollRestoration />
    </div>
  )
}
