import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cache } from 'react'

import { SetTiles } from '@/components/catalog/SetTiles'
import { ChevronRight } from '@/components/icons'
import { ThemeCard } from '@/components/themes/ThemeCard'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Photo } from '@/components/ui/Photo'
import { SectionHead } from '@/components/ui/SectionHead'
import { findRetailSets, listThemes } from '@/lib/api/catalog'
import { CATALOG, catalogHref, parseFilters } from '@/lib/catalog/filters'
import { childThemes, themePathTo, themeYears } from '@/lib/catalog/themes'
import { setCount } from '@/lib/format'
import { themePath } from '@/lib/routes'
import { safe } from '@/lib/safe'
import { pageMetadata, themeCrumbs } from '@/lib/seo'

type Props = { params: Promise<{ slug: string }> }

const findTheme = cache(async (slug: string) => {
  const themes = await listThemes()
  const theme = themes.find((item) => item.slug === slug)
  if (!theme) notFound()
  return { theme, themes }
})

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { theme } = await findTheme((await params).slug)
  const years = themeYears(theme)
  return pageMetadata({
    title: `LEGO ${theme.name}: усі набори`,
    description: `Набори LEGO ${theme.name}: ${setCount(theme.set_count)}${years ? `, ${years}` : ''}. Фото, склад, фігурки й ціни в українських магазинах.`,
    path: themePath(theme),
    image: theme.image?.large ?? theme.image?.medium ?? null,
  })
}

export default async function ThemePage({ params }: Props) {
  const { theme, themes } = await findTheme((await params).slug)
  const parents = themePathTo(themes, theme)
  const children = childThemes(themes, theme)
  const newest = await safe(findRetailSets({ theme_id: theme.id, sort: 'year_desc', limit: 5 }))
  const allSets = catalogHref(parseFilters({}, CATALOG), CATALOG, { mode: 'all', theme: theme.slug })
  const years = themeYears(theme)

  return (
    <div className="wrap">
      <Breadcrumbs items={[{ name: 'Теми', path: theme.is_current ? '/themes' : '/themes/archive' }, ...themeCrumbs(parents), { name: theme.name }]} />
      <section className="theme-hero">
        <Photo src={theme.image?.large ?? theme.image?.medium} className="theme-hero__photo" iconSize={56} eager />
        <div className="theme-hero__text">
          <h1>{theme.name}</h1>
          <p className="theme-hero__meta num">
            <span>{setCount(theme.set_count)}</span>
            {years ? <span>{years}</span> : null}
            {theme.is_current ? <span className="badge">Актуальна</span> : <span className="badge badge--muted">Архів</span>}
          </p>
          <Link className="button button--primary" href={allSets}>
            Переглянути всі набори
            <ChevronRight size={16} />
          </Link>
        </div>
      </section>

      {children.length ? (
        <section aria-labelledby="subthemes">
          <SectionHead id="subthemes" title="Підтеми" />
          <div className="subthemes">
            {children.map((child) => (
              <ThemeCard key={child.id} theme={child} variant="row" />
            ))}
          </div>
        </section>
      ) : null}

      {newest?.items.length ? (
        <section aria-labelledby="theme-new">
          <SectionHead id="theme-new" title="Новіші набори" href={allSets} />
          <SetTiles sets={newest.items} context="sale" columns={5} />
        </section>
      ) : null}
    </div>
  )
}
