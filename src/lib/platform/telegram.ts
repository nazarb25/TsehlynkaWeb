/** Частина Telegram Web App API, якою користується сайт. */
export interface TelegramWebApp {
  initData: string
  colorScheme: 'light' | 'dark'
  platform: string
  isVersionAtLeast(version: string): boolean
  ready(): void
  expand(): void
  disableVerticalSwipes?: () => void
  setHeaderColor(color: string): void
  setBackgroundColor(color: string): void
  onEvent(event: string, handler: () => void): void
  offEvent(event: string, handler: () => void): void
  openLink(url: string): void
  openTelegramLink(url: string): void
  BackButton: {
    show(): void
    hide(): void
    onClick(handler: () => void): void
    offClick(handler: () => void): void
  }
  HapticFeedback?: {
    impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void
    selectionChanged(): void
  }
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp }
  }
}

export const TELEGRAM_SCRIPT = 'https://telegram.org/js/telegram-web-app.js'
const LAUNCH_KEY = 'tsehlynka:telegram'

/** Сторінку відкрито з Telegram: дані запуску в адресі або вже збережена ознака сесії. */
export function launchedFromTelegram(): boolean {
  if (typeof window === 'undefined') return false
  const hash = window.location.hash
  if (hash.includes('tgWebAppData=') || hash.includes('tgWebAppPlatform=')) {
    try {
      window.sessionStorage.setItem(LAUNCH_KEY, '1')
    } catch {}
    return true
  }
  try {
    return window.sessionStorage.getItem(LAUNCH_KEY) === '1'
  } catch {
    return false
  }
}

export function telegramWebApp(): TelegramWebApp | null {
  const webApp = typeof window === 'undefined' ? undefined : window.Telegram?.WebApp
  return webApp && webApp.initData ? webApp : null
}

export function loadTelegramScript(): Promise<TelegramWebApp | null> {
  const ready = telegramWebApp()
  if (ready) return Promise.resolve(ready)
  return new Promise((resolve) => {
    const script = document.createElement('script')
    script.src = TELEGRAM_SCRIPT
    script.async = true
    script.onload = () => resolve(telegramWebApp())
    script.onerror = () => resolve(null)
    document.head.appendChild(script)
  })
}
