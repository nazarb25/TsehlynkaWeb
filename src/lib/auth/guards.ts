import { siteUrl } from '@/lib/site'

/** Перша літера імені для аватарки, як у боті. */
export function initial(name: string): string {
  return Array.from(name.trim())[0]?.toUpperCase() ?? '?'
}

/** Безпечна адреса повернення: лише шлях цього сайту. */
export function safeNext(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return '/'
  return value.startsWith('/auth/') ? '/' : value
}

/** Запит, що змінює стан, приймається лише з цього сайту. */
export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  if (!origin) return false
  const allowed = new Set([new URL(siteUrl()).origin, new URL(request.url).origin])
  return allowed.has(origin)
}
