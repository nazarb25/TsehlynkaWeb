'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { countBucket, queryShape, track } from '@/lib/analytics'
import type { SetItem, Theme } from '@/lib/api/types'
import { type CatalogFilters, catalogHref, type CatalogMode, MAX_PAGE, MODE_LABELS, PAGE_SIZE, queryParams, SEARCH } from '@/lib/catalog/filters'
import { plural } from '@/lib/format'
import { themePath } from '@/lib/routes'

import { Chevron, ModeIcon, StateIcon, XIcon } from './icons'
import { MiniLoadMore } from './MiniLoadMore'
import { isOnSale, SALE_SWIPE, SalePrice, SetRow } from './SetRows'
import { useMobile } from './useMobile'

interface SearchResult {
  theme: Theme | null
  items: SetItem[]
  total: number
}

interface MiniSearchProps {
  filters: CatalogFilters
  initial: SearchResult | null
  chips: { label: string; href: string }[]
}

const DEBOUNCE_MS = 300

function Highlight({ text, query }: { text: string; query: string }) {
  const needle = query.trim().toLocaleLowerCase('uk')
  const start = needle ? text.toLocaleLowerCase('uk').indexOf(needle) : -1
  if (start < 0 || text.toLocaleLowerCase('uk').length !== text.length) return <>{text}</>
  const end = start + needle.length
  return (
    <>
      {text.slice(0, start)}
      <b>{text.slice(start, end)}</b>
      {text.slice(end)}
    </>
  )
}

/** Повноекранний пошук Mini App: поле з режимом каталогу; результати оновлюються за введенням із затримкою. */
function searchKey(filters: CatalogFilters, q: string, mode: CatalogMode): string {
  return queryParams({ ...filters, q: q || null, mode, page: 1, view: null }, SEARCH).toString()
}

export function MiniSearch({ filters, initial, chips }: MiniSearchProps) {
  const router = useRouter()
  const mobile = useMobile()
  const inputRef = useRef<HTMLInputElement>(null)
  const [text, setText] = useState(filters.q ?? '')
  const [mode, setMode] = useState<CatalogMode>(filters.mode)
  const [result, setResult] = useState<{
    key: string
    data: SearchResult | null
  } | null>(filters.q && initial ? { key: searchKey(filters, filters.q.trim(), filters.mode), data: initial } : null)
  const [loading, setLoading] = useState(false)
  const [attempt, setAttempt] = useState(0)

  const query = text.trim()
  const paramsText = searchKey(filters, query, mode)
  const key = paramsText

  useEffect(() => {
    if (mobile && !filters.q) inputRef.current?.focus()
  }, [mobile, filters.q])

  useEffect(() => {
    if (!mobile) return
    window.history.replaceState(window.history.state, '', paramsText ? `/search?${paramsText}` : '/search')
  }, [mobile, paramsText])

  useEffect(() => {
    if (!mobile || !query) return
    if (result?.key === key && attempt === 0) return
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/search?${paramsText}`, {
          signal: controller.signal,
        })
        if (!response.ok) throw new Error(String(response.status))
        const data = (await response.json()) as SearchResult
        setResult({ key, data })
        track('search_results_viewed', { ...queryShape(query), result_bucket: countBucket(data.total), mode, theme_found: Boolean(data.theme) })
      } catch {
        if (!controller.signal.aborted) {
          setResult({ key, data: null })
          track('error_shown', { error_code: 'search_unavailable', route_group: 'search' })
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
          setAttempt(0)
        }
      }
    }, DEBOUNCE_MS)
    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mobile, key, paramsText, attempt])

  const cancel = () => {
    if (window.history.length > 1) router.back()
    else router.push('/catalog')
  }

  const current = query && result?.key === key ? result : null
  const data = current?.data
  const sale = mode === 'sale'
  const pages = data ? Math.min(Math.ceil(data.total / PAGE_SIZE), MAX_PAGE) : 0

  return (
    <div className="c-search-screen">
      <form
        className={`c-sbar${loading ? ' is-loading' : ''}`}
        role="search"
        onSubmit={(event) => {
          event.preventDefault()
          if (query) track('search_submit', { ...queryShape(query), mode })
          inputRef.current?.blur()
        }}
      >
        <div className="c-sbar__row">
          <label className="c-sfield">
            <span className="c-sfield__icon" aria-hidden="true">
              <svg
                className="c-sfield__glass"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              >
                <circle cx="11" cy="11" r="6" />
                <path d="m20 20-4.5-4.5" />
              </svg>
              <span className="c-sfield__spinner" />
            </span>
            <input
              ref={inputRef}
              className="c-sfield__input"
              type="search"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Пошук наборів"
              aria-label="Пошук наборів"
              enterKeyHint="search"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              maxLength={100}
            />
            <button
              type="button"
              className="c-sfield__clear"
              aria-label="Очистити"
              hidden={!text}
              onClick={() => {
                setText('')
                inputRef.current?.focus()
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="10" fill="currentColor" />
                <path d="M8.5 8.5l7 7M15.5 8.5l-7 7" stroke="var(--color-section)" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </label>
          <button type="button" className="c-sbar__cancel" onClick={cancel}>
            Скасувати
          </button>
        </div>
        <div className="c-seg-sm" role="radiogroup" aria-label="Де шукати">
          {(['all', 'sale'] as const).map((value) => (
            <label key={value} className={`c-seg-sm__item c-segmented__item${value === mode ? ' is-selected' : ''}`}>
              <input className="c-segmented__radio" type="radio" name="mode" value={value} checked={value === mode} onChange={() => setMode(value)} />
              <ModeIcon mode={value} />
              {MODE_LABELS[value]}
            </label>
          ))}
        </div>
      </form>

      <div className="c-search-results" aria-live="polite">
        {!query ? (
          <p className="c-search-hint">Шукайте за номером, назвою або персонажем</p>
        ) : !current ? null : !data ? (
          <section className="c-state c-state--compact">
            <span className="c-state__icon">
              <StateIcon kind="error" />
            </span>
            <h2 className="c-state__title">Не вдалося завантажити результати</h2>
            <button type="button" className="c-state__action" onClick={() => setAttempt((value) => value + 1)}>
              Повторити
            </button>
          </section>
        ) : (
          <>
            {data.theme ? (
              <>
                <p className="c-section-cap">Тема</p>
                <div className="c-srows">
                  <Link className="c-srow c-srow--theme" href={themePath(data.theme)}>
                    <span className="c-srow__open">
                      <span className="c-photo-stage c-theme-image c-srow__theme-image">
                        {data.theme.image?.thumb || data.theme.image?.medium ? (
                          <img
                            className="c-photo-stage__photo"
                            src={data.theme.image.thumb ?? data.theme.image.medium ?? ''}
                            alt=""
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <rect x="3" y="10" width="18" height="9" rx="1.5" />
                            <rect x="6" y="6.5" width="4" height="3.5" rx="1" />
                            <rect x="14" y="6.5" width="4" height="3.5" rx="1" />
                          </svg>
                        )}
                      </span>
                      <span className="c-srow__text">
                        <span className="c-srow__name">{data.theme.name}</span>
                        <span className="c-meta">
                          {data.theme.set_count} {plural(data.theme.set_count, 'набір', 'набори', 'наборів')}
                        </span>
                      </span>
                    </span>
                    <Chevron />
                  </Link>
                </div>
              </>
            ) : null}
            {data.items.length ? (
              <>
                <p className="c-section-cap c-section-cap--count">
                  {data.theme ? `Набори · ${data.total}` : `${data.total} ${plural(data.total, 'набір', 'набори', 'наборів')}`}
                </p>
                <div className="c-urows c-urows--search">
                  {data.items.map((item) => (
                    <SetRow
                      key={item.id}
                      item={item}
                      name={<Highlight text={item.name} query={query} />}
                      price={sale && isOnSale(item) ? <SalePrice item={item} /> : null}
                      swipe={sale ? SALE_SWIPE : undefined}
                    />
                  ))}
                  <MiniLoadMore
                    key={paramsText}
                    sectionKey="search"
                    query={paramsText}
                    page={1}
                    pages={pages}
                    context={{ sale, onSale: false, newest: false }}
                    grid={false}
                    end={<></>}
                  />
                </div>
              </>
            ) : data.theme ? null : (
              <section className="c-state c-state--compact">
                <span className="c-state__icon c-state__icon--small">
                  <StateIcon kind="search" />
                </span>
                <h2 className="c-state__title">Нічого не знайдено за цим запитом</h2>
                {chips.length ? (
                  <>
                    <p className="c-state__hint">Діють фільтри:</p>
                    <div className="c-state__chips">
                      {chips.map((chip) => (
                        <Link key={chip.label} className="c-fchip c-fchip--remove" href={chip.href} replace aria-label={`Прибрати фільтр ${chip.label}`}>
                          {chip.label}
                          <XIcon />
                        </Link>
                      ))}
                    </div>
                    <Link
                      className="c-state__action"
                      href={catalogHref({ ...filters, q: query, mode }, SEARCH, {
                        theme: null,
                        line: null,
                        shop: null,
                        yearFrom: null,
                        yearTo: null,
                        age: null,
                        piecesMin: null,
                        piecesMax: null,
                        priceFrom: null,
                        priceTo: null,
                        inStock: null,
                        preorder: false,
                        onSale: false,
                        official: false,
                        specialized: false,
                      })}
                      replace
                    >
                      Очистити фільтри
                    </Link>
                  </>
                ) : null}
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}
