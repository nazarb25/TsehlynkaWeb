import type { Metadata } from 'next'
import Link from 'next/link'

import { HeartIcon } from '@/components/favourites/HeartButton'
import { GridGlyph, ListGlyph } from '@/components/mini/icons'
import { PersonalRow } from '@/components/mini/SetRows'
import { FavouritesMore } from '@/components/personal/FavouritesMore'
import { PersonalPage } from '@/components/personal/PersonalPage'
import { SignInState } from '@/components/personal/SignInState'
import { listFavourites } from '@/lib/api/account'
import { personalSession } from '@/lib/auth/personal'
import { plural } from '@/lib/format'

export const metadata: Metadata = {
  title: 'Обране',
  robots: { index: false, follow: false },
}

interface FavouritesPageProps {
  searchParams: Promise<{ layout?: string }>
}

/** «Обране», як у Mini App: збережені набори списком чи сіткою. */
export default async function FavouritesPage({ searchParams }: FavouritesPageProps) {
  const grid = (await searchParams).layout === 'grid'
  const personal = await personalSession(grid ? '/favourites?layout=grid' : '/favourites')
  if (!personal) {
    return (
      <PersonalPage>
        <SignInState title="Увійдіть, щоб зберігати набори" hint="Обране зберігається у вашому акаунті й однакове на сайті та в боті." />
      </PersonalPage>
    )
  }
  const page = await listFavourites(personal.session, 0)
  const items = page?.items ?? []
  const total = page?.total ?? 0

  return (
    <PersonalPage>
      <div className="c-personal">
        <h1 className="c-personal__title">Обране</h1>
        {items.length ? (
          <>
            <div className="c-personal__bar">
              <span className="c-personal__count">
                {total} {plural(total, 'набір', 'набори', 'наборів')}
              </span>
              <span className="c-views" role="group" aria-label="Вигляд списку">
                <Link
                  className={`c-views__item${grid ? '' : ' is-selected'}`}
                  href="/favourites"
                  replace
                  scroll={false}
                  aria-label="Список"
                  aria-pressed={!grid}
                >
                  <ListGlyph />
                </Link>
                <Link
                  className={`c-views__item${grid ? ' is-selected' : ''}`}
                  href="/favourites?layout=grid"
                  replace
                  scroll={false}
                  aria-label="Сітка"
                  aria-pressed={grid}
                >
                  <GridGlyph size={18} width={2.2} />
                </Link>
              </span>
            </div>
            <div className={grid ? 'c-ugrid' : 'c-urows'}>
              {items.map((item) => (
                <PersonalRow key={item.id} item={item} selected grid={grid} />
              ))}
              <FavouritesMore key={grid ? 'grid' : 'list'} shown={items.map((item) => item.id)} total={total} grid={grid} />
            </div>
          </>
        ) : (
          <section className="c-state c-state--screen">
            <span className="c-state__icon">
              <HeartIcon size={24} width={2} filled={false} />
            </span>
            <h2 className="c-state__title">Тут будуть набори, які ви збережете</h2>
            <p className="c-state__hint">
              Натисніть{' '}
              <svg
                className="c-inline-icon"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinejoin="round"
                aria-label="сердечко"
                role="img"
              >
                <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
              </svg>{' '}
              на наборі, щоб повернутися до нього пізніше
            </p>
            <Link className="c-state__action c-state__action--honey" href="/catalog">
              Перейти до каталогу
            </Link>
          </section>
        )}
      </div>
    </PersonalPage>
  )
}
