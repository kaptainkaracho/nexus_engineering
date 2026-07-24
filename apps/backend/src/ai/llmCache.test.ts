import { describe, it, expect, beforeEach } from 'vitest'
import { LLMCache } from './llmCache'
import type { LLMCompletionRequest, LLMCompletionResponse } from '@nexus-engineering/shared'

function makeRequest(prompt: string): LLMCompletionRequest {
  return { messages: [{ role: 'user', content: prompt }] }
}

const RESPONSE: LLMCompletionResponse = { content: 'ok', model: 'm', usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 } }

describe('LLMCache', () => {
  let cache: LLMCache

  beforeEach(() => {
    cache = new LLMCache(1000)
  })

  it('stores and returns identical requests', () => {
    const req = makeRequest('hello')
    expect(cache.get(req)).toBeUndefined()
    cache.set(req, RESPONSE)
    expect(cache.get(req)).toEqual(RESPONSE)
    expect(cache.has(req)).toBe(true)
    expect(cache.size()).toBe(1)
  })

  it('treats different prompts as different keys', () => {
    cache.set(makeRequest('a'), RESPONSE)
    expect(cache.get(makeRequest('b'))).toBeUndefined()
  })

  it('expires entries after TTL', async () => {
    const req = makeRequest('temp')
    cache.set(req, RESPONSE, 5)
    expect(cache.get(req)).toEqual(RESPONSE)
    await new Promise(r => setTimeout(r, 15))
    expect(cache.get(req)).toBeUndefined()
  })

  it('can be cleared', () => {
    cache.set(makeRequest('x'), RESPONSE)
    cache.clear()
    expect(cache.size()).toBe(0)
  })
})
