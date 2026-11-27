'use client'

import * as Sentry from '@sentry/nextjs'
import Link from 'next/link'
import { useEffect } from 'react'

import { track } from '@/lib/analytics'

import { AlertIcon } from '@/components/icons'
import { EmptyState } from '@/components/ui/EmptyState'
import { FeedbackButton } from '@/components/ui/FeedbackButton'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error)
    track('error_shown', { error_code: 'page_error', route_group: window.location.pathname.split('/')[1] || 'home' })
  }, [error])

  return (
    <div className="wrap error-page">
      <EmptyState icon={<AlertIcon size={26} />} title="Щось пішло не так" text="Сторінка не завантажилась. Спробуйте ще раз або поверніться на головну.">
        <button type="button" className="button button--primary" onClick={reset}>
          Спробувати ще раз
        </button>
        <Link className="button button--surface" href="/">
          На головну
        </Link>
        <FeedbackButton />
      </EmptyState>
    </div>
  )
}
