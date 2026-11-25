import { describe, expect, it } from 'vitest'

import type { RetailShop, Theme } from '@/lib/api/types'

import { apiQuery, CATALOG, DEALS, effectiveSort, filterIds, MAX_PAGE, parseFilters, queryParams } from './filters'

const parse = (query: string, section = CATALOG) => parseFilters(new URLSearchParams(query), section)

describe('parseFilters', () => {
  it('accepts the last page that pagination exposes', () => {
    expect(parse(`page=${MAX_PAGE}`).page).toBe(MAX_PAGE)
    expect(parse(`page=${MAX_PAGE + 1}`).page).toBe(1)
  })

  it('drops sale-only flags when preorder is selected', () => {
    const filters = parse('preorder=true&on_sale=true&official=true')
    expect(filters).toMatchObject({ preorder: true, onSale: false, official: false })
  })

  it('ignores preorder on the deals page', () => {
    expect(parse('preorder=true', DEALS)).toMatchObject({ preorder: false, onSale: true })
  })
})

describe('effectiveSort', () => {
  it('ignores keys inherited from Object.prototype', () => {
    expect(effectiveSort(parse('sort=constructor'), CATALOG)).toBe('price_asc')
    expect(queryParams(parse('sort=toString'), CATALOG).has('sort')).toBe(false)
  })

  it('keeps an allowed sort', () => {
    expect(effectiveSort(parse('sort=price_desc'), CATALOG)).toBe('price_desc')
  })
})

describe('apiQuery', () => {
  it('does not combine in_stock with preorder', () => {
    const query = apiQuery(parse('preorder=true'), CATALOG, { themeId: null, shopId: null })
    expect(query).toMatchObject({ preorder: true, in_stock: null })
  })

  it('filters by stock in sale mode by default', () => {
    expect(apiQuery(parse(''), CATALOG, { themeId: null, shopId: null }).in_stock).toBe(true)
  })

  it('treats a set number as an exact number filter', () => {
    expect(apiQuery(parse('q=75192'), CATALOG, { themeId: null, shopId: null })).toMatchObject({ number: '75192', search: null })
  })
})

describe('filterIds', () => {
  const themes = [{ id: 't1', slug: 'star-wars' }] as Theme[]
  const shops = [{ id: 's1', slug: 'kubyk' }] as RetailShop[]

  it('resolves known slugs', () => {
    expect(filterIds(parse('theme=star-wars&shop=kubyk'), themes, shops)).toEqual({ themeId: 't1', shopId: 's1' })
  })

  it('reports an unknown slug instead of dropping the filter', () => {
    expect(filterIds(parse('theme=old-slug'), themes, shops)).toBe('missing')
  })

  it('reports a failed lookup when a filter needs it', () => {
    expect(filterIds(parse('theme=star-wars'), null, shops)).toBe('failed')
    expect(filterIds(parse(''), null, null)).toEqual({ themeId: null, shopId: null })
  })

  it('ignores the shop outside sale mode', () => {
    expect(filterIds(parse('mode=all&shop=unknown'), themes, null)).toEqual({ themeId: null, shopId: null })
  })
})
