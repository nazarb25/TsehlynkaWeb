import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { getProfile } from '@/lib/api/account'
import { initial, sessionToken } from '@/lib/auth/session'

export const metadata: Metadata = {
  title: 'Профіль',
  robots: { index: false, follow: false },
}

const LANGUAGES: Record<string, string> = { uk: 'Українська', en: 'Англійська', pl: 'Польська', de: 'Німецька', ru: 'Російська' }

function languageName(code: string | null): string | null {
  if (!code) return null
  return LANGUAGES[(code.split('-')[0] ?? code).toLowerCase()] ?? code
}

function LogoutForm({ className }: { className: string }) {
  return (
    <form action="/auth/logout" method="post">
      <button type="submit" className={className}>
        Вийти
      </button>
    </form>
  )
}

/** Профіль, як у Mini App: поля з Telegram і вихід. */
export default async function ProfilePage() {
  const token = await sessionToken()
  const profile = token ? await getProfile(token) : null
  if (!profile) redirect('/login?next=/profile')

  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ')
  const language = languageName(profile.language_code)
  const rows: [string, string][] = [
    ["Ім'я", profile.first_name],
    ...(profile.last_name ? [['Прізвище', profile.last_name] as [string, string]] : []),
    ...(profile.username ? [['Username', `@${profile.username}`] as [string, string]] : []),
    ...(language ? [['Мова', language] as [string, string]] : []),
  ]

  return (
    <>
      <div className="m-only">
        <div className="c-personal">
          <header className="c-profile">
            <span className="c-profile__avatar" aria-hidden="true">
              {initial(profile.first_name)}
            </span>
            <h1 className="c-profile__name">{fullName}</h1>
            {profile.username ? <span className="c-profile__username">@{profile.username}</span> : null}
          </header>
          <h2 className="c-list__caption">З Telegram</h2>
          <div className="c-list c-list--plain c-list--flush">
            {rows.map(([label, value]) => (
              <div key={label} className="c-list__row">
                <span className="c-list__label">{label}</span>
                <span className="c-list__value">{value}</span>
              </div>
            ))}
          </div>
          <LogoutForm className="c-wide-button c-wide-button--danger" />
        </div>
      </div>
      <div className="wrap d-only">
        <div className="account">
          <header className="account__head">
            <span className="account__avatar" aria-hidden="true">
              {initial(profile.first_name)}
            </span>
            <h1 className="account__name">{fullName}</h1>
            {profile.username ? <span className="account__username">@{profile.username}</span> : null}
          </header>
          <h2 className="account__caption">З Telegram</h2>
          <dl className="account__list">
            {rows.map(([label, value]) => (
              <div key={label} className="account__row">
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <LogoutForm className="account__logout" />
        </div>
      </div>
    </>
  )
}
