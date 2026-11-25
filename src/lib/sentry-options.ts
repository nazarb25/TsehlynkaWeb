/** Частка трейсів: зі змінної середовища або 100 % у розробці й 20 % у продакшені. */
export function tracesSampleRate(value: string | undefined): number {
  const rate = Number(value)
  if (value && Number.isFinite(rate) && rate >= 0 && rate <= 1) return rate
  return process.env.NODE_ENV === 'development' ? 1 : 0.2
}

/** Шум, який не залежить від сайту: розширення браузера, обірвані запити, вбудовані браузери. */
export const IGNORED_ERRORS: (string | RegExp)[] = [
  'ResizeObserver loop limit exceeded',
  'ResizeObserver loop completed with undelivered notifications',
  'Non-Error promise rejection captured',
  /^AbortError/,
  /Load failed$/,
  /^NEXT_(NOT_FOUND|REDIRECT)/,
]
