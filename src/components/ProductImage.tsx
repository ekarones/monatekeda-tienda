import { useState } from 'react'

interface Props {
  src: string | null | undefined
  alt: string
  className?: string
  loading?: 'lazy' | 'eager'
}

/** Imagen con placeholder: ~1 de cada 6 productos no tiene foto. */
export function ProductImage({ src, alt, className = '', loading = 'lazy' }: Props) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return (
      <div
        className={`flex items-center justify-center bg-sunk text-line-strong ${className}`}
        role="img"
        aria-label={`${alt} (sin imagen)`}
      >
        <svg viewBox="0 0 24 24" className="h-1/3 w-1/3" fill="none" stroke="currentColor" strokeWidth={1.2}>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <circle cx="9" cy="10" r="2" />
          <path d="m21 16-5-5-9 9" />
        </svg>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      decoding="async"
      onError={() => setFailed(true)}
      className={`bg-sunk object-cover ${className}`}
    />
  )
}
