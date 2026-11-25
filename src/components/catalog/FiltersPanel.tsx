'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import { CheckIcon, ChevronDown, CloseIcon, SearchIcon } from '@/components/icons'
import {
  activeFilters,
  AGE_MARKS,
  type CatalogFilters,
  type CatalogSection,
  catalogHref,
  effectiveInStock,
  isSale,
  PIECES_RANGES,
  queryParams,
  resetHref,
} from '@/lib/catalog/filters'
import { track } from '@/lib/analytics'
import { plural, setCount } from '@/lib/format'

export interface FilterOption {
  slug: string
  name: string
  count: number
}

interface FiltersPanelProps {
  filters: CatalogFilters
  section: CatalogSection
  themes: FilterOption[]
  shops: FilterOption[]
  variant: 'live' | 'draft'
  onDone?: () => void
}

const SHOWN_SHOPS = 4
const SHOWN_THEMES = 4

function Group({ title, open = true, children }: { title: string; open?: boolean; children: React.ReactNode }) {
  return (
    <details className="fgroup" open={open}>
      <summary>
        {title}
        <ChevronDown size={16} />
      </summary>
      <div className="fgroup__body">{children}</div>
    </details>
  )
}

function Check({ checked, label, onChange }: { checked: boolean; label: string; onChange: (value: boolean) => void }) {
  return (
    <label className="fcheck">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span className="fcheck__box" aria-hidden="true">
        <CheckIcon />
      </span>
      {label}
    </label>
  )
}

function Radio({ name, checked, label, onChange }: { name: string; checked: boolean; label: string; onChange: () => void }) {
  return (
    <label className="fradio">
      <input type="radio" name={name} checked={checked} onChange={onChange} />
      <span className="fradio__dot" aria-hidden="true" />
      {label}
    </label>
  )
}

function parseYear(text: string): number | null {
  const value = Number(text)
  return /^\d{4}$/.test(text) && value >= 1949 && value <= 2100 ? value : null
}

/** Фільтри каталогу: на комп'ютері застосовуються одразу, на телефоні — чернетка й кнопка з кількістю. */
export function FiltersPanel({ filters, section, themes, shops, variant, onDone }: FiltersPanelProps) {
  const router = useRouter()
  const live = variant === 'live'
  const [draft, setDraft] = useState(filters)
  const current = live ? filters : draft
  const sale = isSale(current)
  const [themeQuery, setThemeQuery] = useState('')
  const [allThemes, setAllThemes] = useState(false)
  const [allShops, setAllShops] = useState(false)
  const [yearFrom, setYearFrom] = useState(current.yearFrom ? String(current.yearFrom) : '')
  const [yearTo, setYearTo] = useState(current.yearTo ? String(current.yearTo) : '')
  const [count, setCountValue] = useState<number | null>(null)

  const [synced, setSynced] = useState(filters)
  if (synced !== filters) {
    setSynced(filters)
    setDraft(filters)
    setYearFrom(filters.yearFrom ? String(filters.yearFrom) : '')
    setYearTo(filters.yearTo ? String(filters.yearTo) : '')
  }

  const apply = (changes: Partial<CatalogFilters>) => {
    if (live) track('filters_applied', { section: section.path, changed: Object.keys(changes).join(','), variant })
    if (live) router.push(catalogHref(filters, section, changes), { scroll: false })
    else setDraft((value) => ({ ...value, ...changes, page: 1 }))
  }

  useEffect(() => {
    if (live) return
    const controller = new AbortController()
    const params = queryParams(draft, section)
    params.set('mode', draft.mode)
    if (draft.newest) params.set('newest', 'true')
    if (draft.onSale) params.set('on_sale', 'true')
    params.delete('page')
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/count?${params}`, { signal: controller.signal })
        const body = (await response.json()) as { total?: number }
        setCountValue(typeof body.total === 'number' ? body.total : null)
      } catch {
        if (!controller.signal.aborted) setCountValue(null)
      }
    }, 200)
    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [draft, live, section])

  const themeName = themes.find((theme) => theme.slug === current.theme)?.name ?? null
  const shopName = shops.find((shop) => shop.slug === current.shop)?.name ?? null
  const chips = live ? activeFilters(filters, section, { theme: themeName, shop: shopName }) : []

  const visibleThemes = useMemo(() => {
    const needle = themeQuery.trim().toLocaleLowerCase('uk')
    if (needle) return themes.filter((theme) => theme.name.toLocaleLowerCase('uk').includes(needle)).slice(0, 30)
    const list = allThemes ? themes : themes.slice(0, SHOWN_THEMES)
    const selected = themes.find((theme) => theme.slug === current.theme)
    return selected && !list.includes(selected) ? [...list, selected] : list
  }, [themes, themeQuery, allThemes, current.theme])

  const visibleShops = allShops ? shops : shops.slice(0, SHOWN_SHOPS)
  const hiddenShops = shops.length - SHOWN_SHOPS
  const piecesOpen = current.piecesMin !== null || current.piecesMax !== null

  const commitYears = () => {
    let from = parseYear(yearFrom)
    let to = parseYear(yearTo)
    if (from && to && from > to) [from, to] = [to, from]
    if (from !== current.yearFrom || to !== current.yearTo) apply({ yearFrom: from, yearTo: to })
  }

  const reset = () => {
    if (live) router.push(resetHref(filters, section), { scroll: false })
    else {
      setDraft({
        ...draft,
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
      setYearFrom('')
      setYearTo('')
    }
  }

  return (
    <div className={`filters filters--${variant}`}>
      <div className="filters__head">
        <h2>Фільтри</h2>
        <button type="button" className="filters__reset" onClick={reset}>
          Скинути все
        </button>
      </div>

      {chips.length ? (
        <ul className="chips">
          {chips.map((chip) => (
            <li key={chip.label}>
              <Link className="chip" href={chip.href} scroll={false}>
                {chip.label}
                <CloseIcon size={10} />
                <span className="visually-hidden">: прибрати</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      {sale ? (
        <Group title="Наявність">
          <Check checked={effectiveInStock(current)} label="У наявності" onChange={(value) => apply(value ? { inStock: null, preorder: false } : { inStock: false })} />
          <Check checked={current.preorder} label="Передзамовлення" onChange={(value) => apply({ preorder: value })} />
        </Group>
      ) : null}

      {sale ? (
        <Group title="Пропозиції">
          {section.onSale ? null : (
            <Check checked={current.onSale} label="Зі знижкою" onChange={(value) => apply({ onSale: value })} />
          )}
          <Check checked={current.official} label="Офіційний продавець" onChange={(value) => apply({ official: value })} />
        </Group>
      ) : null}

      {!sale && !section.newest ? (
        <Group title="Вихід">
          <Check checked={current.newest} label="Новинки" onChange={(value) => apply({ newest: value })} />
        </Group>
      ) : null}

      {sale && shops.length ? (
        <Group title="Магазин">
          <Radio name={`${variant}-shop`} checked={!current.shop} label="Усі магазини" onChange={() => apply({ shop: null })} />
          {visibleShops.map((shop) => (
            <Radio
              key={shop.slug}
              name={`${variant}-shop`}
              checked={current.shop === shop.slug}
              label={shop.name}
              onChange={() => apply({ shop: shop.slug })}
            />
          ))}
          {hiddenShops > 0 ? (
            <button type="button" className="filters__more" onClick={() => setAllShops((value) => !value)}>
              {allShops ? 'Згорнути' : `Ще ${hiddenShops} ${plural(hiddenShops, 'магазин', 'магазини', 'магазинів')}`}
            </button>
          ) : null}
        </Group>
      ) : null}

      {themes.length ? (
        <Group title="Тема">
          <label className="ffield">
            <SearchIcon size={15} />
            <span className="visually-hidden">Назва теми</span>
            <input
              type="search"
              value={themeQuery}
              placeholder="Назва теми"
              autoComplete="off"
              onChange={(event) => setThemeQuery(event.target.value)}
            />
          </label>
          {themeQuery ? null : (
            <Radio name={`${variant}-theme`} checked={!current.theme} label="Усі теми" onChange={() => apply({ theme: null })} />
          )}
          {visibleThemes.map((theme) => (
            <Radio
              key={theme.slug}
              name={`${variant}-theme`}
              checked={current.theme === theme.slug}
              label={theme.name}
              onChange={() => apply({ theme: theme.slug })}
            />
          ))}
          {themeQuery && !visibleThemes.length ? <p className="filters__empty">Такої теми немає</p> : null}
          {!themeQuery && themes.length > SHOWN_THEMES ? (
            <button type="button" className="filters__more" onClick={() => setAllThemes((value) => !value)}>
              {allThemes ? 'Згорнути' : 'Усі теми'}
            </button>
          ) : null}
        </Group>
      ) : null}

      <Group title="Рік випуску">
        <div className="fyears">
          <label className="ffield ffield--plain">
            <span className="visually-hidden">Рік від</span>
            <input
              inputMode="numeric"
              maxLength={4}
              placeholder="Від"
              value={yearFrom}
              onChange={(event) => {
                setYearFrom(event.target.value.replace(/\D/g, ''))
                if (!live) setDraft((value) => ({ ...value, yearFrom: parseYear(event.target.value) }))
              }}
              onBlur={live ? commitYears : undefined}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && live) commitYears()
              }}
            />
          </label>
          <label className="ffield ffield--plain">
            <span className="visually-hidden">Рік до</span>
            <input
              inputMode="numeric"
              maxLength={4}
              placeholder="До"
              value={yearTo}
              onChange={(event) => {
                setYearTo(event.target.value.replace(/\D/g, ''))
                if (!live) setDraft((value) => ({ ...value, yearTo: parseYear(event.target.value) }))
              }}
              onBlur={live ? commitYears : undefined}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && live) commitYears()
              }}
            />
          </label>
        </div>
      </Group>

      <Group title="Вік на коробці">
        <div className="fages">
          <button type="button" className="fage" aria-pressed={current.age === null} onClick={() => apply({ age: null })}>
            Будь-який
          </button>
          {AGE_MARKS.filter((mark) => mark.months >= 48).map((mark) => (
            <button
              key={mark.months}
              type="button"
              className="fage num"
              aria-pressed={current.age === mark.months}
              onClick={() => apply({ age: current.age === mark.months ? null : mark.months })}
            >
              {mark.label}
            </button>
          ))}
        </div>
      </Group>

      <Group title="Кількість деталей" open={piecesOpen}>
        <Radio
          name={`${variant}-pieces`}
          checked={current.piecesMin === null && current.piecesMax === null}
          label="Будь-яка"
          onChange={() => apply({ piecesMin: null, piecesMax: null })}
        />
        {PIECES_RANGES.map((range) => (
          <Radio
            key={range.label}
            name={`${variant}-pieces`}
            checked={current.piecesMin === range.min && current.piecesMax === range.max}
            label={range.label}
            onChange={() => apply({ piecesMin: range.min, piecesMax: range.max })}
          />
        ))}
      </Group>

      <Group title="Інше" open={current.specialized}>
        <Check
          checked={current.specialized}
          label="Спеціальні набори"
          onChange={(value) => apply({ specialized: value })}
        />
        <p className="filters__note">Полібеги, промо, журнальні й ексклюзиви заходів</p>
      </Group>

      {live ? null : (
        <div className="filters__foot">
          <button
            type="button"
            className="button button--primary"
            onClick={() => {
              track('filters_applied', { section: section.path, variant, total: count })
              router.push(catalogHref(draft, section, {}), { scroll: false })
              onDone?.()
            }}
          >
            {count === null ? 'Показати набори' : count ? `Показати ${setCount(count)}` : 'Наборів немає'}
          </button>
        </div>
      )}
    </div>
  )
}

