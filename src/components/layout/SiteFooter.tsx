import Link from 'next/link'

import { Logo } from '@/components/icons'
import { INFO_PAGES } from '@/components/personal/InfoLinks'
import type { Theme } from '@/lib/api/types'
import { themePath } from '@/lib/routes'
import { SITE_NAME } from '@/lib/site'

interface SiteFooterProps {
  themes: Theme[]
  botUrl: string | null
}

export const TRADEMARK_NOTICE =
  'LEGO® — торгова марка групи компаній LEGO. Цеглинка — незалежний неофіційний проєкт, не пов’язаний із групою компаній LEGO і не спонсорований нею.'

export function SiteFooter({ themes, botUrl }: SiteFooterProps) {
  return (
    <footer className="footer d-only">
      <div className="footer__in wrap">
        <div className="footer__about">
          <Link className="brand" href="/">
            <Logo />
            <span>{SITE_NAME}</span>
          </Link>
          <p>{TRADEMARK_NOTICE}</p>
          <p className="footer__small">Зображення наборів і фігурок та інструкції захищені авторським правом групи компаній LEGO.</p>
        </div>
        <nav className="hide-mobile" aria-label="Каталог">
          <h3>Каталог</h3>
          <Link href="/catalog?mode=all">Усі набори</Link>
          <Link href="/catalog">Є в продажу</Link>
          <Link href="/new">Новинки</Link>
          <Link href="/deals">Зі знижкою</Link>
          <Link href="/themes">Теми LEGO</Link>
          <Link href="/themes/archive">Архів тем</Link>
        </nav>
        {themes.length ? (
          <nav className="hide-mobile" aria-label="Популярні теми">
            <h3>Популярні теми</h3>
            {themes.map((theme) => (
              <Link key={theme.id} href={themePath(theme)}>
                {theme.name}
              </Link>
            ))}
          </nav>
        ) : null}
        <nav className="hide-mobile" aria-label="Інформація">
          <h3>Інформація</h3>
          {INFO_PAGES.map((page) => (
            <Link key={page.href} href={page.href}>
              {page.label}
            </Link>
          ))}
          {botUrl ? (
            <a className="web-only" href={botUrl} target="_blank" rel="noopener">
              Бот у Telegram
            </a>
          ) : null}
        </nav>
      </div>
    </footer>
  )
}
