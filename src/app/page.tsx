import type { Metadata } from 'next'
import Link from 'next/link'

import { SetTiles } from '@/components/catalog/SetTiles'
import { BagIcon, GridIcon, StarIcon, TagIcon } from '@/components/icons'
import { MiniHome } from '@/components/mini/MiniHome'
import { ThemeCard } from '@/components/themes/ThemeCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { SearchField } from '@/components/ui/SearchField'
import { SectionHead } from '@/components/ui/SectionHead'
import { findSets, listThemes } from '@/lib/api/catalog'
import { apiQuery, DEALS, NEWEST, parseFilters } from '@/lib/catalog/filters'
import { currentRootThemes, popularThemes } from '@/lib/catalog/themes'
import { safe } from '@/lib/safe'
import { pageMetadata } from '@/lib/seo'
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from '@/lib/site'

export function generateMetadata(): Metadata {
  return {
    ...pageMetadata({ title: `${SITE_NAME}: ${SITE_TAGLINE}`, description: SITE_DESCRIPTION, path: '/' }),
    title: { absolute: `${SITE_NAME}: ${SITE_TAGLINE}` },
  }
}

const ROW = 5

const QUICK_LINKS = [
  { href: '/themes', label: 'Усі теми', short: 'Усі теми', icon: GridIcon },
  { href: '/new', label: 'Новинки', short: 'Новинки', icon: StarIcon },
  { href: '/catalog', label: 'Є в продажу', short: 'У продажу', icon: BagIcon },
  { href: '/deals', label: 'Зі знижкою', short: 'Зі знижкою', icon: TagIcon },
] as const

export default async function HomePage() {
  const newest = parseFilters({}, NEWEST)
  const deals = parseFilters({}, DEALS)
  const [themes, newestPage, dealsPage] = await Promise.all([
    safe(listThemes()),
    safe(findSets(apiQuery(newest, NEWEST, {}, ROW), false)),
    safe(findSets(apiQuery(deals, DEALS, {}, ROW), true)),
  ])
  const unavailable = !themes && !newestPage && !dealsPage
  const top = themes ? popularThemes(themes, 8) : []

  return (
    <>
      <div className="m-only">
        <MiniHome
          themes={themes ? currentRootThemes(themes).slice(0, 6) : null}
          newest={newestPage ? newestPage.items.slice(0, 3) : null}
          deals={(dealsPage?.items ?? []).filter((item) => item.best_deal).slice(0, 3)}
        />
      </div>
      <section className="hero d-only">
        <div className="hero__in wrap">
          <h1 className="hide-mobile">{SITE_TAGLINE}</h1>
          <p className="hide-mobile">Повний каталог, архів і пропозиції в одному місці</p>
          <SearchField button className="hero__search" />
          <nav className="quick" aria-label="Швидкі переходи">
            {QUICK_LINKS.map(({ href, label, short, icon: Icon }) => (
              <Link key={href} href={href}>
                <Icon size={18} />
                <span className="hide-mobile">{label}</span>
                <span className="hide-desktop">{short}</span>
              </Link>
            ))}
          </nav>
        </div>
      </section>

      <div className="wrap home d-only">
        {unavailable ? (
          <EmptyState title="Каталог тимчасово недоступний" text="Спробуйте оновити сторінку за хвилину." />
        ) : null}

        {top.length ? (
          <section aria-labelledby="home-themes">
            <SectionHead id="home-themes" title="Теми LEGO" href="/themes" />
            <div className="themes-strip">
              {top.map((theme) => (
                <ThemeCard key={theme.id} theme={theme} />
              ))}
            </div>
          </section>
        ) : null}

        {newestPage?.items.length ? (
          <section aria-labelledby="home-new" className="home-row">
            <SectionHead id="home-new" title="Новинки" href="/new" />
            <SetTiles sets={newestPage.items} context="newest" columns={5} />
          </section>
        ) : null}

        {dealsPage?.items.length ? (
          <section aria-labelledby="home-deals" className="home-row">
            <SectionHead id="home-deals" title="Зі знижкою" href="/deals" />
            <SetTiles sets={dealsPage.items} context="sale" columns={5} />
          </section>
        ) : null}
      </div>
    </>
  )
}
