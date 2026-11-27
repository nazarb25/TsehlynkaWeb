import { notFound } from 'next/navigation'

import { findCatalogSets, listThemes } from '@/lib/api/catalog'
import type { CatalogSetItem } from '@/lib/api/types'
import { setPath, themePath } from '@/lib/routes'
import { type SitemapEntry, urlset } from '@/lib/sitemap'

export const dynamic = 'force-dynamic'

const STATIC_PAGES = ['/', '/catalog', '/catalog?mode=all', '/new', '/deals', '/themes', '/themes/archive', '/contacts', '/privacy']
const PAGE_LIMIT = 100
const MAX_OFFSET = 10_000

async function themeSets(themeId: string): Promise<CatalogSetItem[]> {
  const items: CatalogSetItem[] = []
  for (let offset = 0; offset <= MAX_OFFSET; offset += PAGE_LIMIT) {
    const page = await findCatalogSets({ theme_id: themeId, include_specialized: true, sort: 'year_desc', limit: PAGE_LIMIT, offset })
    items.push(...page.items)
    if (offset + PAGE_LIMIT >= page.total) break
  }
  return items
}

export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params
  const themes = await listThemes()
  if (name === 'pages.xml') {
    const entries: SitemapEntry[] = [
      ...STATIC_PAGES.map((path) => ({ path })),
      ...themes.filter((theme) => theme.set_count > 0).map((theme) => ({ path: themePath(theme) })),
    ]
    return urlset(entries)
  }
  const match = /^sets-(.+)\.xml$/.exec(name)
  const theme = match ? themes.find((item) => item.slug === match[1] && !item.parent_id) : undefined
  if (!theme) notFound()
  const sets = await themeSets(theme.id)
  return urlset(sets.map((set) => ({ path: setPath(set) })))
}
