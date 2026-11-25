import 'server-only'

import { absoluteUrl } from '@/lib/site'

export interface SitemapEntry {
  path: string
  lastModified?: string
}

function escape(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function xmlResponse(body: string): Response {
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n${body}`, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  })
}

export function urlset(entries: SitemapEntry[]): Response {
  const urls = entries
    .map(
      (entry) =>
        `<url><loc>${escape(absoluteUrl(entry.path))}</loc>${entry.lastModified ? `<lastmod>${entry.lastModified}</lastmod>` : ''}</url>`,
    )
    .join('\n')
  return xmlResponse(`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`)
}

export function sitemapIndex(paths: string[]): Response {
  const items = paths.map((path) => `<sitemap><loc>${escape(absoluteUrl(path))}</loc></sitemap>`).join('\n')
  return xmlResponse(`<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items}\n</sitemapindex>`)
}
