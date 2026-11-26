'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

/** Набір і пошук мають власну нижню дію або потребують усього місця, тому панелі там немає. */
const HIDDEN = /^\/(sets|search)(\/|$)/

const TABS = [
  {
    key: 'home',
    href: '/',
    label: 'Головна',
    match: (path: string) => path === '/',
    icon: <path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z" />,
  },
  {
    key: 'catalog',
    href: '/catalog',
    label: 'Каталог',
    match: (path: string) => ['/catalog', '/new', '/deals', '/search', '/sets'].some((prefix) => path.startsWith(prefix)),
    icon: (
      <>
        <rect x="4" y="4" width="7" height="7" rx="1.5" />
        <rect x="13" y="4" width="7" height="7" rx="1.5" />
        <rect x="4" y="13" width="7" height="7" rx="1.5" />
        <rect x="13" y="13" width="7" height="7" rx="1.5" />
      </>
    ),
  },
  {
    key: 'themes',
    href: '/themes',
    label: 'Теми',
    match: (path: string) => path.startsWith('/themes'),
    icon: (
      <>
        <rect x="3" y="10" width="18" height="10" rx="2" />
        <rect x="6" y="6" width="4" height="4" rx="1" />
        <rect x="14" y="6" width="4" height="4" rx="1" />
      </>
    ),
  },
] as const

/** Нижня панель вкладок Mini App на телефоні. */
export function MobileDock() {
  const pathname = usePathname()
  const visible = !HIDDEN.test(pathname)

  useEffect(() => {
    const narrow = window.matchMedia('(max-width: 999.98px)')
    const sync = () => document.body.classList.toggle('has-dock', visible && narrow.matches)
    sync()
    narrow.addEventListener('change', sync)
    return () => {
      narrow.removeEventListener('change', sync)
      document.body.classList.remove('has-dock')
    }
  }, [visible])

  return (
    <nav className="c-dock m-only" aria-label="Розділи" hidden={!visible}>
      {TABS.map((tab) => {
        const active = tab.match(pathname)
        return (
          <Link key={tab.key} className={`c-dock__tab${active ? ' is-active' : ''}`} href={tab.href} aria-current={active ? 'page' : undefined}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {tab.icon}
            </svg>
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
