import Link from 'next/link'

import type { BuildingLine, Page, RetailShop, SetItem, Theme } from '@/lib/api/types'
import {
  activeFilters,
  AGE_MARKS,
  ageLabel,
  CATALOG,
  type CatalogFilters,
  type CatalogSection,
  catalogHref,
  effectiveInStock,
  effectiveSort,
  filtersCount,
  MAX_PAGE,
  MODE_HINTS,
  MODE_LABELS,
  NEWEST_HINT,
  PAGE_SIZE,
  queryParams,
  resetHref,
  type SectionKey,
  yearLabel,
} from '@/lib/catalog/filters'
import { currentYear, plural } from '@/lib/format'

import { Caret, GridGlyph, ListGlyph, ModeIcon, SearchGlyph, SortGlyph, StateIcon, XIcon } from './icons'
import { MiniFilters, type MiniOption } from './MiniFilters'
import { MiniLoadMore } from './MiniLoadMore'
import { NavSelect } from './NavSelect'
import { CatalogRow, type RowContext } from './SetRows'

const SORT_LABELS = {
  all: { year_desc: 'Новіші', year_asc: 'Старіші', name_asc: 'За назвою' },
  sale: {
    price_asc: 'Дешевші',
    price_desc: 'Дорожчі',
    discount_desc: 'Знижка',
    year_desc: 'Новіші',
    year_asc: 'Старіші',
    name_asc: 'За назвою',
  },
  newest: { release_desc: 'Новіші', name_asc: 'За назвою' },
} as const

const YEAR_OPTIONS = 30

interface MiniCatalogProps {
  sectionKey: SectionKey
  section: CatalogSection
  filters: CatalogFilters
  page: Page<SetItem> | null
  themes: Theme[]
  shops: RetailShop[]
  lines: BuildingLine[]
}

/** Розділ як прапорці фільтрів: новинки й знижки в Mini App — фільтри одного каталогу. */
function asCatalog(filters: CatalogFilters, section: CatalogSection): CatalogFilters {
  return {
    ...filters,
    mode: section.mode ?? filters.mode,
    newest: filters.newest || Boolean(section.newest),
    onSale: filters.onSale || Boolean(section.onSale),
    sort: filters.sort ?? (section.defaultSort && section.defaultSort !== 'price_asc' ? section.defaultSort : null),
  }
}

export function rootThemeOptions(themes: Theme[], current: string | null): MiniOption[] {
  const roots = themes.filter((theme) => !theme.parent_id && theme.set_count > 0).sort((a, b) => a.name.localeCompare(b.name, 'uk'))
  const selected = current ? themes.find((theme) => theme.slug === current) : undefined
  const options = roots.map((theme) => ({
    slug: theme.slug,
    name: theme.name,
  }))
  return selected?.parent_id ? [{ slug: selected.slug, name: selected.name }, ...options] : options
}

export function shopOptions(shops: RetailShop[]): MiniOption[] {
  return [...shops].sort((a, b) => a.name.localeCompare(b.name, 'uk')).map((shop) => ({ slug: shop.slug, name: shop.name }))
}

/** Каталог Mini App: режими, швидкі чипи, рядок порядку й список наборів. */
export function MiniCatalog({ sectionKey, section, filters: raw, page, themes, shops, lines }: MiniCatalogProps) {
  const filters = asCatalog(raw, section)
  const sale = filters.mode === 'sale'
  const newest = filters.newest && !sale
  const href = (changes: Partial<CatalogFilters>) => catalogHref(filters, CATALOG, changes)
  const sorts: Record<string, string> = newest ? SORT_LABELS.newest : SORT_LABELS[filters.mode]
  const sort = effectiveSort(filters, CATALOG)
  const sortKey: string = Object.hasOwn(sorts, sort) ? sort : (Object.keys(sorts)[0] ?? sort)
  const grid = filters.view === 'grid'
  const theme = filters.theme ? themes.find((item) => item.slug === filters.theme) : undefined
  const shop = filters.shop ? shops.find((item) => item.slug === filters.shop) : undefined
  const names = {
    theme: theme?.name ?? null,
    shop: shop?.name ?? null,
    line: lines.find((item) => item.id === filters.line)?.name ?? null,
  }
  const chips = activeFilters(filters, CATALOG, names)
  const total = page?.total ?? 0
  const pages = Math.min(Math.ceil(total / PAGE_SIZE), MAX_PAGE)
  const context: RowContext = { sale, onSale: filters.onSale, newest }
  const year = currentYear()
  const years = Array.from({ length: YEAR_OPTIONS }, (_, index) => year + 1 - index)
  const yearText = yearLabel(filters)
  const ageText = ageLabel(filters)
  const inStock = effectiveInStock(filters)
  const query = queryParams(filters, CATALOG, {
    page: filters.page,
  }).toString()
  const searchHref = filters.q ? `/search?q=${encodeURIComponent(filters.q)}` : '/search'

  return (
    <div className="c-cat">
      <header className="c-cat__top">
        <h1 className="c-cat__title">Каталог</h1>
        <Link className="c-pill" href={searchHref}>
          <SearchGlyph />
          Пошук
        </Link>
      </header>

      <nav className="c-modes" aria-label="Режим каталогу">
        {(['all', 'sale'] as const).map((mode) => (
          <Link
            key={mode}
            className={`c-modes__item${mode === filters.mode ? ' is-selected' : ''}`}
            href={href({ mode })}
            replace
            scroll={false}
            aria-current={mode === filters.mode ? 'true' : undefined}
            data-track={mode === filters.mode ? undefined : 'catalog_mode_change'}
            data-track-from={filters.mode}
            data-track-to={mode}
          >
            <ModeIcon mode={mode} />
            {MODE_LABELS[mode]}
          </Link>
        ))}
      </nav>
      <p className="c-cat__hint">{newest ? NEWEST_HINT : MODE_HINTS[filters.mode]}</p>

      <div className="c-fchips">
        <MiniFilters
          filters={filters}
          section={CATALOG}
          themes={rootThemeOptions(themes, filters.theme)}
          shops={shopOptions(shops)}
          lines={lines.map((line) => ({ slug: line.id, name: line.name }))}
          active={filtersCount(filters, CATALOG)}
          total={total}
        />
        {sale ? (
          <>
            <Link
              className={`c-fchip${inStock ? ' is-selected' : ''}`}
              href={href(inStock ? { inStock: false } : { inStock: null, preorder: false })}
              replace
              scroll={false}
              aria-pressed={inStock}
            >
              У наявності
            </Link>
            <Link
              className={`c-fchip${filters.onSale ? ' is-selected' : ''}`}
              href={href(filters.onSale ? { onSale: false } : { onSale: true, preorder: false })}
              replace
              scroll={false}
              aria-pressed={filters.onSale}
            >
              Зі знижкою
            </Link>
            <label className={`c-fchip${shop ? ' is-selected' : ''}`}>
              <span>{shop?.name ?? 'Магазин'}</span>
              <Caret />
              <NavSelect
                className="c-fchip__select"
                label="Магазин"
                value={href({ shop: shop?.slug ?? null })}
                options={[
                  { href: href({ shop: null }), label: 'Будь-який магазин' },
                  ...shopOptions(shops).map((item) => ({
                    href: href({ shop: item.slug }),
                    label: item.name,
                  })),
                ]}
              />
            </label>
          </>
        ) : (
          <>
            {newest ? (
              <Link className="c-fchip c-fchip--remove is-selected" href={href({ newest: false })} replace scroll={false} aria-label="Прибрати новинки">
                Новинки
                <XIcon />
              </Link>
            ) : null}
            <label className={`c-fchip${yearText ? ' is-selected' : ''}`}>
              <span>{yearText ?? 'Рік'}</span>
              <Caret />
              <NavSelect
                className="c-fchip__select"
                label="Рік випуску"
                value={href({
                  yearFrom: filters.yearFrom,
                  yearTo: filters.yearTo,
                })}
                options={[
                  ...(yearText && !(filters.yearFrom && filters.yearFrom === filters.yearTo && years.includes(filters.yearFrom))
                    ? [{ href: href({}), label: yearText }]
                    : []),
                  {
                    href: href({ yearFrom: null, yearTo: null }),
                    label: 'Будь-який рік',
                  },
                  ...years.map((value) => ({
                    href: href({ yearFrom: value, yearTo: value }),
                    label: String(value),
                  })),
                ]}
              />
            </label>
            <label className={`c-fchip${ageText ? ' is-selected' : ''}`}>
              <span>{ageText ?? 'Вік'}</span>
              <Caret />
              <NavSelect
                className="c-fchip__select"
                label="Вік на коробці"
                value={href({ age: filters.age })}
                options={[
                  { href: href({ age: null }), label: 'Будь-який вік' },
                  ...AGE_MARKS.map((mark) => ({
                    href: href({ age: mark.months }),
                    label: mark.label,
                  })),
                ]}
              />
            </label>
            {theme ? (
              <Link
                className="c-fchip c-fchip--remove is-selected"
                href={href({ theme: null })}
                replace
                scroll={false}
                aria-label={`Прибрати тему ${theme.name}`}
              >
                {theme.name}
                <XIcon />
              </Link>
            ) : null}
          </>
        )}
        {filters.specialized ? (
          <Link
            className="c-fchip c-fchip--remove is-selected"
            href={href({ specialized: false })}
            replace
            scroll={false}
            aria-label="Прибрати спеціальні набори"
          >
            Спеціальні
            <XIcon />
          </Link>
        ) : null}
        {filters.q ? (
          <Link className="c-fchip c-fchip--remove is-selected" href={href({ q: null })} replace scroll={false} aria-label="Прибрати пошук">
            «{filters.q}»
            <XIcon />
          </Link>
        ) : null}
      </div>

      {!page ? (
        <section className="c-state">
          <span className="c-state__icon">
            <StateIcon kind="error" />
          </span>
          <h2 className="c-state__title">Не вдалося завантажити набори</h2>
          <p className="c-state__hint">Спробуйте оновити сторінку за хвилину.</p>
          <Link className="c-state__action" href={href({ page: filters.page })}>
            Оновити
          </Link>
        </section>
      ) : page.items.length ? (
        <>
          <div className="c-cat__bar">
            <label className="c-sort">
              <SortGlyph />
              <span>{sorts[sortKey]}</span>
              <NavSelect
                className="c-fchip__select"
                label="Порядок"
                value={href({ sort: sortKey as CatalogFilters['sort'] })}
                options={Object.entries(sorts).map(([value, label]) => ({
                  href: href({ sort: value as CatalogFilters['sort'] }),
                  label,
                  key: value,
                }))}
                event={{ name: 'catalog_sort_change', properties: { mode: filters.mode } }}
              />
            </label>
            <span className="c-cat__count">
              {total} {plural(total, 'набір', 'набори', 'наборів')}
            </span>
            <span className="c-views" role="group" aria-label="Вигляд списку">
              <Link
                className={`c-views__item${grid ? '' : ' is-selected'}`}
                href={href({ view: null, page: filters.page })}
                replace
                scroll={false}
                aria-label="Список"
                aria-pressed={!grid}
              >
                <ListGlyph />
              </Link>
              <Link
                className={`c-views__item${grid ? ' is-selected' : ''}`}
                href={href({ view: 'grid', page: filters.page })}
                replace
                scroll={false}
                aria-label="Сітка"
                aria-pressed={grid}
              >
                <GridGlyph size={18} width={2} />
              </Link>
            </span>
          </div>

          <div className={grid ? 'c-ugrid' : 'c-urows'}>
            {page.items.map((item, index) => (
              <CatalogRow key={item.id} item={item} context={context} grid={grid} eager={index < 4} />
            ))}
            <MiniLoadMore key={`${sectionKey}?${query}`} sectionKey="catalog" query={query} page={filters.page} pages={pages} context={context} grid={grid} />
          </div>
        </>
      ) : chips.length ? (
        <section className="c-state">
          <span className="c-state__icon">
            <StateIcon kind="filter" />
          </span>
          <h2 className="c-state__title">З такими фільтрами наборів немає</h2>
          <p className="c-state__hint">Приберіть один із фільтрів або скиньте всі.</p>
          <div className="c-state__chips">
            {chips.map((chip) => (
              <Link key={chip.label} className="c-fchip c-fchip--remove" href={chip.href} replace scroll={false} aria-label={`Прибрати фільтр ${chip.label}`}>
                {chip.label}
                <XIcon />
              </Link>
            ))}
          </div>
          <Link className="c-state__action" href={resetHref(filters, CATALOG)} replace scroll={false}>
            Скинути всі фільтри
          </Link>
        </section>
      ) : (
        <section className="c-state">
          <span className="c-state__icon">
            <StateIcon kind="search" />
          </span>
          <h2 className="c-state__title">{filters.q ? 'Нічого не знайдено за цим запитом' : 'Наборів поки немає'}</h2>
          {filters.q ? (
            <Link className="c-state__action" href={href({ q: null })} replace scroll={false}>
              Прибрати пошук
            </Link>
          ) : null}
        </section>
      )}
    </div>
  )
}
