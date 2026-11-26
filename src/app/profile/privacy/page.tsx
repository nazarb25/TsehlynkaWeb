import type { Metadata } from 'next'

import { PersonalPage } from '@/components/personal/PersonalPage'

export const metadata: Metadata = {
  title: 'Конфіденційність',
  description: 'Які дані зберігає Цеглинка, навіщо вони потрібні і як їх видалити.',
  alternates: { canonical: '/profile/privacy' },
}

export default function PrivacyPage() {
  return (
    <PersonalPage>
      <div className="c-personal c-article">
        <h1 className="c-personal__title">Конфіденційність</h1>

        <h2 className="c-article__heading">Вхід</h2>
        <p>Окремої реєстрації немає: Цеглинка бачить ім&apos;я, прізвище, username і мову з вашого профілю Telegram.</p>

        <h2 className="c-article__heading">Що ми зберігаємо</h2>
        <p>Обране, стеження за ціною й 30 останніх переглянутих наборів. Вони потрібні, щоб ці списки були на будь-якому пристрої.</p>
        <p>Email, телефон і дату народження можна вказати за бажанням. Для користування каталогом вони не потрібні.</p>

        <h2 className="c-article__heading">На сайті</h2>
        <p>
          Після входу сайт зберігає у браузері cookie сесії, щоб ви лишалися в акаунті. Ще ми збираємо знеособлену статистику відвідувань і звіти про помилки,
          щоб виправляти збої.
        </p>

        <h2 className="c-article__heading">Як видалити</h2>
        <p>
          Історію переглядів очищає «Очистити історію». Особисті дані видаляє кнопка «Видалити всі особисті дані» в профілі. Обране й стеження прибираються з
          відповідних списків.
        </p>

        <h2 className="c-article__heading">Магазини</h2>
        <p>Перехід «До магазину» відкриває сайт магазину. Ваших даних з Telegram ми магазинам не передаємо.</p>
      </div>
    </PersonalPage>
  )
}
