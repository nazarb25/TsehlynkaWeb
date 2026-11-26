import { createHash } from 'node:crypto'

import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const { authorizationRequest } = await import('./telegram')

describe('authorizationRequest', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('builds the Telegram authorize URL with state and S256 PKCE', () => {
    vi.stubEnv('SITE_URL', 'https://tsehlynka.com.ua')

    const { url, state, verifier } = authorizationRequest({ id: '9063884455', secret: 'secret' })
    const params = new URL(url).searchParams

    expect(url.startsWith('https://oauth.telegram.org/auth?')).toBe(true)
    expect(params.get('client_id')).toBe('9063884455')
    expect(params.get('redirect_uri')).toBe('https://tsehlynka.com.ua/auth/telegram/callback')
    expect(params.get('response_type')).toBe('code')
    expect(params.get('scope')).toBe('openid profile telegram:bot_access')
    expect(params.get('state')).toBe(state)
    expect(params.get('code_challenge_method')).toBe('S256')
    expect(params.get('code_challenge')).toBe(createHash('sha256').update(verifier).digest('base64url'))
    expect(url).not.toContain('secret')
  })
})
