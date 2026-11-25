import { describe, expect, it } from 'vitest'

import type { ShopOffer } from '@/lib/api/types'

import { bestOffer, discountPercent, isWebUrl, summarizeOffers } from './offers'

function offer(fields: Partial<ShopOffer>): ShopOffer {
  return {
    shop_id: 'shop',
    shop_name: 'Shop',
    availability: 'in_stock',
    price: '100',
    old_price: null,
    product_url: 'https://shop.example/set',
    seller_name: null,
    is_sold_by_shop: true,
    ...fields,
  } as ShopOffer
}

describe('summarizeOffers', () => {
  it('keeps the in-stock state when prices are unknown', () => {
    const summary = summarizeOffers([offer({ price: null })])
    expect(summary.state).toBe('in_stock')
    expect(summary.leadPrice).toBeNull()
  })

  it('reports none without offers', () => {
    expect(summarizeOffers([]).state).toBe('none')
  })
})

describe('bestOffer', () => {
  it('picks the single cheapest in-stock offer', () => {
    const cheap = offer({ shop_id: 'a', price: '90' })
    expect(bestOffer([offer({ shop_id: 'b', price: '120' }), cheap])).toBe(cheap)
  })

  it('returns nothing on a price tie', () => {
    expect(bestOffer([offer({ shop_id: 'a' }), offer({ shop_id: 'b' })])).toBeNull()
  })
})

describe('discountPercent', () => {
  it('rounds the discount', () => {
    expect(discountPercent({ price: '75', old_price: '100' })).toBe(25)
  })

  it('ignores a higher or missing old price', () => {
    expect(discountPercent({ price: '100', old_price: '90' })).toBeNull()
    expect(discountPercent({ price: '100', old_price: null })).toBeNull()
  })
})

describe('isWebUrl', () => {
  it('allows only http and https', () => {
    expect(isWebUrl('https://shop.example')).toBe(true)
    expect(isWebUrl('javascript:alert(1)')).toBe(false)
    expect(isWebUrl(null)).toBe(false)
  })
})
