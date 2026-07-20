import { createHash } from 'node:crypto'
import type { LLMCompletionRequest, LLMCompletionResponse } from '@nexus-engineering/shared'

interface CacheEntry {
  response: LLMCompletionResponse
  expiresAt: number
}

/**
 * In-memory TTL cache for LLM completions keyed by a hash of the request.
 * Avoids redundant (and costly) LLM calls for identical prompts.
 */
export class LLMCache {
  private store = new Map<string, CacheEntry>()
  private readonly defaultTtlMs: number

  constructor(defaultTtlMs: number = 1000 * 60 * 30) {
    this.defaultTtlMs = defaultTtlMs
  }

  private key(request: LLMCompletionRequest): string {
    const seed = JSON.stringify({
      messages: request.messages,
      temperature: request.temperature,
      maxTokens: request.maxTokens,
    })
    return createHash('sha256').update(seed).digest('hex')
  }

  get(request: LLMCompletionRequest): LLMCompletionResponse | undefined {
    const k = this.key(request)
    const entry = this.store.get(k)
    if (!entry) return undefined
    if (entry.expiresAt < Date.now()) {
      this.store.delete(k)
      return undefined
    }
    return entry.response
  }

  set(request: LLMCompletionRequest, response: LLMCompletionResponse, ttlMs?: number): void {
    const k = this.key(request)
    this.store.set(k, {
      response,
      expiresAt: Date.now() + (ttlMs ?? this.defaultTtlMs),
    })
  }

  has(request: LLMCompletionRequest): boolean {
    return this.get(request) !== undefined
  }

  clear(): void {
    this.store.clear()
  }

  size(): number {
    return this.store.size
  }
}

let cacheInstance: LLMCache | null = null

export function getLLMCache(ttlMs?: number): LLMCache {
  if (!cacheInstance) {
    cacheInstance = new LLMCache(ttlMs)
  }
  return cacheInstance
}
