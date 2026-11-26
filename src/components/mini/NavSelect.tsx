'use client'

import { useRouter } from 'next/navigation'

interface NavSelectProps {
  className: string
  label: string
  value: string
  options: { href: string; label: string }[]
}

/** Прихований випадний список чипа: вибір одразу відкриває адресу варіанта. */
export function NavSelect({ className, label, value, options }: NavSelectProps) {
  const router = useRouter()
  return (
    <select className={className} aria-label={label} value={value} onChange={(event) => router.replace(event.target.value, { scroll: false })}>
      {options.map((option) => (
        <option key={option.href} value={option.href}>
          {option.label}
        </option>
      ))}
    </select>
  )
}
