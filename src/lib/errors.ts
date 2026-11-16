import { ApiError } from '../api/client'

export function errorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 429) {
      const wait = error.retryAfter ? ` Intenta de nuevo en ${error.retryAfter} segundos.` : ' Espera un momento.'
      return `Demasiadas solicitudes.${wait}`
    }
    if (error.status >= 500) return 'El servicio no está disponible en este momento.'
    if (error.serverMessage) return error.serverMessage
  }
  return 'No pudimos conectar con la tienda. Revisa tu conexión.'
}
