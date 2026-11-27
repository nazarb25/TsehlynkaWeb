import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs/config'

const posthogHost = (process.env.POSTHOG_HOST || 'https://eu.i.posthog.com').replace(/\/+$/, '')
const posthogAssets = posthogHost.replace('.i.posthog.com', '-assets.i.posthog.com')

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
  serverExternalPackages: ['@sentry/profiling-node'],
  skipTrailingSlashRedirect: true,
  async redirects() {
    return [{ source: '/profile/privacy', destination: '/privacy', permanent: true }]
  },
  async rewrites() {
    return [
      { source: '/ingest/static/:path*', destination: `${posthogAssets}/static/:path*` },
      { source: '/ingest/array/:path*', destination: `${posthogAssets}/array/:path*` },
      { source: '/ingest/:path*', destination: `${posthogHost}/:path*` },
    ]
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Document-Policy', value: 'js-profiling' },
        ],
      },
    ]
  },
}

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  release: { name: process.env.SENTRY_RELEASE },
  silent: !process.env.CI,
  telemetry: false,
  widenClientFileUpload: true,
  reactComponentAnnotation: { enabled: true },
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN, deleteSourcemapsAfterUpload: true },
})
