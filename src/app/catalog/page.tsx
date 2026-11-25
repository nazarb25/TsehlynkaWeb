import type { Metadata } from 'next'

import { CatalogView } from '@/components/catalog/CatalogView'
import { CATALOG, hint, parseFilters } from '@/lib/catalog/filters'
import { listMetadata } from '@/lib/catalog/meta'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const filters = parseFilters(await searchParams, CATALOG)
  return filters.mode === 'all'
    ? listMetadata(filters, CATALOG, 'Усі набори LEGO', 'Повний каталог наборів LEGO українською: від перших років до новинок, з темами, складом і фігурками.')
    : listMetadata(filters, CATALOG, 'Набори LEGO в продажу', 'Набори LEGO, які зараз можна купити в українських магазинах: ціни, знижки й наявність в одному місці.')
}

export default async function CatalogPage({ searchParams }: Props) {
  const filters = parseFilters(await searchParams, CATALOG)
  return <CatalogView sectionKey="catalog" filters={filters} title="Набори LEGO" hint={hint(filters)} crumbs={[{ name: 'Каталог' }]} modes />
}
