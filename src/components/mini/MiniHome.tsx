import Link from 'next/link'

import type { SetItem, Theme } from '@/lib/api/types'
import { plural } from '@/lib/format'
import { themePath } from '@/lib/routes'

import { TrademarkNotice } from './icons'
import { DealPrice, ReleaseLine, SetRow } from './SetRows'

interface MiniHomeProps {
  themes: Theme[] | null
  newest: SetItem[] | null
  deals: SetItem[]
  telegramUrl: string | null
}

function Logo() {
  return (
    <svg className="c-logo c-home__logo" viewBox="13 9 76 76" aria-hidden="true" focusable="false">
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
  )
}

function SectionError({ title, message }: { title: string; message: string }) {
  return (
    <section className="c-hsec">
      <h2 className="c-hsec__title">{title}</h2>
      <div className="c-hsec__error">
        <span>{message}</span>
        <Link className="c-hsec__retry" href="/" prefetch={false}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20 12a8 8 0 1 1-2.3-5.7" />
            <path d="M20 4v5h-5" />
          </svg>
          Повторити
        </Link>
      </div>
    </section>
  )
}

function SetsSection({ title, href, items, deal }: { title: string; href: string; items: SetItem[]; deal: boolean }) {
  if (!items.length) return null
  return (
    <section className="c-hsec">
      <div className="c-hsec__head">
        <h2 className="c-hsec__title">{title}</h2>
        <Link className="c-hsec__all" href={href}>
          Усі
        </Link>
      </div>
      <div className="c-urows">
        {items.map((item) =>
          deal && item.best_deal ? (
            <SetRow key={item.id} item={item} price={<DealPrice deal={item.best_deal} />} deal={item.best_deal} />
          ) : (
            <SetRow key={item.id} item={item} price={item.release_date ? <ReleaseLine item={item} /> : null} />
          ),
        )}
      </div>
    </section>
  )
}

/** Головна Mini App: шапка, пошук, швидкі входи, теми, новинки й знижки. */
export function MiniHome({ themes, newest, deals, telegramUrl }: MiniHomeProps) {
  return (
    <div className="c-home">
      <header className="c-home__top">
        <Logo />
        <span className="c-home__brand">Цеглинка</span>
        {telegramUrl ? (
          <a className="c-avatar c-avatar--telegram" href={telegramUrl} aria-label="Відкрити в Telegram">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M20.7 4.3 2.9 11.2c-1.2.5-1.2 1.2-.2 1.5l4.6 1.4 1.7 5.4c.2.6.4.8.9.8.4 0 .6-.2.9-.4l2.2-2.1 4.6 3.4c.8.5 1.4.2 1.6-.8l3-14.1c.3-1.2-.5-1.8-1.5-1.3Zm-3 3.6-8.4 7.6-.3 3.5-1.6-5 9.8-6.3c.4-.3.9 0 .5.2Z" />
            </svg>
          </a>
        ) : null}
      </header>

      <Link className="c-home__search" href="/search">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
        <span>Номер, назва, тема, персонаж</span>
      </Link>

      <nav className="c-quick" aria-label="Швидкі входи">
        <Link className="c-quick__item" href="/themes">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
            <rect x="4" y="4" width="7" height="7" rx="1.5" />
            <rect x="13" y="4" width="7" height="7" rx="1.5" />
            <rect x="4" y="13" width="7" height="7" rx="1.5" />
            <rect x="13" y="13" width="7" height="7" rx="1.5" />
          </svg>
          Усі теми
        </Link>
        <Link className="c-quick__item" href="/new">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z" />
          </svg>
          Новинки
        </Link>
        <Link className="c-quick__item" href="/catalog">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M4 9h16l-1.5 11h-13z" />
            <path d="M9 9V6a3 3 0 0 1 6 0v3" />
          </svg>
          У продажу
        </Link>
        <Link className="c-quick__item" href="/deals">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20 12l-8 8-9-9V3h8z" />
            <circle cx="7.5" cy="7.5" r="1.5" />
          </svg>
          Зі знижкою
        </Link>
      </nav>

      {themes === null ? (
        <SectionError title="Теми LEGO" message="Теми не завантажились" />
      ) : themes.length ? (
        <section className="c-hsec">
          <div className="c-hsec__head">
            <h2 className="c-hsec__title">Теми LEGO</h2>
            <Link className="c-hsec__all" href="/themes">
              Усі
            </Link>
          </div>
          <div className="c-hthemes">
            {themes.map((theme) => {
              const src = theme.image?.thumb ?? theme.image?.medium
              return (
                <Link key={theme.id} className="c-htheme" href={themePath(theme)}>
                  <span className="c-photo-stage c-theme-image c-htheme__image">
                    {src ? (
                      <img className="c-photo-stage__photo" src={src} alt="" loading="lazy" decoding="async" />
                    ) : (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <rect x="3" y="10" width="18" height="9" rx="1.5" />
                        <rect x="6" y="6.5" width="4" height="3.5" rx="1" />
                        <rect x="14" y="6.5" width="4" height="3.5" rx="1" />
                      </svg>
                    )}
                  </span>
                  <span className="c-htheme__text">
                    <b className="c-htheme__name">{theme.name}</b>
                    <small className="c-htheme__count">
                      {theme.set_count} {plural(theme.set_count, 'набір', 'набори', 'наборів')}
                    </small>
                  </span>
                </Link>
              )
            })}
          </div>
        </section>
      ) : null}

      {newest === null ? (
        <SectionError title="Новинки" message="Новинки не завантажились" />
      ) : (
        <SetsSection title="Новинки" href="/new" items={newest} deal={false} />
      )}
      <SetsSection title="Зі знижкою" href="/deals" items={deals} deal />

      <TrademarkNotice />
    </div>
  )
}
