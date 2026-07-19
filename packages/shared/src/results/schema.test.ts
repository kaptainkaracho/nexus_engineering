import { describe, it, expect } from 'vitest'
import { resultsDocSchema } from './schema'
import Ajv from 'ajv'

const ajv = new Ajv()

describe('resultsDocSchema', () => {
  it('accepts a valid results-doc/v1 document', () => {
    const doc = {
      nexus: {
        schema: 'results-doc/v1',
        metadata: { domain: 'auth', version: '1.0.0', source: 'vitest' },
      },
      executions: [
        { id: 'e1', suiteId: 's1', caseId: 'c1', status: 'passed', durationMs: 10 },
      ],
    }
    const validate = ajv.compile(resultsDocSchema)
    expect(validate(doc)).toBe(true)
  })

  it('rejects wrong schema enum', () => {
    const validate = ajv.compile(resultsDocSchema)
    expect(
      validate({ nexus: { schema: 'wrong/v1', metadata: {} }, executions: [] }),
    ).toBe(false)
  })

  it('requires nexus and executions', () => {
    const validate = ajv.compile(resultsDocSchema)
    expect(validate({})).toBe(false)
    expect(validate({ nexus: { schema: 'results-doc/v1', metadata: {} } })).toBe(false)
  })

  it('rejects invalid execution status', () => {
    const validate = ajv.compile(resultsDocSchema)
    expect(
      validate({
        nexus: { schema: 'results-doc/v1', metadata: { domain: 'd', version: '1', source: 's' } },
        executions: [{ id: 'e1', suiteId: 's1', caseId: 'c1', status: 'bogus' }],
      }),
    ).toBe(false)
  })

  it('accepts all five statuses', () => {
    const validate = ajv.compile(resultsDocSchema)
    for (const status of ['passed', 'failed', 'skipped', 'error', 'flaky']) {
      const ok = validate({
        nexus: { schema: 'results-doc/v1', metadata: { domain: 'd', version: '1', source: 's' } },
        executions: [{ id: 'e1', suiteId: 's1', caseId: 'c1', status }],
      })
      expect(ok).toBe(true)
    }
  })
})
