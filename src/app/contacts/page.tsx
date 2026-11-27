import type { Metadata } from 'next'

import { Chevron } from '@/components/mini/icons'
import { CopyButton } from '@/components/personal/CopyButton'
import { PersonalPage } from '@/components/personal/PersonalPage'
import { TILE, TileIcon } from '@/components/personal/icons'
import { CONTACT_TOPICS, type ContactTopic, contactEmail, contactTelegram, mailtoHref, type TelegramContact } from '@/lib/contacts'

export const metadata: Metadata = {
  title: 'Контакти',
  description: 'Як зв’язатися з Цеглинкою: пошта й Telegram, і з чим можна написати.',
  alternates: { canonical: '/contacts' },
}

const LEAD =
  'Цеглинка — незалежний каталог наборів конструктора з цінами українських магазинів. Ми нічого не продаємо, а допомагаємо знайти набір і порівняти ціни.'
const NOTE = 'Для помилки чи ціни додайте посилання на набір, так виправимо швидше.'

const TOPIC_STYLE: Record<ContactTopic['key'], { icon: string; tone: string }> = {
  shops: { icon: TILE.shop, tone: 'green' },
  catalog: { icon: TILE.alert, tone: 'red' },
  price: { icon: TILE.tag, tone: 'orange' },
  complaint: { icon: TILE.chat, tone: 'purple' },
  idea: { icon: TILE.idea, tone: 'honey' },
}

interface ContactsProps {
  email: string | null
  telegram: TelegramContact | null
}

/** Телефон: як інші довідкові сторінки «Моє». */
function MobileContacts({ email, telegram }: ContactsProps) {
  return (
    <PersonalPage>
      <div className="c-personal c-contacts">
        <h1 className="c-personal__title">Контакти</h1>
        <p className="c-contacts__lead">{LEAD}</p>

        {email || telegram ? (
          <div className="c-list">
            {email ? (
              <a className="c-list__row" href={mailtoHref(email)}>
                <span className="c-list__tile c-list__tile--blue">
                  <TileIcon path={TILE.mail} />
                </span>
                <span className="c-list__label">Пошта</span>
                <span className="c-list__value c-list__value--link">{email}</span>
              </a>
            ) : null}
            {telegram ? (
              <a className="c-list__row" href={telegram.href} target="_blank" rel="noopener">
                <span className="c-list__tile c-list__tile--sky">
                  <TileIcon path={TILE.send} />
                </span>
                <span className="c-list__label">Telegram</span>
                <span className="c-list__value c-list__value--link">{telegram.label}</span>
              </a>
            ) : null}
          </div>
        ) : null}

        {email ? (
          <>
            <h2 className="c-list__caption c-contacts__caption">З чим можна написати</h2>
            <div className="c-list c-list--flush">
              {CONTACT_TOPICS.map((topic) => (
                <a key={topic.key} className="c-list__row c-contacts__topic" href={mailtoHref(email, topic)}>
                  <span className={`c-list__tile c-list__tile--${TOPIC_STYLE[topic.key].tone}`}>
                    <TileIcon path={TOPIC_STYLE[topic.key].icon} />
                  </span>
                  <span className="c-list__who">
                    <b>{topic.title}</b>
                    <span>{topic.hint}</span>
                  </span>
                  <Chevron />
                </a>
              ))}
            </div>
            <p className="c-list__note">{NOTE}</p>
          </>
        ) : null}
      </div>
    </PersonalPage>
  )
}

function ContactCard({ href, tone, icon, caption, label, copy, copyLabel, external }: {
  href: string
  tone: string
  icon: string
  caption: string
  label: string
  copy: string
  copyLabel: string
  external?: boolean
}) {
  return (
    <div className="contacts__card">
      <a className="contacts__card-link" href={href} {...(external ? { target: '_blank', rel: 'noopener' } : {})}>
        <span className={`contacts__icon contacts__icon--${tone}`}>
          <TileIcon path={icon} />
        </span>
        <span className="contacts__card-text">
          <small>{caption}</small>
          <b>{label}</b>
        </span>
      </a>
      <CopyButton value={copy} label={copyLabel} />
    </div>
  )
}

/** Комп'ютер: опис і контакти зліва, теми справа. */
function DesktopContacts({ email, telegram }: ContactsProps) {
  return (
    <div className="wrap contacts">
      <div>
        <h1 className="contacts__title">Контакти</h1>
        <p className="contacts__lead">{LEAD}</p>
        {email || telegram ? (
          <div className="contacts__cards">
            {email ? (
              <ContactCard href={mailtoHref(email)} tone="blue" icon={TILE.mail} caption="Написати на пошту" label={email} copy={email} copyLabel="Скопіювати пошту" />
            ) : null}
            {telegram ? (
              <ContactCard
                href={telegram.href}
                tone="sky"
                icon={TILE.send}
                caption="Написати в Telegram"
                label={telegram.label}
                copy={telegram.href}
                copyLabel="Скопіювати посилання на Telegram"
                external
              />
            ) : null}
          </div>
        ) : null}
      </div>
      {email ? (
        <div className="contacts__main">
          <h2 className="contacts__h2">З чим можна написати</h2>
          <div className="contacts__list">
            {CONTACT_TOPICS.map((topic) => (
              <a key={topic.key} className="contacts__row" href={mailtoHref(email, topic)}>
                <span className={`contacts__icon contacts__icon--${TOPIC_STYLE[topic.key].tone}`}>
                  <TileIcon path={TOPIC_STYLE[topic.key].icon} />
                </span>
                <span className="contacts__row-text">
                  <b>{topic.title}</b>
                  <span>{topic.hint}</span>
                </span>
                <span className="contacts__go">Написати</span>
              </a>
            ))}
          </div>
          <p className="contacts__note">{NOTE}</p>
        </div>
      ) : null}
    </div>
  )
}

export default function ContactsPage() {
  const props = { email: contactEmail(), telegram: contactTelegram() }
  return (
    <>
      <div className="hide-mobile">
        <DesktopContacts {...props} />
      </div>
      <div className="hide-desktop">
        <MobileContacts {...props} />
      </div>
    </>
  )
}
