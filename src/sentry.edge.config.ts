import * as Sentry from '@sentry/nextjs'

import { IGNORED_ERRORS, tracesSampleRate } from '@/lib/sentry-options'

const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
  tracesSampleRate: tracesSampleRate(process.env.SENTRY_TRACES_SAMPLE_RATE),
  ignoreErrors: IGNORED_ERRORS,
  integrations: [Sentry.serveTunnelIntegration(), Sentry.consoleLoggingIntegration({ levels: ['warn', 'error'] })],
})
