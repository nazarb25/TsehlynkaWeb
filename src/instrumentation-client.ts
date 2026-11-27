import * as Sentry from '@sentry/nextjs'
import posthog from 'posthog-js'

import { stripPrivateParams } from '@/lib/analytics'
import { IGNORED_ERRORS, tracesSampleRate } from '@/lib/sentry-options'

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.NODE_ENV,
  tunnel: true,
  tracesSampleRate: tracesSampleRate(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE),
  profileSessionSampleRate: 1,
  profileLifecycle: 'trace',
  ignoreErrors: IGNORED_ERRORS,
  denyUrls: [/^chrome-extension:\/\//, /^moz-extension:\/\//, /^safari-web-extension:\/\//],
  integrations: [
    Sentry.browserProfilingIntegration(),
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
/** Адреси в подіях PostHog, з яких прибирається текст пошуку. */
const URL_PROPERTIES = ['$current_url', '$referrer', '$initial_current_url', '$initial_referrer', '$prev_pageview_url']

if (posthogKey) {
  posthog.init(posthogKey, {
    api_host: '/ingest',
    ui_host: process.env.NEXT_PUBLIC_POSTHOG_UI_HOST || 'https://eu.posthog.com',
    defaults: '2026-08-30',
    capture_pageview: 'history_change',
    capture_pageleave: true,
    person_profiles: 'identified_only',
    session_recording: { maskAllInputs: true },
    capture_exceptions: false,
    before_send: (event) => {
      if (!event) return event
      for (const bag of [event.properties, event.$set, event.$set_once]) {
        if (!bag) continue
        for (const key of URL_PROPERTIES) if (key in bag) bag[key] = stripPrivateParams(bag[key])
      }
      return event
    },
  })
  posthog.register({ platform: 'web' })
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
