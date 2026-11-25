'use client'

import { useMemo, useState } from 'react'

import { SearchIcon } from '@/components/icons'
import { EmptyState } from '@/components/ui/EmptyState'
import type { Theme } from '@/lib/api/types'
import { plural } from '@/lib/format'

import { ThemeCard } from './ThemeCard'

interface ThemesBrowserProps {
  themes: Theme[]
  notes: Record<string, string>
}

/** Сітка тем з пошуком за назвою без перезавантаження. */
export function ThemesBrowser({ themes, notes }: ThemesBrowserProps) {
  const [query, setQuery] = useState('')
  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('uk')
    return needle ? themes.filter((theme) => theme.name.toLocaleLowerCase('uk').includes(needle)) : themes
  }, [themes, query])

  return (
    <>
      <div className="toolbar themes-toolbar">
        <p className="toolbar__count num">
          {visible.length} {plural(visible.length, 'тема', 'теми', 'тем')}
        </p>
        <label className="ffield themes-search">
          <SearchIcon size={15} />
          <span className="visually-hidden">Назва теми</span>
          <input type="search" value={query} placeholder="Назва теми" autoComplete="off" onChange={(event) => setQuery(event.target.value)} />
        </label>
      </div>
      {visible.length ? (
        <div className="themes-grid">
          {visible.map((theme) => (
            <ThemeCard key={theme.id} theme={theme} note={notes[theme.id]} />
          ))}
        </div>
      ) : (
        <EmptyState icon={<SearchIcon size={26} />} title="Такої теми немає" text="Перевірте назву або пошукайте в іншому розділі тем." />
      )}
    </>
  )
}
