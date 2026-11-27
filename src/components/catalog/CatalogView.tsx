import Link from 'next/link'

import { AlertIcon, BagIcon, ChevronRight, CloseIcon, GridIcon, ListIcon, SearchIcon } from '@/components/icons'
import { TrackView } from '@/components/platform/Analytics'
import { countBucket, queryShape } from '@/lib/analytics'
import { JsonLd } from '@/components/seo/JsonLd'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { EmptyState } from '@/components/ui/EmptyState'
import { Photo } from '@/components/ui/Photo'
import { SearchField } from '@/components/ui/SearchField'
import { findSets, listBuildingLines, listShops, listThemes } from '@/lib/api/catalog'
import type { BuildingLine, Page, RetailShop, SetItem, Theme } from '@/lib/api/types'
import {
  activeFilters,
  API_MAX_OFFSET,
  apiQuery,
  type CatalogFilters,
  type CatalogMode,
  catalogHref,
  effectiveSort,
  filterIds,
  filtersCount,
  isNewest,
  isSale,
  MAX_PAGE,
  MODE_LABELS,
  PAGE_SIZE,
  queryParams,
  resetHref,
  type SectionKey,
  SECTIONS,
  sortOptions,
} from '@/lib/catalog/filters'
import { matchTheme } from '@/lib/catalog/themes'
import { setCount } from '@/lib/format'
import { themePath } from '@/lib/routes'
import { safe } from '@/lib/safe'
import { MiniCatalog } from '@/components/mini/MiniCatalog'
import { MiniSearch } from '@/components/mini/MiniSearch'
import { itemListSchema, type Crumb } from '@/lib/seo'

import type { FilterOption } from './FiltersPanel'
import { FiltersPanel } from './FiltersPanel'
import { LoadMore } from './LoadMore'
import { MobileFilters } from './MobileFilters'
import { Pagination } from './Pagination'
import type { TileContext } from './SetTile'
import { SetTiles } from './SetTiles'
import { SortSelect } from './SortSelect'

interface CatalogViewProps {
  sectionKey: SectionKey
  filters: CatalogFilters
  title: string
  hint: string
  crumbs: Crumb[]
  /** Перемикач «Усі набори | Є в продажу» біля заголовка. */
  modes?: boolean
}

export interface CatalogData {
  page: Page<SetItem> | null
  themes: Theme[]
  shops: RetailShop[]
  lines: BuildingLine[]
}

export async function loadCatalog(sectionKey: SectionKey, filters: CatalogFilters): Promise<CatalogData> {
  const section = SECTIONS[sectionKey]
  const sale = isSale(filters)
  const [themes, shops, lines] = await Promise.all([
    safe(listThemes()),
    sale ? safe(listShops()) : Promise.resolve([]),
    safe(listBuildingLines()),
  ])
  const ids = filterIds(filters, themes, shops)
  const offset = (filters.page - 1) * PAGE_SIZE
  const empty = { items: [], total: 0, limit: PAGE_SIZE, offset }
  const page =
    ids === 'failed'
      ? null
      : ids === 'missing' || offset > API_MAX_OFFSET
        ? empty
        : await safe(findSets(apiQuery(filters, section, ids), sale))
  return { page, themes: themes ?? [], shops: shops ?? [], lines: lines ?? [] }
}

/** Теми для фільтра; однакові назви розрізняє назва батьківської теми. */
function themeOptions(themes: Theme[]): FilterOption[] {
  const byId = new Map(themes.map((theme) => [theme.id, theme]))
  const named = new Map<string, number>()
  for (const theme of themes) if (theme.set_count > 0) named.set(theme.name, (named.get(theme.name) ?? 0) + 1)
  const label = (theme: Theme) => {
    const parent = theme.parent_id ? byId.get(theme.parent_id) : undefined
    return (named.get(theme.name) ?? 0) > 1 && parent ? `${theme.name} · ${parent.name}` : theme.name
  }
  return themes
    .filter((theme) => theme.set_count > 0)
    .sort(
      (a, b) =>
        Number(Boolean(a.parent_id)) - Number(Boolean(b.parent_id)) ||
        Number(b.is_current) - Number(a.is_current) ||
        b.set_count - a.set_count,
    )
    .map((theme) => ({ slug: theme.slug, name: label(theme), count: theme.set_count }))
}

function shopOptions(shops: RetailShop[]): FilterOption[] {
  return [...shops]
    .sort((a, b) => b.in_stock_sets_count - a.in_stock_sets_count || a.name.localeCompare(b.name, 'uk'))
    .map((shop) => ({ slug: shop.slug, name: shop.name, count: shop.in_stock_sets_count }))
}

function lineOptions(lines: BuildingLine[]): FilterOption[] {
  return lines.map((line) => ({ slug: line.id, name: line.name, count: line.set_count }))
}

const MODE_ICONS: Record<CatalogMode, typeof GridIcon> = { all: GridIcon, sale: BagIcon }

export async function CatalogView({ sectionKey, filters, title, hint, crumbs, modes }: CatalogViewProps) {
  const section = SECTIONS[sectionKey]
  const { page, themes, shops, lines } = await loadCatalog(sectionKey, filters)
  const sale = isSale(filters)
  const context: TileContext = sale ? 'sale' : isNewest(filters) ? 'newest' : 'all'
  const sort = effectiveSort(filters, section)
  const total = page?.total ?? 0
  const pages = Math.min(Math.ceil(total / PAGE_SIZE), MAX_PAGE)
  const view = filters.view ?? 'auto'
  const themeOpts = themeOptions(themes)
  const shopOpts = shopOptions(shops)
  const lineOpts = lineOptions(lines)
  const names = {
    theme: themes.find((theme) => theme.slug === filters.theme)?.name ?? null,
    shop: shops.find((shop) => shop.slug === filters.shop)?.name ?? null,
    line: lines.find((line) => line.id === filters.line)?.name ?? null,
  }
  const chips = activeFilters(filters, section, names)
  const suggestedTheme = sectionKey === 'search' && filters.q && filters.page === 1 ? matchTheme(themes, filters.q) : null
  const query = queryParams(filters, section, { page: filters.page }).toString()
  const olderHref = isNewest(filters) ? catalogHref(filters, SECTIONS.catalog, { newest: false, page: 1 }) : null

  return (
    <>
      {page ? null : <TrackView event="error_shown" properties={{ error_code: 'catalog_unavailable', route_group: sectionKey }} />}
      <div className="m-only">
        {sectionKey === 'search' ? (
          <MiniSearch filters={filters} initial={page && filters.page === 1 ? { theme: suggestedTheme, items: page.items, total } : null} chips={chips} />
        ) : (
          <MiniCatalog sectionKey={sectionKey} section={section} filters={filters} page={page} themes={themes} shops={shops} lines={lines} />
        )}
      </div>
      <div className="wrap d-only">
      <Breadcrumbs items={crumbs} />
      <div className="page-head">
        <h1>{title}</h1>
        {modes ? (
          <nav className="seg" aria-label="Режим каталогу">
            {(['all', 'sale'] as const).map((mode) => {
              const Icon = MODE_ICONS[mode]
              return (
                <Link
                  key={mode}
                  href={catalogHref(filters, section, { mode })}
                  aria-current={filters.mode === mode ? 'page' : undefined}
                  scroll={false}
                  data-track={filters.mode === mode ? undefined : 'catalog_mode_change'}
                  data-track-from={filters.mode}
                  data-track-to={mode}
                >
                  <Icon size={16} />
                  {MODE_LABELS[mode]}
                </Link>
              )
            })}
          </nav>
        ) : null}
      </div>
      <p className="page-hint">{hint}</p>
      {sectionKey === 'search' && page ? (
        <TrackView
          event="search_results_viewed"
          properties={{ ...queryShape(filters.q), result_bucket: countBucket(total), mode: filters.mode, page: filters.page }}
        />
      ) : null}
      {sectionKey === 'search' ? <SearchField defaultValue={filters.q} className="mobile-search hide-desktop" /> : null}

      <div className="catalog">
        <aside className="catalog__side hide-mobile" aria-label="Фільтри">
          <FiltersPanel filters={filters} section={section} themes={themeOpts} shops={shopOpts} lines={lineOpts} variant="live" />
        </aside>

        <div className="catalog__main">
          <div className="toolbar">
            <p className="toolbar__count num" aria-live="polite">
              {page ? setCount(total) : ''}
            </p>
            <div className="toolbar__tools">
              <span className="hide-desktop">
                <MobileFilters
                  filters={filters}
                  section={section}
                  themes={themeOpts}
                  shops={shopOpts}
                  lines={lineOpts}
                  active={filtersCount(filters, section)}
                />
              </span>
              <SortSelect filters={filters} section={section} value={sort} options={sortOptions(filters)} />
              <nav className="views" aria-label="Вигляд">
                <Link
                  href={catalogHref(filters, section, { view: 'list', page: filters.page })}
                  aria-current={view === 'list' ? 'page' : undefined}
                  scroll={false}
                  aria-label="Список"
                >
                  <ListIcon size={16} />
                  <span className="hide-mobile">Список</span>
                </Link>
                <Link
                  href={catalogHref(filters, section, { view: 'grid', page: filters.page })}
                  aria-current={view === 'grid' ? 'page' : undefined}
                  scroll={false}
                  aria-label="Сітка"
                >
                  <GridIcon size={16} />
                  <span className="hide-mobile">Сітка</span>
                </Link>
              </nav>
            </div>
          </div>

          {chips.length ? (
            <ul className="chips hide-desktop">
              {chips.map((chip) => (
                <li key={chip.label}>
                  <Link className="chip" href={chip.href} scroll={false}>
                    {chip.label}
                    <CloseIcon size={10} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}

          {suggestedTheme ? (
            <Link className="theme-hit" href={themePath(suggestedTheme)}>
              <Photo src={suggestedTheme.image?.thumb} className="theme-hit__photo" iconSize={20} />
              <span>
                <small>Тема</small>
                <b>{suggestedTheme.name}</b>
                <small className="num">{setCount(suggestedTheme.set_count)}</small>
              </span>
              <ChevronRight size={18} />
            </Link>
          ) : null}

          {!page ? (
            <EmptyState
              icon={<AlertIcon size={26} />}
              title="Не вдалося завантажити набори"
              text="Каталог тимчасово недоступний. Спробуйте оновити сторінку за хвилину."
            >
              <Link className="button button--primary" href={catalogHref(filters, section, { page: filters.page })}>
                Оновити
              </Link>
            </EmptyState>
          ) : page.items.length ? (
            <>
              <SetTiles sets={page.items} context={context} view={view} eagerCount={4} />
              <LoadMore
                key={`${sectionKey}?${query}#${filters.page}`}
                sectionKey={sectionKey}
                query={query}
                page={filters.page}
                pages={pages}
                context={context}
                view={view}
                end={
                  olderHref ? (
                    <p className="list-end">
                      {chips.length ? 'Це всі новинки з цими фільтрами.' : 'Це всі новинки.'}{' '}
                      <Link className="link" href={olderHref}>
                        Переглянути старіші набори
                        <ChevronRight size={14} />
                      </Link>
                    </p>
                  ) : null
                }
              />
              <Pagination page={filters.page} pages={pages} href={(value) => catalogHref(filters, section, { page: value })} />
              <JsonLd data={itemListSchema(page.items, page.offset)} />
            </>
          ) : filters.page > 1 && total > 0 ? (
            <EmptyState title="Цієї сторінки немає" text="Наборів менше, ніж сторінок у посиланні.">
              <Link className="button button--primary" href={catalogHref(filters, section, { page: 1 })}>
                До першої сторінки
              </Link>
            </EmptyState>
          ) : chips.length ? (
            <EmptyState icon={<SearchIcon size={26} />} title="З такими фільтрами наборів немає" text="Приберіть один із фільтрів або скиньте всі.">
              <ul className="chips chips--center">
                {chips.map((chip) => (
                  <li key={chip.label}>
                    <Link className="chip" href={chip.href} scroll={false}>
                      {chip.label}
                      <CloseIcon size={10} />
                    </Link>
                  </li>
                ))}
              </ul>
              <Link className="button button--primary" href={resetHref(filters, section)} scroll={false}>
                Скинути всі фільтри
              </Link>
              {olderHref ? (
                <Link className="link list-end__link" href={olderHref}>
                  Шукати серед старіших наборів
                  <ChevronRight size={14} />
                </Link>
              ) : null}
            </EmptyState>
          ) : filters.q ? (
            <EmptyState
              icon={<SearchIcon size={26} />}
              title={`За «${filters.q}» нічого не знайшли`}
              text={sale ? 'Можливо, цього набору зараз немає в продажу. Пошукайте серед усіх наборів.' : 'Перевірте написання або спробуйте номер набору.'}
            >
              {sale ? (
                <Link className="button button--primary" href={catalogHref(filters, section, { mode: 'all' })}>
                  Шукати серед усіх наборів
                </Link>
              ) : (
                <Link className="button button--surface" href="/themes">
                  Переглянути теми
                </Link>
              )}
            </EmptyState>
          ) : (
            <EmptyState title="Тут поки порожньо" text="Наборів для цього розділу зараз немає." />
          )}
        </div>
      </div>
    </div>
    </>
  )
}
