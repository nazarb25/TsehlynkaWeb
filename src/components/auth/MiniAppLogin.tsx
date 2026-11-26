'use client'

import * as Sentry from '@sentry/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'

import { usePlatform } from '@/components/platform/TelegramBridge'

import { useAuth } from './AuthProvider'

/** У Mini App сайт входить сам, як бот: один раз передає init data на сервер і оновлює сторінку; кнопки «Вийти» там немає. */
export function MiniAppLogin() {
  const { telegram } = usePlatform()
  const { account } = useAuth()
  const router = useRouter()
  const started = useRef(false)

  useEffect(() => {
    if (!telegram || account || started.current || !telegram.initData) return
    started.current = true
    fetch('/auth/mini-app', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData: telegram.initData }),
    })
      .then((response) => {
        if (response.ok) router.refresh()
        else Sentry.logger.warn('Mini App login rejected', { status: response.status })
      })
      .catch((error) => Sentry.captureException(error))
  }, [telegram, account, router])

  return null
}
