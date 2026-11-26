import type { Metadata } from 'next'

import { CatalogView } from '@/components/catalog/CatalogView'
import { BrickIcon } from '@/components/icons'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { EmptyState } from '@/components/ui/EmptyState'
import { SearchField } from '@/components/ui/SearchField'
import { MiniSearch } from '@/components/mini/MiniSearch'
import { hint, parseFilters, SEARCH } from '@/lib/catalog/filters'
import { pageMetadata } from '@/lib/seo'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const filters = parseFilters(await searchParams, SEARCH)
  const title = filters.q ? `Пошук: ${filters.q}` : 'Пошук наборів'
  return pageMetadata({ title, description: 'Пошук наборів LEGO за номером, назвою, темою чи персонажем.', path: '/search', noindex: true })
}

export default async function SearchPage({ searchParams }: Props) {
  const filters = parseFilters(await searchParams, SEARCH)
  if (!filters.q) {
    return (
      <>
        <div className="m-only">
          <MiniSearch filters={filters} initial={null} chips={[]} />
        </div>
        <div className="wrap d-only">
        <Breadcrumbs items={[{ name: 'Пошук' }]} />
        <div className="page-head">
          <h1>Пошук наборів</h1>
        </div>
        <SearchField className="search-page__field" button autoFocus />
        <div className="search-page__empty">
          <EmptyState icon={<BrickIcon size={28} />} title="Що шукаємо?" text="Введіть номер набору, назву, тему чи персонажа: наприклад, 75192, «Сокіл» або Ninjago." />
        </div>
      </div>
      </>
    )
  }
  return (
    <CatalogView
      sectionKey="search"
      filters={filters}
      title={`Результати за «${filters.q}»`}
      hint={hint(filters)}
      crumbs={[{ name: 'Пошук' }]}
      modes
    />
  )
}
