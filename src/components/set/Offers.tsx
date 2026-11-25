import { CloseIcon, ExternalIcon } from '@/components/icons'
import { ShopLogo } from '@/components/ui/ShopLogo'
import type { ShopOffer } from '@/lib/api/types'
import { checkedAgo, price } from '@/lib/format'
import { discountPercent, GROUP_TITLES, groupOffers, isWebUrl } from '@/lib/catalog/offers'

const AVAILABILITY_CLASS: Record<string, string> = {
  in_stock: 'is-ok',
  preorder: 'is-pre',
  unknown: 'is-unknown',
  out_of_stock: 'is-out',
}

function sellerLine(offer: ShopOffer): string | null {
  if (!offer.is_sold_by_shop && offer.seller_name) return `Продавець: ${offer.seller_name}`
  return offer.is_official ? 'Офіційний продавець' : null
}

interface OffersProps {
  setNumber: string | null
  offers: ShopOffer[]
  best: ShopOffer | null
  now: Date
}

/** «Де купити»: таблиця на комп'ютері, шторка за посиланням #offers на телефоні. */
export function Offers({ setNumber, offers, best, now }: OffersProps) {
  const groups = groupOffers(offers)
  return (
    <section id="offers" className="offers" aria-labelledby="offers-title">
      <a className="offers__backdrop hide-desktop" href="#" aria-label="Закрити" />
      <div className="offers__panel">
        <div className="offers__head">
          <h2 id="offers-title">Де купити</h2>
          <a className="offers__close hide-desktop" href="#" aria-label="Закрити">
            <CloseIcon size={14} />
          </a>
        </div>
        <div className="otable" role="table" aria-label="Пропозиції магазинів">
          <div className="otable__row otable__row--head hide-mobile" role="row">
            <span role="columnheader">Магазин</span>
            <span role="columnheader">Наявність</span>
            <span role="columnheader">Перевірено</span>
            <span role="columnheader">Ціна</span>
            <span role="columnheader">
              <span className="visually-hidden">Посилання</span>
            </span>
          </div>
          {groups.flatMap((group) =>
            group.offers.map((offer) => {
              const discount = discountPercent(offer)
              const seller = sellerLine(offer)
              const link = isWebUrl(offer.product_url)
              const primary = best !== null && offer.shop_id === best.shop_id && offer.product_url === best.product_url && offer.seller_name === best.seller_name
              return (
                <div key={`${offer.shop_id}-${offer.product_url}`} className={`otable__row${link ? '' : ' is-dim'}`} role="row">
                  <span className="ocell ocell--shop" role="cell">
                    <ShopLogo shopId={offer.shop_id} name={offer.shop_name} logo={offer.logo} logoUrl={offer.logo_url} size={32} />
                    <span>
                      <b>{offer.shop_name}</b>
                      {seller ? <small>{seller}</small> : null}
                    </span>
                  </span>
                  <span className={`ocell ocell--state ${AVAILABILITY_CLASS[offer.availability] ?? ''}`} role="cell">
                    <i aria-hidden="true" />
                    {GROUP_TITLES[offer.availability]}
                  </span>
                  <span className="ocell ocell--checked" role="cell">
                    <span className="hide-desktop">Перевірено </span>
                    {checkedAgo(offer.last_checked_at, now)}
                  </span>
                  <span className="ocell ocell--price num" role="cell">
                    {offer.price !== null ? <b>{price(offer.price)}</b> : <span className="ocell__none">Ціну не вказано</span>}
                    {discount ? (
                      <span>
                        <s>{price(offer.old_price)}</s> <em>−{discount}%</em>
                      </span>
                    ) : null}
                  </span>
                  <span className="ocell ocell--go" role="cell">
                    {link ? (
                      <a
                        className={`button button--small${primary ? ' button--primary' : ' button--outline'}`}
                        href={offer.product_url}
                        target="_blank"
                        rel="sponsored nofollow noopener"
                        data-track="shop_clicked"
                        data-track-place="offers"
                        data-track-shop={offer.shop_name}
                        data-track-set={setNumber ?? undefined}
                        data-track-price={offer.price ?? undefined}
                        data-track-availability={offer.availability}
                      >
                        До магазину
                        <ExternalIcon />
                      </a>
                    ) : (
                      <span className="ocell__none">Посилання недоступне</span>
                    )}
                  </span>
                </div>
              )
            }),
          )}
        </div>
        <p className="offers__note">Фінальну ціну й умови перевіряйте на сайті магазину.</p>
      </div>
    </section>
  )
}
