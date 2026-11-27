import { describe, expect, it } from 'vitest'

import { mailtoHref, parseContactEmail, parseTelegramContact } from './contacts'

describe('parseTelegramContact', () => {
  it('shows the username and keeps the full link', () => {
    expect(parseTelegramContact('https://t.me/tsehlynka_ua?direct')).toEqual({ href: 'https://t.me/tsehlynka_ua?direct', label: '@tsehlynka_ua' })
  })

  it('accepts a link without the scheme and a bare @username', () => {
    expect(parseTelegramContact('t.me/tsehlynka_ua?direct')?.href).toBe('https://t.me/tsehlynka_ua?direct')
    expect(parseTelegramContact('@tsehlynka_ua')).toEqual({ href: 'https://t.me/tsehlynka_ua', label: '@tsehlynka_ua' })
  })

  it('rejects other hosts, plain http and bad usernames', () => {
    expect(parseTelegramContact('https://example.com/tsehlynka_ua')).toBeNull()
    expect(parseTelegramContact('http://t.me/tsehlynka_ua')).toBeNull()
    expect(parseTelegramContact('https://t.me/')).toBeNull()
    expect(parseTelegramContact('@a b')).toBeNull()
    expect(parseTelegramContact('')).toBeNull()
    expect(parseTelegramContact(undefined)).toBeNull()
  })
})

describe('parseContactEmail', () => {
  it('trims a valid address and rejects junk', () => {
    expect(parseContactEmail('  hi@example.com ')).toBe('hi@example.com')
    expect(parseContactEmail('hi@example')).toBeNull()
    expect(parseContactEmail('hi@example.com?bcc=x@y.z')).toBeNull()
    expect(parseContactEmail(undefined)).toBeNull()
  })
})

describe('mailtoHref', () => {
  it('encodes the subject and body with %20, not +', () => {
    expect(mailtoHref('hi@example.com', { title: 'Неточна ціна', body: 'Магазин:\n' })).toBe(
      `mailto:hi@example.com?subject=${encodeURIComponent('Неточна ціна')}&body=${encodeURIComponent('Магазин:\n')}`,
    )
    expect(mailtoHref('hi@example.com', { title: 'Скарга чи претензія' })).not.toContain('body=')
    expect(mailtoHref('hi@example.com')).toBe('mailto:hi@example.com')
  })
})
