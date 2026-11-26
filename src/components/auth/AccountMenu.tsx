'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import type { AccountView } from './AuthProvider'

const ITEMS = [
  { href: '/favourites', label: 'Обране' },
  { href: '/recent', label: 'Нещодавно переглянуті' },
  { href: '/profile/personal-data', label: 'Особисті дані' },
] as const

/** Меню під аватаркою в шапці десктопу: профіль, особисті списки й вихід. */
export function AccountMenu({ account }: { account: AccountView }) {
  const pathname = usePathname()
  const [openOn, setOpenOn] = useState<string | null>(null)
  const open = openOn === pathname
  const setOpen = (value: boolean) => setOpenOn(value ? pathname : null)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpenOn(null)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenOn(null)
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="account-menu" ref={rootRef}>
      <button type="button" className="header__account" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className="header__avatar" aria-hidden="true">
          {account.initial}
        </span>
        <span>{account.name}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open ? (
        <div className="account-menu__panel" role="menu">
          <Link className="account-menu__who" href="/profile" role="menuitem">
            <span className="header__avatar" aria-hidden="true">
              {account.initial}
            </span>
            <span>
              <b>{account.name}</b>
              <small>{account.username ? `@${account.username}` : 'Профіль'}</small>
            </span>
          </Link>
          {ITEMS.map((item) => (
            <Link key={item.href} className="account-menu__item" href={item.href} role="menuitem">
              {item.label}
            </Link>
          ))}
          <form action="/auth/logout" method="post" className="logout-form">
            <button type="submit" className="account-menu__item account-menu__item--danger" role="menuitem">
              Вийти
            </button>
          </form>
        </div>
      ) : null}
    </div>
  )
}
