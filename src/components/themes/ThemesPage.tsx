import Link from 'next/link'

import { AlertIcon } from '@/components/icons'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { EmptyState } from '@/components/ui/EmptyState'
import { listThemes } from '@/lib/api/catalog'
import { archiveRootThemes, currentRootThemes, themeYears } from '@/lib/catalog/themes'
import { currentYear } from '@/lib/format'
import { safe } from '@/lib/safe'

import { ThemesBrowser } from './ThemesBrowser'

export async function ThemesPage({ archive }: { archive: boolean }) {
  const themes = await safe(listThemes())
  const year = currentYear()
  const list = themes ? (archive ? archiveRootThemes(themes) : currentRootThemes(themes)) : []
  const notes: Record<string, string> = {}
  for (const theme of list) {
    if (archive) {
      const years = themeYears(theme)
      if (years) notes[theme.id] = years
    } else if (theme.recent_set_count) {
      notes[theme.id] = `+${theme.recent_set_count} за ${year - 1}–${year}`
    }
  }
  return (
    <div className="wrap">
      <Breadcrumbs items={archive ? [{ name: 'Теми', path: '/themes' }, { name: 'Архів' }] : [{ name: 'Теми' }]} />
      <div className="page-head">
        <h1>{archive ? 'Архів тем LEGO' : 'Теми LEGO'}</h1>
        <nav className="seg" aria-label="Теми">
          <Link href="/themes" aria-current={archive ? undefined : 'page'}>
            Актуальні
          </Link>
          <Link href="/themes/archive" aria-current={archive ? 'page' : undefined}>
            Архів
          </Link>
        </nav>
      </div>
      <p className="page-hint">{archive ? 'Теми, набори яких більше не виходять' : 'Теми, у яких виходять нові набори'}</p>
      <div className="themes-body">
        {themes ? (
          <ThemesBrowser themes={list} notes={notes} />
        ) : (
          <EmptyState icon={<AlertIcon size={26} />} title="Не вдалося завантажити теми" text="Каталог тимчасово недоступний. Спробуйте оновити сторінку за хвилину." />
        )}
      </div>
    </div>
  )
}
