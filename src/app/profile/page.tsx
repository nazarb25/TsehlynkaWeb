import type { Metadata } from 'next'
import Link from 'next/link'

import { Chevron } from '@/components/mini/icons'
import { PersonalPage } from '@/components/personal/PersonalPage'
import { SignInState } from '@/components/personal/SignInState'
import { initial } from '@/lib/auth/guards'
import { personalSession } from '@/lib/auth/personal'
import { filledCount } from '@/lib/personal'

export const metadata: Metadata = {
  title: 'Профіль',
  robots: { index: false, follow: false },
}

const LANGUAGES: Record<string, string> = { uk: 'Українська', en: 'Англійська', pl: 'Польська', de: 'Німецька', ru: 'Російська' }

function languageName(code: string | null): string | null {
  if (!code) return null
  return LANGUAGES[(code.split('-')[0] ?? code).toLowerCase()] ?? code
}

/** Профіль, як у Mini App: поля з Telegram, особисті дані й вихід. */
export default async function ProfilePage() {
  const personal = await personalSession('/profile')
  if (!personal) {
    return (
      <PersonalPage>
        <SignInState title="Увійдіть, щоб бачити профіль" hint="Профіль береться з вашого акаунта Telegram." />
      </PersonalPage>
    )
  }
  const { profile } = personal
  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ')
  const language = languageName(profile.language_code)
  const rows: [string, string][] = [
    ["Ім'я", profile.first_name],
    ...(profile.last_name ? [['Прізвище', profile.last_name] as [string, string]] : []),
    ...(profile.username ? [['Username', `@${profile.username}`] as [string, string]] : []),
    ...(language ? [['Мова', language] as [string, string]] : []),
  ]

  return (
    <PersonalPage>
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

        <div className="c-list c-list--plain">
          <Link className="c-list__row" href="/profile/personal-data">
            <span className="c-list__label">Особисті дані</span>
            <span className="c-list__value">Заповнено {filledCount(profile.personal_data)} з 3</span>
            <Chevron />
          </Link>
        </div>
        <p className="c-list__note">Необов&apos;язкові. Для користування каталогом не потрібні.</p>

        <form action="/auth/logout" method="post" className="logout-form">
          <button type="submit" className="c-wide-button c-wide-button--danger">
            Вийти
          </button>
        </form>
      </div>
    </PersonalPage>
  )
}
