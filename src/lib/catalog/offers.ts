import type { OfferAvailability, ShopOffer } from '@/lib/api/types'

export type OfferState = OfferAvailability | 'none'

export interface OfferGroup {
  availability: OfferAvailability
  offers: ShopOffer[]
}

export interface OfferSummary {
  state: OfferState
  /** Найнижча ціна в наявності серед пропозицій самих магазинів. */
  minInStockPrice: number | null
  inStockShopsCount: number
  offersCount: number
  /** Ціна, магазини й час перевірки найкращої доступності, разом зі сторонніми продавцями. */
  leadPrice: number | null
  leadShopsCount: number
  lastCheckedAt: string | null
}

const ORDER: readonly OfferAvailability[] = ['in_stock', 'preorder', 'unknown', 'out_of_stock']

export const GROUP_TITLES: Record<OfferAvailability, string> = {
  in_stock: 'У наявності',
  preorder: 'Передзамовлення',
  unknown: 'Наявність потребує уточнення',
  out_of_stock: 'Немає в наявності',
}

function priceOf(offer: ShopOffer): number | null {
  return offer.price === null || offer.price === undefined ? null : Number(offer.price)
}

function byPrice(a: ShopOffer, b: ShopOffer): number {
  const pa = priceOf(a)
  const pb = priceOf(b)
  if (pa === null) return pb === null ? 0 : 1
  if (pb === null) return -1
  return pa - pb
}

function inStock(offers: ShopOffer[]): ShopOffer[] {
  return offers.filter((offer) => offer.availability === 'in_stock' && priceOf(offer) !== null)
}

/** Непорожні групи за доступністю: наявні — від дешевшої, решта — в порядку API. */
export function groupOffers(offers: ShopOffer[]): OfferGroup[] {
  return ORDER.flatMap((availability) => {
    const members = offers.filter((offer) => offer.availability === availability)
    if (availability === 'in_stock') members.sort(byPrice)
    return members.length ? [{ availability, offers: members }] : []
  })
}

export function summarizeOffers(offers: ShopOffer[]): OfferSummary {
  const soldByShop = inStock(offers).filter((offer) => offer.is_sold_by_shop)
  const groups = groupOffers(offers)
  const lead = groups[0]?.offers ?? []
  const leadPrices = lead.map(priceOf).filter((value): value is number => value !== null)
  const shopPrices = soldByShop.map(priceOf).filter((value): value is number => value !== null)
  const checked = lead.map((offer) => offer.last_checked_at).sort()
  return {
    state: groups[0]?.availability ?? 'none',
    minInStockPrice: shopPrices.length ? Math.min(...shopPrices) : null,
    inStockShopsCount: new Set(soldByShop.map((offer) => offer.shop_id)).size,
    offersCount: offers.length,
    leadPrice: leadPrices.length ? Math.min(...leadPrices) : null,
    leadShopsCount: new Set(lead.map((offer) => offer.shop_id)).size,
    lastCheckedAt: checked.at(-1) ?? null,
  }
}

/** Єдина найдешевша пропозиція в наявності; за однакової ціни переможця немає. */
export function bestOffer(offers: ShopOffer[]): ShopOffer | null {
  const priced = inStock(offers).sort(byPrice)
  const [first, second] = priced
  if (!first || (second && priceOf(first) === priceOf(second))) return null
  return first
}

export function discountPercent(offer: Pick<ShopOffer, 'price' | 'old_price'>): number | null {
  if (offer.price === null || offer.old_price === null || offer.price === undefined || offer.old_price === undefined) return null
  const current = Number(offer.price)
  const old = Number(offer.old_price)
  if (!(current > 0 && current < old)) return null
  return Math.round((1 - current / old) * 100)
}

export function isWebUrl(value: string | null | undefined): value is string {
  if (!value) return false
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}
