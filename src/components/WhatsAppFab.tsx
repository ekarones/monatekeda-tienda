import { Link } from 'react-router'
import { config } from '../config'
import { WhatsAppGlyph } from './HeroExtras'

/**
 * Botón flotante de contacto por WhatsApp, en todas las páginas.
 * Con número configurado (config.js) abre el chat con un saludo; sin número, lleva a /contacto.
 * Al pasar el cursor se despliega la etiqueta "Escríbenos".
 */
export function WhatsAppFab() {
  const number = config.whatsappNumber
  const href = number
    ? `https://wa.me/${number}?text=${encodeURIComponent(`¡Hola ${config.storeName}! Tengo una consulta.`)}`
    : ''
  const className =
    'fade-up group fixed right-4 bottom-4 z-40 flex h-14 items-center gap-0 rounded-full bg-[#25D366] pr-[1.0625rem] pl-[1.0625rem] text-white shadow-[0_14px_30px_-10px_rgb(18_140_70/0.6)] transition-[gap,padding,transform] duration-500 ease-out-expo hover:-translate-y-0.5 hover:gap-2.5 hover:pr-5 focus-visible:gap-2.5 focus-visible:pr-5 sm:right-6 sm:bottom-6'
  const content = (
    <>
      <svg viewBox="0 0 24 24" width={24} height={24} aria-hidden="true" className="shrink-0">
        <WhatsAppGlyph />
      </svg>
      <span className="max-w-0 overflow-hidden text-[0.9375rem] font-semibold whitespace-nowrap transition-[max-width] duration-500 ease-out-expo group-hover:max-w-[8rem] group-focus-visible:max-w-[8rem]">
        Escríbenos
      </span>
    </>
  )
  return number ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Escríbenos por WhatsApp a ${config.storeName}`}
      className={className}
      style={{ animationDelay: '1400ms' }}
    >
      {content}
    </a>
  ) : (
    <Link
      to="/contacto"
      aria-label="Contacto por WhatsApp"
      className={className}
      style={{ animationDelay: '1400ms' }}
    >
      {content}
    </Link>
  )
}
