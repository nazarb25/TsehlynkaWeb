'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { BrickIcon, ChevronDown, ChevronRight } from '@/components/icons'
import type { Theme } from '@/lib/api/types'
import { setCount } from '@/lib/format'
import { themePath } from '@/lib/routes'

interface HeaderNavProps {
  themes: Theme[]
}

const LINKS = [
  { href: '/catalog', label: 'Каталог' },
  { href: '/new', label: 'Новинки' },
  { href: '/deals', label: 'Зі знижкою' },
] as const

export function HeaderNav({ themes }: HeaderNavProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const [openedAt, setOpenedAt] = useState(pathname)
  if (openedAt !== pathname) {
    setOpenedAt(pathname)
    setOpen(false)
  }

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    const onClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
    }
  }, [open])

  const isOn = (href: string) => pathname === href || pathname.startsWith(`${href}/`)
  const [catalog, ...rest] = LINKS

  return (
    <div className="nav hide-mobile" ref={rootRef}>
      <nav className="nav__links" aria-label="Розділи">
        <Link href={catalog.href} className={isOn(catalog.href) ? 'is-on' : undefined}>
          {catalog.label}
        </Link>
        <button
          type="button"
          className={isOn('/themes') ? 'is-on' : undefined}
          aria-expanded={open}
          aria-controls="themes-menu"
          onClick={() => setOpen((value) => !value)}
        >
          Теми
          <ChevronDown size={16} />
        </button>
        {rest.map((link) => (
          <Link key={link.href} href={link.href} className={isOn(link.href) ? 'is-on' : undefined}>
            {link.label}
          </Link>
        ))}
      </nav>
      <div id="themes-menu" className="mega" hidden={!open}>
        <div className="mega__in wrap">
          <ul className="mega__grid">
            {themes.map((theme) => (
              <li key={theme.id}>
                <Link className="mega__theme" href={themePath(theme)}>
                  <span className="stage mega__photo">
                    {theme.image?.thumb ? <img src={theme.image.thumb} alt="" loading="lazy" /> : <BrickIcon />}
                  </span>
                  <span>
                    <b>{theme.name}</b>
                    <small className="num">{setCount(theme.set_count)}</small>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mega__side">
            <h3>Теми LEGO</h3>
            <Link href="/themes">
              Усі актуальні теми
              <ChevronRight size={14} />
            </Link>
            <Link href="/themes/archive">
              Архів тем
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
