import { NextResponse, type NextRequest } from 'next/server'

import { findCatalogSets, listThemes } from '@/lib/api/catalog'
import { setNumberFromText } from '@/lib/catalog/filters'
import type { Suggestions } from '@/lib/catalog/suggest'
import { matchTheme } from '@/lib/catalog/themes'
import { setPath, themePath } from '@/lib/routes'

const LIMIT = 4

export async function GET(request: NextRequest) {
  const text = (request.nextUrl.searchParams.get('q') ?? '').trim().slice(0, 100)
  if (text.length < 2) return NextResponse.json({ theme: null, sets: [] } satisfies Suggestions)
  const number = setNumberFromText(text)
  try {
    const [page, themes] = await Promise.all([
      findCatalogSets({ number, search: number ? null : text, sort: 'year_desc', limit: LIMIT }),
      number ? Promise.resolve([]) : listThemes(),
    ])
    const theme = matchTheme(themes, text)
    const body: Suggestions = {
      theme: theme
        ? { name: theme.name, href: themePath(theme), image: theme.image?.thumb ?? null, setCount: theme.set_count }
        : null,
      sets: page.items.map((item) => ({
        name: item.name,
        href: setPath(item),
        image: item.image?.thumb ?? null,
        number: item.official_number_display ?? null,
        year: item.intro_year ?? null,
      })),
    }
    return NextResponse.json(body, { headers: { 'Cache-Control': 'private, max-age=60' } })
  } catch {
    return NextResponse.json({ error: 'unavailable' }, { status: 503 })
  }
}
