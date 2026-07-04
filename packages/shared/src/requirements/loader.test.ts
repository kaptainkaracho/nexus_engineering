import { describe, it } from 'node:test'
import assert from 'node:assert'
import { ValidatedRequirementsLoader } from './loader'

describe('ValidatedRequirementsLoader - getExternalArtifactLookup', () => {
  const mockDocs = [
    {
      nexus: {
        metadata: {
          documentId: 'doc-1',
          domain: 'system'
        }
      },
      requirements: [
        { id: 'req-1', title: 'Requirement 1' },
        { id: 'req-2', title: 'Requirement 2' }
      ]
    },
    {
      nexus: {
        metadata: {
          documentId: 'doc-2',
          domain: 'hardware'
        }
      },
      requirements: [
        { id: 'req-3', title: 'Requirement 3' }
      ]
    },
    {
      nexus: {
        metadata: {
          documentId: 'doc-empty'
        }
      },
      requirements: []
    },
    {
      nexus: {
        metadata: {
          documentId: 'doc-no-reqs'
        }
      }
    }
  ]

  it('should create lookup map with requirement IDs', () => {
    const loader = new ValidatedRequirementsLoader()
    const result = (loader as any).getExternalArtifactLookup(mockDocs)

    assert.deepStrictEqual(result['doc-1'], ['req-1', 'req-2'])
    assert.deepStrictEqual(result['doc-2'], ['req-3'])
    assert.deepStrictEqual(result['doc-empty'], [])
  })

  it('should handle empty document array', () => {
    const loader = new ValidatedRequirementsLoader()
    assert.deepStrictEqual((loader as any).getExternalArtifactLookup([]), {})
  })

  it('should populate lookup map with actual requirement IDs', () => {
    const singleDoc = [
      {
        nexus: {
          metadata: {
            documentId: 'single-doc'
          }
        },
        requirements: [
          { id: 'single-req-id' },
          { id: 'another-req-id' }
        ]
      }
    ]

    const loader = new ValidatedRequirementsLoader()
    const result = (loader as any).getExternalArtifactLookup(singleDoc)

    assert.ok(result['single-doc'].includes('single-req-id'))
    assert.ok(result['single-doc'].includes('another-req-id'))
    assert.strictEqual(result['single-doc'].length, 2)
  })
})
