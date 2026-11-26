import type { Metadata } from 'next'
import Link from 'next/link'

import { ClearPersonalData } from '@/components/personal/ClearPersonalData'
import { PersonalPage } from '@/components/personal/PersonalPage'
import { SignInState } from '@/components/personal/SignInState'
import type { PersonalField } from '@/lib/api/account'
import { personalSession } from '@/lib/auth/personal'
import { displayValue, filledCount, PERSONAL_FIELDS } from '@/lib/personal'

export const metadata: Metadata = {
  title: 'Особисті дані',
  robots: { index: false, follow: false },
}

const FIELDS: PersonalField[] = ['email', 'phone', 'birth_date']

/** Особисті дані, як у Mini App: email, телефон і дата народження. */
export default async function PersonalDataPage() {
  const personal = await personalSession('/profile/personal-data')
  if (!personal) {
    return (
      <PersonalPage>
        <SignInState title="Увійдіть, щоб змінити особисті дані" hint="Особисті дані зберігаються у вашому акаунті й бачите їх лише ви." />
      </PersonalPage>
    )
  }
  const data = personal.profile.personal_data

  return (
    <PersonalPage>
      <div className="c-personal">
        <h1 className="c-personal__title">Особисті дані</h1>
        <p className="c-personal__lead">Необов&apos;язкові. Для користування каталогом не потрібні.</p>

        <div className="c-list c-list--plain c-list--flush">
          {FIELDS.map((field) => {
            const value = displayValue(data, field)
            return (
              <Link key={field} className="c-list__row" href={`/profile/personal-data/${field}`}>
                <span className="c-list__label">{PERSONAL_FIELDS[field].label}</span>
                <span className={`c-list__value${value ? '' : ' c-list__value--empty'}`}>{value || 'Не вказано'}</span>
              </Link>
            )
          })}
        </div>

        {filledCount(data) ? <ClearPersonalData /> : null}
      </div>
    </PersonalPage>
  )
}
