import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { PersonalFieldForm } from '@/components/personal/PersonalFieldForm'
import { PersonalPage } from '@/components/personal/PersonalPage'
import { SignInState } from '@/components/personal/SignInState'
import { personalSession } from '@/lib/auth/personal'
import { isPersonalField, PERSONAL_FIELDS } from '@/lib/personal'

interface PersonalFieldPageProps {
  params: Promise<{ field: string }>
}

export async function generateMetadata({ params }: PersonalFieldPageProps): Promise<Metadata> {
  const { field } = await params
  return { title: isPersonalField(field) ? PERSONAL_FIELDS[field].label : 'Особисті дані', robots: { index: false, follow: false } }
}

function kyivToday(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Kyiv' }).format(new Date())
}

/** Одне поле особистих даних, як у Mini App. */
export default async function PersonalFieldPage({ params }: PersonalFieldPageProps) {
  const { field } = await params
  if (!isPersonalField(field)) notFound()
  const personal = await personalSession(`/profile/personal-data/${field}`)
  if (!personal) {
    return (
      <PersonalPage>
        <SignInState title="Увійдіть, щоб змінити особисті дані" hint="Особисті дані зберігаються у вашому акаунті й бачите їх лише ви." />
      </PersonalPage>
    )
  }
  const form = PERSONAL_FIELDS[field]

  return (
    <PersonalPage>
      <header className="c-header">
        <div className="c-header__titles">
          <h1 className="c-header__heading">{form.label}</h1>
          <span className="c-header__hint">Бачите лише ви. Поле можна лишити порожнім.</span>
        </div>
      </header>
      <PersonalFieldForm key={field} field={field} initial={personal.profile.personal_data[field] ?? ''} today={kyivToday()} />
    </PersonalPage>
  )
}
