import { NextResponse, type NextRequest } from 'next/server'

import { findSets, listShops, listThemes } from '@/lib/api/catalog'
import { apiQuery, filterIds, CATALOG, isSale, parseFilters } from '@/lib/catalog/filters'

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
    const ids = filterIds(filters, themes, shops)
    if (ids === 'missing') return NextResponse.json({ total: 0 })
    if (ids === 'failed') throw new Error('lookup failed')
    const page = await findSets(apiQuery(filters, CATALOG, ids, 1), isSale(filters))
    return NextResponse.json({ total: page.total })
  } catch {
    return NextResponse.json({ error: 'unavailable' }, { status: 503 })
  }
}
