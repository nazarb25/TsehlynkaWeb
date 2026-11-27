import { describe, expect, it } from 'vitest'

import { countBucket, entrySource, queryShape, stripPrivateParams } from './analytics'

describe('queryShape', () => {
  it('keeps only the kind and length of the query', () => {
    expect(queryShape('10305')).toEqual({ query_type: 'number', query_length_bucket: '3-5' })
    expect(queryShape('  Тисячолітній сокіл ')).toEqual({ query_type: 'text', query_length_bucket: '11-20' })
    expect(queryShape(null)).toEqual({ query_type: 'empty', query_length_bucket: '0' })
  })
})

describe('countBucket', () => {
  it('separates zero results', () => {
    expect([0, 1, 7, 40, 900].map(countBucket)).toEqual(['0', '1', '2-10', '11-50', '51+'])
  })
})

describe('entrySource', () => {
  it('accepts only known bot sources', () => {
    expect(entrySource('price_alert')).toBe('price_alert')
    expect(entrySource('naz')).toBeNull()
    expect(entrySource(null)).toBeNull()
  })
})

describe('stripPrivateParams', () => {
  it('hides the search text in URLs', () => {
    expect(stripPrivateParams('https://tsehlynka.com.ua/search?q=falcon&mode=all')).toBe('https://tsehlynka.com.ua/search?q=%E2%80%A6&mode=all')
    expect(stripPrivateParams('https://tsehlynka.com.ua/catalog?theme=city')).toBe('https://tsehlynka.com.ua/catalog?theme=city')
    expect(stripPrivateParams(42)).toBe(42)
  })
})
