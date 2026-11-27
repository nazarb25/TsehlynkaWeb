import type { Metadata } from 'next'

import { type CatalogFilters, type CatalogSection, catalogHref, queryParams } from '@/lib/catalog/filters'
import { pageMetadata } from '@/lib/seo'

/** Канонічна адреса списку: режим і сторінка; фільтри, порядок і вигляд — без індексації. */
export function listMetadata(
  filters: CatalogFilters,
  section: CatalogSection,
  title: string,
  description: string,
  noindex = false,
): Metadata {
  const params = queryParams(filters, section, { page: filters.page })
  const extra = [...params.keys()].filter((key) => key !== 'mode' && key !== 'page')
  const canonical = catalogHref(
    { ...filters, theme: null, line: null, shop: null, sort: null, view: null, yearFrom: null, yearTo: null, age: null, piecesMin: null, piecesMax: null, priceFrom: null, priceTo: null, inStock: null, preorder: false, official: false, specialized: false, q: null, newest: section.newest ?? false, onSale: section.onSale ?? false },
    section,
    { page: filters.page },
  )
  const pageTitle = filters.page > 1 ? `${title}, сторінка ${filters.page}` : title
  return pageMetadata({ title: pageTitle, description, path: canonical, noindex: noindex || extra.length > 0 })
}
