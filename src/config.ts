/**
 * Configuración de la tienda.
 *
 * Orden de prioridad:
 * 1. `public/config.js` (window.STORE_CONFIG): se edita directamente en el servidor
 *    (cPanel → Administrador de archivos) sin volver a compilar.
 * 2. Variables `VITE_*` del archivo `.env`, fijadas al compilar.
 */
interface RuntimeConfig {
  apiBaseUrl?: string
  storeName?: string
  storeTagline?: string
  whatsappNumber?: string
  instagramUrl?: string
  facebookUrl?: string
  tiktokUrl?: string
}

/** Acepta "instagram.com/x" o "https://…"; vacío = sin enlace. */
const url = (v: string | undefined) => {
  const s = (v ?? '').trim()
  if (!s) return ''
  return /^https?:\/\//i.test(s) ? s : `https://${s}`
}

declare global {
  interface Window {
    STORE_CONFIG?: RuntimeConfig
  }
}

const env = import.meta.env
const runtime: RuntimeConfig = (typeof window !== 'undefined' && window.STORE_CONFIG) || {}

const pick = (value: string | undefined, fallback: string | undefined) =>
  value !== undefined && value.trim() !== '' ? value.trim() : (fallback ?? '')

export const config = {
  apiBaseUrl: pick(runtime.apiBaseUrl, env.VITE_API_BASE_URL).replace(/\/+$/, ''),
  storeName: pick(runtime.storeName, env.VITE_STORE_NAME) || 'Tienda',
  storeTagline: pick(runtime.storeTagline, env.VITE_STORE_TAGLINE),
  /** Vacío = pedidos por WhatsApp desactivados (el botón se oculta). */
  whatsappNumber: pick(runtime.whatsappNumber, env.VITE_WHATSAPP_NUMBER).replace(/\D/g, ''),
  /** Redes sociales del hero. Vacío = el ícono se muestra atenuado y sin enlace. */
  socials: {
    instagram: url(runtime.instagramUrl),
    facebook: url(runtime.facebookUrl),
    tiktok: url(runtime.tiktokUrl),
  },
}

if (!config.apiBaseUrl) {
  console.error('Falta la URL de la API: complétala en config.js o en VITE_API_BASE_URL')
}
