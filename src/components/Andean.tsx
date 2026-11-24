import { useId } from 'react'

/*
 * Motivos andinos derivados del logo (corazón escalonado): escalonados y rombos escalonados,
 * dibujados en una retícula de pasos de 4px. Son decoración (aria-hidden) y van en detalles finos:
 * orillas, separadores y texturas tenues. Nunca como relleno llamativo.
 */

/** Greca escalonada: una línea que sube y baja en peldaños, repetida a lo ancho. */
export function StepBand({ className = 'w-full', height = 12 }: { className?: string; height?: number }) {
  const id = useId()
  return (
    <svg aria-hidden="true" className={`block ${className}`} height={height} preserveAspectRatio="none">
      <defs>
        <pattern id={id} width={32} height={12} patternUnits="userSpaceOnUse">
          <path
            d="M0 10.5h4v-3h4v-3h4v-3h8v3h4v3h4v3h4"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinejoin="miter"
          />
          {/* Punto central: el "ojo" que lleva el escalonado en los tejidos */}
          <rect x={14.5} y={6} width={3} height={3} fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  )
}

/**
 * Orilla escalonada: borde inferior en peldaños, como el remate de un tejido.
 * Se coloca al pie de una sección y se pinta del color de la sección siguiente.
 */
export function StepHem({ className = '', height = 14 }: { className?: string; height?: number }) {
  const id = useId()
  return (
    <svg aria-hidden="true" className={`block w-full ${className}`} height={height} preserveAspectRatio="none">
      <defs>
        <pattern id={id} width={56} height={14} patternUnits="userSpaceOnUse">
          {/* Pirámide escalonada de 3 peldaños que sube desde la base */}
          <path d="M0 14V10h8V6h8V2h24v4h8v4h8v4Z" fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  )
}

/** Textura de rombos escalonados (para fondos de paneles, siempre a muy baja opacidad). */
export function StepDiamondField({ className = '' }: { className?: string }) {
  const id = useId()
  return (
    <svg aria-hidden="true" className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}>
      <defs>
        <pattern id={id} width={64} height={64} patternUnits="userSpaceOnUse">
          {/* Rombo escalonado hueco con un cuadro al centro */}
          <path
            d="M28 8h8v4h4v4h4v4h4v8h4v8h-4v8h-4v4h-4v4h-4v4h-8v-4h-4v-4h-4v-4h-4v-8h-4v-8h4v-8h4v-4h4v-4h4Z"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
          />
          <rect x={29} y={29} width={6} height={6} fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  )
}

/** Remate escalonado pequeño, para acompañar un texto en quechua o un título corto. */
export function StepGlyph({ className = '', size = 18 }: { className?: string; size?: number }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 12" width={size * 2} height={size} className={className}>
      <path d="M0 12V9h4V6h4V3h8v3h4v3h4v3Z" fill="currentColor" />
    </svg>
  )
}
