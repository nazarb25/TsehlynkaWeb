import type { Metadata } from 'next'
import Link from 'next/link'

import { PersonalPage } from '@/components/personal/PersonalPage'
import { contactEmail, mailtoHref } from '@/lib/contacts'
import { botUsername, siteUrl } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Політика конфіденційності',
  description: 'Які дані збирає Цеглинка, навіщо, кому їх передає і як їх видалити.',
  alternates: { canonical: '/privacy' },
}

const UPDATED = 'Оновлено 27 листопада 2026'

export default function PrivacyPage() {
  const email = contactEmail()
  const bot = botUsername()
  const host = new URL(siteUrl()).host
  return (
    <PersonalPage>
      <div className="c-personal c-article">
        <h1 className="c-personal__title">Політика конфіденційності</h1>
        <p className="c-article__date">{UPDATED}</p>

        <h2 className="c-article__heading">Хто ми</h2>
        <p>
          Цеглинка — незалежний каталог наборів конструктора: сайт {host}
          {bot ? ` і бот @${bot} у Telegram` : ''}. З питань про ваші дані пишіть{' '}
          {email ? (
            <>
              на <a href={mailtoHref(email)}>{email}</a>
            </>
          ) : (
            <>
              через <Link href="/contacts">контакти</Link>
            </>
          )}
          .
        </p>

        <h2 className="c-article__heading">Які дані ми збираємо</h2>
        <ul className="c-article__list">
          <li>
            <b>Профіль Telegram.</b> Під час входу: ідентифікатор, ім&apos;я, прізвище, username і мова. Окремої реєстрації й пароля немає.
          </li>
          <li>
            <b>Ваші списки.</b> Обране, стеження за ціною і 30 останніх переглянутих наборів.
          </li>
          <li>
            <b>За бажанням.</b> Email, телефон і дата народження, якщо ви вкажете їх у профілі.
          </li>
          <li>
            <b>На сайті.</b> Cookie сесії, знеособлена статистика відвідувань і звіти про помилки.
          </li>
        </ul>

        <h2 className="c-article__heading">Навіщо</h2>
        <p>Щоб ваші списки були на будь-якому пристрої, щоб надсилати сповіщення про ціну в Telegram і щоб знаходити й виправляти збої.</p>

        <h2 className="c-article__heading">Кому передаємо</h2>
        <p>
          Ми не продаємо дані й не передаємо їх магазинам. Статистику обробляє PostHog, звіти про помилки — Sentry. Перехід «До магазину» відкриває сайт
          магазину, і далі діють його правила.
        </p>

        <h2 className="c-article__heading">Скільки зберігаємо</h2>
        <p>Поки у вас є акаунт або доки ви не видалите дані самі.</p>

        <h2 className="c-article__heading">Як видалити</h2>
        <p>
          Історію переглядів очищає «Очистити історію». Особисті дані видаляє кнопка «Видалити всі особисті дані» в профілі. Обране й стеження прибираються з
          відповідних списків. Щоб видалити акаунт повністю, <Link href="/contacts">напишіть нам</Link>.
        </p>

        <h2 className="c-article__heading">Зміни</h2>
        <p>Якщо політика зміниться, ми оновимо її тут і змінимо дату вгорі.</p>
      </div>
    </PersonalPage>
  )
}
