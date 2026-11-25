import type { MetadataRoute } from 'next'

import { absoluteUrl, isIndexable } from '@/lib/site'

export const dynamic = 'force-dynamic'

export default function robots(): MetadataRoute.Robots {
  if (!isIndexable()) return { rules: { userAgent: '*', disallow: '/' } }
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/search', '/monitoring'] },
    sitemap: absoluteUrl('/sitemap.xml'),
  }
}
