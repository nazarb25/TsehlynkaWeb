import Link from 'next/link'

import { AccountButton } from '@/components/auth/AccountButton'
import { Logo } from '@/components/icons'
import type { Theme } from '@/lib/api/types'
import { SITE_NAME } from '@/lib/site'

import { HeaderNav } from './HeaderNav'
import { HeaderSearch } from './HeaderSearch'

interface SiteHeaderProps {
  themes: Theme[]
}

export function SiteHeader({ themes }: SiteHeaderProps) {
  return (
    <header className="header d-only">
      <div className="header__in wrap">
        <Link className="brand" href="/" aria-label={`${SITE_NAME}: головна`}>
          <Logo />
          <span>{SITE_NAME}</span>
        </Link>
        <HeaderNav themes={themes} />
        <HeaderSearch />
        <AccountButton variant="header" />
      </div>
    </header>
  )
}
