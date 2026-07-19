import { describe, it, expect } from 'vitest'
import { extractJson, parseStructuredLLM, safeStructured } from './llmResponseParser'

describe('llmResponseParser', () => {
  it('extracts JSON from markdown code fences', () => {
    const text = 'Here is the result:\n```json\n{"analysisType":"gap","score":9}\n```'
    expect(extractJson(text)).toContain('"analysisType"')
  })

  it('extracts JSON embedded in prose', () => {
    const text = 'blah {"a":1} trailing text'
    expect(extractJson(text)).toBe('{"a":1}')
  })

  it('parses a valid structured response', () => {
    const res = { content: '{"analysisType":"impact","n":3}', model: 'm', usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 } }
    const result = parseStructuredLLM(res, 'impact')
    expect(result.ok).toBe(true)
    expect(result.data?.analysisType).toBe('impact')
  })

  it('fails when analysisType mismatches', () => {
    const res = { content: '{"analysisType":"other"}', model: 'm', usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 } }
    const result = parseStructuredLLM(res, 'gap')
    expect(result.ok).toBe(false)
  })

  it('safeStructured never throws and preserves raw on failure', () => {
    const res = { content: 'not json at all', model: 'm', usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 } }
    const data = safeStructured(res, 'gap')
    expect(data.analysisType).toBe('gap')
    expect((data as any).parseError).toBeDefined()
    expect((data as any).raw).toContain('not json')
  })
})
