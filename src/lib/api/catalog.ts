import 'server-only'

import { cache } from 'react'

import { apiGet, NotFoundError } from './client'
import type {
  CatalogSetItem,
  Inventory,
  Page,
  RetailSetItem,
  RetailShop,
  SetDetails,
  SetItem,
  ShopOffer,
  Theme,
} from './types'

type ApiQuery = Record<string, string | number | boolean | null | undefined>

export const listThemes = cache(async (): Promise<Theme[]> => apiGet<Theme[]>('themes', undefined, 900))

export const listShops = cache(async (): Promise<RetailShop[]> => apiGet<RetailShop[]>('retail/shops', undefined, 900))

export async function findRetailSets(query: ApiQuery): Promise<Page<RetailSetItem>> {
  return apiGet<Page<RetailSetItem>>('retail/sets', query, 120)
}

export async function findCatalogSets(query: ApiQuery): Promise<Page<CatalogSetItem>> {
  const { in_stock: _a, preorder: _b, official: _c, on_sale: _d, shop_id: _e, ...catalog } = query
  const sort = catalog.sort
  const allowed = sort === 'name_asc' || sort === 'year_asc' || sort === 'year_desc' || sort === 'release_desc'
  return apiGet<Page<CatalogSetItem>>('sets', { ...catalog, sort: allowed ? sort : 'year_desc' }, 300)
}

/** Набори в продажу або весь каталог за режимом. */
export async function findSets(query: ApiQuery, retail: boolean): Promise<Page<SetItem>> {
  return retail ? findRetailSets(query) : findCatalogSets(query)
}

export const getSet = cache(async (id: string): Promise<SetDetails> => apiGet<SetDetails>(`sets/${id}`, undefined, 300))

export const getInventory = cache(async (id: string): Promise<Inventory | null> => {
  try {
    return await apiGet<Inventory>(`sets/${id}/inventory`, undefined, 900)
  } catch (error) {
    if (error instanceof NotFoundError) return null
    throw error
  }
})

export const getOffers = cache(async (id: string): Promise<ShopOffer[]> => apiGet<ShopOffer[]>(`retail/sets/${id}/offers`, undefined, 120))

/** Ідентифікатор набору лише за точним збігом номера. */
export const findSetIdByNumber = cache(async (number: string): Promise<string | null> => {
  const page = await apiGet<Page<CatalogSetItem>>('sets', { number, include_specialized: true, limit: 5 }, 900)
  return page.items.find((item) => item.official_number_display === number)?.id ?? null
})

const RETAIL_IDS_LIMIT = 100

/** Роздрібні поля для власного списку наборів: особисті списки API віддають лише поля каталогу. */
export async function withRetail<T extends SetItem>(items: T[]): Promise<T[]> {
  const ids = [...new Set(items.map((item) => item.id))]
  if (!ids.length) return items
  const retail = new Map<string, RetailSetItem>()
  try {
    for (let start = 0; start < ids.length; start += RETAIL_IDS_LIMIT) {
      const chunk = ids.slice(start, start + RETAIL_IDS_LIMIT)
      const page = await apiGet<Page<RetailSetItem>>('retail/sets', { set_id: chunk, include_specialized: true, limit: chunk.length }, 120)
      for (const item of page.items) retail.set(item.id, item)
    }
  } catch {
    return items
  }
  return items.map((item) => {
    const found = retail.get(item.id)
    return found ? { ...found, ...item } : item
  })
}
