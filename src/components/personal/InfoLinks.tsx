import Link from 'next/link'

import { Chevron } from '@/components/mini/icons'

export const INFO_PAGES = [
  { href: '/profile/how-it-works', label: 'Як працюють ціни й сповіщення' },
  { href: '/profile/about', label: 'Про Цеглинку' },
  { href: '/profile/privacy', label: 'Конфіденційність' },
] as const

/** Довідкові сторінки внизу «Моє», як у Mini App. */
export function InfoLinks() {
  return (
    <div className="c-list c-list--plain">
      {INFO_PAGES.map((page) => (
        <Link key={page.href} className="c-list__row" href={page.href}>
          <span className="c-list__label">{page.label}</span>
          <Chevron />
        </Link>
      ))}
    </div>
  )
}
