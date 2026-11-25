import type { ImageUrls } from '@/lib/api/types'

const TINTS = 6

/** Номер кольору плитки магазину за його ідентифікатором, як у Mini App. */
export function shopTint(shopId: string): number {
  const hex = shopId.replace(/-/g, '')
  if (!/^[0-9a-f]+$/i.test(hex)) return 0
  return Number(BigInt(`0x${hex}`) % BigInt(TINTS))
}

interface ShopLogoProps {
  shopId: string
  name: string
  logo?: ImageUrls | null
  logoUrl?: string | null
  size?: number
  className?: string
}

export function ShopLogo({ shopId, name, logo, logoUrl, size = 26, className }: ShopLogoProps) {
  const src = logo?.thumb ?? logoUrl ?? null
  const tint = shopTint(shopId)
  const classes = ['shop-logo', tint ? `shop-logo--t${tint}` : null, className].filter(Boolean).join(' ')
  return (
    <span
      className={classes}
      style={{ width: size, height: size, fontSize: Math.max(9, Math.round(size * 0.36)) }}
      role="img"
      aria-label={name}
    >
      {src ? <img src={src} alt="" loading="lazy" decoding="async" /> : name.slice(0, 2).toUpperCase()}
    </span>
  )
}
