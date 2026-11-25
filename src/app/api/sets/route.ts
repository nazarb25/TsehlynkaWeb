import { NextResponse, type NextRequest } from 'next/server'

import { findSets, listShops, listThemes } from '@/lib/api/catalog'
import { apiQuery, isSale, parseFilters, type SectionKey, SECTIONS } from '@/lib/catalog/filters'

/** Наступна сторінка списку для «Показати ще». */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const key = params.get('section') as SectionKey | null
  const section = key && key in SECTIONS ? SECTIONS[key] : SECTIONS.catalog
  const filters = parseFilters(params, section)
  try {
    const [themes, shops] = await Promise.all([
      filters.theme ? listThemes() : Promise.resolve([]),
      filters.shop && isSale(filters) ? listShops() : Promise.resolve([]),
    ])
    const themeId = themes.find((theme) => theme.slug === filters.theme)?.id ?? null
    const shopId = shops.find((shop) => shop.slug === filters.shop)?.id ?? null
    const page = await findSets(apiQuery(filters, section, { themeId, shopId }), isSale(filters))
    return NextResponse.json({ items: page.items, total: page.total })
  } catch {
    return NextResponse.json({ error: 'unavailable' }, { status: 503 })
  }
}
