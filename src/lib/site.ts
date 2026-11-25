export const SITE_NAME = 'Цеглинка'
export const SITE_TAGLINE = 'Набори LEGO і ціни українських магазинів'
export const SITE_DESCRIPTION =
  'Каталог наборів LEGO українською: теми, архів, склад, фігурки й порівняння цін в українських магазинах.'

/** Публічна адреса сайту без скісної риски в кінці; для canonical, sitemap і OG. */
export function siteUrl(): string {
  return (process.env.SITE_URL ?? 'http://localhost:3000').replace(/\/+$/, '')
}

export function absoluteUrl(path: string): string {
  return `${siteUrl()}${path.startsWith('/') ? path : `/${path}`}`
}

/** Ім'я бота без «@»; без нього посилань на Telegram немає. */
export function botUsername(): string | null {
  const value = process.env.TELEGRAM_BOT_USERNAME?.replace(/^@/, '').trim()
  return value || null
}

export function botUrl(): string | null {
  const username = botUsername()
  return username ? `https://t.me/${username}` : null
}

/** Посилання, що відкриває набір у боті: `?start=set_<id без дефісів>`. */
export function botSetUrl(setId: string, shops = false): string | null {
  const username = botUsername()
  if (!username) return null
  return `https://t.me/${username}?start=${shops ? 'shops' : 'set'}_${setId.replace(/-/g, '')}`
}

export function isIndexable(): boolean {
  return process.env.SITE_INDEXABLE === 'true'
}
