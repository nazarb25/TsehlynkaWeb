import type { components } from './schema'

type Schemas = components['schemas']

export type Theme = Schemas['CatalogThemeWithCountResource']
export type ThemeRef = Schemas['CatalogThemeResource']
export type ImageUrls = Schemas['ImageUrlsResource']
export type CatalogSetItem = Schemas['SetListItemResource']
export type RetailSetItem = Schemas['RetailSetListItemResource']
export type SetDeal = Schemas['RetailSetDealResource']
export type SetDetails = Schemas['SetDetailsResource']
export type SetImage = Schemas['CatalogImageResource']
export type SetInstruction = Schemas['CatalogInstructionResource']
export type Inventory = Schemas['CatalogInventoryResource']
export type InventoryFigure = Schemas['CatalogInventoryFigureResource']
export type ShopOffer = Schemas['SetShopOfferResource']
export type RetailShop = Schemas['RetailShopResource']
export type OfferAvailability = Schemas['OfferAvailability']
export type RetailSort = Schemas['RetailSetSort']
export type CatalogSort = Schemas['CatalogSetSort']

/** Набір у списку: каталожні поля завжди, роздрібні — лише зі списку наборів у продажу. */
export type SetItem = CatalogSetItem & Partial<Omit<RetailSetItem, keyof CatalogSetItem>>

export interface Page<T> {
  items: T[]
  total: number
  limit: number
  offset: number
}
