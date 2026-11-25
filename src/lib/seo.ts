import type { Metadata } from 'next'

import type { SetDetails, SetItem, ShopOffer, ThemeRef } from '@/lib/api/types'
import { gallery, imageSrc } from '@/lib/catalog/set'
import { setPath, themePath } from '@/lib/routes'
import { absoluteUrl, isIndexable, SITE_DESCRIPTION, SITE_NAME } from '@/lib/site'

type Schema = Record<string, unknown>

export interface Crumb {
  name: string
  path?: string
}

export function websiteSchema(): Schema {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: absoluteUrl('/'),
    inLanguage: 'uk',
    description: SITE_DESCRIPTION,
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${absoluteUrl('/search')}?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  }
}

export function organizationSchema(): Schema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: absoluteUrl('/'),
    logo: absoluteUrl('/icon.svg'),
  }
}

export function breadcrumbSchema(crumbs: Crumb[]): Schema {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      ...(crumb.path ? { item: absoluteUrl(crumb.path) } : {}),
    })),
  }
}

export function itemListSchema(items: SetItem[], offset: number): Schema {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: offset + index + 1,
      url: absoluteUrl(setPath(item)),
      name: item.name,
    })),
  }
}

/**
 * Набір як Product з AggregateOffer: діапазон цін магазинів без продавця, доставки й повернення,
 * бо сайт порівнює ціни, а не продає.
 */
export function productSchema(details: SetDetails, offers: ShopOffer[], path: string): Schema {
  const theme = details.theme_path.at(-1)
  const images = gallery(details).all.slice(0, 6).map(imageSrc)
  const prices = offers
    .filter((offer) => offer.price !== null && (offer.availability === 'in_stock' || offer.availability === 'preorder'))
    .map((offer) => Number(offer.price))
  const inStock = offers.some((offer) => offer.availability === 'in_stock' && offer.price !== null)
  const product: Schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: details.name,
    url: absoluteUrl(path),
    brand: { '@type': 'Brand', name: 'LEGO' },
    ...(details.official_number_display ? { sku: details.official_number_display, mpn: details.official_number_display } : {}),
    ...(images.length ? { image: images } : {}),
    ...(details.description ? { description: details.description } : {}),
    ...(theme ? { category: theme.name } : {}),
    ...(details.intro_year ? { releaseDate: String(details.intro_year) } : {}),
  }
  if (prices.length) {
    product.offers = {
      '@type': 'AggregateOffer',
      priceCurrency: 'UAH',
      lowPrice: Math.min(...prices),
      highPrice: Math.max(...prices),
      offerCount: prices.length,
      availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder',
    }
  }
  return product
}

export function themeCrumbs(path: ThemeRef[]): Crumb[] {
  return path.map((theme) => ({ name: theme.name, path: themePath(theme) }))
}

interface PageMeta {
  title: string
  description: string
  path: string
  image?: string | null
  /** Сторінки з фільтрами й пошуком: не індексувати, але йти за посиланнями. */
  noindex?: boolean
}

export function pageMetadata({ title, description, path, image, noindex }: PageMeta): Metadata {
  const indexable = isIndexable() && !noindex
  return {
    title,
    description,
    alternates: { canonical: path },
    robots: indexable ? { index: true, follow: true } : { index: false, follow: isIndexable() },
    openGraph: {
      title,
      description,
      url: path,
      type: 'website',
      siteName: SITE_NAME,
      locale: 'uk_UA',
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: { card: image ? 'summary_large_image' : 'summary', title, description, ...(image ? { images: [image] } : {}) },
  }
}
