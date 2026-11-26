import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { LoginPanel } from '@/components/auth/LoginPanel'
import { currentAccount, safeNext } from '@/lib/auth/session'

export const metadata: Metadata = {
  title: 'Вхід',
  robots: { index: false, follow: false },
}

interface LoginPageProps {
  searchParams: Promise<{ next?: string; error?: string }>
}

/** Запасна сторінка входу для прямих посилань і помилок входу; зазвичай вхід відкривається вікном. */
export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next, error } = await searchParams
  const target = safeNext(next)
  if (!error && (await currentAccount())) redirect(target)
  return (
    <div className="login-page">
      <LoginPanel next={target} error={error ?? null} />
    </div>
  )
}
