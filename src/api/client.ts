import { config } from '../config'

export class ApiError extends Error {
  status: number
  /** Mensaje del backend (`{ message }`). `null` cuando la respuesta vino sin body. */
  serverMessage: string | null
  /** Segundos a esperar en un 429 (requiere que el backend exponga `Retry-After` por CORS). */
  retryAfter: number | null

  constructor(status: number, serverMessage: string | null, retryAfter: number | null) {
    super(serverMessage ?? `Error ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.serverMessage = serverMessage
    this.retryAfter = retryAfter
  }

  /**
   * 404 sin body = tienda deshabilitada (`store_enabled=false`) o tenant inválido.
   * Un 404 "normal" (producto inexistente) siempre trae `{ message }`.
   */
  get isStoreUnavailable() {
    return (this.status === 404 && this.serverMessage === null) || this.status === 400
  }
}

type QueryValue = string | number | boolean | undefined | null

function buildUrl(path: string, query?: Record<string, QueryValue>) {
  const url = new URL(config.apiBaseUrl + path)
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '' || value === false) continue
      url.searchParams.set(key, value === true ? '1' : String(value))
    }
  }
  return url.toString()
}

/**
 * GET contra la API pública. Sin headers custom a propósito: así la request es
 * "simple" para CORS y el navegador no manda un preflight OPTIONS extra.
 */
export async function apiGet<T>(
  path: string,
  query?: Record<string, QueryValue>,
  signal?: AbortSignal,
): Promise<T> {
  const res = await fetch(buildUrl(path, query), { signal })

  if (!res.ok) {
    let message: string | null = null
    try {
      const text = await res.text()
      if (text) message = (JSON.parse(text) as { message?: string }).message ?? null
    } catch {
      // body vacío o no-JSON
    }
    const retryHeader = res.headers.get('Retry-After')
    const retryAfter = retryHeader ? Number(retryHeader) || null : null
    throw new ApiError(res.status, message, retryAfter)
  }

  return (await res.json()) as T
}

/** Codifica un segmento de path. Necesario porque muchos códigos traen `#` (ej. `#0188`). */
export const seg = (value: string) => encodeURIComponent(value)
