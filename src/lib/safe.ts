import 'server-only'

import * as Sentry from '@sentry/nextjs'

import { CatalogUnavailableError } from '@/lib/api/client'

/** Дані розділу або `null`, якщо каталог недоступний: сторінка показує решту. */
export async function safe<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise
  } catch (error) {
    if (!(error instanceof CatalogUnavailableError)) Sentry.captureException(error)
    return null
  }
}
