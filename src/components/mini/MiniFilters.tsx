'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

import { AGE_MARKS, CATALOG, type CatalogFilters, type CatalogSection, catalogHref, effectiveInStock, queryParams } from '@/lib/catalog/filters'
import { plural } from '@/lib/format'

import { Chevron, FilterGlyph, XIcon } from './icons'
import { MiniSheet } from './MiniSheet'

export interface MiniOption {
  slug: string
  name: string
}

interface MiniFiltersProps {
  filters: CatalogFilters
  section: CatalogSection
  themes: MiniOption[]
  shops: MiniOption[]
  active: number
  total: number
}

const YEAR = { min: 1949, max: 2100 }
const PIECES = { min: 0, max: 100_000 }

type RangeError = 'order' | 'bounds' | null

function toNumber(text: string): number | null {
  return /^\d+$/.test(text.trim()) ? Number(text.trim()) : null
}

function rangeError(from: string, to: string, bounds: { min: number; max: number }): RangeError {
  const parse = (text: string) => (text.trim() ? toNumber(text) : null)
  const low = parse(from)
  const high = parse(to)
  const outside = (text: string, value: number | null) => Boolean(text.trim()) && (value === null || value < bounds.min || value > bounds.max)
  if (outside(from, low) || outside(to, high)) return 'bounds'
  if (low !== null && high !== null && low > high) return 'order'
  return null
}

function setCount(count: number): string {
  return `${count} ${plural(count, 'набір', 'набори', 'наборів')}`
}

const CLOSE_ICON = <XIcon size={14} />

/** Шторка фільтрів Mini App: зміни оновлюють лише кнопку з кількістю, «Показати» застосовує їх. */
export function MiniFilters({ filters, section, themes, shops, active, total }: MiniFiltersProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<CatalogFilters>(filters)
  const [years, setYears] = useState({
    from: filters.yearFrom?.toString() ?? '',
    to: filters.yearTo?.toString() ?? '',
  })
  const [pieces, setPieces] = useState({
    from: filters.piecesMin?.toString() ?? '',
    to: filters.piecesMax?.toString() ?? '',
  })
  const [count, setCountValue] = useState<number | null>(total)
  const sale = draft.mode === 'sale'

  const yearError = rangeError(years.from, years.to, YEAR)
  const piecesError = rangeError(pieces.from, pieces.to, PIECES)
  const invalid = Boolean(yearError || piecesError)

  const next: CatalogFilters = {
    ...draft,
    yearFrom: yearError ? null : toNumber(years.from),
    yearTo: yearError ? null : toNumber(years.to),
    piecesMin: piecesError ? null : toNumber(pieces.from),
    piecesMax: piecesError ? null : toNumber(pieces.to),
    page: 1,
  }
  const countQuery = queryParams(
    {
      ...next,
      newest: next.newest || Boolean(section.newest),
      onSale: next.onSale || Boolean(section.onSale),
    },
    CATALOG,
  )
  if (section.mode) countQuery.set('mode', section.mode)
  const countKey = countQuery.toString()

  useEffect(() => {
    if (!open || invalid) return
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/count?${countKey}`, {
          signal: controller.signal,
        })
        const body = (await response.json()) as { total?: number }
        setCountValue(typeof body.total === 'number' ? body.total : null)
      } catch {
        if (!controller.signal.aborted) setCountValue(null)
      }
    }, 300)
    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [open, invalid, countKey])

  const show = () => {
    setDraft(filters)
    setYears({
      from: filters.yearFrom?.toString() ?? '',
      to: filters.yearTo?.toString() ?? '',
    })
    setPieces({
      from: filters.piecesMin?.toString() ?? '',
      to: filters.piecesMax?.toString() ?? '',
    })
    setCountValue(total)
    setOpen(true)
  }
  const close = useCallback(() => setOpen(false), [])

  const reset = () => {
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
      onSale: false,
      official: false,
      specialized: false,
    })
    setYears({ from: '', to: '' })
    setPieces({ from: '', to: '' })
  }

  const apply = (event: React.FormEvent) => {
    event.preventDefault()
    if (invalid || count === 0) return
    setOpen(false)
    router.push(catalogHref(next, section), { scroll: true })
  }

  const patch = (changes: Partial<CatalogFilters>) => setDraft((value) => ({ ...value, ...changes }))
  const themeName = themes.find((item) => item.slug === draft.theme)?.name ?? null
  const shopName = shops.find((item) => item.slug === draft.shop)?.name ?? null
  const inStock = effectiveInStock(draft)

  return (
    <>
      <button type="button" className="c-fchip" onClick={show}>
        <FilterGlyph />
        Фільтри
        {active ? (
          <>
            {' '}
            <b className="c-fchip__count">{active}</b>
          </>
        ) : null}
      </button>
      <MiniSheet open={open} label="Фільтри" onClose={close}>
        <form className="c-filters" onSubmit={apply} noValidate>
          <header className="c-filters__head">
            <button type="button" className="c-filters__reset" onClick={reset}>
              Скинути
            </button>
            <h2 className="c-filters__title">Фільтри</h2>
            <button type="button" className="c-round-close" onClick={close} aria-label="Закрити">
              {CLOSE_ICON}
            </button>
          </header>

          <div className="c-filters__body">
            <p className="c-filters__cap">Тема</p>
            <div className="c-fgroup">
              <label className="c-frow c-frow--select">
                <span className="c-frow__text">
                  <span>{themeName ?? 'Будь-яка'}</span>
                  <small hidden={!themeName}>з усіма підтемами</small>
                </span>
                <Chevron />
                <select
                  className="c-frow__select"
                  aria-label="Тема"
                  value={draft.theme ?? ''}
                  onChange={(event) => patch({ theme: event.target.value || null })}
                >
                  <option value="">Будь-яка</option>
                  {themes.map((item) => (
                    <option key={item.slug} value={item.slug}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <p className="c-filters__cap">Рік випуску</p>
            <div className="c-fgroup c-frange">
              <label className="c-ffield">
                <span>Від</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={YEAR.min}
                  max={YEAR.max}
                  placeholder="Будь-який"
                  value={years.from}
                  onChange={(event) => setYears({ ...years, from: event.target.value })}
                />
              </label>
              <label className="c-ffield">
                <span>До</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={YEAR.min}
                  max={YEAR.max}
                  placeholder="Будь-який"
                  value={years.to}
                  onChange={(event) => setYears({ ...years, to: event.target.value })}
                />
              </label>
            </div>
            <p className="c-filters__error" hidden={!yearError}>
              {yearError === 'bounds' ? 'Рік має бути від 1949 до 2100' : 'Рік «від» має бути не більшим за рік «до»'}
            </p>

            <p className="c-filters__cap">Вік на коробці</p>
            <div className="c-rail">
              <div className="c-rail__track">
                <label className="c-rail__chip">
                  <input type="radio" name="age" checked={!draft.age} onChange={() => patch({ age: null })} />
                  <span>Будь-який</span>
                </label>
                {AGE_MARKS.map((mark) => (
                  <label key={mark.months} className="c-rail__chip">
                    <input type="radio" name="age" checked={draft.age === mark.months} onChange={() => patch({ age: mark.months })} />
                    <span>{mark.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <p className="c-filters__cap">Кількість деталей</p>
            <div className="c-fgroup c-frange">
              <label className="c-ffield">
                <span>Від</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={PIECES.min}
                  max={PIECES.max}
                  placeholder="Будь-яка"
                  value={pieces.from}
                  onChange={(event) => setPieces({ ...pieces, from: event.target.value })}
                />
              </label>
              <label className="c-ffield">
                <span>До</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={PIECES.min}
                  max={PIECES.max}
                  placeholder="Будь-яка"
                  value={pieces.to}
                  onChange={(event) => setPieces({ ...pieces, to: event.target.value })}
                />
              </label>
            </div>
            <p className="c-filters__error" hidden={!piecesError}>
              {piecesError === 'bounds' ? 'Кількість має бути від 0 до 100 000' : 'Кількість «від» має бути не більшою за «до»'}
            </p>

            <div className="c-fgroup c-fgroup--spaced">
              <label className="c-frow">
                <span className="c-frow__text">
                  Спеціальні набори<small>полібеги, промо, журнальні</small>
                </span>
                <input className="c-toggle" type="checkbox" checked={draft.specialized} onChange={(event) => patch({ specialized: event.target.checked })} />
              </label>
            </div>

            {sale ? (
              <>
                <p className="c-filters__cap">Продаж</p>
                <div className="c-fgroup">
                  <label className="c-frow">
                    <span className="c-frow__text">У наявності</span>
                    <input
                      className="c-toggle"
                      type="checkbox"
                      checked={inStock}
                      onChange={(event) => patch(event.target.checked ? { inStock: null, preorder: false } : { inStock: false })}
                    />
                  </label>
                  {section.onSale ? null : (
                    <label className="c-frow">
                      <span className="c-frow__text">Передзамовлення</span>
                      <input
                        className="c-toggle"
                        type="checkbox"
                        checked={draft.preorder}
                        onChange={(event) =>
                          patch(
                            event.target.checked
                              ? {
                                  preorder: true,
                                  onSale: false,
                                  official: false,
                                }
                              : { preorder: false },
                          )
                        }
                      />
                    </label>
                  )}
                  {section.onSale ? null : (
                    <label className="c-frow">
                      <span className="c-frow__text">Зі знижкою</span>
                      <input
                        className="c-toggle"
                        type="checkbox"
                        checked={draft.onSale}
                        onChange={(event) => patch(event.target.checked ? { onSale: true, preorder: false } : { onSale: false })}
                      />
                    </label>
                  )}
                  <label className="c-frow">
                    <span className="c-frow__text">Офіційний продавець</span>
                    <input
                      className="c-toggle"
                      type="checkbox"
                      checked={draft.official}
                      onChange={(event) => patch(event.target.checked ? { official: true, preorder: false } : { official: false })}
                    />
                  </label>
                  <label className="c-frow c-frow--select">
                    <span className="c-frow__text">Магазин</span>
                    <span className="c-frow__value">{shopName ?? 'Будь-який'}</span>
                    <Chevron />
                    <select
                      className="c-frow__select"
                      aria-label="Магазин"
                      value={draft.shop ?? ''}
                      onChange={(event) => patch({ shop: event.target.value || null })}
                    >
                      <option value="">Будь-який</option>
                      {shops.map((item) => (
                        <option key={item.slug} value={item.slug}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </>
            ) : (
              <p className="c-filters__note">Наявність, знижки, магазин і офіційний продавець є лише в режимі «Є в продажу».</p>
            )}
          </div>

          <footer className="c-filters__foot">
            <button type="submit" className="c-primary" disabled={invalid || count === 0}>
              {invalid ? 'Перевірте фільтри' : count ? `Показати ${setCount(count)}` : count === 0 ? 'Наборів не знайдено' : 'Показати'}
            </button>
          </footer>
        </form>
      </MiniSheet>
    </>
  )
}
