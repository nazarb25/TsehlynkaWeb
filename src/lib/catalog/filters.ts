import type { RetailShop, Theme } from '@/lib/api/types'
import { isoDateDaysAgo } from '@/lib/format'

export type CatalogMode = 'all' | 'sale'
export type SetSort =
  | 'name_asc'
  | 'price_asc'
  | 'price_desc'
  | 'year_asc'
  | 'year_desc'
  | 'discount_desc'
  | 'release_desc'
export type ListView = 'grid' | 'list'

/** Розділ каталогу: адреса й значення, які він задає сам і не показує в адресі. */
export interface CatalogSection {
  path: string
  mode?: CatalogMode
  newest?: boolean
  onSale?: boolean
  defaultSort?: SetSort
  /** Режим без параметра в адресі, коли розділ не задає його сам. */
  defaultMode?: CatalogMode
}

export const CATALOG: CatalogSection = { path: '/catalog' }
export const NEWEST: CatalogSection = { path: '/new', mode: 'all', newest: true }
export const DEALS: CatalogSection = { path: '/deals', mode: 'sale', onSale: true, defaultSort: 'discount_desc' }
export const SEARCH: CatalogSection = { path: '/search', defaultMode: 'sale' }

export interface CatalogFilters {
  mode: CatalogMode
  q: string | null
  theme: string | null
  shop: string | null
  sort: SetSort | null
  yearFrom: number | null
  yearTo: number | null
  age: number | null
  piecesMin: number | null
  piecesMax: number | null
  inStock: boolean | null
  preorder: boolean
  onSale: boolean
  official: boolean
  newest: boolean
  specialized: boolean
  view: ListView | null
  page: number
}

export interface AgeMark {
  months: number
  label: string
}

export const AGE_MARKS: readonly AgeMark[] = [
  { months: 18, label: '1½+' },
  { months: 24, label: '2+' },
  { months: 48, label: '4+' },
  { months: 60, label: '5+' },
  { months: 72, label: '6+' },
  { months: 84, label: '7+' },
  { months: 96, label: '8+' },
  { months: 108, label: '9+' },
  { months: 120, label: '10+' },
  { months: 144, label: '12+' },
  { months: 168, label: '14+' },
  { months: 192, label: '16+' },
  { months: 216, label: '18+' },
]

export interface PiecesRange {
  min: number
  max: number | null
  label: string
}

export const PIECES_RANGES: readonly PiecesRange[] = [
  { min: 0, max: 99, label: 'До 100' },
  { min: 100, max: 299, label: '100–299' },
  { min: 300, max: 699, label: '300–699' },
  { min: 700, max: 1499, label: '700–1499' },
  { min: 1500, max: null, label: '1500 і більше' },
]

export const MODE_LABELS: Record<CatalogMode, string> = { all: 'Усі набори', sale: 'Є в продажу' }
export const MODE_HINTS: Record<CatalogMode, string> = {
  all: 'Усі набори LEGO, разом з архівом',
  sale: 'Лише те, що можна купити в Україні',
}
export const NEWEST_HINT = 'Вийшли за останні пів року або скоро вийдуть'
export const PAGE_SIZE = 20

/** API віддає записи лише до зсуву 10 000. */
export const API_MAX_OFFSET = 10_000

export const MAX_PAGE = Math.floor(API_MAX_OFFSET / PAGE_SIZE) + 1
const NEWEST_WINDOW_DAYS = 183
const MIN_YEAR = 1949
const MAX_YEAR = 2100

const SALE_SORTS: Record<string, string> = {
  price_asc: 'Спочатку дешевші',
  price_desc: 'Спочатку дорожчі',
  discount_desc: 'Найбільша знижка',
  year_desc: 'Спочатку новіші',
  year_asc: 'Спочатку старіші',
  name_asc: 'За назвою',
}
const ALL_SORTS: Record<string, string> = {
  year_desc: 'Спочатку новіші',
  year_asc: 'Спочатку старіші',
  name_asc: 'За назвою',
}
const NEWEST_SORTS: Record<string, string> = {
  release_desc: 'Спочатку новіші',
  name_asc: 'За назвою',
}

type Params = Record<string, string | string[] | undefined> | URLSearchParams

function read(params: Params, name: string): string | null {
  const value = params instanceof URLSearchParams ? params.get(name) : params[name]
  const text = Array.isArray(value) ? value[0] : value
  return text && text.trim() ? text.trim() : null
}

function readInt(params: Params, name: string, min: number, max: number): number | null {
  const text = read(params, name)
  if (text === null || !/^\d+$/.test(text)) return null
  const value = Number(text)
  return value >= min && value <= max ? value : null
}

function readFlag(params: Params, name: string): boolean {
  return read(params, name) === 'true'
}

export function isSale(filters: CatalogFilters): boolean {
  return filters.mode === 'sale'
}

export function isNewest(filters: CatalogFilters): boolean {
  return filters.newest && !isSale(filters)
}

export function sortOptions(filters: Pick<CatalogFilters, 'mode' | 'newest'>): Record<string, string> {
  if (filters.newest && filters.mode === 'all') return NEWEST_SORTS
  return filters.mode === 'sale' ? SALE_SORTS : ALL_SORTS
}

export function defaultSort(filters: Pick<CatalogFilters, 'mode' | 'newest'>, section: CatalogSection): SetSort {
  if (filters.newest && filters.mode === 'all') return 'release_desc'
  if (section.defaultSort) return section.defaultSort
  return filters.mode === 'sale' ? 'price_asc' : 'year_desc'
}

export function effectiveSort(filters: CatalogFilters, section: CatalogSection): SetSort {
  if (filters.sort && Object.hasOwn(sortOptions(filters), filters.sort)) return filters.sort
  return defaultSort(filters, section)
}

/**
 * У режимі продажу без явного вибору — лише в наявності. API поєднує `in_stock` і `preorder`
 * через «і», тому передзамовлення замінює фільтр наявності.
 */
export function effectiveInStock(filters: CatalogFilters): boolean {
  return isSale(filters) && filters.inStock !== false && !filters.preorder
}

export function parseFilters(params: Params, section: CatalogSection): CatalogFilters {
  const requested = read(params, 'mode')
  const mode: CatalogMode =
    section.mode ?? (requested === 'all' || requested === 'sale' ? requested : (section.defaultMode ?? 'sale'))
  let yearFrom = readInt(params, 'year_from', MIN_YEAR, MAX_YEAR)
  let yearTo = readInt(params, 'year_to', MIN_YEAR, MAX_YEAR)
  if (yearFrom && yearTo && yearFrom > yearTo) [yearFrom, yearTo] = [yearTo, yearFrom]
  let piecesMin = readInt(params, 'pieces_min', 0, 100_000)
  let piecesMax = readInt(params, 'pieces_max', 0, 100_000)
  if (piecesMin !== null && piecesMax !== null && piecesMin > piecesMax) [piecesMin, piecesMax] = [piecesMax, piecesMin]
  const view = read(params, 'view')
  const sort = read(params, 'sort') as SetSort | null
  const inStock = read(params, 'in_stock')
  // `on_sale` і `official` вимагають пропозиції в наявності, тому з передзамовленням не поєднуються.
  const preorder = !section.onSale && readFlag(params, 'preorder')
  return {
    mode,
    q: (read(params, 'q') ?? read(params, 'search'))?.slice(0, 100) ?? null,
    theme: read(params, 'theme'),
    shop: read(params, 'shop'),
    sort,
    yearFrom,
    yearTo,
    age: readInt(params, 'age', 1, 1200),
    piecesMin,
    piecesMax,
    inStock: inStock === 'false' ? false : null,
    preorder,
    onSale: section.onSale ?? (!preorder && readFlag(params, 'on_sale')),
    official: !preorder && readFlag(params, 'official'),
    newest: section.newest ?? readFlag(params, 'newest'),
    specialized: readFlag(params, 'specialized'),
    view: view === 'grid' || view === 'list' ? view : null,
    page: readInt(params, 'page', 1, MAX_PAGE) ?? 1,
  }
}

/** Параметри адреси без порожніх значень і без того, що задає сам розділ; сторінка скидається. */
export function queryParams(filters: CatalogFilters, section: CatalogSection, changes: Partial<CatalogFilters> = {}): URLSearchParams {
  const next: CatalogFilters = { ...filters, page: 1, ...changes }
  const sale = next.mode === 'sale'
  const newest = next.newest && !sale
  const sortDefault = defaultSort({ mode: next.mode, newest }, section)
  const sort = next.sort && Object.hasOwn(sortOptions({ mode: next.mode, newest }), next.sort) && next.sort !== sortDefault ? next.sort : null
  const entries: [string, string | number | null | false][] = [
    ['q', next.q],
    ['mode', section.mode || next.mode === (section.defaultMode ?? 'sale') ? null : next.mode],
    ['theme', next.theme],
    ['shop', sale ? next.shop : null],
    ['year_from', next.yearFrom],
    ['year_to', next.yearTo],
    ['age', next.age],
    ['pieces_min', next.piecesMin],
    ['pieces_max', next.piecesMax],
    ['in_stock', sale && next.inStock === false ? 'false' : null],
    ['preorder', sale && next.preorder ? 'true' : null],
    ['on_sale', !section.onSale && sale && next.onSale ? 'true' : null],
    ['official', sale && next.official ? 'true' : null],
    ['newest', !section.newest && newest ? 'true' : null],
    ['specialized', next.specialized ? 'true' : null],
    ['sort', sort],
    ['view', next.view],
    ['page', next.page > 1 ? next.page : null],
  ]
  const params = new URLSearchParams()
  for (const [name, value] of entries) {
    if (value !== null && value !== false && value !== '') params.set(name, String(value))
  }
  return params
}

export function catalogHref(filters: CatalogFilters, section: CatalogSection, changes: Partial<CatalogFilters> = {}): string {
  const query = queryParams(filters, section, changes).toString()
  return query ? `${section.path}?${query}` : section.path
}

/** Той самий режим, пошук, порядок і вигляд без фільтрів. */
export function resetHref(filters: CatalogFilters, section: CatalogSection): string {
  return catalogHref(filters, section, {
    theme: null,
    shop: null,
    yearFrom: null,
    yearTo: null,
    age: null,
    piecesMin: null,
    piecesMax: null,
    inStock: null,
    preorder: false,
    onSale: section.onSale ?? false,
    official: false,
    newest: section.newest ?? false,
    specialized: false,
  })
}

export function yearLabel(filters: CatalogFilters): string | null {
  const { yearFrom, yearTo } = filters
  if (yearFrom && yearTo) return yearFrom === yearTo ? String(yearFrom) : `${yearFrom}–${yearTo}`
  if (yearFrom) return `Від ${yearFrom}`
  if (yearTo) return `До ${yearTo}`
  return null
}

export function piecesLabel(filters: CatalogFilters): string | null {
  const { piecesMin, piecesMax } = filters
  if (piecesMin !== null && piecesMax !== null) return `${piecesMin}–${piecesMax} дет.`
  if (piecesMin !== null) return `Від ${piecesMin} дет.`
  if (piecesMax !== null) return `До ${piecesMax} дет.`
  return null
}

export function ageLabel(filters: CatalogFilters): string | null {
  return AGE_MARKS.find((mark) => mark.months === filters.age)?.label ?? null
}

export interface ActiveFilter {
  label: string
  href: string
}

/** Застосовані фільтри з адресою без кожного; пошуковий текст і умови розділу не фільтри. */
export function activeFilters(
  filters: CatalogFilters,
  section: CatalogSection,
  names: { theme?: string | null; shop?: string | null },
): ActiveFilter[] {
  const sale = isSale(filters)
  const candidates: [string | null, Partial<CatalogFilters>][] = [
    [!section.newest && isNewest(filters) ? 'Новинки' : null, { newest: false }],
    [filters.theme ? (names.theme ?? 'Тема') : null, { theme: null }],
    [sale && filters.shop ? (names.shop ?? 'Магазин') : null, { shop: null }],
    [sale && filters.inStock === false ? 'Без наявності' : null, { inStock: null }],
    [sale && filters.preorder ? 'Передзамовлення' : null, { preorder: false }],
    [!section.onSale && sale && filters.onSale ? 'Зі знижкою' : null, { onSale: false }],
    [sale && filters.official ? 'Офіційний продавець' : null, { official: false }],
    [yearLabel(filters), { yearFrom: null, yearTo: null }],
    [ageLabel(filters), { age: null }],
    [piecesLabel(filters), { piecesMin: null, piecesMax: null }],
    [filters.specialized ? 'Спеціальні набори' : null, { specialized: false }],
  ]
  return candidates
    .filter((candidate): candidate is [string, Partial<CatalogFilters>] => Boolean(candidate[0]))
    .map(([label, changes]) => ({ label, href: catalogHref(filters, section, changes) }))
}

/** Номер набору з тексту: 3–7 цифр і необов'язковий варіант через дефіс. */
export function setNumberFromText(text: string): string | null {
  const compact = text.replace(/\s+/g, '')
  return /^[0-9]{3,7}(-[0-9]{1,2})?$/.test(compact) ? compact : null
}

/** Запит до API: текст-номер шукається за номером; роздрібні умови — лише в режимі продажу. */
export function apiQuery(
  filters: CatalogFilters,
  section: CatalogSection,
  ids: { themeId?: string | null; shopId?: string | null },
  limit: number = PAGE_SIZE,
): Record<string, string | number | boolean | null> {
  const sale = isSale(filters)
  const number = filters.q ? setNumberFromText(filters.q) : null
  return {
    number,
    search: number ? null : filters.q,
    theme_id: ids.themeId ?? null,
    age_mark_months: filters.age,
    year_from: filters.yearFrom,
    year_to: filters.yearTo,
    pieces_min: filters.piecesMin,
    pieces_max: filters.piecesMax,
    released_from: isNewest(filters) ? isoDateDaysAgo(NEWEST_WINDOW_DAYS) : null,
    include_specialized: filters.specialized ? true : null,
    in_stock: effectiveInStock(filters) ? true : null,
    preorder: sale && filters.preorder ? true : null,
    official: sale && filters.official ? true : null,
    on_sale: sale && filters.onSale ? true : null,
    shop_id: sale ? (ids.shopId ?? null) : null,
    sort: effectiveSort(filters, section),
    limit,
    offset: (filters.page - 1) * limit,
  }
}

export function hint(filters: CatalogFilters): string {
  return isNewest(filters) ? NEWEST_HINT : MODE_HINTS[filters.mode]
}

export const SECTIONS = { catalog: CATALOG, new: NEWEST, deals: DEALS, search: SEARCH } as const
export type SectionKey = keyof typeof SECTIONS

/** Кількість застосованих фільтрів для кнопки на телефоні. */
export function filtersCount(filters: CatalogFilters, section: CatalogSection): number {
  return activeFilters(filters, section, {}).length
}

export type FilterIds = { themeId: string | null; shopId: string | null }

/**
 * Ідентифікатори теми й магазину з адреси. `missing` — такої теми чи магазину немає (порожній список),
 * `failed` — довідник не завантажився, тож запит без фільтра показав би чужі набори.
 */
export function filterIds(filters: CatalogFilters, themes: Theme[] | null, shops: RetailShop[] | null): FilterIds | 'missing' | 'failed' {
  const shop = isSale(filters) ? filters.shop : null
  if ((filters.theme && !themes) || (shop && !shops)) return 'failed'
  const themeId = filters.theme ? (themes?.find((theme) => theme.slug === filters.theme)?.id ?? null) : null
  const shopId = shop ? (shops?.find((item) => item.slug === shop)?.id ?? null) : null
  if ((filters.theme && !themeId) || (shop && !shopId)) return 'missing'
  return { themeId, shopId }
}
