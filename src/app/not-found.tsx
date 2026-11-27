import type { Metadata } from 'next'
import Link from 'next/link'

import { TrackView } from '@/components/platform/Analytics'
import { SearchField } from '@/components/ui/SearchField'

export const metadata: Metadata = { title: 'Сторінку не знайдено', robots: { index: false } }

export default function NotFound() {
  return (
    <div className="wrap">
      <div className="notfound" data-not-found="">
        <TrackView event="error_shown" properties={{ error_code: '404', route_group: 'not_found' }} />
        <p className="notfound__code num">404</p>
        <h1>Такої сторінки немає</h1>
        <p>Можливо, набір перейменували або посилання з помилкою. Спробуйте знайти його пошуком.</p>
        <SearchField button className="notfound__search" />
        <div className="state__actions">
          <Link className="button button--surface" href="/">
            На головну
          </Link>
          <Link className="button button--surface" href="/catalog">
            До каталогу
          </Link>
        </div>
      </div>
    </div>
  )
}
