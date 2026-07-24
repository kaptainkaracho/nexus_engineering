import { describe, it, expect } from 'vitest'
import { ValidatedRequirementsLoader } from './loader'

describe('ValidatedRequirementsLoader - getExternalArtifactLookup', () => {
  const mockDocs = [
    {
      nexus: {
        metadata: {
          documentId: 'doc-1',
          domain: 'system',
        },
      },
      requirements: [
        { id: 'req-1', title: 'Requirement 1' },
        { id: 'req-2', title: 'Requirement 2' },
      ],
    },
    {
      nexus: {
        metadata: {
          documentId: 'doc-2',
          domain: 'hardware',
        },
      },
      requirements: [{ id: 'req-3', title: 'Requirement 3' }],
    },
    {
      nexus: {
        metadata: {
          documentId: 'doc-empty',
        },
      },
      requirements: [],
    },
    {
      nexus: {
        metadata: {
          documentId: 'doc-no-reqs',
        },
      },
    },
  ]

  it('should create lookup map with requirement IDs', () => {
    const loader = new ValidatedRequirementsLoader()
    const result = (loader as any).getExternalArtifactLookup(mockDocs)

    expect(result['doc-1']).toEqual(['req-1', 'req-2'])
    expect(result['doc-2']).toEqual(['req-3'])
    expect(result['doc-empty']).toEqual([])
  })

  it('should handle empty document array', () => {
    const loader = new ValidatedRequirementsLoader()
    expect((loader as any).getExternalArtifactLookup([])).toEqual({})
  })

  it('should populate lookup map with actual requirement IDs', () => {
    const singleDoc = [
      {
        nexus: {
          metadata: {
            documentId: 'single-doc',
          },
        },
        requirements: [{ id: 'single-req-id' }, { id: 'another-req-id' }],
      },
    ]

    const loader = new ValidatedRequirementsLoader()
    const result = (loader as any).getExternalArtifactLookup(singleDoc)

    expect(result['single-doc']).toContain('single-req-id')
    expect(result['single-doc']).toContain('another-req-id')
    expect(result['single-doc'].length).toBe(2)
  })
})
