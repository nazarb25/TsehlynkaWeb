import Link from 'next/link'

import { Logo, TelegramIcon } from '@/components/icons'
import type { Theme } from '@/lib/api/types'
import { SITE_NAME } from '@/lib/site'

import { HeaderNav } from './HeaderNav'
import { HeaderSearch } from './HeaderSearch'

interface SiteHeaderProps {
  themes: Theme[]
  botUrl: string | null
}

export function SiteHeader({ themes, botUrl }: SiteHeaderProps) {
  return (
    <header className="header d-only">
      <div className="header__in wrap">
        <Link className="brand" href="/" aria-label={`${SITE_NAME}: головна`}>
          <Logo />
          <span>{SITE_NAME}</span>
        </Link>
        <HeaderNav themes={themes} />
        <HeaderSearch />
        {botUrl ? (
          <a className="header__tg web-only" href={botUrl} target="_blank" rel="noopener" data-track="telegram_opened" data-track-place="header">
            <TelegramIcon />
            <span className="hide-mobile">Відкрити в Telegram</span>
            <span className="hide-desktop">Telegram</span>
          </a>
        ) : null}
      </div>
    </header>
  )
}
