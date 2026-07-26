import type { FastifyRequest, FastifyReply } from 'fastify'
import { AppError } from './errorHandler'

interface RateLimitEntry {
  count: number
  resetAt: number
}

const stores = new Map<string, Map<string, RateLimitEntry>>()

function getStore(name: string): Map<string, RateLimitEntry> {
  if (!stores.has(name)) {
    stores.set(name, new Map())
  }
  return stores.get(name)!
}

function cleanupStores() {
  const now = Date.now()
  for (const [, store] of stores) {
    for (const [key, entry] of store) {
      if (entry.resetAt <= now) {
        store.delete(key)
      }
    }
  }
}

setInterval(cleanupStores, 60_000)

export interface RateLimitOptions {
  windowMs: number
  max: number
  name?: string
  keyFn?: (request: FastifyRequest) => string
}

export function rateLimit(opts: RateLimitOptions) {
  const {
    windowMs = 60_000,
    max = 100,
    name = 'default',
    keyFn = (req) => req.ip ?? 'unknown',
  } = opts

  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const store = getStore(name)
    const key = keyFn(request)
    const now = Date.now()

    let entry = store.get(key)
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs }
      store.set(key, entry)
    }

    entry.count++

    reply.header('X-RateLimit-Limit', max)
    reply.header('X-RateLimit-Remaining', Math.max(0, max - entry.count))
    reply.header('X-RateLimit-Reset', Math.ceil(entry.resetAt / 1000))

    if (entry.count > max) {
      throw new AppError(429, 'Too many requests. Please try again later.', {
        limit: max,
        windowMs,
        retryAfter: Math.ceil((entry.resetAt - now) / 1000),
      })
    }
  }
}

export const complianceRateLimit = rateLimit({
  windowMs: 60_000,
  max: 30,
  name: 'compliance',
})

export const reportGenerationRateLimit = rateLimit({
  windowMs: 60_000,
  max: 10,
  name: 'report-generation',
})

export function resetRateLimiters() {
  stores.clear()
}
