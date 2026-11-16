interface Props {
  page: number
  lastPage: number
  onChange: (page: number) => void
}

function pageList(page: number, last: number): (number | '…')[] {
  const pages = new Set([1, last, page - 1, page, page + 1].filter((p) => p >= 1 && p <= last))
  const sorted = [...pages].sort((a, b) => a - b)
  const out: (number | '…')[] = []
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push('…')
    out.push(p)
  })
  return out
}

export function Pagination({ page, lastPage, onChange }: Props) {
  if (lastPage <= 1) return null
  const btn = 'min-w-10 h-10 rounded-full px-3 text-sm font-medium transition disabled:opacity-40'

  return (
    <nav className="mt-8 flex flex-wrap items-center justify-center gap-1" aria-label="Paginación">
      <button className={`${btn} hover:bg-stone-100`} disabled={page <= 1} onClick={() => onChange(page - 1)}>
        ‹ Anterior
      </button>
      {pageList(page, lastPage).map((p, i) =>
        p === '…' ? (
          <span key={`e${i}`} className="px-1 text-stone-400">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            aria-current={p === page ? 'page' : undefined}
            className={`${btn} ${p === page ? 'bg-brand-700 text-white' : 'hover:bg-stone-100'}`}
          >
            {p}
          </button>
        ),
      )}
      <button
        className={`${btn} hover:bg-stone-100`}
        disabled={page >= lastPage}
        onClick={() => onChange(page + 1)}
      >
        Siguiente ›
      </button>
    </nav>
  )
}
