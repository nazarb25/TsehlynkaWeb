'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { BrickIcon, GridIcon, HomeIcon } from '@/components/icons'

const TABS = [
  { href: '/', label: 'Головна', icon: HomeIcon, match: (path: string) => path === '/' },
  {
    href: '/catalog',
    label: 'Каталог',
    icon: GridIcon,
    match: (path: string) => ['/catalog', '/new', '/deals', '/search', '/sets'].some((prefix) => path.startsWith(prefix)),
  },
  { href: '/themes', label: 'Теми', icon: BrickIcon, match: (path: string) => path.startsWith('/themes') },
] as const

export function MobileDock() {
  const pathname = usePathname()
  return (
    <nav className="dock hide-desktop" aria-label="Розділи">
      {TABS.map(({ href, label, icon: Icon, match }) => {
        const on = match(pathname)
        return (
          <Link key={href} href={href} className={on ? 'is-on' : undefined} aria-current={on ? 'page' : undefined}>
            <Icon size={22} strokeWidth={2} />
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
