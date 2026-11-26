'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

import type { Theme } from '@/lib/api/types'
import { archiveRootThemes, currentRootThemes } from '@/lib/catalog/themes'
import { plural } from '@/lib/format'
import { themePath } from '@/lib/routes'

type Period = 'current' | 'archive'

const PERIOD_LABELS: Record<Period, string> = { current: 'Актуальні', archive: 'Архів' }

interface MiniThemesProps {
  themes: Theme[]
  archive: boolean
  year: number
}

function searchThemes(themes: Theme[], text: string): Theme[] {
  const needle = text.toLocaleLowerCase('uk')
  return themes
    .filter((theme) => theme.name.toLocaleLowerCase('uk').includes(needle))
    .sort((a, b) => {
      const aStarts = a.name.toLocaleLowerCase('uk').startsWith(needle) ? 0 : 1
      const bStarts = b.name.toLocaleLowerCase('uk').startsWith(needle) ? 0 : 1
      return aStarts - bStarts || Number(b.is_current) - Number(a.is_current) || b.set_count - a.set_count || a.name.localeCompare(b.name, 'uk')
    })
}

/** Теми LEGO Mini App: пошук теми на будь-якому рівні, «Актуальні / Архів» і сітка тем. */
export function MiniThemes({ themes, archive, year }: MiniThemesProps) {
  const [text, setText] = useState('')
  const [period, setPeriod] = useState<Period>(archive ? 'archive' : 'current')
  const search = text.trim()
  const byId = useMemo(() => new Map(themes.map((theme) => [theme.id, theme])), [themes])
  const list = useMemo(
    () => (search ? searchThemes(themes, search) : period === 'current' ? currentRootThemes(themes) : archiveRootThemes(themes)),
    [themes, search, period],
  )

  const choosePeriod = (value: Period) => {
    setPeriod(value)
    window.history.replaceState(window.history.state, '', value === 'archive' ? '/themes/archive' : '/themes')
  }

  return (
    <div className="c-themes">
      <h1 className="c-themes__title">Теми LEGO</h1>
      <form className="c-themes__filters" role="search" onSubmit={(event) => event.preventDefault()}>
        <label className="c-sfield c-tfield">
          <span className="c-sfield__icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <circle cx="11" cy="11" r="6" />
              <path d="m20 20-4.5-4.5" />
            </svg>
          </span>
          <input
            className="c-sfield__input"
            type="search"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Назва теми"
            aria-label="Назва теми"
            enterKeyHint="search"
            maxLength={100}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
          />
          <button type="button" className="c-sfield__clear" aria-label="Очистити" hidden={!text} onClick={() => setText('')}>
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="10" fill="currentColor" />
              <path d="M8.5 8.5l7 7M15.5 8.5l-7 7" stroke="var(--color-section)" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </label>
        <div className="c-segmented c-tseg" role="radiogroup" aria-label="Які теми показати">
          {(['current', 'archive'] as const).map((value) => (
            <label key={value} className={`c-segmented__item${value === period ? ' is-selected' : ''}`}>
              <input className="c-segmented__radio" type="radio" name="period" value={value} checked={value === period} onChange={() => choosePeriod(value)} />
              {PERIOD_LABELS[value]}
            </label>
          ))}
        </div>
      </form>

      <section className="c-tresults">
        {list.length ? (
          <>
            <p className="c-tresults__count">
              {list.length} {plural(list.length, 'тема', 'теми', 'тем')}
            </p>
            <div className="c-tgrid">
              {list.map((theme) => {
                const parent = search && theme.parent_id ? byId.get(theme.parent_id) : undefined
                const src = theme.image?.medium
                return (
                  <Link key={theme.id} className="c-tcard" href={themePath(theme)}>
                    <span className="c-photo-stage c-theme-image c-tcard__image">
                      {src ? (
                        <img className="c-photo-stage__photo" src={src} alt="" loading="lazy" decoding="async" />
                      ) : (
                        <svg
                          width="26"
                          height="26"
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
                    <span className="c-tcard__text">
                      {parent ? <span className="c-tcard__path">{parent.name}</span> : null}
                      <b className="c-tcard__name">{theme.name}</b>
                      <small className="c-tcard__hint">
                        {theme.set_count} {plural(theme.set_count, 'набір', 'набори', 'наборів')}
                      </small>
                      {!theme.is_current && theme.first_set_year ? (
                        <small className="c-tcard__hint">
                          {theme.first_set_year === theme.last_set_year ? theme.first_set_year : `${theme.first_set_year}–${theme.last_set_year}`}
                        </small>
                      ) : theme.is_current && theme.recent_set_count ? (
                        <span className="c-tcard__new">
                          +{theme.recent_set_count} за {year - 1}–{year}
                        </span>
                      ) : null}
                    </span>
                  </Link>
                )
              })}
            </div>
          </>
        ) : search ? (
          <div className="c-tempty">
            <span className="c-tempty__icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <circle cx="11" cy="11" r="6" />
                <path d="m20 20-4.5-4.5" />
              </svg>
            </span>
            <b className="c-tempty__title">Тему не знайдено</b>
            <Link className="c-tempty__action" href={`/search?${new URLSearchParams({ mode: 'all', q: search })}`}>
              Шукати серед наборів
            </Link>
          </div>
        ) : (
          <div className="c-tempty">
            <b className="c-tempty__title">Тем поки немає</b>
          </div>
        )}
      </section>
    </div>
  )
}
