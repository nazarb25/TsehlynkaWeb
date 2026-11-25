import * as Sentry from '@sentry/nextjs'
import { nodeProfilingIntegration } from '@sentry/profiling-node'

import { IGNORED_ERRORS, tracesSampleRate } from '@/lib/sentry-options'

const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
  tracesSampleRate: tracesSampleRate(process.env.SENTRY_TRACES_SAMPLE_RATE),
  profileSessionSampleRate: 1,
  profileLifecycle: 'trace',
  ignoreErrors: IGNORED_ERRORS,
  integrations: [
    Sentry.serveTunnelIntegration(),
    nodeProfilingIntegration(),
    Sentry.nodeRuntimeMetricsIntegration(),
    Sentry.consoleLoggingIntegration({ levels: ['warn', 'error'] }),
  ],
})
