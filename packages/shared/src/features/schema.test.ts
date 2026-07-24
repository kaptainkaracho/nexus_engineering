import { describe, it, expect } from 'vitest'
import { featureDocSchema } from './schema'
import Ajv from 'ajv'

const ajv = new Ajv()

describe('featureDocSchema', () => {
  it('accepts a valid feature-doc/v1 document', () => {
    const doc = {
      nexus: {
        schema: 'feature-doc/v1',
        metadata: { domain: 'auth', version: '1.0.0', source: 'product' },
      },
      features: [
        {
          id: 'f1',
          name: 'Login',
          description: 'User can log in',
          userStories: [
            {
              id: 'us1',
              role: 'user',
              want: 'log in',
              acceptanceCriteria: [{ id: 'ac1', then: 'I am authenticated' }],
            },
          ],
        },
      ],
    }
    const validate = ajv.compile(featureDocSchema)
    expect(validate(doc)).toBe(true)
  })

  it('rejects wrong schema enum', () => {
    const validate = ajv.compile(featureDocSchema)
    expect(
      validate({ nexus: { schema: 'wrong/v1', metadata: {} }, features: [] }),
    ).toBe(false)
  })

  it('requires nexus and features', () => {
    const validate = ajv.compile(featureDocSchema)
    expect(validate({})).toBe(false)
    expect(validate({ nexus: { schema: 'feature-doc/v1', metadata: {} } })).toBe(false)
  })

  it('rejects feature without userStories', () => {
    const validate = ajv.compile(featureDocSchema)
    expect(
      validate({
        nexus: { schema: 'feature-doc/v1', metadata: { domain: 'd', version: '1', source: 's' } },
        features: [{ id: 'f1', name: 'n', description: 'd' }],
      }),
    ).toBe(false)
  })

  it('rejects acceptance criterion missing then/description', () => {
    const validate = ajv.compile(featureDocSchema)
    expect(
      validate({
        nexus: { schema: 'feature-doc/v1', metadata: { domain: 'd', version: '1', source: 's' } },
        features: [
          {
            id: 'f1',
            name: 'n',
            description: 'd',
            userStories: [{ id: 'us1', role: 'r', want: 'w', acceptanceCriteria: [{ id: 'ac1' }] }],
          },
        ],
      }),
    ).toBe(false)
  })

  it('accepts all four feature statuses', () => {
    const validate = ajv.compile(featureDocSchema)
    for (const status of ['draft', 'approved', 'implemented', 'deprecated']) {
      const ok = validate({
        nexus: { schema: 'feature-doc/v1', metadata: { domain: 'd', version: '1', source: 's' } },
        features: [
          {
            id: 'f1',
            name: 'n',
            description: 'd',
            status,
            userStories: [{ id: 'us1', role: 'r', want: 'w', acceptanceCriteria: [{ id: 'ac1', then: 't' }] }],
          },
        ],
      })
      expect(ok).toBe(true)
    }
  })
})
