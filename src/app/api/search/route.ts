import { NextResponse, type NextRequest } from 'next/server'

import { findSets, listThemes } from '@/lib/api/catalog'
import { apiQuery, filterIds, isSale, parseFilters, SEARCH } from '@/lib/catalog/filters'
import { matchTheme } from '@/lib/catalog/themes'

/** Результати повноекранного пошуку: тема за назвою й перша сторінка наборів. */
export async function GET(request: NextRequest) {
  const filters = parseFilters(request.nextUrl.searchParams, SEARCH)
  if (!filters.q) return NextResponse.json({ theme: null, items: [], total: 0 })
  try {
    const themes = await listThemes()
    const ids = filterIds(filters, themes, [])
    if (ids === 'failed') throw new Error('lookup failed')
    const page = ids === 'missing' ? { items: [], total: 0 } : await findSets(apiQuery(filters, SEARCH, ids), isSale(filters))
    return NextResponse.json({
      theme: filters.page === 1 ? matchTheme(themes, filters.q) : null,
      items: page.items,
      total: page.total,
    })
  } catch {
    return NextResponse.json({ error: 'unavailable' }, { status: 503 })
  }
}
