'use client'

import * as Sentry from '@sentry/nextjs'
import { usePathname, useRouter } from 'next/navigation'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

import { registerPlatform } from '@/lib/analytics'
import { launchedFromTelegram, loadTelegramScript, type TelegramWebApp } from '@/lib/platform/telegram'

interface Platform {
  /** Telegram Web App, коли сайт відкрито як Mini App; у браузері — `null`. */
  telegram: TelegramWebApp | null
  haptic(kind?: 'impact' | 'selection'): void
  openExternal(url: string): void
}

const PlatformContext = createContext<Platform>({
  telegram: null,
  haptic: () => {},
  openExternal: (url) => window.open(url, '_blank', 'noopener'),
})

export function usePlatform(): Platform {
  return useContext(PlatformContext)
}

const TELEGRAM_HOST = 't.me'

/**
 * Інтеграції Telegram: тема клієнта, BackButton, тактильний відгук і відкриття зовнішніх
 * посилань через Telegram. У браузері нічого не робить.
 */
export function TelegramBridge({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [telegram, setTelegram] = useState<TelegramWebApp | null>(null)
  const depth = useRef(0)

  useEffect(() => {
    if (!launchedFromTelegram()) return
    let cancelled = false
    let applyScheme: (() => void) | null = null
    loadTelegramScript().then((webApp) => {
      if (cancelled || !webApp) return
      const root = document.documentElement
      root.dataset.platform = 'telegram'
      Sentry.setTags({ platform: 'telegram', 'telegram.client': webApp.platform })
      registerPlatform('telegram', webApp.platform)
      applyScheme = () => {
        root.dataset.colorScheme = webApp.colorScheme === 'dark' ? 'dark' : 'light'
      }
      applyScheme()
      webApp.onEvent('themeChanged', applyScheme)
      webApp.ready()
      webApp.expand()
      if (webApp.isVersionAtLeast('7.7')) webApp.disableVerticalSwipes?.()
      if (webApp.isVersionAtLeast('6.1')) {
        webApp.setHeaderColor('secondary_bg_color')
        webApp.setBackgroundColor('secondary_bg_color')
      }
      setTelegram(webApp)
    })
    return () => {
      cancelled = true
      if (applyScheme) window.Telegram?.WebApp?.offEvent('themeChanged', applyScheme)
    }
  }, [])

  const previous = useRef(pathname)
  useEffect(() => {
    if (previous.current !== pathname) depth.current += 1
    previous.current = pathname
  }, [pathname])

  useEffect(() => {
    if (!telegram) return
    const goBack = () => {
      if (depth.current > 0) {
        depth.current -= 2
        router.back()
      } else {
        router.push('/')
      }
    }
    if (pathname === '/') telegram.BackButton.hide()
    else telegram.BackButton.show()
    telegram.BackButton.onClick(goBack)
    return () => telegram.BackButton.offClick(goBack)
  }, [telegram, pathname, router])

  const haptic = useCallback(
    (kind: 'impact' | 'selection' = 'impact') => {
      const feedback = telegram?.HapticFeedback
      if (!feedback) return
      if (kind === 'selection') feedback.selectionChanged()
      else feedback.impactOccurred('light')
    },
    [telegram],
  )

  const openExternal = useCallback(
    (address: string) => {
      let url: URL
      try {
        url = new URL(address, window.location.href)
      } catch {
        return
      }
      if (!telegram) {
        window.open(url.href, '_blank', 'noopener')
      } else if (url.protocol === 'https:' && url.hostname === TELEGRAM_HOST) {
        telegram.openTelegramLink(url.href)
      } else if (url.protocol === 'https:' || url.protocol === 'http:') {
        telegram.openLink(url.href)
      }
    },
    [telegram],
  )

  useEffect(() => {
    if (!telegram) return
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      const link = target?.closest<HTMLAnchorElement>('a[href]')
      if (link && (link.target === '_blank' || link.origin !== window.location.origin)) {
        event.preventDefault()
        haptic()
        openExternal(link.href)
        return
      }
      if (target?.closest('a[href], button, [data-haptic]')) haptic('selection')
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [telegram, haptic, openExternal])

  const value = useMemo(() => ({ telegram, haptic, openExternal }), [telegram, haptic, openExternal])
  return <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>
}
