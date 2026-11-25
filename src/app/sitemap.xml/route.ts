import { listThemes } from '@/lib/api/catalog'
import { sitemapIndex } from '@/lib/sitemap'

export const dynamic = 'force-dynamic'

/** Індекс карт сайту: сторінки, теми й набори окремою картою для кожної кореневої теми. */
export async function GET() {
  const themes = await listThemes().catch(() => [])
  const roots = themes.filter((theme) => !theme.parent_id && theme.set_count > 0)
  return sitemapIndex(['/sitemaps/pages.xml', ...roots.map((theme) => `/sitemaps/sets-${theme.slug}.xml`)])
}
