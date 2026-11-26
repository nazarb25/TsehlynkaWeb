'use client'

import Link from 'next/link'

import { usePlatform } from '@/components/platform/TelegramBridge'

import { useAuth } from './AuthProvider'

/**
 * Аватарка з першою літерою імені, як у боті, або «Увійти» до входу. У Mini App кнопки входу
 * немає: сайт входить сам за init data.
 */
export function AccountButton({ variant }: { variant: 'home' | 'header' }) {
  const { account, openLogin } = useAuth()
  const { telegram } = usePlatform()

  if (account) {
    return variant === 'home' ? (
      <Link className="c-avatar" href="/profile" aria-label="Профіль">
        {account.initial}
      </Link>
    ) : (
      <Link className="header__account" href="/profile">
        <span className="header__avatar" aria-hidden="true">
          {account.initial}
        </span>
        <span>{account.name}</span>
      </Link>
    )
  }
  if (telegram) return null
  return (
    <button type="button" className={variant === 'home' ? 'c-home__login login-trigger' : 'header__login login-trigger'} onClick={() => openLogin()}>
      Увійти
    </button>
  )
}
