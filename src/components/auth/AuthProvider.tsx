'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'

import { LoginDialog } from './LoginDialog'

export interface AccountView {
  name: string
  username: string | null
  initial: string
}

interface Auth {
  account: AccountView | null
  /** Відкрити вікно входу; після входу користувач повернеться на `next` (типово поточна сторінка). */
  openLogin(next?: string): void
}

const AuthContext = createContext<Auth>({ account: null, openLogin: () => {} })

export function useAuth(): Auth {
  return useContext(AuthContext)
}

export function AuthProvider({ account, children }: { account: AccountView | null; children: React.ReactNode }) {
  const [loginNext, setLoginNext] = useState<string | null>(null)

  const openLogin = useCallback((next?: string) => {
    setLoginNext(next ?? `${window.location.pathname}${window.location.search}`)
  }, [])
  const close = useCallback(() => setLoginNext(null), [])
  const value = useMemo(() => ({ account, openLogin }), [account, openLogin])

  return (
    <AuthContext.Provider value={value}>
      {children}
      <LoginDialog next={loginNext} onClose={close} />
    </AuthContext.Provider>
  )
}
