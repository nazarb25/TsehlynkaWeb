import type { Metadata } from 'next'
import Link from 'next/link'

import { AlertsList } from '@/components/alerts/AlertsList'
import { PersonalPage } from '@/components/personal/PersonalPage'
import { SignInState } from '@/components/personal/SignInState'
import { listPriceAlerts, PRICE_ALERT_LIMIT } from '@/lib/api/account'
import { personalSession } from '@/lib/auth/personal'
import { plural } from '@/lib/format'
import { botUrl } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Стежу за ціною',
  robots: { index: false, follow: false },
}

/** «Стежу за ціною», як у Mini App: стеження, умова сповіщення й дзвіночок. */
export default async function PriceAlertsPage() {
  const personal = await personalSession('/price-alerts')
  if (!personal) {
    return (
      <PersonalPage>
        <SignInState title="Увійдіть, щоб стежити за цінами" hint="Сповіщення про зниження ціни надходять у Telegram від бота Цеглинки." />
      </PersonalPage>
    )
  }
  const page = await listPriceAlerts(personal.session, 0)
  const items = page?.items ?? []
  const total = page?.total ?? 0
  const chat = botUrl()

  return (
    <PersonalPage>
      <div className="c-personal">
        <h1 className="c-personal__title">Стежу за ціною</h1>
        {items.length ? (
          <>
            <p className="c-personal__count c-personal__count--lead">
              {total} {plural(total, 'набір', 'набори', 'наборів')} з {PRICE_ALERT_LIMIT}
            </p>
            <p className="c-personal__lead">
              Повідомлення надходять у{' '}
              {chat ? (
                <a href={chat} target="_blank" rel="noopener" data-track="telegram_opened" data-track-place="price_alerts">
                  чат із ботом
                </a>
              ) : (
                'чат із ботом'
              )}
              .
            </p>
            <AlertsList initial={items} total={total} />
          </>
        ) : (
          <section className="c-state c-state--screen">
            <span className="c-state__icon">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8" />
                <path d="M10 20a2 2 0 0 0 4 0" />
              </svg>
            </span>
            <h2 className="c-state__title">Ви ще ні за чим не стежите</h2>
            <p className="c-state__hint">Виберіть набір і натисніть «Стежити за ціною». Повідомлення прийде в чат із ботом.</p>
            <Link className="c-state__action c-state__action--honey" href="/catalog">
              Знайти набір
            </Link>
          </section>
        )}
      </div>
    </PersonalPage>
  )
}
