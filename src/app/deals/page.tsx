import type { Metadata } from 'next'

import { CatalogView } from '@/components/catalog/CatalogView'
import { DEALS, parseFilters } from '@/lib/catalog/filters'
import { listMetadata } from '@/lib/catalog/meta'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

const HINT = 'Набори, які зараз дешевші за звичайну ціну магазину'

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const filters = parseFilters(await searchParams, DEALS)
  return listMetadata(filters, DEALS, 'Знижки на LEGO', 'Набори LEGO зі знижкою в українських магазинах: стара й нова ціна, відсоток знижки й наявність.')
}

export default async function DealsPage({ searchParams }: Props) {
  const filters = parseFilters(await searchParams, DEALS)
  return <CatalogView sectionKey="deals" filters={filters} title="Зі знижкою" hint={HINT} crumbs={[{ name: 'Зі знижкою' }]} />
}
