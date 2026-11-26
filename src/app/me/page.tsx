import type { Metadata } from 'next'
import Link from 'next/link'

import { Chevron } from '@/components/mini/icons'
import { PersonalPage } from '@/components/personal/PersonalPage'
import { SignInState } from '@/components/personal/SignInState'
import { TILE, TileIcon } from '@/components/personal/icons'
import { countPriceAlerts } from '@/lib/api/account'
import { initial } from '@/lib/auth/guards'
import { personalSession } from '@/lib/auth/personal'
import { botUrl } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Моє',
  robots: { index: false, follow: false },
}

/** «Моє», як у Mini App: профіль і особисті списки. */
export default async function MePage() {
  const personal = await personalSession('/me')
  if (!personal) {
    return (
      <PersonalPage>
        <SignInState title="Увійдіть, щоб бачити своє" hint="Обране, стеження за ціною, історія переглядів і профіль зберігаються у вашому акаунті Telegram." />
      </PersonalPage>
    )
  }
  const { profile } = personal
  const alerts = await countPriceAlerts(personal.session)
  const chat = botUrl()
  return (
    <PersonalPage>
      <div className="c-personal">
        <h1 className="c-personal__title">Моє</h1>

        <div className="c-list">
          <Link className="c-list__row c-list__row--profile" href="/profile">
            <span className="c-avatar c-avatar--large" aria-hidden="true">
              {initial(profile.first_name)}
            </span>
            <span className="c-list__who">
              <b>{profile.first_name}</b>
              {profile.username ? <span>@{profile.username}</span> : null}
            </span>
            <Chevron />
          </Link>
        </div>

        <div className="c-list">
          <Link className="c-list__row" href="/price-alerts">
            <span className="c-list__tile c-list__tile--orange">
              <TileIcon path={TILE.bell} />
            </span>
            <span className="c-list__label">Стежу за ціною</span>
            {alerts !== null ? <span className="c-list__value">{alerts}</span> : null}
            <Chevron />
          </Link>
          <Link className="c-list__row" href="/recent">
            <span className="c-list__tile c-list__tile--purple">
              <TileIcon path={TILE.clock} />
            </span>
            <span className="c-list__label">Нещодавно переглянуті</span>
            <span className="c-list__value">{profile.recently_viewed_count}</span>
            <Chevron />
          </Link>
        </div>
        <p className="c-list__note">
          Сповіщення про ціну надходять у{' '}
          {chat ? (
            <a href={chat} target="_blank" rel="noopener" data-track="telegram_opened" data-track-place="me">
              чат із ботом
            </a>
          ) : (
            'чат із ботом'
          )}
          .
        </p>
      </div>
    </PersonalPage>
  )
}
