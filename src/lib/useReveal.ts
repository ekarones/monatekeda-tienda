import { useLayoutEffect, useRef } from 'react'

/**
 * Revelado al entrar en pantalla, partiendo de un estado VISIBLE:
 * el elemento solo se oculta (`data-armed="true"`) cuando el observador ya está
 * activo, antes del primer pintado. Sin JS, sin IntersectionObserver o con
 * "reducir movimiento", el contenido se ve siempre. Al entrar marca `data-in="true"`.
 * Funciona con `.reveal`, `.reveal-media` y `.cascade` de index.css.
 */
export function useReveal<T extends HTMLElement>(threshold = 0.18) {
  const ref = useRef<T>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.dataset.in = 'true'
          io.disconnect()
        }
      },
      { threshold, rootMargin: '0px 0px -8% 0px' },
    )
    el.dataset.armed = 'true'
    io.observe(el)
    return () => io.disconnect()
  }, [threshold])

  return ref
}
