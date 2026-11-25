import Link from 'next/link'

import { ChevronLeft, ChevronRight } from '@/components/icons'

interface PaginationProps {
  page: number
  pages: number
  href: (page: number) => string
}

/** Номери сторінок: перша, остання й сусідні з поточною, решта — трикрапкою. */
function pageNumbers(page: number, pages: number): (number | null)[] {
  const wanted = new Set([1, pages, page - 1, page, page + 1].filter((value) => value >= 1 && value <= pages))
  const sorted = [...wanted].sort((a, b) => a - b)
  const result: (number | null)[] = []
  sorted.forEach((value, index) => {
    const previous = sorted[index - 1]
    if (previous !== undefined && value - previous > 1) result.push(null)
    result.push(value)
  })
  return result
}

export function Pagination({ page, pages, href }: PaginationProps) {
  if (pages <= 1) return null
  return (
    <nav className="pages" aria-label="Сторінки">
      {page > 1 ? (
        <Link href={href(page - 1)} rel="prev" aria-label="Попередня сторінка">
          <ChevronLeft size={16} />
        </Link>
      ) : null}
      {pageNumbers(page, pages).map((value, index) =>
        value === null ? (
          <span key={`gap-${index}`} className="pages__gap">
            …
          </span>
        ) : (
          <Link key={value} href={href(value)} aria-current={value === page ? 'page' : undefined} className="num">
            {value}
          </Link>
        ),
      )}
      {page < pages ? (
        <Link href={href(page + 1)} rel="next" aria-label="Наступна сторінка">
          <ChevronRight size={16} />
        </Link>
      ) : null}
    </nav>
  )
}
