import Link from 'next/link'

import { WatchCard } from '@/components/alerts/WatchCard'
import { AgeIcon, ChevronRight, ExternalIcon, FigureIcon, PiecesIcon } from '@/components/icons'
import type { SetDetails, ShopOffer } from '@/lib/api/types'
import { bestOffer, discountPercent, isWebUrl, summarizeOffers } from '@/lib/catalog/offers'
import { ageMark, figuresCount, piecesCount, plural, price, release } from '@/lib/format'
import { themePath } from '@/lib/routes'

type Edition = SetDetails['editions'][number]

interface BuyPanelProps {
  details: SetDetails
  offers: ShopOffer[]
  /** Пропозиції не завантажилися: показуємо прохання оновити, а не «немає в продажу». */
  offersFailed: boolean
  figureCount: number | null
  edition: Edition | undefined
  upcoming: boolean
  /** Стеження за ціною доступне. */
  watch: boolean
  now: Date
}

/** Липка панель праворуч: назва, характеристики, ціна за станом пропозицій і дії. */
export function BuyPanel({ details, offers, offersFailed, figureCount, edition, upcoming, watch, now }: BuyPanelProps) {
  const theme = details.theme_path.at(-1) ?? null
  const age = ageMark(details.age_label, details.age_min_months)
  const summary = summarizeOffers(offers)
  const best = bestOffer(offers)
  const bestDiscount = best ? discountPercent(best) : null
  const offersCount = offers.length

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
          </div>
          {watch ? <WatchCard place="panel" price={summary.minInStockPrice} appear={summary.state === 'none' && !offersFailed} /> : null}
        </div>
      </div>
    </aside>
  )
}
