import { describe, it, expect } from 'vitest'
import { validateFeatures, validateFeatureDocument } from './validator'
import type { FeatureDocument } from './format'

function docWith(features: any[]): FeatureDocument {
  return {
    nexus: { schema: 'feature-doc/v1', metadata: { domain: 'd', version: '1', source: 's' } },
    features,
  }
}

describe('validateFeatures', () => {
  it('passes a clean document', () => {
    const errors = validateFeatures(
      docWith([
        {
          id: 'f1',
          name: 'n',
          description: 'd',
          userStories: [{ id: 'us1', role: 'r', want: 'w', acceptanceCriteria: [{ id: 'ac1', then: 't' }] }],
        },
      ]),
    )
    expect(errors.size).toBe(0)
  })

  it('flags duplicate feature ids', () => {
    const errors = validateFeatures(
      docWith([
        { id: 'f1', name: 'n', description: 'd', userStories: [] },
        { id: 'f1', name: 'n2', description: 'd', userStories: [] },
      ]),
    )
    expect(errors.has('f1')).toBe(true)
  })

  it('flags feature with no user stories', () => {
    const errors = validateFeatures(docWith([{ id: 'f1', name: 'n', description: 'd', userStories: [] }]))
    expect(errors.get('f1')?.some((m) => m.includes('no user stories'))).toBe(true)
  })

  it('flags story with no acceptance criteria', () => {
    const errors = validateFeatures(
      docWith([{ id: 'f1', name: 'n', description: 'd', userStories: [{ id: 'us1', role: 'r', want: 'w' }] }]),
    )
    expect(errors.get('f1')?.some((m) => m.includes('no acceptance criteria'))).toBe(true)
  })

  it('flags invalid feature status', () => {
    const errors = validateFeatures(
      docWith([
        {
          id: 'f1',
          name: 'n',
          description: 'd',
          status: 'bogus',
          userStories: [{ id: 'us1', role: 'r', want: 'w', acceptanceCriteria: [{ id: 'ac1', then: 't' }] }],
        },
      ]),
    )
    expect(errors.get('f1')?.some((m) => m.includes('Invalid status'))).toBe(true)
  })

  it('flags invalid trace link type', () => {
    const errors = validateFeatures(
      docWith([
        {
          id: 'f1',
          name: 'n',
          description: 'd',
          userStories: [{ id: 'us1', role: 'r', want: 'w', acceptanceCriteria: [{ id: 'ac1', then: 't' }] }],
          traceLinks: [{ type: 'bogus', target: { id: 'r1', documentId: 'd1' } }],
        },
      ]),
    )
    expect(errors.get('f1')?.some((m) => m.includes('Invalid trace link type'))).toBe(true)
  })

  it('flags incomplete trace link target', () => {
    const errors = validateFeatures(
      docWith([
        {
          id: 'f1',
          name: 'n',
          description: 'd',
          userStories: [{ id: 'us1', role: 'r', want: 'w', acceptanceCriteria: [{ id: 'ac1', then: 't' }] }],
          traceLinks: [{ type: 'satisfies', target: { id: 'r1' } }],
        },
      ]),
    )
    expect(errors.get('f1')?.some((m) => m.includes('incomplete target'))).toBe(true)
  })
})

describe('validateFeatureDocument', () => {
  it('returns valid:true for clean doc', async () => {
    const res = await validateFeatureDocument(
      docWith([
        {
          id: 'f1',
          name: 'n',
          description: 'd',
          userStories: [{ id: 'us1', role: 'r', want: 'w', acceptanceCriteria: [{ id: 'ac1', then: 't' }] }],
        },
      ]),
    )
    expect(res.valid).toBe(true)
  })

  it('returns valid:false when nexus missing', async () => {
    const res = await validateFeatureDocument({} as any)
    expect(res.valid).toBe(false)
    expect(res.errors?.has('document')).toBe(true)
  })
})
