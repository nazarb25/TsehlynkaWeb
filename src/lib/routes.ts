const TRANSLIT: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', є: 'ie', ж: 'zh', з: 'z', и: 'y', і: 'i', ї: 'i',
  й: 'i', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh',
  ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ь: '', ю: 'iu', я: 'ia', ы: 'y', э: 'e', ё: 'io', ъ: '',
}

/** Латинський slug з назви: транслітерація кирилиці, лише a–z, 0–9 і дефіси. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .split('')
    .map((char) => TRANSLIT[char] ?? char)
    .join('')
    .replace(/['’ʼ`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value)
}

interface SetLike {
  id: string
  name: string
  canonical_name?: string | null
  official_number_display?: string | null
}

/** Адреса набору: `/sets/75192-millennium-falcon`; без номера — за ідентифікатором. */
export function setPath(set: SetLike): string {
  const number = set.official_number_display
  if (!number || !/^[0-9]{3,7}(-[0-9]{1,2})?$/.test(number)) return `/sets/${set.id}`
  const slug = slugify(set.canonical_name || set.name)
  return slug ? `/sets/${number}-${slug}` : `/sets/${number}`
}

/** Номер набору з адреси: `75192-millennium-falcon` → `75192`, `10497-1-galaxy` → `10497-1`. */
export function numberFromSetSlug(slug: string): string | null {
  const match = /^([0-9]{3,7})(?:-([0-9]{1,2}))?(?=-|$)/.exec(slug)
  if (!match) return null
  const [, base, variant] = match
  const rest = slug.slice(match[0].length)
  if (variant && rest && !rest.startsWith('-')) return base ?? null
  return variant ? `${base}-${variant}` : (base ?? null)
}

export function themePath(theme: { slug: string }): string {
  return `/themes/${theme.slug}`
}
