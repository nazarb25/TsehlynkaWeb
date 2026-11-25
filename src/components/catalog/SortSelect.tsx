'use client'

import { useRouter } from 'next/navigation'

import { ChevronDown } from '@/components/icons'
import { type CatalogFilters, type CatalogSection, catalogHref, type SetSort } from '@/lib/catalog/filters'

interface SortSelectProps {
  filters: CatalogFilters
  section: CatalogSection
  value: SetSort
  options: Record<string, string>
}

export function SortSelect({ filters, section, value, options }: SortSelectProps) {
  const router = useRouter()
  return (
    <label className="sort">
      <span className="sort__label hide-mobile">Сортування:</span>
      <span className="sort__value">{options[value]}</span>
      <ChevronDown size={16} />
      <select
        aria-label="Сортування"
        value={value}
        onChange={(event) =>
          router.push(catalogHref(filters, section, { sort: event.target.value as SetSort }), { scroll: false })
        }
      >
        {Object.entries(options).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
    </label>
  )
}
