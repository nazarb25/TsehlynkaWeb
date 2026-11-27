'use client'

import { useRouter } from 'next/navigation'

import { type AnalyticsEvent, track } from '@/lib/analytics'

interface NavSelectProps {
  className: string
  label: string
  value: string
  options: { href: string; label: string; key?: string }[]
  /** Подія вибору з ключем обраного варіанта. */
  event?: { name: AnalyticsEvent; properties: Record<string, string> }
}

/** Прихований випадний список чипа: вибір одразу відкриває адресу варіанта. */
export function NavSelect({ className, label, value, options, event }: NavSelectProps) {
  const router = useRouter()
  const pick = (href: string) => {
    const chosen = options.find((option) => option.href === href)
    if (event && chosen?.key) track(event.name, { ...event.properties, value: chosen.key })
    router.replace(href, { scroll: false })
  }
  return (
    <select className={className} aria-label={label} value={value} onChange={(change) => pick(change.target.value)}>
      {options.map((option) => (
        <option key={option.href} value={option.href}>
          {option.label}
        </option>
      ))}
    </select>
  )
}
