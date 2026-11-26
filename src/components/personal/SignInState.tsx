'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import { usePlatform } from '@/components/platform/TelegramBridge'

/** Порожній стан особистого екрана до входу; у Mini App вхід відбувається сам. */
export function SignInState({ title, hint }: { title: string; hint: string }) {
  const { openLogin } = useAuth()
  const { telegram } = usePlatform()
  return (
    <section className="c-state c-state--screen">
      <span className="c-state__icon">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="8.5" r="3.5" />
          <path d="M5 20a7 7 0 0 1 14 0" />
        </svg>
      </span>
      <h1 className="c-state__title">{title}</h1>
      <p className="c-state__hint">{hint}</p>
      {telegram ? null : (
        <button type="button" className="c-state__action c-state__action--honey" onClick={() => openLogin()}>
          Увійти з Telegram
        </button>
      )}
    </section>
  )
}
