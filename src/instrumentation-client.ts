import * as Sentry from '@sentry/nextjs'
import posthog from 'posthog-js'

import { IGNORED_ERRORS, tracesSampleRate } from '@/lib/sentry-options'

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
  tunnel: true,
  tracesSampleRate: tracesSampleRate(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE),
  profileSessionSampleRate: 1,
  profileLifecycle: 'trace',
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  ignoreErrors: IGNORED_ERRORS,
  denyUrls: [/^chrome-extension:\/\//, /^moz-extension:\/\//, /^safari-web-extension:\/\//],
  integrations: [
    Sentry.browserProfilingIntegration(),
    Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false }),
    Sentry.feedbackIntegration({
      autoInject: false,
      colorScheme: 'system',
      showBranding: false,
      formTitle: 'Повідомити про проблему',
      submitButtonLabel: 'Надіслати',
      cancelButtonLabel: 'Скасувати',
      confirmButtonLabel: 'Підтвердити',
      addScreenshotButtonLabel: 'Додати знімок екрана',
      removeScreenshotButtonLabel: 'Прибрати знімок екрана',
      nameLabel: 'Імʼя',
      namePlaceholder: 'Як до вас звертатися',
      emailLabel: 'Email',
      emailPlaceholder: 'Щоб ми могли відповісти',
      isRequiredLabel: '(обовʼязково)',
      messageLabel: 'Що сталося',
      messagePlaceholder: 'Опишіть, що ви робили і що пішло не так',
      successMessageText: 'Дякуємо! Ми отримали повідомлення.',
    }),
    Sentry.consoleLoggingIntegration({ levels: ['warn', 'error'] }),
  ],
})

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY

if (posthogKey) {
  posthog.init(posthogKey, {
    api_host: '/ingest',
    ui_host: process.env.NEXT_PUBLIC_POSTHOG_UI_HOST ?? 'https://eu.posthog.com',
    defaults: '2026-08-30',
    capture_pageview: 'history_change',
    capture_pageleave: true,
    person_profiles: 'identified_only',
    disable_session_recording: true,
    capture_exceptions: false,
  })
  posthog.register({ platform: 'web' })
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
