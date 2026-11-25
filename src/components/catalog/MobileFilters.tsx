'use client'

import { useEffect, useState } from 'react'

import { CloseIcon, FilterIcon } from '@/components/icons'
import type { CatalogFilters, CatalogSection } from '@/lib/catalog/filters'

import { type FilterOption, FiltersPanel } from './FiltersPanel'

interface MobileFiltersProps {
  filters: CatalogFilters
  section: CatalogSection
  themes: FilterOption[]
  shops: FilterOption[]
  active: number
}

/** Кнопка «Фільтри» й шторка з чернеткою фільтрів на телефоні. */
export function MobileFilters({ filters, section, themes, shops, active }: MobileFiltersProps) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <>
      <button type="button" className="tool-button" aria-haspopup="dialog" onClick={() => setOpen(true)}>
        <FilterIcon size={16} />
        Фільтри
        {active ? <span className="tool-button__count num">{active}</span> : null}
      </button>
      {open ? (
        <div className="sheet" role="dialog" aria-modal="true" aria-label="Фільтри">
          <button type="button" className="sheet__backdrop" aria-label="Закрити" onClick={() => setOpen(false)} />
          <div className="sheet__panel">
            <button type="button" className="sheet__close" aria-label="Закрити" onClick={() => setOpen(false)}>
              <CloseIcon size={14} />
            </button>
            <FiltersPanel
              filters={filters}
              section={section}
              themes={themes}
              shops={shops}
              variant="draft"
              onDone={() => setOpen(false)}
            />
          </div>
        </div>
      ) : null}
    </>
  )
}
