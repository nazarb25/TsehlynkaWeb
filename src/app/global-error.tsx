'use client'

import * as Sentry from '@sentry/nextjs'
import Link from 'next/link'
import { useEffect } from 'react'

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="uk">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center', padding: 24 }}>
          <h1 style={{ fontSize: 22 }}>Щось пішло не так</h1>
          <p style={{ color: '#676d77' }}>Спробуйте оновити сторінку за хвилину.</p>
          <Link href="/" style={{ color: '#2481cc' }}>
            На головну
          </Link>
        </div>
      </body>
    </html>
  )
}
