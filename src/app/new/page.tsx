import type { Metadata } from 'next'

import { CatalogView } from '@/components/catalog/CatalogView'
import { NEWEST, NEWEST_HINT, parseFilters } from '@/lib/catalog/filters'
import { listMetadata } from '@/lib/catalog/meta'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const filters = parseFilters(await searchParams, NEWEST)
  return listMetadata(filters, NEWEST, 'Новинки LEGO', 'Нові набори LEGO за останні пів року й ті, що скоро вийдуть: дати виходу, теми й кількість деталей.')
}

export default async function NewestPage({ searchParams }: Props) {
  const filters = parseFilters(await searchParams, NEWEST)
  return <CatalogView sectionKey="new" filters={filters} title="Новинки" hint={NEWEST_HINT} crumbs={[{ name: 'Новинки' }]} />
}
