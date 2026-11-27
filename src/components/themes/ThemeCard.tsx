import Link from 'next/link'

import { Photo } from '@/components/ui/Photo'
import type { Theme } from '@/lib/api/types'
import { setCount } from '@/lib/format'
import { themePath } from '@/lib/routes'

interface ThemeCardProps {
  theme: Theme
  note?: React.ReactNode
  variant?: 'card' | 'row'
}

/** Тема: картка з фото або рядок з мініатюрою; розмір задає контейнер. */
export function ThemeCard({ theme, note, variant = 'card' }: ThemeCardProps) {
  return (
    <Link className={`theme theme--${variant}`} href={themePath(theme)}>
      <Photo src={theme.image?.medium ?? theme.image?.thumb} className="theme__photo stage--cover" iconSize={22} />
      <span className="theme__text">
        <b>{theme.name}</b>
        <small className="num">{setCount(theme.set_count)}</small>
        {note ? <small className="theme__note num">{note}</small> : null}
      </span>
    </Link>
  )
}
