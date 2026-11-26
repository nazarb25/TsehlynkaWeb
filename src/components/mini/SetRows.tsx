import Link from 'next/link'

import { shopTint } from '@/components/ui/ShopLogo'
import type { SetDeal, SetItem } from '@/lib/api/types'
import { plural, price, release, releaseUpcoming, thousands } from '@/lib/format'
import { setPath } from '@/lib/routes'

import { MetaIcon, MiniPhoto } from './icons'

export function shopsPhrase(count: number | null | undefined): string {
  const shops = count || 1
  return `${shops === 1 ? 'в' : 'у'} ${shops} ${plural(shops, 'магазині', 'магазинах', 'магазинах')}`
}

interface MetaSource {
  official_number_display?: string | null
  intro_year?: number | null
  declared_piece_count?: number | null
  age_label?: string | null
}

/** Параметри набору: номер, рік, деталі й вік на коробці, лише відомі значення. `short` — номер і рік. */
export function SetMetaLine({ item, short, age }: { item: MetaSource; short?: boolean; age?: string | null }) {
  const mark = age ?? item.age_label
  return (
    <span className="c-umeta">
      {item.official_number_display ? (
        <span>
          <MetaIcon kind="number" />
          <span className="c-visually-hidden">Номер </span>
          {item.official_number_display}
        </span>
      ) : null}
      {item.intro_year ? (
        <span>
          <MetaIcon kind="year" />
          <span className="c-visually-hidden">Рік </span>
          {item.intro_year}
        </span>
      ) : null}
      {!short && item.declared_piece_count ? (
        <span>
          <MetaIcon kind="pieces" />
          {thousands(item.declared_piece_count)}
          <span className="c-visually-hidden"> {plural(item.declared_piece_count, 'деталь', 'деталі', 'деталей')}</span>
        </span>
      ) : null}
      {!short && mark ? (
        <span>
          <MetaIcon kind="age" />
          <span className="c-visually-hidden">Вік </span>
          {mark}
        </span>
      ) : null}
    </span>
  )
}

/** Лого магазину найкращої знижки: мала копія логотипа або плитка з ініціалами. */
export function DealLogo({ deal, className = 'c-urow__logo' }: { deal: SetDeal; className?: string }) {
  const src = deal.shop_logo?.thumb ?? deal.shop_logo_url ?? null
  if (src) return <img className={className} src={src} alt={deal.shop_name} loading="lazy" decoding="async" />
  return (
    <span className={`${className} ${className}--tint-${shopTint(deal.shop_id)}`} role="img" aria-label={deal.shop_name}>
      {deal.shop_name.slice(0, 2).toUpperCase()}
    </span>
  )
}

export function DealPrice({ deal }: { deal: SetDeal }) {
  return (
    <>
      <b>{price(deal.price)}</b>
      <s>{price(deal.old_price)}</s>
      <em>−{deal.discount_percent}%</em>
    </>
  )
}

export function isOnSale(item: SetItem): boolean {
  return Boolean(item.has_in_stock_offer) && item.min_in_stock_price !== null && item.min_in_stock_price !== undefined
}

/** Ціна в продажу: «від X · у N магазинах». */
export function SalePrice({ item }: { item: SetItem }) {
  return (
    <>
      <b>
        {(item.in_stock_offers_count ?? 0) > 1 ? 'від ' : ''}
        {price(item.min_in_stock_price)}
      </b>{' '}
      · {shopsPhrase(item.in_stock_shops_count)}
    </>
  )
}

export function ReleaseLine({ item }: { item: SetItem }) {
  if (!item.release_date) return null
  const precision = item.release_date_precision ?? null
  return <span className={releaseUpcoming(item.release_date, precision) ? 'is-soon' : ''}>{release(item.release_date, precision)}</span>
}

/** Рядок ціни з роздрібних полів: знижка, ціна в продажу чи передзамовлення. */
export function RetailPrice({ item }: { item: SetItem }) {
  if (item.best_deal) return <DealPrice deal={item.best_deal} />
  if (isOnSale(item)) return <SalePrice item={item} />
  if (item.has_preorder_offer)
    return (
      <>
        {item.min_preorder_price !== null && item.min_preorder_price !== undefined ? (
          <>
            <b>{price(item.min_preorder_price)}</b> ·{' '}
          </>
        ) : null}
        <span className="is-pre">передзамовлення</span>
      </>
    )
  return null
}

interface RowProps {
  item: SetItem
  price?: React.ReactNode
  deal?: SetDeal | null
  note?: React.ReactNode
  name?: React.ReactNode
  eager?: boolean
}

/** Рядок набору: фото й назва, рядок ціни чи дати, лого магазину знижки праворуч угорі, параметри внизу. */
export function SetRow({ item, price: amount, deal, note, name, eager }: RowProps) {
  const path = setPath(item)
  return (
    <div className={`c-urow${deal ? ' has-logo' : ''}`}>
      <div className="c-urow__body">
        <Link className="c-urow__open" draggable={false} href={path}>
          <MiniPhoto src={item.image?.thumb ?? item.image?.medium} alt={item.name} className="c-urow__photo" eager={eager} />
          <span className="c-urow__text">
            <span className="c-urow__name">{name ?? item.name}</span>
            {amount ? <span className="c-urow__price">{amount}</span> : null}
            {note ? <span className="c-urow__note">{note}</span> : null}
          </span>
        </Link>
        {deal ? <DealLogo deal={deal} /> : null}
        <div className="c-urow__foot">
          <SetMetaLine item={item} />
        </div>
      </div>
    </div>
  )
}

/** Картка сітки: фото 4:3 з лого магазину в куті, назва, ціна, номер і рік. */
export function SetCard({ item, price: amount, deal, eager }: RowProps) {
  const path = setPath(item)
  return (
    <div className="c-ucard">
      <Link className="c-ucard__open" draggable={false} href={path}>
        <MiniPhoto src={item.image?.medium ?? item.image?.thumb} alt={item.name} className="c-ucard__photo" eager={eager} />
        <span className="c-ucard__text">
          <span className="c-ucard__name">{item.name}</span>
          {amount ? <span className="c-ucard__price">{amount}</span> : null}
        </span>
      </Link>
      {deal ? <DealLogo deal={deal} className="c-ucard__logo" /> : null}
      <div className="c-ucard__foot">
        <SetMetaLine item={item} short />
      </div>
    </div>
  )
}

export interface RowContext {
  sale: boolean
  onSale: boolean
  newest: boolean
}

/** Рядок каталогу за режимом: усі набори — без ціни, новинки — дата виходу, у продажу — ціна й магазини, зі знижкою — знижка з лого. */
export function CatalogRow({ item, context, grid, eager }: { item: SetItem; context: RowContext; grid?: boolean; eager?: boolean }) {
  const deal = context.sale && context.onSale && item.best_deal ? item.best_deal : null
  let amount: React.ReactNode = null
  if (deal) amount = <DealPrice deal={deal} />
  else if (context.sale && isOnSale(item)) amount = <SalePrice item={item} />
  else if (context.sale && item.has_preorder_offer) amount = <RetailPrice item={item} />
  else if (context.newest) amount = <ReleaseLine item={item} />
  return grid ? <SetCard item={item} price={amount} deal={deal} eager={eager} /> : <SetRow item={item} price={amount} deal={deal} eager={eager} />
}
