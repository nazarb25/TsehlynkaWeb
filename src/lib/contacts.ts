/** Контакти проєкту з рантайм-змінних: їх міняють у `.env` і перезапускають контейнер, без збирання. */

export interface TelegramContact {
  /** Повне посилання, як у конфігу, разом із `?direct`. */
  href: string
  /** Що бачить людина: `@username`. */
  label: string
}

export interface ContactTopic {
  key: 'shops' | 'catalog' | 'price' | 'complaint' | 'idea'
  title: string
  hint: string
  body?: string
}

export const CONTACT_TOPICS: readonly ContactTopic[] = [
  { key: 'shops', title: 'Магазинам і мережам', hint: 'Додати ваш фід із цінами в каталог', body: 'Магазин:\nСайт:\nПосилання на фід:\n' },
  { key: 'catalog', title: 'Помилка в каталозі', hint: 'Не той набір, фото, склад чи тема', body: 'Набір (посилання або номер):\nЩо не так:\n' },
  { key: 'price', title: 'Неточна ціна', hint: 'Ціна чи наявність не як у магазині', body: 'Набір (посилання або номер):\nМагазин:\nЩо не так:\n' },
  { key: 'complaint', title: 'Скарга чи претензія', hint: 'Щодо сайту, його вмісту чи даних' },
  { key: 'idea', title: 'Пропозиція чи зауваження', hint: 'Ідея, як зробити Цеглинку кращою' },
]

const EMAIL = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[^\s@<>()",;:]+$/
const USERNAME = /^[A-Za-z][A-Za-z0-9_]{3,31}$/

export function parseContactEmail(value: string | undefined): string | null {
  const email = value?.trim()
  return email && EMAIL.test(email) ? email : null
}

/** Приймає `https://t.me/name?direct`, `t.me/name` або `@name`; показує `@name`, веде на повне посилання. */
export function parseTelegramContact(value: string | undefined): TelegramContact | null {
  const raw = value?.trim()
  if (!raw) return null
  if (raw.startsWith('@')) {
    const username = raw.slice(1)
    return USERNAME.test(username) ? { href: `https://t.me/${username}`, label: `@${username}` } : null
  }
  let url: URL
  try {
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`)
  } catch {
    return null
  }
  if (url.protocol !== 'https:' || url.hostname !== 't.me') return null
  const username = url.pathname.split('/').filter(Boolean)[0] ?? ''
  if (!USERNAME.test(username)) return null
  url.hash = ''
  return { href: url.toString(), label: `@${username}` }
}

export function contactEmail(): string | null {
  return parseContactEmail(process.env.CONTACT_EMAIL)
}

export function contactTelegram(): TelegramContact | null {
  return parseTelegramContact(process.env.CONTACT_TELEGRAM_URL)
}

/** Лист із темою і заготовкою. Пробіли кодуються як `%20`: `+` поштові програми показують буквально. */
export function mailtoHref(email: string, topic?: Pick<ContactTopic, 'title' | 'body'>): string {
  const params: string[] = []
  if (topic) params.push(`subject=${encodeURIComponent(topic.title)}`)
  if (topic?.body) params.push(`body=${encodeURIComponent(topic.body)}`)
  return `mailto:${email}${params.length ? `?${params.join('&')}` : ''}`
}
