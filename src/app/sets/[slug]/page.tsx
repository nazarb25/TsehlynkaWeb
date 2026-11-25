import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { cache, Suspense } from 'react'

import { TrackView } from '@/components/platform/Analytics'
import { JsonLd } from '@/components/seo/JsonLd'
import { BuyPanel } from '@/components/set/BuyPanel'
import { Gallery, type GalleryImage } from '@/components/set/Gallery'
import { Offers } from '@/components/set/Offers'
import { RelatedSets, RelatedSetsSkeleton } from '@/components/set/RelatedSets'
import { SetAbout } from '@/components/set/SetAbout'
import { SetFigures } from '@/components/set/SetFigures'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { findSetIdByNumber, getInventory, getOffers, getSet } from '@/lib/api/catalog'
import { NotFoundError } from '@/lib/api/client'
import type { SetDetails } from '@/lib/api/types'
import { bestOffer, summarizeOffers } from '@/lib/catalog/offers'
import { figureSet, gallery, imageCaption, imageSrc } from '@/lib/catalog/set'
import { piecesCount, releaseUpcoming } from '@/lib/format'
import { isUuid, numbersFromSetSlug, setPath } from '@/lib/routes'
import { safe } from '@/lib/safe'
import { pageMetadata, productSchema, themeCrumbs } from '@/lib/seo'
import { botSetUrl } from '@/lib/site'

type Props = { params: Promise<{ slug: string }> }

const resolveSet = cache(async (slug: string): Promise<SetDetails> => {
  try {
    if (isUuid(slug)) return await getSet(slug)
    let fallback: SetDetails | null = null
    for (const number of numbersFromSetSlug(slug)) {
      const id = await findSetIdByNumber(number)
      if (!id) continue
      const details = await getSet(id)
      if (setPath(details) === `/sets/${slug}`) return details
      fallback ??= details
    }
    if (fallback) return fallback
    notFound()
  } catch (error) {
    if (error instanceof NotFoundError) notFound()
    throw error
  }
})

function describe(details: SetDetails): string {
  const parts = [
    details.official_number_display ? `Набір LEGO ${details.official_number_display}` : 'Набір LEGO',
    details.theme_path.length ? `тема ${details.theme_path.map((theme) => theme.name).join(' › ')}` : null,
    details.intro_year ? `${details.intro_year} рік` : null,
    details.declared_piece_count ? piecesCount(details.declared_piece_count) : null,
  ].filter(Boolean)
  return `${details.name}: ${parts.join(', ')}. Фото, склад, фігурки й ціни в українських магазинах.`
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const details = await resolveSet(slug)
  const title = details.official_number_display ? `${details.name} (${details.official_number_display})` : details.name
  const image = gallery(details).all[0]
  return pageMetadata({
    title: `${title}: LEGO`,
    description: describe(details),
    path: setPath(details),
    image: image ? imageSrc(image) : null,
  })
}

export default async function SetPage({ params }: Props) {
  const { slug } = await params
  const details = await resolveSet(slug)
  const canonical = setPath(details)
  if (`/sets/${slug}` !== canonical) permanentRedirect(canonical)

  const theme = details.theme_path.at(-1) ?? null
  const [offersResult, inventory] = await Promise.all([safe(getOffers(details.id)), safe(getInventory(details.id))])
  const offersFailed = offersResult === null
  const offers = offersResult ?? []
  const summary = summarizeOffers(offers)
  const figures = figureSet(inventory)
  const figureCount = details.declared_figure_count ?? (figures.figureCount || null)
  const now = new Date()
  const images: GalleryImage[] = gallery(details).all.map((image) => ({
    src: imageSrc(image),
    thumb: image.variants?.thumb ?? imageSrc(image),
    alt: image.alt ?? `${details.name}: ${imageCaption(image).toLowerCase()}`,
    packaging: image.role === 'packaging',
  }))
  const edition = details.editions.find((item) => item.is_default) ?? details.editions[0]
  const upcoming = edition ? releaseUpcoming(edition.release_date, edition.release_date_precision) : false

  return (
    <div className="wrap set">
      <Breadcrumbs items={[{ name: 'Теми', path: '/themes' }, ...themeCrumbs(details.theme_path), { name: details.name }]} />

      <div className="set__top">
        <div className="set__gallery">
          <Gallery images={images} name={details.name} />
        </div>

        <BuyPanel
          details={details}
          offers={offers}
          offersFailed={offersFailed}
          figureCount={figureCount}
          edition={edition}
          upcoming={upcoming}
          watchUrl={botSetUrl(details.id)}
          now={now}
        />

        {offers.length ? (
          <div className="set__offers">
            <Offers setNumber={details.official_number_display} offers={offers} best={bestOffer(offers)} now={now} />
          </div>
        ) : null}
      </div>

      <SetFigures figures={figures} />
      <SetAbout details={details} figureCount={figureCount} edition={edition} now={now} />

      {theme ? (
        <Suspense fallback={<RelatedSetsSkeleton />}>
          <RelatedSets setId={details.id} theme={theme} />
        </Suspense>
      ) : null}

      <JsonLd data={productSchema(details, offers, canonical)} />
      <TrackView
        event="set_viewed"
        properties={{
          set_number: details.official_number_display,
          set_name: details.name,
          theme: theme?.name,
          offers_count: offers.length,
          availability: summary.state,
          lead_price: summary.leadPrice,
        }}
      />
    </div>
  )
}
