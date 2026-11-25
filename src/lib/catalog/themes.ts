import type { Theme } from '@/lib/api/types'

/** Тема за назвою: спершу ті, що починаються з тексту, далі більші. */
export function matchTheme(themes: Theme[], text: string): Theme | null {
  const needle = text.trim().toLocaleLowerCase('uk')
  if (!needle) return null
  const matches = themes.filter((theme) => theme.name.toLocaleLowerCase('uk').includes(needle))
  matches.sort((a, b) => {
    const aStarts = a.name.toLocaleLowerCase('uk').startsWith(needle) ? 0 : 1
    const bStarts = b.name.toLocaleLowerCase('uk').startsWith(needle) ? 0 : 1
    return aStarts - bStarts || b.set_count - a.set_count || a.name.localeCompare(b.name, 'uk')
  })
  return matches[0] ?? null
}

export function themePathTo(themes: Theme[], theme: Theme): Theme[] {
  const byId = new Map(themes.map((item) => [item.id, item]))
  const path: Theme[] = []
  let parentId = theme.parent_id
  while (parentId && byId.has(parentId) && path.length < themes.length) {
    const parent = byId.get(parentId)!
    path.unshift(parent)
    parentId = parent.parent_id
  }
  return path
}

export function childThemes(themes: Theme[], theme: Theme): Theme[] {
  return themes
    .filter((item) => item.parent_id === theme.id)
    .sort((a, b) => b.set_count - a.set_count || a.name.localeCompare(b.name, 'uk'))
}

/** Кореневі актуальні теми за свіжими наборами, як у Mini App. */
export function currentRootThemes(themes: Theme[]): Theme[] {
  return themes
    .filter((theme) => !theme.parent_id && theme.is_current)
    .sort((a, b) => b.recent_set_count - a.recent_set_count || a.name.localeCompare(b.name, 'uk'))
}

export function archiveRootThemes(themes: Theme[]): Theme[] {
  return themes
    .filter((theme) => !theme.parent_id && !theme.is_current)
    .sort((a, b) => a.name.localeCompare(b.name, 'uk'))
}

/** Найбільші кореневі теми каталогу: для меню й фільтра. */
export function popularThemes(themes: Theme[], limit: number): Theme[] {
  return themes
    .filter((theme) => !theme.parent_id && theme.is_current)
    .sort((a, b) => b.set_count - a.set_count)
    .slice(0, limit)
}

export function themeYears(theme: Theme): string | null {
  const { first_set_year: first, last_set_year: last } = theme
  if (first && last) return first === last ? String(first) : `${first}–${last}`
  return first ? `з ${first}` : null
}
