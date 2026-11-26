import { afterEach, describe, expect, it, vi } from 'vitest'

import { initial, safeNext, sameOrigin } from './guards'

describe('safeNext', () => {
  it.each([
    ['/sets/42100-liebherr', '/sets/42100-liebherr'],
    ['/catalog?view=grid', '/catalog?view=grid'],
    [null, '/'],
    ['', '/'],
    ['https://evil.example/', '/'],
    ['//evil.example/', '/'],
    ['/\\evil.example', '/'],
    ['/auth/logout', '/'],
  ])('%s → %s', (value, expected) => {
    expect(safeNext(value)).toBe(expected)
  })
})

describe('sameOrigin', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('accepts the site origin and rejects others', () => {
    vi.stubEnv('SITE_URL', 'https://tsehlynka.com.ua')
    const request = (origin: string | null) => new Request('http://localhost:3000/auth/logout', { method: 'POST', headers: origin ? { origin } : {} })

    expect(sameOrigin(request('https://tsehlynka.com.ua'))).toBe(true)
    expect(sameOrigin(request('http://localhost:3000'))).toBe(true)
    expect(sameOrigin(request('https://evil.example'))).toBe(false)
    expect(sameOrigin(request(null))).toBe(false)
  })
})

describe('initial', () => {
  it('takes the first letter of the name', () => {
    expect(initial('олена')).toBe('О')
    expect(initial('  Nazar')).toBe('N')
    expect(initial('')).toBe('?')
  })
})
