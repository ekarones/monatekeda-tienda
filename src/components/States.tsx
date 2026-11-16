import { Link } from 'react-router'
import { config } from '../config'
import { errorMessage } from '../lib/errors'

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
      <p className="text-red-800">{errorMessage(error)}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 rounded-full bg-red-700 px-5 py-2 text-sm font-medium text-white hover:bg-red-800"
        >
          Reintentar
        </button>
      )}
    </div>
  )
}

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h2 className="text-lg font-semibold text-stone-800">{title}</h2>
      {children && <div className="mt-2 text-stone-500">{children}</div>}
    </div>
  )
}

export function NotFound({ title = 'Página no encontrada' }: { title?: string }) {
  return (
    <EmptyState title={title}>
      <p>Lo que buscas no existe o ya no está disponible.</p>
      <Link to="/" className="mt-6 inline-block rounded-full bg-brand-700 px-5 py-2 font-medium text-white">
        Volver al inicio
      </Link>
    </EmptyState>
  )
}

/** Tienda deshabilitada (`store_enabled=false`) o tenant mal configurado. */
export function StoreUnavailable() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 p-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-stone-800">{config.storeName}</h1>
        <p className="mt-2 text-stone-500">La tienda no está disponible en este momento. Vuelve pronto.</p>
      </div>
    </div>
  )
}

export function Spinner() {
  return (
    <div className="flex justify-center py-16" role="status" aria-label="Cargando">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-200 border-t-brand-700" />
    </div>
  )
}
