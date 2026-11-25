import Link from 'next/link'

import { Photo } from '@/components/ui/Photo'
import { SetMeta } from '@/components/ui/SetMeta'
import { ShopLogo } from '@/components/ui/ShopLogo'
import type { SetDeal, SetItem } from '@/lib/api/types'
import { ageMark, price, release, releaseUpcoming, shopsPhrase } from '@/lib/format'
import { setPath } from '@/lib/routes'

/** Що показати під назвою: ціни магазинів, дату виходу новинки або нічого. */
export type TileContext = 'sale' | 'newest' | 'all'

interface SetTileProps {
  set: SetItem
  context: TileContext
  eager?: boolean
}

/** Знижка показується, лише коли вона і є найнижчою ціною в наявності. */
function leadingDeal(set: SetItem): SetDeal | null {
  const deal = set.best_deal
  if (!deal) return null
  const min = set.min_in_stock_price
  if (min !== null && min !== undefined && Number(deal.price) > Number(min)) return null
  return deal
}

export function SetTile({ set, context, eager }: SetTileProps) {
  const path = setPath(set)
  const sale = context === 'sale'
  const deal = sale ? leadingDeal(set) : null
  const inStock = sale && set.has_in_stock_offer && set.min_in_stock_price !== null && set.min_in_stock_price !== undefined
  const preorder = sale && !inStock && set.has_preorder_offer
  const shops = inStock ? shopsPhrase(set.in_stock_shops_count ?? 1) : null
  const upcoming = releaseUpcoming(set.release_date, set.release_date_precision)

  let amount: React.ReactNode = null
  let below: React.ReactNode = null
  if (deal) {
    amount = price(deal.price)
    below = (
      <span className="tile__was">
        <s>{price(deal.old_price)}</s>
        <em>−{deal.discount_percent}%</em>
      </span>
    )
  } else if (inStock) {
    amount = `${(set.in_stock_offers_count ?? 0) > 1 ? 'від ' : ''}${price(set.min_in_stock_price)}`
    below = <span className="tile__shops">{shops}</span>
  } else if (preorder) {
    amount = set.min_preorder_price ? `від ${price(set.min_preorder_price)}` : null
    below = <span className="tile__pre">передзамовлення</span>
  } else if (context === 'newest' && set.release_date) {
    below = <span className={upcoming ? 'tile__soon' : 'tile__released'}>{release(set.release_date, set.release_date_precision)}</span>
  }

  return (
    <article className={`tile${deal ? ' has-deal' : ''}`}>
      <Photo src={set.image?.medium ?? set.image?.thumb} className="tile__photo" eager={eager}>
        {deal ? (
          <ShopLogo shopId={deal.shop_id} name={deal.shop_name} logo={deal.shop_logo} logoUrl={deal.shop_logo_url} className="tile__badge" />
        ) : null}
      </Photo>
      <div className="tile__body">
        <h3 className="tile__name">
          <Link href={path} className="tile__link">
            {set.name}
          </Link>
        </h3>
        {amount || below ? (
          <p className="tile__price num">
            {amount ? <b>{amount}</b> : null}
            {below}
          </p>
        ) : null}
        <SetMeta
          className="tile__meta"
          number={set.official_number_display}
          year={set.intro_year}
          pieces={set.declared_piece_count}
          age={ageMark(set.age_label, set.age_min_months) || null}
        />
      </div>
      {sale ? (
        <div className="tile__shop">
          {deal ? (
            <>
              <ShopLogo shopId={deal.shop_id} name={deal.shop_name} logo={deal.shop_logo} logoUrl={deal.shop_logo_url} size={20} />
              <span>{deal.shop_name}</span>
            </>
          ) : shops ? (
            <span className="tile__hint">{shops}</span>
          ) : null}
        </div>
      ) : null}
    </article>
  )
}
