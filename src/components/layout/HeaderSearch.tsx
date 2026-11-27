'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useId, useRef, useState } from 'react'

import { BrickIcon, ChevronRight, SearchIcon } from '@/components/icons'
import { queryShape, track } from '@/lib/analytics'
import type { Suggestions } from '@/lib/catalog/suggest'
import { setCount } from '@/lib/format'

const MIN_LENGTH = 2
const DEBOUNCE_MS = 250

export function HeaderSearch() {
  const router = useRouter()
  const pathname = usePathname()
  const listId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [text, setText] = useState('')
  const [open, setOpen] = useState(false)
  const [pending, setLoading] = useState(false)
  const [found, setFound] = useState<{ query: string; data: Suggestions | null } | null>(null)
  const [active, setActive] = useState(-1)
  const [docked, setDocked] = useState(false)
  const home = pathname === '/'

  const [openedAt, setOpenedAt] = useState(pathname)
  if (openedAt !== pathname) {
    setOpenedAt(pathname)
    setOpen(false)
    setText('')
    setActive(-1)
  }

  useEffect(() => {
    const hero = home ? document.querySelector('.hero__search') : null
    if (!hero) return
    const header = document.querySelector('.header')
    const top = header?.getBoundingClientRect().height ?? 0
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) setDocked(!entry.isIntersecting && entry.boundingClientRect.top < top)
      },
      { rootMargin: `-${top}px 0px 0px 0px` },
    )
    observer.observe(hero)
    return () => {
      observer.disconnect()
      setDocked(false)
    }
  }, [home])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (event.key !== '/' || target?.closest('input, textarea, select, [contenteditable]')) return
      event.preventDefault()
      inputRef.current?.focus()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    const query = text.trim()
    if (query.length < MIN_LENGTH) return
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/suggest?q=${encodeURIComponent(query)}`, { signal: controller.signal })
        setFound({ query, data: response.ok ? ((await response.json()) as Suggestions) : null })
      } catch {
        if (!controller.signal.aborted) setFound({ query, data: null })
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, DEBOUNCE_MS)
    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [text])

  const searchable = text.trim().length >= MIN_LENGTH
  const result = searchable && found?.query === text.trim() ? found.data : null
  const loading = searchable && pending

  const links = [
    ...(result?.theme ? [result.theme.href] : []),
    ...(result?.sets.map((set) => set.href) ?? []),
  ]

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    const query = text.trim()
    const chosen = active >= 0 ? links[active] : undefined
    setOpen(false)
    if (query) track('search_submit', { ...queryShape(query), suggestion: Boolean(chosen) })
    if (chosen) track('search_suggestion_selected', { ...queryShape(query), kind: chosen.startsWith('/themes') ? 'theme' : 'set', position: active })
    if (chosen) router.push(chosen)
    else if (query) router.push(`/search?q=${encodeURIComponent(query)}`)
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      setActive((index) => Math.min(index + 1, links.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((index) => Math.max(index - 1, -1))
    } else if (event.key === 'Escape') {
      setOpen(false)
      inputRef.current?.blur()
    }
  }

  const showDrop = open && text.trim().length >= MIN_LENGTH && result !== null
  let index = -1

  return (
    <form
      role="search"
      className={`hsearch hide-mobile${home ? ' hsearch--home' : ''}${home && (docked || open) ? ' is-docked' : ''}${open ? ' is-open' : ''}`}
      action="/search"
      onSubmit={submit}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false)
      }}
    >
      <label className="hsearch__field">
        <SearchIcon />
        <span className="visually-hidden">Пошук наборів</span>
        <input
          ref={inputRef}
          type="search"
          name="q"
          value={text}
          autoComplete="off"
          placeholder="Номер, назва, тема, персонаж"
          role="combobox"
          aria-expanded={showDrop}
          aria-controls={listId}
          aria-autocomplete="list"
          onChange={(event) => {
            setText(event.target.value)
            setActive(-1)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
        {loading ? <span className="spinner" aria-hidden="true" /> : null}
      </label>
      {showDrop ? (
        <div
          className="hsearch__drop"
          id={listId}
          role="listbox"
          aria-label="Підказки"
          onMouseDown={(event) => event.preventDefault()}
        >
          {result.theme ? <p className="sugg__cap" role="presentation">Тема</p> : null}
          {result.theme ? (
            <Link
              href={result.theme.href}
              data-track="search_suggestion_selected"
              data-track-kind="theme"
              data-track-query-type={queryShape(text).query_type}
              data-track-query-length-bucket={queryShape(text).query_length_bucket}
              role="option"
              aria-selected={active === ++index}
              className={`sugg${active === index ? ' is-active' : ''}`}
            >
              <span className="stage stage--cover sugg__photo">
                {result.theme.image ? <img src={result.theme.image} alt="" /> : <BrickIcon size={16} />}
              </span>
              <span className="sugg__text">
                <b>{result.theme.name}</b>
                <small className="num">{setCount(result.theme.setCount)}</small>
              </span>
            </Link>
          ) : null}
          {result.sets.length ? (
            <p className="sugg__cap" role="presentation">
              {result.theme ? `Набори · ${result.total}` : setCount(result.total)}
            </p>
          ) : null}
          {result.sets.map((set) => (
            <Link
              key={set.href}
              href={set.href}
              data-track="search_suggestion_selected"
              data-track-kind="set"
              data-track-query-type={queryShape(text).query_type}
              data-track-query-length-bucket={queryShape(text).query_length_bucket}
              role="option"
              aria-selected={active === ++index}
              className={`sugg${active === index ? ' is-active' : ''}`}
            >
              <span className="stage sugg__photo">
                {set.image ? <img src={set.image} alt="" /> : <BrickIcon size={16} />}
              </span>
              <span className="sugg__text">
                <b>{set.name}</b>
                <small className="num">{[set.number ? `#${set.number}` : null, set.year].filter(Boolean).join(' · ')}</small>
              </span>
            </Link>
          ))}
          {result.sets.length || result.theme ? (
            <Link className="sugg__all" href={`/search?q=${encodeURIComponent(text.trim())}`}>
              Усі результати
              <ChevronRight size={14} />
            </Link>
          ) : (
            <p className="sugg__empty">Нічого не знайдено</p>
          )}
        </div>
      ) : null}
    </form>
  )
}
