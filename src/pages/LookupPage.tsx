import { Navigate, useParams } from 'react-router'
import { ApiError } from '../api/client'
import { useLookup } from '../api/store'
import { ErrorState, NotFound, Spinner } from '../components/States'

/**
 * /qr/:code — destino de los QR impresos. Resuelve el código y redirige al detalle.
 * El código puede traer "#" (ej. #0188): en el QR debe ir codificado como %23.
 */
export function LookupPage() {
  const { code = '' } = useParams()
  const lookup = useLookup(code)

  if (lookup.isPending) return <Spinner />
  if (lookup.isError) {
    if (lookup.error instanceof ApiError && lookup.error.status === 404) {
      return <NotFound title="Código no encontrado" />
    }
    return <ErrorState error={lookup.error} onRetry={() => lookup.refetch()} />
  }

  const { data } = lookup
  const to = data.kind === 'variation' ? `/producto/${data.slug}?v=${data.variation_id}` : `/producto/${data.slug}`
  return <Navigate to={to} replace />
}
