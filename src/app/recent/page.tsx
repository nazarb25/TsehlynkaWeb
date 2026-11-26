import type { Metadata } from 'next'
import Link from 'next/link'

import { PersonalRow } from '@/components/mini/SetRows'
import { ClearRecent } from '@/components/personal/ClearRecent'
import { PersonalPage } from '@/components/personal/PersonalPage'
import { SignInState } from '@/components/personal/SignInState'
import { recentSets } from '@/lib/api/account'
import { personalSession } from '@/lib/auth/personal'
import { plural } from '@/lib/format'

export const metadata: Metadata = {
  title: 'Нещодавно переглянуті',
  robots: { index: false, follow: false },
}

/** Нещодавно переглянуті, як у Mini App: до 30 наборів і очищення історії. */
export default async function RecentPage() {
  const personal = await personalSession('/recent')
  if (!personal) {
    return (
      <PersonalPage>
        <SignInState title="Увійдіть, щоб бачити історію" hint="Переглянуті набори зберігаються у вашому акаунті Telegram." />
      </PersonalPage>
    )
  }
  const items = (await recentSets(personal.session)) ?? []

  return (
    <PersonalPage>
      <div className="c-personal">
        <h1 className="c-personal__title">Нещодавно переглянуті</h1>
        {items.length ? (
          <>
            <p className="c-personal__count c-personal__count--lead">
              {items.length} {plural(items.length, 'набір', 'набори', 'наборів')}
            </p>
            <div className="c-urows">
              {items.map((item) => (
                <PersonalRow key={item.id} item={item} />
              ))}
            </div>
            <ClearRecent />
          </>
        ) : (
          <section className="c-state c-state--screen">
            <span className="c-state__icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <circle cx="12" cy="12" r="8.5" />
                <path d="M12 7.5V12l3 2" />
              </svg>
            </span>
            <h2 className="c-state__title">Тут з&apos;являться переглянуті набори</h2>
            <Link className="c-state__action c-state__action--honey" href="/catalog">
              Переглянути каталог
            </Link>
          </section>
        )}
      </div>
    </PersonalPage>
  )
}
