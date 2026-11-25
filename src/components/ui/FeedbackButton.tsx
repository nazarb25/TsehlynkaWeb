'use client'

import * as Sentry from '@sentry/nextjs'
import { useState } from 'react'

/** Відкриває форму Sentry User Feedback; без Sentry кнопки немає. */
export function FeedbackButton({ className = 'button button--surface' }: { className?: string }) {
  const [busy, setBusy] = useState(false)
  const feedback = Sentry.getFeedback()
  if (!feedback) return null
  return (
    <button
      type="button"
      className={className}
      disabled={busy}
      onClick={async () => {
        setBusy(true)
        try {
          const form = await feedback.createForm()
          form.appendToDom()
          form.open()
        } finally {
          setBusy(false)
        }
      }}
    >
      Повідомити про проблему
    </button>
  )
}
