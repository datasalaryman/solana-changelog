import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { logServerError } from './errors'

export type RateLimitPolicy = 'auth:get' | 'auth:post' | 'rpc'

const DEFAULT_LIMITS: Record<RateLimitPolicy, number> = {
  'auth:get': 60,
  'auth:post': 10,
  rpc: 30,
}

const POLICY_ENV: Record<RateLimitPolicy, string> = {
  'auth:get': 'RATE_LIMIT_AUTH_GET_PER_MINUTE',
  'auth:post': 'RATE_LIMIT_AUTH_POST_PER_MINUTE',
  rpc: 'RATE_LIMIT_RPC_PER_MINUTE',
}

const WINDOW = '1 m'
const FALLBACK_RETRY_AFTER_SECONDS = 60

let redis: Redis | null | undefined
const limiters = new Map<RateLimitPolicy, Ratelimit>()

type RedisCredentials = {
  url: string
  token: string
}

function isProductionLike(): boolean {
  return process.env.NODE_ENV === 'production' || process.env.VERCEL === '1'
}

function getLimit(policy: RateLimitPolicy): number {
  const value = Number.parseInt(process.env[POLICY_ENV[policy]] || '', 10)
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_LIMITS[policy]
}

export function parseRedisUrl(value: string | undefined): RedisCredentials | null {
  if (!value) {
    return null
  }

  try {
    const redisUrl = new URL(value)

    if (redisUrl.protocol !== 'rediss:' || redisUrl.username !== 'default' || !redisUrl.password || !redisUrl.hostname || redisUrl.port !== '6379') {
      return null
    }

    return {
      url: `https://${redisUrl.hostname}`,
      token: decodeURIComponent(redisUrl.password),
    }
  } catch {
    return null
  }
}

function getRedis(): Redis | null {
  if (redis !== undefined) {
    return redis
  }

  const credentials = parseRedisUrl(process.env.REDIS_URL)

  if (!credentials) {
    redis = null
    return redis
  }

  redis = new Redis(credentials)
  return redis
}

function getLimiter(policy: RateLimitPolicy): Ratelimit | null {
  const client = getRedis()
  if (!client) {
    return null
  }

  const existing = limiters.get(policy)
  if (existing) {
    return existing
  }

  const limiter = new Ratelimit({
    redis: client,
    limiter: Ratelimit.slidingWindow(getLimit(policy), WINDOW),
    prefix: `solana-changelog:${policy}`,
    analytics: true,
  })

  limiters.set(policy, limiter)
  return limiter
}

export function extractClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    const [firstIp] = forwardedFor.split(',')
    const ip = firstIp?.trim()
    if (ip) {
      return ip
    }
  }

  return request.headers.get('x-real-ip')?.trim()
    || request.headers.get('cf-connecting-ip')?.trim()
    || 'unknown'
}

function unavailableResponse(): Response {
  return new Response(JSON.stringify({ error: 'Service temporarily unavailable' }), {
    status: 503,
    headers: {
      'Content-Type': 'application/json',
      'Retry-After': FALLBACK_RETRY_AFTER_SECONDS.toString(),
    },
  })
}

function rateLimitedResponse(result: { limit: number; remaining: number; reset: number }): Response {
  const retryAfter = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000))

  return new Response(JSON.stringify({ error: 'Too many requests' }), {
    status: 429,
    headers: {
      'Content-Type': 'application/json',
      'Retry-After': retryAfter.toString(),
      'X-RateLimit-Limit': result.limit.toString(),
      'X-RateLimit-Remaining': Math.max(0, result.remaining).toString(),
      'X-RateLimit-Reset': Math.ceil(result.reset / 1000).toString(),
    },
  })
}

export async function rateLimitRequest(request: Request, policy: RateLimitPolicy): Promise<Response | null> {
  const limiter = getLimiter(policy)

  if (!limiter) {
    if (isProductionLike()) {
      logServerError(new Error('Missing Upstash Redis rate-limit configuration'), {
        route: 'rate-limit',
        code: 'RATE_LIMIT_CONFIG_MISSING',
        metadata: { policy },
      })

      return unavailableResponse()
    }

    return null
  }

  const ip = extractClientIp(request)
  const identifier = `${policy}:${ip}`

  try {
    const result = await limiter.limit(identifier, {
      ip,
      userAgent: request.headers.get('user-agent') || undefined,
    })

    if (result.success) {
      return null
    }

    return rateLimitedResponse(result)
  } catch (error) {
    logServerError(error, {
      route: 'rate-limit',
      code: 'RATE_LIMIT_CHECK_FAILED',
      metadata: { policy },
    })

    if (policy.startsWith('auth:') || !isProductionLike()) {
      return null
    }

    return unavailableResponse()
  }
}
