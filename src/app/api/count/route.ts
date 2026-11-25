import { NextResponse, type NextRequest } from 'next/server'

import { findSets, listShops, listThemes } from '@/lib/api/catalog'
import { apiQuery, CATALOG, isSale, parseFilters } from '@/lib/catalog/filters'

/** Кількість наборів за чернеткою фільтрів мобільної шторки. */
export async function GET(request: NextRequest) {
  const filters = parseFilters(request.nextUrl.searchParams, CATALOG)
  const mode = request.nextUrl.searchParams.get('mode')
  if (mode === 'all' || mode === 'sale') filters.mode = mode
  try {
    const [themes, shops] = await Promise.all([
      filters.theme ? listThemes() : Promise.resolve([]),
      filters.shop && isSale(filters) ? listShops() : Promise.resolve([]),
    ])
    const themeId = themes.find((theme) => theme.slug === filters.theme)?.id ?? null
    const shopId = shops.find((shop) => shop.slug === filters.shop)?.id ?? null
    const page = await findSets(apiQuery(filters, CATALOG, { themeId, shopId }, 1), isSale(filters))
    return NextResponse.json({ total: page.total })
  } catch {
    return NextResponse.json({ error: 'unavailable' }, { status: 503 })
  }
}
