import Link from 'next/link'

import { WatchRow } from '@/components/alerts/WatchRow'
import { HeartButton } from '@/components/favourites/HeartButton'
import { RecordView } from '@/components/favourites/RecordView'
import { shopTint } from '@/components/ui/ShopLogo'
import type { InventoryFigure, SetDetails, SetImage, SetItem, ShopOffer } from '@/lib/api/types'
import { bestOffer, discountPercent, groupOffers, isWebUrl, type OfferSummary } from '@/lib/catalog/offers'
import {
  type FigureSet,
  imageCaption,
  imageSrc,
  INSTRUCTION_LABELS,
  LIFECYCLE_LABELS,
  linkedInstructions,
  originalName,
  otherNumbers,
  PACKAGING_LABELS,
  packagingType,
} from '@/lib/catalog/set'
import { ageMark, checkedAgo, plural, price, thousands } from '@/lib/format'
import { setPath, themePath } from '@/lib/routes'

import { Caret, Chevron, MetaIcon, MiniPhoto, NoPhoto, TrademarkNotice } from './icons'
import { MiniOffersCta, MiniSetBehaviour } from './MiniSetClient'

const LANGUAGE_SHORT: Record<string, string> = {
  uk: 'укр.',
  en: 'англ.',
  de: 'нім.',
  pl: 'пол.',
  fr: 'фр.',
  es: 'ісп.',
  it: 'італ.',
  nl: 'нід.',
  cs: 'чес.',
}

const GROUP_TITLES = {
  in_stock: 'У наявності',
  preorder: 'Передзамовлення',
  unknown: 'Наявність потребує уточнення',
  out_of_stock: 'Немає в наявності',
} as const

interface MiniSetProps {
  details: SetDetails
  model: SetImage[]
  packaging: SetImage[]
  offers: ShopOffer[]
  offersFailed: boolean
  summary: OfferSummary
  figures: FigureSet
  figureCount: number | null
  related: SetItem[]
  /** Стеження за ціною доступне. */
  watch: boolean
  openOffers?: boolean
  now: Date
}

function StepIcon({ back }: { back?: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={back ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} />
    </svg>
  )
}

function shopsText(count: number): string {
  return `${count === 1 ? 'в' : 'у'} ${count} ${plural(count, 'магазині', 'магазинах', 'магазинах')}`
}

function FigureGrid({ figures }: { figures: InventoryFigure[] }) {
  const collapsed = figures.length > 6
  return (
    <>
      <div className={`c-set-figs${collapsed ? ' is-collapsed' : ''}`} data-figures>
        {figures.map((figure) => (
          <div key={figure.figure_id} className="c-set-fig">
            <span className="c-set-fig__photo">
              <MiniPhoto src={figure.image_url} alt={figure.name} className="" />
              {figure.quantity > 1 ? <span className="c-set-fig__qty">×{figure.quantity}</span> : null}
            </span>
            <span className="c-set-fig__name">{figure.name}</span>
          </div>
        ))}
      </div>
      {collapsed ? (
        <button type="button" className="c-set-figs__more" data-figures-toggle aria-expanded="false">
          Показати всі
        </button>
      ) : null}
    </>
  )
}

function OffersSheet({ details, offers, summary, now }: { details: SetDetails; offers: ShopOffer[]; summary: OfferSummary; now: Date }) {
  const groups = groupOffers(offers)
  const best = bestOffer(offers)
  const priced = offers
    .filter((offer) => offer.availability === 'in_stock' && offer.price !== null && offer.price !== undefined)
    .sort((a, b) => Number(a.price) - Number(b.price))
  const low = priced[0]
  const high = priced.at(-1)
  const spread = low && high && Number(low.price) !== Number(high.price) ? [low, high] : null
  const second = priced[1]
  const gap = best && second ? Number(second.price) - Number(best.price) : 0
  const first = details.images[0]
  const thumb = first ? imageSrc(first) : null
  return (
    <>
      <div className="c-sheet__header c-offers__header">
        <div className="c-offers__heading">
          <h1 className="c-sheet__title">Де купити</h1>
          <span className="c-sheet__hint">{[details.official_number_display, details.name].filter(Boolean).join(' · ')}</span>
        </div>
        <button type="button" className="c-offers__close" data-sheet-close aria-label="Закрити">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      <div className="c-offers-lead">
        <span className="c-offers-lead__thumb">{thumb ? <img src={thumb} alt="" decoding="async" /> : <NoPhoto />}</span>
        {summary.state === 'in_stock' && summary.leadPrice !== null ? (
          <>
            <span className="c-offers-lead__label">Найнижча ціна</span>
            <span className="c-offers-lead__price">{price(summary.leadPrice)}</span>
            {best && gap > 0 ? <span className="c-offers-lead__pill">На {price(gap)} дешевше за наступну</span> : null}
          </>
        ) : summary.state === 'preorder' ? (
          <span className="c-offers-lead__title">Доступне передзамовлення</span>
        ) : summary.state === 'unknown' ? (
          <>
            <span className="c-offers-lead__title">Є пропозиції</span>
            <span className="c-offers-lead__label">Наявність потребує уточнення</span>
          </>
        ) : summary.state === 'out_of_stock' ? (
          <span className="c-offers-lead__title">Зараз немає в наявності</span>
        ) : null}
      </div>

      {spread ? (
        <div className="c-offers-range" role="img" aria-label={`Ціни серед наявних: від ${price(spread[0]!.price)} до ${price(spread[1]!.price)}`}>
          <span className="c-offers-range__label">Розкид цін</span>
          <span className="c-offers-range__track" aria-hidden="true">
            <i className="c-offers-range__dot c-offers-range__dot--low" />
            <i className="c-offers-range__dot c-offers-range__dot--high" />
          </span>
          <span className="c-offers-range__ends" aria-hidden="true">
            {spread.map((offer, index) => (
              <span key={index}>
                <b>{price(offer!.price)}</b>
                <small>{offer!.shop_name}</small>
              </span>
            ))}
          </span>
        </div>
      ) : null}

      {groups.map((group) => (
        <div key={group.availability}>
          <h2 className="c-offers__group">{GROUP_TITLES[group.availability]}</h2>
          <div className="c-offers__list">
            {group.offers.map((offer, index) => {
              const isBest = best !== null && offer === best
              const percent = discountPercent(offer)
              const logo = offer.logo?.thumb ?? offer.logo_url ?? null
              return (
                <article
                  key={`${offer.shop_id}-${offer.product_url}-${index}`}
                  className={`c-offer-card${isBest ? ' c-offer-card--best' : ''}${group.availability === 'out_of_stock' ? ' c-offer-card--muted' : ''}`}
                >
                  <div className="c-offer-card__top">
                    {logo ? (
                      <img className="c-offer-card__logo" src={logo} alt="" loading="lazy" />
                    ) : (
                      <span className={`c-offer-card__logo c-offer-card__logo--tint-${shopTint(offer.shop_id)}`} aria-hidden="true">
                        {offer.shop_name.slice(0, 1).toUpperCase()}
                      </span>
                    )}
                    <span className="c-offer-card__name">
                      <span className="c-offer-card__shop">{offer.shop_name}</span>
                      {!offer.is_sold_by_shop ? (
                        <span className="c-offer-card__seller">{offer.seller_name ? `Продавець: ${offer.seller_name}` : 'Сторонній продавець'}</span>
                      ) : offer.is_official ? (
                        <span className="c-offer-card__seller">Офіційний продавець</span>
                      ) : null}
                    </span>
                    {offer.price !== null && offer.price !== undefined ? (
                      <span className="c-offer-card__prices">
                        <span className="c-offer-card__price">{price(offer.price)}</span>
                        {percent ? (
                          <span className="c-offer-card__old">
                            <s>{price(offer.old_price)}</s>
                            <em>−{percent}%</em>
                          </span>
                        ) : null}
                      </span>
                    ) : null}
                  </div>
                  <p className="c-offer-card__checked">Перевірено {checkedAgo(offer.last_checked_at, now)}</p>
                  {group.availability !== 'out_of_stock' ? (
                    isWebUrl(offer.product_url) ? (
                      <a
                        className={`c-offer-card__go${isBest ? ' c-offer-card__go--primary' : ''}`}
                        href={offer.product_url}
                        target="_blank"
                        rel="noopener nofollow"
                        aria-label={`До магазину ${offer.shop_name}`}
                        data-track="shop_clicked"
                        data-track-place="offers_sheet"
                        data-track-shop={offer.shop_name}
                        data-track-set={details.official_number_display ?? undefined}
                        data-track-price={offer.price ?? undefined}
                        data-track-availability={offer.availability}
                      >
                        До магазину
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M7 17L17 7M9 7h8v8" />
                        </svg>
                      </a>
                    ) : (
                      <span className="c-offer-card__go c-offer-card__go--disabled" aria-disabled="true">
                        Посилання на товар недоступне
                      </span>
                    )
                  ) : null}
                </article>
              )
            })}
          </div>
        </div>
      ))}

      <p className="c-offers__foot">
        {summary.state === 'preorder'
          ? 'Фінальну ціну, умови й строки передзамовлення перевіряйте на сайті магазину.'
          : 'Фінальну ціну й умови перевіряйте на сайті магазину.'}
      </p>
    </>
  )
}

/** Картка набору Mini App. */
export function MiniSet({ details, model, packaging, offers, offersFailed, summary, figures, figureCount, related, watch, openOffers = false, now }: MiniSetProps) {
  const images = [...model, ...packaging]
  const age = ageMark(details.age_label, details.age_min_months)
  const rootTheme = details.theme_path[0] ?? null
  const theme = details.theme_path.at(-1) ?? null
  const sub = [details.official_number_display, details.intro_year].filter(Boolean).join(' · ')
  const hasFigures = figures.figures.length > 0 || figures.randomFigures.length > 0
  const state = summary.state
  const shops = shopsText(summary.leadShopsCount)
  const checked = summary.lastCheckedAt ? `Перевірено ${checkedAgo(summary.lastCheckedAt, now)}` : ''
  const from = summary.leadShopsCount > 1 ? 'від ' : ''
  const lifecycle = LIFECYCLE_LABELS[details.lifecycle_status]
  const pack = packagingType(details)
  const packLabel = pack ? PACKAGING_LABELS[pack] : undefined
  const numbers = otherNumbers(details)
  const original = originalName(details)
  const instructions = linkedInstructions(details)
  const place = state === 'none' && !offersFailed ? 'appear' : 'price'
  const randomPlace = pack && ['polybag', 'foil_pack', 'bag'].includes(pack) ? 'в пакеті' : 'в наборі'
  const figuresText = figureCount ? `${figureCount} ${plural(figureCount, 'фігурка', 'фігурки', 'фігурок')}` : ''
  const figureIcon = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
      <rect x="8" y="3" width="8" height="7" rx="2" />
      <path d="M6 21v-7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v7" />
      <path d="M12 15v6" />
    </svg>
  )

  return (
    <MiniSetBehaviour>
      <div className={`c-set-media${images.length ? '' : ' c-set-media--empty'}`} data-gallery>
        {images.length ? (
          <>
            <div className="c-set-media__track" data-gallery-track aria-label="Фото набору">
              {images.map((image, index) => (
                <button
                  key={image.url}
                  type="button"
                  className="c-set-media__slide"
                  data-gallery-open={index}
                  aria-label={`Відкрити фото ${index + 1} з ${images.length} на весь екран`}
                >
                  <img src={imageSrc(image)} alt={image.alt ?? details.name} loading={index ? 'lazy' : 'eager'} decoding="async" draggable={false} />
                </button>
              ))}
            </div>
            {images.length > 1 ? (
              <>
                <button type="button" className="c-set-media__step c-set-media__step--prev" data-gallery-step="-1" aria-label="Попереднє фото" disabled>
                  <StepIcon back />
                </button>
                <button type="button" className="c-set-media__step c-set-media__step--next" data-gallery-step="1" aria-label="Наступне фото">
                  <StepIcon />
                </button>
                <span className="c-set-media__count" aria-hidden="true">
                  <span data-gallery-index>1</span> / {images.length}
                </span>
              </>
            ) : null}
            {model.length && packaging.length ? (
              <div className="c-set-media__seg" role="group" aria-label="Тип фото">
                <button type="button" className="is-active" data-gallery-jump="0" aria-pressed="true">
                  Модель
                </button>
                <button type="button" data-gallery-jump={model.length} aria-pressed="false">
                  Паковання
                </button>
              </div>
            ) : null}
          </>
        ) : (
          <span className="c-set-media__none">
            <NoPhoto />
            <span aria-hidden="true">Фото набору поки немає</span>
          </span>
        )}
        <HeartButton setId={details.id} name={details.name} variant="media" />
      </div>
      <RecordView setId={details.id} />

      <div className={`c-set${state !== 'none' ? ' c-set--cta' : ''}`}>
        {rootTheme ? (
          <Link className="c-set__theme" href={themePath(rootTheme)}>
            {rootTheme.name}
            <Chevron />
          </Link>
        ) : null}
        <h1 className="c-set__name">{details.name}</h1>
        {sub ? <p className="c-set__sub">{sub}</p> : null}

        {age || details.declared_piece_count || figureCount ? (
          <div className="c-set__facts" aria-label="Коротко про набір">
            {age ? (
              <span className="c-fact">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <circle cx="12" cy="7.5" r="3.5" />
                  <path d="M5 20a7 7 0 0 1 14 0" />
                </svg>
                {age}
              </span>
            ) : null}
            {details.declared_piece_count ? (
              <span className="c-fact">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="10" width="18" height="9" rx="1.5" />
                  <rect x="6" y="6.5" width="4" height="3.5" rx="1" />
                  <rect x="14" y="6.5" width="4" height="3.5" rx="1" />
                </svg>
                {thousands(details.declared_piece_count)} {plural(details.declared_piece_count, 'деталь', 'деталі', 'деталей')}
              </span>
            ) : null}
            {figureCount ? (
              hasFigures ? (
                <a className="c-fact c-fact--link" href="#set-figures" data-scroll-to="set-figures">
                  {figureIcon}
                  {figuresText}
                  <span className="c-fact__caret">
                    <Caret />
                  </span>
                </a>
              ) : (
                <span className="c-fact">
                  {figureIcon}
                  {figuresText}
                </span>
              )
            ) : null}
          </div>
        ) : null}

        {state === 'in_stock' || state === 'preorder' || state === 'unknown' ? (
          <div className="c-set-price">
            <span className="c-set-price__label">
              {state === 'in_stock' ? 'Найнижча ціна серед наявних' : state === 'preorder' ? 'Доступне передзамовлення' : 'Є пропозиції'}
            </span>
            {summary.leadPrice !== null ? (
              <span className="c-set-price__value">
                {from}
                {price(summary.leadPrice)}
              </span>
            ) : null}
            <span className={`c-set-price__status c-set-price__status--${state}`}>
              <i aria-hidden="true" />
              {state === 'in_stock' ? (
                <>
                  <b>У наявності</b> {shops}
                </>
              ) : state === 'preorder' ? (
                <>
                  <b>Передзамовлення</b> {shops}
                </>
              ) : (
                <b>Наявність потребує уточнення</b>
              )}
            </span>
            {state === 'unknown' ? (
              <span className="c-set-price__checked">
                {shops}
                {checked ? ` · ${checked.toLowerCase()}` : ''}
              </span>
            ) : checked ? (
              <span className="c-set-price__checked">{checked}</span>
            ) : null}
          </div>
        ) : (
          <div className="c-set-price c-set-price--empty">
            <span className="c-set-price__icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 9h14l-1.3 10.2a1 1 0 0 1-1 .8H7.3a1 1 0 0 1-1-.8z" />
                <path d="M9 9V7a3 3 0 0 1 6 0v2" />
              </svg>
            </span>
            <span className="c-set-price__text">
              {state === 'out_of_stock' ? (
                <>
                  <b>Зараз немає в наявності</b>
                  <span className="c-set-price__checked">
                    {shops.charAt(0).toUpperCase() + shops.slice(1)}
                    {checked ? ` · ${checked.toLowerCase()}` : ''}
                  </span>
                </>
              ) : offersFailed ? (
                <>
                  <b>Не вдалося перевірити ціни</b>
                  <span className="c-set-price__checked">Оновіть сторінку за хвилину</span>
                </>
              ) : (
                <b>Пропозицій українських магазинів поки немає</b>
              )}
            </span>
          </div>
        )}

        {watch ? <WatchRow place={place} /> : null}

        <h2 className="c-set__heading">Про набір</h2>
        <div className="c-set-facts">
          {theme ? (
            <div className="c-set-facts__row">
              <span>Тема</span>
              <Link className="c-set-facts__value c-set-facts__value--link" href={themePath(theme)}>
                {details.theme_path.map((item) => item.name).join(' › ')}
              </Link>
            </div>
          ) : null}
          {details.intro_year ? (
            <div className="c-set-facts__row">
              <span>Рік випуску</span>
              <span className="c-set-facts__value">{details.intro_year}</span>
            </div>
          ) : null}
          {age ? (
            <div className="c-set-facts__row">
              <span>Вік на коробці</span>
              <span className="c-set-facts__value">{age}</span>
            </div>
          ) : null}
          {details.declared_piece_count ? (
            <div className="c-set-facts__row">
              <span>Деталей</span>
              <span className="c-set-facts__value">{thousands(details.declared_piece_count)}</span>
            </div>
          ) : null}
          {figureCount !== null ? (
            <div className="c-set-facts__row">
              <span>Фігурок</span>
              <span className="c-set-facts__value">{figureCount}</span>
            </div>
          ) : null}
          <div className="c-set-facts__row">
            <span>Тип продукту</span>
            <span className="c-set-facts__value">{details.set_type.name}</span>
          </div>
          {lifecycle ? (
            <div className="c-set-facts__row">
              <span>Випуск</span>
              <span className="c-set-facts__value">{lifecycle}</span>
            </div>
          ) : null}
          {original || numbers.length || packLabel ? (
            <details className="c-set-facts__more">
              <summary className="c-set-facts__row c-set-facts__toggle">
                <span>Додаткові відомості</span>
                <Caret />
              </summary>
              {original ? (
                <div className="c-set-facts__row">
                  <span>Оригінальна назва</span>
                  <span className="c-set-facts__value">{original}</span>
                </div>
              ) : null}
              {numbers.length ? (
                <div className="c-set-facts__row">
                  <span>Інші номери</span>
                  <span className="c-set-facts__value">{numbers.join(', ')}</span>
                </div>
              ) : null}
              {packLabel ? (
                <div className="c-set-facts__row">
                  <span>Упаковка</span>
                  <span className="c-set-facts__value">{packLabel}</span>
                </div>
              ) : null}
            </details>
          ) : null}
        </div>

        {hasFigures ? (
          <>
            <h2 className="c-set__heading" id="set-figures">
              {figures.figures.length ? (
                <>
                  Фігурки в наборі
                  {figureCount ? <small>{figureCount}</small> : null}
                </>
              ) : (
                'Фігурки'
              )}
            </h2>
            {figures.figures.length ? (
              <>
                {figures.randomFigures.length ? <p className="c-set__caption">Входить до набору</p> : null}
                <FigureGrid figures={figures.figures} />
              </>
            ) : null}
            {figures.randomFigures.length ? (
              <>
                <p className="c-set__caption">Може трапитися{figures.randomPick === 1 ? ` · одна ${randomPlace}` : ''}</p>
                <FigureGrid figures={figures.randomFigures} />
              </>
            ) : null}
          </>
        ) : null}

        {instructions.length ? (
          <>
            <h2 className="c-set__heading">Інструкції</h2>
            <div className="c-set-facts">
              {instructions.map((instruction, index) => {
                const kind = [INSTRUCTION_LABELS[instruction.instruction_type], instruction.language_code ? LANGUAGE_SHORT[instruction.language_code] : null]
                  .filter(Boolean)
                  .join(' · ')
                return (
                  <a
                    key={`${instruction.url}-${index}`}
                    className="c-set-facts__row c-set-facts__row--link"
                    href={instruction.url ?? undefined}
                    target="_blank"
                    rel="noopener nofollow"
                  >
                    <span>
                      {instruction.part_number && instruction.total_parts && instruction.total_parts > 1
                        ? `Частина ${instruction.part_number} із ${instruction.total_parts}`
                        : instruction.title}
                    </span>
                    <span className="c-set-facts__value">{kind}</span>
                    <Chevron />
                  </a>
                )
              })}
            </div>
          </>
        ) : null}

        {theme && related.length ? (
          <section className="c-set-rail">
            <div className="c-set-rail__head">
              <h2 className="c-set__heading">Інші набори цієї теми</h2>
              <Link className="c-set-rail__all" href={themePath(theme)}>
                Усі
              </Link>
            </div>
            <div className="c-set-rail__track">
              {related.map((item) => (
                <Link key={item.id} className="c-rail-card" href={setPath(item)}>
                  <MiniPhoto src={item.image?.medium ?? item.image?.thumb} alt={item.name} className="c-rail-card__photo" />
                  <span className="c-rail-card__body">
                    <span className="c-rail-card__name">{item.name}</span>
                    <span className="c-rail-card__meta">
                      {item.official_number_display ? (
                        <span>
                          <MetaIcon kind="number" />
                          {item.official_number_display}
                        </span>
                      ) : null}
                      {item.intro_year ? (
                        <span>
                          <MetaIcon kind="year" />
                          {item.intro_year}
                        </span>
                      ) : null}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <TrademarkNotice />
      </div>

      {state !== 'none' ? (
        <MiniOffersCta openOnLoad={openOffers} offers={offers.length} label={state === 'in_stock' ? 'Порівняти ціни' : state === 'preorder' ? 'Переглянути передзамовлення' : 'Переглянути пропозиції'}>
          <OffersSheet details={details} offers={offers} summary={summary} now={now} />
        </MiniOffersCta>
      ) : null}

      {images.length ? (
        <div
          className="c-gallery"
          data-gallery-viewer
          role="dialog"
          aria-modal="true"
          aria-label={`Фото набору ${[details.official_number_display, details.name].filter(Boolean).join(' ')}`}
          hidden
        >
          <div className="c-gallery__top">
            <button type="button" className="c-gallery__close" data-gallery-close aria-label="Закрити">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
            {images.length > 1 ? (
              <span className="c-gallery__count">
                <span data-gallery-index>1</span> / {images.length}
              </span>
            ) : null}
          </div>
          <div className="c-gallery__track" data-gallery-track>
            {images.map((image) => (
              <figure key={image.url} className="c-gallery__slide">
                <img src={imageSrc(image)} alt={image.alt ?? details.name} loading="lazy" decoding="async" draggable={false} />
                <figcaption className="c-gallery__caption">{imageCaption(image)}</figcaption>
              </figure>
            ))}
          </div>
          {images.length > 1 ? (
            <>
              <button type="button" className="c-gallery__step c-gallery__step--prev" data-gallery-step="-1" aria-label="Попереднє фото" disabled>
                <StepIcon back />
              </button>
              <button type="button" className="c-gallery__step c-gallery__step--next" data-gallery-step="1" aria-label="Наступне фото">
                <StepIcon />
              </button>
            </>
          ) : null}
          {model.length && packaging.length ? (
            <div className="c-gallery__seg" role="group" aria-label="Тип фото">
              <button type="button" className="is-active" data-gallery-jump="0" aria-pressed="true">
                Модель · {model.length}
              </button>
              <button type="button" data-gallery-jump={model.length} aria-pressed="false">
                Паковання · {packaging.length}
              </button>
            </div>
          ) : null}
          {images.length > 1 ? (
            <div className="c-gallery__dots" aria-hidden="true">
              {images.map((image, index) => (
                <i key={image.url} className={index === 0 ? 'is-active' : undefined} />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </MiniSetBehaviour>
  )
}
