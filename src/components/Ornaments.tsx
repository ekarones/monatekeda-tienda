import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

const line = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.1, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

export function SearchIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" {...props}>
      <g {...line} strokeWidth={1.6}>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m20 20-4.8-4.8" />
      </g>
    </svg>
  )
}

export function CartIcon({ size = 26, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 28 24" width={size} height={(size * 24) / 28} aria-hidden="true" {...props}>
      <g {...line} strokeWidth={1.5}>
        <path d="M1.5 2.5h3.2l3 13.2h14.6l2.9-9.7H6" />
        <circle cx="10" cy="20.3" r="1.6" />
        <circle cx="20" cy="20.3" r="1.6" />
      </g>
    </svg>
  )
}

/* ---- Iconos de categoría: objetos grabados, un solo trazo, retícula de 40 ---- */

const CATEGORY_ICONS: { match: RegExp; paths: React.ReactNode }[] = [
  {
    // Joyería: un par de aretes de gota con cuenta y escalonado interior
    match: /joyer|arete|anillo|collar|pulsera|dije/i,
    paths: (
      <>
        {[12, 28].map((x) => (
          <g key={x}>
            <path d={`M${x} 4.5c-2.2 0-2.2 3.6 0 3.6v2.4`} />
            <circle cx={x} cy={12.2} r={1.6} />
            <path d={`M${x} 14.2l-4.2 9.4a4.6 4.6 0 0 0 8.4 0Z`} />
            <path d={`M${x} 19l1.6 2.2-1.6 2.2-1.6-2.2Z`} />
            <path d={`M${x - 2.2} 30.5l-.8 3.5M${x + 2.2} 30.5l.8 3.5M${x} 31v3.6`} />
          </g>
        ))}
      </>
    ),
  },
  {
    // Platería: copa de plata repujada con banda en zigzag y nudo en el fuste
    match: /plater|plata|vaso|copa|azafate|bandeja/i,
    paths: (
      <>
        <path d="M8.5 6h23c0 8-4.5 12.8-11.5 12.8S8.5 14 8.5 6Z" />
        <path d="M9.4 9.6h21.2" />
        <path d="m11.5 12.6 2 2 2-2 2 2 2-2 2 2 2-2 2 2 2-2 2 2" />
        <path d="M20 18.8v4.4M20 26.2v2.2" />
        <ellipse cx="20" cy="24.7" rx="2.6" ry="1.5" />
        <path d="M14.5 34h11l-2.6-5.6h-5.8Z" />
        <path d="M12.5 34h15" />
      </>
    ),
  },
  {
    // Peluches: llama de perfil, orejas altas, cuello largo y vellón
    match: /peluch|alpaca|juguete|beb/i,
    paths: (
      <>
        <path d="M6.5 13.6c0-1.6 1.2-2.6 2.8-2.6h2.4l.6-4.6 1.1 4 1.1-4 .6 4.6c.9.6 1.4 1.5 1.4 2.6v8.2c0-.5.8-.9 2.4-.9h9.4c2.1 0 3.6 1.4 3.6 3.6v1.6" />
        <path d="M6.5 13.6c0 1.2.9 2 2.3 2h1.6v9.6c0 1.6 1.2 2.8 2.8 2.8h16.4c1.3 0 2.2-.9 2.2-2.2" />
        <path d="M31.8 22.6c1.3 0 2.1-.9 1.9-2.2" />
        <path d="M13.4 28v6.6M16.6 28v6.6M26.4 28v6.6M29.6 27.8v6.8" />
        <path d="M18.6 24.6c.8-.9 1.6-.9 2.4 0s1.6.9 2.4 0 1.6-.9 2.4 0 1.6.9 2.4 0" />
        <circle cx="10.6" cy="12.8" r="0.55" fill="currentColor" />
      </>
    ),
  },
  {
    // Cerámica: cuenco con labio, pie y banda escalonada
    match: /cer[aá]m|decoraci|posa/i,
    paths: (
      <>
        <path d="M5 16.5h30c-1 9.5-6.6 15.2-15 15.2S6 26 5 16.5Z" />
        <path d="M5 16.5c0-1.8 6.7-3 15-3s15 1.2 15 3" />
        <path d="M8.6 21.2h3.6v-2h3v2h3.6v-2h3v2h3.6v-2h3v2h3" />
        <path d="M15.6 31.6l.9 2.6h7l.9-2.6" />
      </>
    ),
  },
  {
    // Textiles: poncho con cuello, franjas, rombo y flecos
    match: /textil|ropa|polo|gorra|chompa|manta|poncho/i,
    paths: (
      <>
        <path d="M14 6h12l11 11-6 15H9L3 17Z" />
        <path d="M15.6 6c0 3 2 5 4.4 5s4.4-2 4.4-5" />
        <path d="M7.6 22h24.8M6.4 25.4h27.2" />
        <path d="m20 14.4 2.6 2.6-2.6 2.6-2.6-2.6Z" />
        <path d="M11 32v3.4M14 32v3.4M17 32v3.4M20 32v3.4M23 32v3.4M26 32v3.4M29 32v3.4" />
      </>
    ),
  },
  {
    // Carteras: bolso de solapa con cierre
    match: /carter|bols|billeter|monedero/i,
    paths: (
      <>
        <path d="M8 15h24l-2 19H10Z" />
        <path d="M14 15v-4a6 6 0 0 1 12 0v4" />
        <path d="M8 15l12 8.4L32 15" />
        <circle cx="20" cy="23.4" r="1.6" />
        <path d="M10.4 29.4h19.2" />
      </>
    ),
  },
  {
    // Hogar y mesa: botija con asa
    match: /hogar|mesa|cocina|pisco|bebida/i,
    paths: (
      <>
        <path d="M16 5h8M17 5v4c-5.6 2-8 6.4-8 11.6C9 27.6 13.6 33 20 33s11-5.4 11-12.4C31 15.4 28.6 11 23 9V5" />
        <path d="M30.6 15.6c4.6.2 4.6 8.2.2 9.4" />
        <path d="M9.4 21h21.2M10.4 25.6h19.2" />
        <path d="M15.4 33v2h9.2v-2" />
      </>
    ),
  },
  {
    // Souvenirs: llavero con chapa grabada
    match: /souvenir|llaver|im[aá]n|amulet|instrument|peruaniz|pin/i,
    paths: (
      <>
        <circle cx="12" cy="11" r="6.4" />
        <path d="M16.6 15.6 20.4 19.4" />
        <path d="M20.4 19.4h12.4v14.4H20.4Z" />
        <circle cx="26.6" cy="22.6" r="1.2" />
        <path d="M23.4 28.6l1.6-1.6 1.6 1.6 1.6-1.6 1.6 1.6" />
      </>
    ),
  },
  {
    // Marcos: marco tallado con paisaje
    match: /plaque|marco|cuadro/i,
    paths: (
      <>
        <rect x="5.5" y="5.5" width="29" height="29" />
        <rect x="9.5" y="9.5" width="21" height="21" />
        <path d="M5.5 5.5l4 4M34.5 5.5l-4 4M5.5 34.5l4-4M34.5 34.5l-4-4" />
        <path d="m11.5 27 5-6.4 3.8 4 3-3.2 5 5.6" />
        <circle cx="24.6" cy="14.6" r="1.6" />
      </>
    ),
  },
]

export function CategoryIcon({ name, size = 44, ...props }: IconProps & { name: string }) {
  const icon = CATEGORY_ICONS.find((c) => c.match.test(name))
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true" {...props}>
      {icon ? (
        <g {...line}>{icon.paths}</g>
      ) : (
        <path d="M20 5 22 18 35 20 22 22 20 35 18 22 5 20 18 18Z" {...line} />
      )}
    </svg>
  )
}
