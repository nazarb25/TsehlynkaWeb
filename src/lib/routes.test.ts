import { describe, expect, it } from 'vitest'

import { numbersFromSetSlug, setPath, slugify } from './routes'

describe('slugify', () => {
  it('transliterates Ukrainian letters with diacritics before stripping them', () => {
    expect(slugify('Чарівний їжак')).toBe('charivnyi-izhak')
  })

  it('keeps latin text and drops punctuation', () => {
    expect(slugify('Millennium Falcon™: UCS!')).toBe('millennium-falcon-ucs')
  })
})

describe('setPath', () => {
  it('builds a number slug path', () => {
    expect(setPath({ id: 'x', name: 'Millennium Falcon', official_number_display: '75192' })).toBe('/sets/75192-millennium-falcon')
  })

  it('falls back to id when the number is not usable', () => {
    expect(setPath({ id: 'abc', name: 'Promo', official_number_display: 'PROMO-1' })).toBe('/sets/abc')
  })
})

describe('numbersFromSetSlug', () => {
  it('returns the plain number', () => {
    expect(numbersFromSetSlug('75192-millennium-falcon')).toEqual(['75192'])
  })

  it('tries the variant before the base number for a short numeric part', () => {
    expect(numbersFromSetSlug('75968-4-privet-drive')).toEqual(['75968-4', '75968'])
  })

  it('resolves a path generated for a name starting with a number', () => {
    const path = setPath({ id: 'x', name: '4 Privet Drive', official_number_display: '75968' })
    expect(numbersFromSetSlug(path.slice('/sets/'.length))).toContain('75968')
  })

  it('rejects non-numeric slugs', () => {
    expect(numbersFromSetSlug('millennium-falcon')).toEqual([])
  })
})
