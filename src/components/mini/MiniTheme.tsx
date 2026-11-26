import Link from 'next/link'
import { Fragment } from 'react'

import type { SetItem, Theme } from '@/lib/api/types'
import { plural } from '@/lib/format'
import { themePath } from '@/lib/routes'

import { SetRow } from './SetRows'

interface MiniThemeProps {
  theme: Theme
  parents: Theme[]
  subthemes: Theme[]
  sets: SetItem[]
  catalogPath: string
  specializedPath: string
}

function CrumbChevron() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  )
}

/** Сторінка теми Mini App: шлях, фото, факти, «Переглянути всі набори», підтеми й найновіші набори. */
export function MiniTheme({ theme, parents, subthemes, sets, catalogPath, specializedPath }: MiniThemeProps) {
  const hero = theme.image?.large ?? theme.image?.medium
  const specialized = theme.specialized_set_count
  return (
    <div className="c-tpage">
      <nav className="c-crumbs" aria-label="Шлях до теми">
        <Link href="/themes">Теми LEGO</Link>
        {parents.map((parent) => (
          <Fragment key={parent.id}>
            <CrumbChevron />
            <Link href={themePath(parent)}>{parent.name}</Link>
          </Fragment>
        ))}
      </nav>

      {hero ? (
        <span className="c-photo-stage c-tpage__hero">
          <img className="c-photo-stage__photo" src={hero} alt="" decoding="async" />
        </span>
      ) : null}

      <h1 className="c-tpage__name">{theme.name}</h1>
      <p className="c-tpage__info">
        <span>
          {theme.set_count} {plural(theme.set_count, 'набір', 'набори', 'наборів')}
        </span>
        {theme.first_set_year ? (
          <span>{theme.first_set_year === theme.last_set_year ? theme.first_set_year : `${theme.first_set_year}–${theme.last_set_year}`}</span>
        ) : null}
        {theme.is_current ? (
          <span className="c-tpage__current">
            <i aria-hidden="true" />
            Актуальна
          </span>
        ) : (
          <span className="c-tpage__archive">Архівна тема</span>
        )}
      </p>

      <Link className="c-primary c-tpage__cta" href={catalogPath}>
        Переглянути всі набори
      </Link>
      {specialized ? (
        <Link className="c-tpage__more" href={specializedPath}>
          Ще {specialized} {plural(specialized, 'спеціальний набір', 'спеціальні набори', 'спеціальних наборів')}
        </Link>
      ) : null}

      {subthemes.length ? (
        <section className="c-hsec">
          <h2 className="c-hsec__title">Підтеми</h2>
          <div className="c-subthemes">
            {subthemes.map((child) => {
              const src = child.image?.thumb ?? child.image?.medium
              return (
                <Link key={child.id} className="c-subtheme" href={themePath(child)}>
                  <span className="c-photo-stage c-theme-image c-subtheme__image">
                    {src ? (
                      <img className="c-photo-stage__photo" src={src} alt="" loading="lazy" decoding="async" />
                    ) : (
                      <svg
                        width="18"
                        height="18"
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
                  <span className="c-subtheme__text">
                    <b>{child.name}</b>
                    <small>
                      {child.set_count} {plural(child.set_count, 'набір', 'набори', 'наборів')}
                    </small>
                  </span>
                  <svg
                    className="c-subtheme__chevron"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="m9 6 6 6-6 6" />
                  </svg>
                </Link>
              )
            })}
          </div>
        </section>
      ) : null}

      {sets.length ? (
        <section className="c-hsec">
          <div className="c-hsec__head">
            <h2 className="c-hsec__title">{theme.is_current ? 'Новіші набори' : 'Останні набори'}</h2>
            <Link className="c-hsec__all" href={catalogPath}>
              Усі
            </Link>
          </div>
          <div className="c-urows">
            {sets.map((item) => (
              <SetRow key={item.id} item={item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
