import 'server-only'

import { cookies } from 'next/headers'
import type { NextResponse } from 'next/server'

import type { OpenedSession, Profile } from '@/lib/api/account'
import { siteUrl } from '@/lib/site'

export { initial, safeNext, sameOrigin } from './guards'

const SESSION_COOKIE = 'ts_session'
const ACCOUNT_COOKIE = 'ts_account'

/** Що сайт знає про користувача без запиту до API: ім'я для аватарки. */
export interface Account {
  name: string
  username: string | null
}

export function secureCookies(): boolean {
  return siteUrl().startsWith('https://')
}

function parseAccount(raw: string | undefined): Account | null {
  if (!raw) return null
  try {
    const value = JSON.parse(raw) as Partial<Account>
    return typeof value.name === 'string' ? { name: value.name, username: typeof value.username === 'string' ? value.username : null } : null
  } catch {
    return null
  }
}

/** Користувач із cookie; без сесії — `null`. */
export async function currentAccount(): Promise<Account | null> {
  const jar = await cookies()
  if (!jar.get(SESSION_COOKIE)?.value) return null
  return parseAccount(jar.get(ACCOUNT_COOKIE)?.value)
}

export async function sessionToken(): Promise<string | null> {
  return (await cookies()).get(SESSION_COOKIE)?.value || null
}

export function storeSession(response: NextResponse, session: OpenedSession, profile: Profile): void {
  const options = {
    httpOnly: true,
    secure: secureCookies(),
    sameSite: 'lax' as const,
    path: '/',
    expires: new Date(session.expires_at),
  }
  response.cookies.set(SESSION_COOKIE, session.token, options)
  response.cookies.set(ACCOUNT_COOKIE, JSON.stringify({ name: profile.first_name, username: profile.username }), options)
}

export function clearSession(response: NextResponse): void {
  response.cookies.delete(SESSION_COOKIE)
  response.cookies.delete(ACCOUNT_COOKIE)
}

export async function clearSessionCookies(): Promise<void> {
  const jar = await cookies()
  jar.delete(SESSION_COOKIE)
  jar.delete(ACCOUNT_COOKIE)
}
