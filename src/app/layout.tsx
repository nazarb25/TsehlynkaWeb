import type { Metadata, Viewport } from 'next'

import { AnalyticsClicks } from '@/components/platform/Analytics'
import { MobileDock } from '@/components/layout/MobileDock'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { TelegramBridge } from '@/components/platform/TelegramBridge'
import { JsonLd } from '@/components/seo/JsonLd'
import { listThemes } from '@/lib/api/catalog'
import type { Theme } from '@/lib/api/types'
import { popularThemes } from '@/lib/catalog/themes'
import { organizationSchema, websiteSchema } from '@/lib/seo'
import { botUrl, isIndexable, SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, siteUrl } from '@/lib/site'

import '@/styles/tokens.css'
import '@/styles/base.css'
import '@/styles/layout.css'
import '@/styles/sets.css'
import '@/styles/catalog.css'
import '@/styles/set.css'
import '@/styles/pages.css'

export const dynamic = 'force-dynamic'

export function generateMetadata(): Metadata {
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: `${SITE_NAME}: ${SITE_TAGLINE}`, template: `%s | ${SITE_NAME}` },
    description: SITE_DESCRIPTION,
    applicationName: SITE_NAME,
    robots: isIndexable() ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: { type: 'website', siteName: SITE_NAME, locale: 'uk_UA' },
    twitter: { card: 'summary_large_image' },
    formatDetection: { telephone: false },
    icons: { icon: '/icon.svg' },
    verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f2f2f7' },
    { media: '(prefers-color-scheme: dark)', color: '#1c1c1e' },
  ],
}

async function loadThemes(): Promise<Theme[]> {
  try {
    return await listThemes()
  } catch {
    return []
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const themes = await loadThemes()
  const telegram = botUrl()
  return (
    <html lang="uk">
      <body>
        <TelegramBridge>
          <SiteHeader themes={popularThemes(themes, 12)} botUrl={telegram} />
          <main className="main">{children}</main>
          <SiteFooter themes={popularThemes(themes, 4)} botUrl={telegram} />
          <MobileDock />
          <AnalyticsClicks />
        </TelegramBridge>
        <JsonLd data={[websiteSchema(), organizationSchema()]} />
      </body>
    </html>
  )
}
