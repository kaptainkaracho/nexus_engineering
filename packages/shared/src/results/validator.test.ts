import { describe, it, expect } from 'vitest'
import { validateExecutions, validateResultsDocument } from './validator'
import type { ResultsDocument } from './format'

function docWith(executions: any[]): ResultsDocument {
  return {
    nexus: { schema: 'results-doc/v1', metadata: { domain: 'd', version: '1', source: 's' } },
    executions,
  }
}

describe('validateExecutions', () => {
  it('passes a clean document', () => {
    const errors = validateExecutions(
      docWith([{ id: 'e1', suiteId: 's1', caseId: 'c1', status: 'passed', durationMs: 5 }]),
    )
    expect(errors.size).toBe(0)
  })

  it('flags duplicate execution ids', () => {
    const errors = validateExecutions(
      docWith([
        { id: 'e1', suiteId: 's1', caseId: 'c1', status: 'passed' },
        { id: 'e1', suiteId: 's1', caseId: 'c2', status: 'passed' },
      ]),
    )
    expect(errors.has('e1')).toBe(true)
  })

  it('flags negative duration', () => {
    const errors = validateExecutions(
      docWith([{ id: 'e1', suiteId: 's1', caseId: 'c1', status: 'passed', durationMs: -3 }]),
    )
    expect(errors.get('e1')?.[0]).toMatch(/durationMs/)
  })

  it('requires error message for failed/error', () => {
    const errors = validateExecutions(
      docWith([{ id: 'e1', suiteId: 's1', caseId: 'c1', status: 'failed' }]),
    )
    expect(errors.get('e1')?.some((m) => m.includes('error.message'))).toBe(true)
  })

  it('flags finishedAt before startedAt', () => {
    const errors = validateExecutions(
      docWith([
        {
          id: 'e1',
          suiteId: 's1',
          caseId: 'c1',
          status: 'passed',
          startedAt: '2026-01-01T10:00:00Z',
          finishedAt: '2026-01-01T09:00:00Z',
        },
      ]),
    )
    expect(errors.get('e1')?.some((m) => m.includes('finishedAt'))).toBe(true)
  })

  it('flags non-integer retries', () => {
    const errors = validateExecutions(
      docWith([{ id: 'e1', suiteId: 's1', caseId: 'c1', status: 'passed', retries: 1.5 }]),
    )
    expect(errors.get('e1')?.some((m) => m.includes('retries'))).toBe(true)
  })
})

describe('validateResultsDocument', () => {
  it('returns valid:true for clean doc', async () => {
    const res = await validateResultsDocument(
      docWith([{ id: 'e1', suiteId: 's1', caseId: 'c1', status: 'passed' }]),
    )
    expect(res.valid).toBe(true)
  })

  it('returns valid:false when nexus missing', async () => {
    const res = await validateResultsDocument({} as any)
    expect(res.valid).toBe(false)
    expect(res.errors?.has('document')).toBe(true)
  })
})
