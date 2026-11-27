import type { Metadata } from 'next'

import { Chevron } from '@/components/mini/icons'
import { PersonalPage } from '@/components/personal/PersonalPage'
import { supportUrl } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Про Цеглинку',
  description: 'Цеглинка — каталог наборів конструктора з цінами українських магазинів.',
  alternates: { canonical: '/profile/about' },
}

export default function AboutPage() {
  const support = supportUrl()
  return (
    <PersonalPage>
      <div className="c-personal">
        <header className="c-profile">
          <svg className="c-logo c-logo--large" viewBox="13 9 76 76" aria-hidden="true" focusable="false">
            <g fill="none" strokeLinecap="round">
              <circle cx="49.4" cy="52.2" r="22.7" stroke="currentColor" strokeWidth="5.6" />
              <path d="M33.5 70 23.5 80.5" stroke="currentColor" strokeWidth="6.5" />
              <path d="M64.8 15.2 61.6 23.5M75 19.9l-6.8 8M81.3 29.9l-7.5 4" stroke="var(--color-honey)" strokeWidth="5.5" />
            </g>
            <g fill="var(--color-honey)">
              <rect x="33.3" y="47" width="32.9" height="12.2" rx="2" />
              <rect x="36.9" y="42.9" width="6.8" height="5.4" rx="1.2" />
              <rect x="46.5" y="42.9" width="6.8" height="5.4" rx="1.2" />
              <rect x="56.1" y="42.9" width="6.8" height="5.4" rx="1.2" />
            </g>
          </svg>
          <h1 className="c-profile__name">Цеглинка</h1>
        </header>

        <div className="c-list c-list--plain">
          <p className="c-list__text">
            Цеглинка — каталог наборів конструктора з цінами українських магазинів. Тут можна знайти набір за номером чи назвою, переглянути його склад і
            порівняти пропозиції магазинів.
          </p>
        </div>
        {support ? (
          <div className="c-list c-list--plain">
            <a className="c-list__row" href={support} target="_blank" rel="noopener">
              <span className="c-list__label">Звернутися до підтримки</span>
              <Chevron />
            </a>
          </div>
        ) : null}
        <p className="c-menu-footnote c-legal">
          Цеглинка — незалежний каталог: вона не пов&apos;язана з виробниками конструкторів і не продає товари. Назви наборів і тем показано лише для того, щоб
          описати товар.
        </p>
        <p className="c-menu-footnote c-trademark">
          LEGO® — торгова марка групи компаній LEGO. Цеглинка — незалежний неофіційний проєкт, не пов&apos;язаний із групою компаній LEGO і не спонсорований
          нею. Зображення наборів і фігурок та інструкції захищені авторським правом групи компаній LEGO.
        </p>
      </div>
    </PersonalPage>
  )
}
