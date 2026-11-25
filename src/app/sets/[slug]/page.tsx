import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'
import { cache } from 'react'

import { SetTiles } from '@/components/catalog/SetTiles'
import { AgeIcon, BellIcon, ChevronRight, ExternalIcon, FigureIcon, FileIcon, PiecesIcon } from '@/components/icons'
import { TrackView } from '@/components/platform/Analytics'
import { JsonLd } from '@/components/seo/JsonLd'
import { Gallery, type GalleryImage } from '@/components/set/Gallery'
import { Offers } from '@/components/set/Offers'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Photo } from '@/components/ui/Photo'
import { SectionHead } from '@/components/ui/SectionHead'
import { findRetailSets, findSetIdByNumber, getInventory, getOffers, getSet } from '@/lib/api/catalog'
import { NotFoundError } from '@/lib/api/client'
import type { SetDetails } from '@/lib/api/types'
import { bestOffer, discountPercent, isWebUrl, summarizeOffers } from '@/lib/catalog/offers'
import {
  figureSet,
  gallery,
  imageCaption,
  imageSrc,
  INSTRUCTION_LABELS,
  LANGUAGE_LABELS,
  LIFECYCLE_LABELS,
  linkedInstructions,
  originalName,
  otherNumbers,
  PACKAGING_LABELS,
  packagingType,
} from '@/lib/catalog/set'
import { ageMark, figuresCount, piecesCount, plural, price, release, releaseUpcoming, thousands } from '@/lib/format'
import { isUuid, numbersFromSetSlug, setPath, themePath } from '@/lib/routes'
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
  const [offersResult, inventory, related] = await Promise.all([
    safe(getOffers(details.id)),
    safe(getInventory(details.id)),
    theme ? safe(findRetailSets({ theme_id: theme.id, sort: 'year_desc', limit: 6 })) : Promise.resolve(null),
  ])
  const offersFailed = offersResult === null
  const offers = offersResult ?? []
  const summary = summarizeOffers(offers)
  const best = bestOffer(offers)
  const figures = figureSet(inventory)
  const figureCount = details.declared_figure_count ?? (figures.figureCount || null)
  const age = ageMark(details.age_label, details.age_min_months)
  const now = new Date()
  const photos = gallery(details)
  const images: GalleryImage[] = photos.all.map((image) => ({
    src: imageSrc(image),
    thumb: image.variants?.thumb ?? imageSrc(image),
    alt: image.alt ?? `${details.name}: ${imageCaption(image).toLowerCase()}`,
    packaging: image.role === 'packaging',
  }))
  const edition = details.editions.find((item) => item.is_default) ?? details.editions[0]
  const upcoming = edition ? releaseUpcoming(edition.release_date, edition.release_date_precision) : false
  const instructions = linkedInstructions(details)
  const packaging = packagingType(details)
  const numbers = otherNumbers(details)
  const original = originalName(details)
  const watchUrl = botSetUrl(details.id)
  const others = (related?.items ?? []).filter((item) => item.id !== details.id).slice(0, 5)
  const offersCount = offers.length
  const bestDiscount = best ? discountPercent(best) : null

  const facts: [string, React.ReactNode][] = [
    ...(details.theme_path.length
      ? [
          [
            'Тема',
            <span key="theme" className="facts__path">
              {details.theme_path.map((item, index) => (
                <span key={item.id}>
                  {index ? ' › ' : ''}
                  <Link className="link" href={themePath(item)}>
                    {item.name}
                  </Link>
                </span>
              ))}
            </span>,
          ] as [string, React.ReactNode],
        ]
      : []),
    ...(details.intro_year ? [['Рік випуску', String(details.intro_year)] as [string, React.ReactNode]] : []),
    ...(edition?.release_date ? [['Вихід', release(edition.release_date, edition.release_date_precision, now).replace(/^Вий\S+ /, '')] as [string, React.ReactNode]] : []),
    ...(age ? [['Вік на коробці', age] as [string, React.ReactNode]] : []),
    ...(details.declared_piece_count ? [['Деталей', thousands(details.declared_piece_count)] as [string, React.ReactNode]] : []),
    ...(figureCount ? [['Фігурок', String(figureCount)] as [string, React.ReactNode]] : []),
    ['Тип продукту', details.set_type.name],
    ...(LIFECYCLE_LABELS[details.lifecycle_status] ? [['Випуск', LIFECYCLE_LABELS[details.lifecycle_status]] as [string, React.ReactNode]] : []),
    ...(packaging && PACKAGING_LABELS[packaging] ? [['Паковання', PACKAGING_LABELS[packaging]] as [string, React.ReactNode]] : []),
    ...(numbers.length ? [['Інші номери', numbers.join(', ')] as [string, React.ReactNode]] : []),
    ...(original ? [['Оригінальна назва', original] as [string, React.ReactNode]] : []),
  ]

  let priceBlock: React.ReactNode
  if (summary.state === 'in_stock') {
    priceBlock = (
      <>
        <p className="buy__label">{summary.leadPrice !== null ? 'Найнижча ціна серед наявних' : 'Ціну уточнюйте в магазині'}</p>
        {summary.leadPrice !== null ? (
          <p className="buy__price num">
            {summary.leadShopsCount > 1 && !best ? 'від ' : ''}
            {price(summary.leadPrice)}
          </p>
        ) : null}
        {best && bestDiscount ? (
          <p className="buy__was num">
            <s>{price(best.old_price)}</s> <em>−{bestDiscount}%</em>
          </p>
        ) : null}
        <p className="buy__state is-ok">
          <i aria-hidden="true" />
          <b>У наявності</b> {summary.leadShopsCount > 1 ? `у ${summary.leadShopsCount} ${plural(summary.leadShopsCount, 'магазині', 'магазинах', 'магазинах')}` : 'в 1 магазині'}
        </p>
      </>
    )
  } else if (summary.state === 'preorder') {
    priceBlock = (
      <>
        <p className="buy__label">Передзамовлення</p>
        {summary.leadPrice !== null ? <p className="buy__price num">від {price(summary.leadPrice)}</p> : null}
        <p className="buy__state is-pre">
          <i aria-hidden="true" />
          <b>Можна замовити наперед</b> {summary.leadShopsCount > 1 ? `у ${summary.leadShopsCount} магазинах` : 'в 1 магазині'}
        </p>
      </>
    )
  } else if (summary.state === 'unknown') {
    priceBlock = (
      <>
        <p className="buy__label">Ціни магазинів</p>
        {summary.leadPrice !== null ? <p className="buy__price num">{price(summary.leadPrice)}</p> : null}
        <p className="buy__state is-unknown">
          <i aria-hidden="true" />
          <b>Наявність потребує уточнення</b>
        </p>
      </>
    )
  } else if (offersFailed) {
    priceBlock = (
      <>
        <p className="buy__label">Де купити</p>
        <p className="buy__none">Не вдалося перевірити ціни. Оновіть сторінку за хвилину.</p>
      </>
    )
  } else {
    priceBlock = (
      <>
        <p className="buy__label">{upcoming ? 'Ще не вийшов' : 'Де купити'}</p>
        <p className="buy__none">
          {upcoming && edition ? release(edition.release_date, edition.release_date_precision, now) : offersCount ? 'Зараз немає в наявності' : 'Зараз немає в продажу в українських магазинах'}
        </p>
      </>
    )
  }

  return (
    <div className="wrap set">
      <Breadcrumbs items={[{ name: 'Теми', path: '/themes' }, ...themeCrumbs(details.theme_path), { name: details.name }]} />

      <div className="set__top">
        <div className="set__gallery">
          <Gallery images={images} name={details.name} />
        </div>

        <aside className="set__buy">
          <div className="buy">
            {theme ? (
              <Link className="buy__theme" href={themePath(theme)}>
                {theme.name}
                <ChevronRight size={14} />
              </Link>
            ) : null}
            <h1>{details.name}</h1>
            <p className="buy__sub num">{[details.official_number_display, details.intro_year].filter(Boolean).join(' · ')}</p>
            <ul className="pills num">
              {age ? (
                <li>
                  <AgeIcon />
                  {age}
                </li>
              ) : null}
              {details.declared_piece_count ? (
                <li>
                  <PiecesIcon />
                  {piecesCount(details.declared_piece_count)}
                </li>
              ) : null}
              {figureCount ? (
                <li>
                  <FigureIcon size={13} />
                  {figuresCount(figureCount)}
                </li>
              ) : null}
            </ul>
            <div className="buy__offer">
              {priceBlock}
              <div className="buy__actions">
                {best && isWebUrl(best.product_url) ? (
                  <a
                    className="button button--primary"
                    href={best.product_url}
                    target="_blank"
                    rel="sponsored nofollow noopener"
                    data-track="shop_clicked"
                    data-track-place="primary"
                    data-track-shop={best.shop_name}
                    data-track-set={details.official_number_display ?? undefined}
                    data-track-price={best.price ?? undefined}
                    data-track-availability={best.availability}
                  >
                    До магазину {best.shop_name}
                    <ExternalIcon />
                  </a>
                ) : null}
                {offersCount ? (
                  <a className={`button${best ? ' button--outline' : ' button--primary'}`} href="#offers">
                    Порівняти ціни · {offersCount} {plural(offersCount, 'пропозиція', 'пропозиції', 'пропозицій')}
                  </a>
                ) : null}
                {watchUrl ? (
                  <a className={`button web-only${offersCount ? ' button--ghost' : ' button--outline'}`} href={watchUrl} target="_blank" rel="noopener" data-track="telegram_watch_clicked" data-track-set={details.official_number_display ?? undefined}>
                    <BellIcon size={16} />
                    Стежити за ціною в Telegram
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </aside>

        {offersCount ? (
          <div className="set__offers">
            <Offers setNumber={details.official_number_display} offers={offers} best={best} now={now} />
          </div>
        ) : null}
      </div>

      {figures.figures.length || figures.randomFigures.length ? (
        <section aria-labelledby="figures-title">
          <SectionHead id="figures-title" title="Фігурки в наборі" count={figures.figureCount || undefined} />
          {figures.figures.length ? (
            <ul className="figs">
              {figures.figures.map((figure) => (
                <li key={figure.figure_id} className="fig">
                  <Photo src={figure.image_url} className="fig__photo stage--white" iconSize={22}>
                    {figure.quantity > 1 ? <span className="fig__qty num">×{figure.quantity}</span> : null}
                  </Photo>
                  <span>{figure.character_name ?? figure.name}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {figures.randomFigures.length ? (
            <>
              <h3 className="figs__title">
                {figures.randomPick
                  ? `Випадкові: ${figures.randomPick} з ${figures.randomFigures.length}`
                  : `Випадкові фігурки: ${figures.randomFigures.length}`}
              </h3>
              <ul className="figs">
                {figures.randomFigures.map((figure) => (
                  <li key={figure.figure_id} className="fig">
                    <Photo src={figure.image_url} className="fig__photo stage--white" iconSize={22} />
                    <span>{figure.character_name ?? figure.name}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </section>
      ) : null}

      <div className={`set__info${instructions.length ? '' : ' set__info--single'}`}>
        <section aria-labelledby="about-title">
          <SectionHead id="about-title" title="Про набір" />
          {details.description ? <p className="set__desc">{details.description}</p> : null}
          <dl className="facts">
            {facts.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd className="num">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
        {instructions.length ? (
          <section aria-labelledby="instructions-title">
            <SectionHead id="instructions-title" title="Інструкції" />
            <ul className="instr">
              {instructions.map((item, index) => (
                <li key={`${item.url}-${index}`}>
                  <a href={item.url ?? undefined} target="_blank" rel="noopener nofollow">
                    <FileIcon size={18} />
                    <span>
                      <b>
                        {item.total_parts && item.part_number ? `Частина ${item.part_number} із ${item.total_parts}` : item.title}
                      </b>
                      <small>
                        {[INSTRUCTION_LABELS[item.instruction_type], item.language_code ? (LANGUAGE_LABELS[item.language_code] ?? item.language_code) : null]
                          .filter(Boolean)
                          .join(' · ')}
                      </small>
                    </span>
                    <ChevronRight size={16} />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      {others.length && theme ? (
        <section aria-labelledby="others-title">
          <SectionHead id="others-title" title="Інші набори цієї теми" href={themePath(theme)} />
          <SetTiles sets={others} context="sale" columns={5} />
        </section>
      ) : null}

      <JsonLd data={productSchema(details, offers, canonical)} />
      <TrackView
        event="set_viewed"
        properties={{
          set_number: details.official_number_display,
          set_name: details.name,
          theme: theme?.name,
          offers_count: offersCount,
          availability: summary.state,
          lead_price: summary.leadPrice,
        }}
      />
    </div>
  )
}
