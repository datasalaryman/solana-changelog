import { describe, expect, test } from 'bun:test'
import { extractClientIp, parseRedisUrl } from './rateLimit'

describe('extractClientIp', () => {
  test('uses the first x-forwarded-for IP', () => {
    const request = new Request('https://example.com', {
      headers: { 'x-forwarded-for': '203.0.113.10, 198.51.100.2' },
    })

    expect(extractClientIp(request)).toBe('203.0.113.10')
  })

  test('falls back to x-real-ip and Cloudflare headers', () => {
    expect(extractClientIp(new Request('https://example.com', {
      headers: { 'x-real-ip': '198.51.100.7' },
    }))).toBe('198.51.100.7')

    expect(extractClientIp(new Request('https://example.com', {
      headers: { 'cf-connecting-ip': '198.51.100.8' },
    }))).toBe('198.51.100.8')
  })
})

describe('parseRedisUrl', () => {
  test('normalizes the Upstash rediss URL into REST credentials', () => {
    expect(parseRedisUrl('rediss://default:secret-token@example.upstash.io:6379')).toEqual({
      url: 'https://example.upstash.io',
      token: 'secret-token',
    })
  })

  test('rejects unsupported Redis URL formats', () => {
    expect(parseRedisUrl('https://:secret-token@example.upstash.io')).toBeNull()
    expect(parseRedisUrl('rediss://user:secret-token@example.upstash.io:6379')).toBeNull()
    expect(parseRedisUrl('rediss://default:secret-token@example.upstash.io')).toBeNull()
  })
})
