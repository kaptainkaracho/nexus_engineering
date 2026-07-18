import { describe, it, expect } from 'vitest'
import { GraphDatabase } from './graphDatabase'
import type { ParsedDocument } from '../parsers/repositoryParser'

function sampleParsedDocs(): ParsedDocument[] {
  const createDoc = (
    id: string,
    type: string,
    title: string,
    links: Array<{ sourceId: string; targetId: string; relationshipType: string; confidence: 'high' | 'medium' | 'low' }>
  ): ParsedDocument => ({
    id,
    filePath: `/artifact-${id}.yaml`,
    relativePath: `artifact-${id}.yaml`,
    type: 'Json' as any,
    detectedType: type as any,
    content: {},
    metadata: { title },
    traceLinks: links as any
  }) as unknown as ParsedDocument

  return [
    createDoc('req-doc-1', 'requirement', 'Auth Req', [
      { sourceId: 'req-doc-1', targetId: 'auth-001', relationshipType: 'satisfies', confidence: 'high' },
      { sourceId: 'req-doc-1', targetId: 'perf-001', relationshipType: 'tracesTo', confidence: 'medium' },
      { sourceId: 'req-doc-1', targetId: 'scaling-002', relationshipType: 'dependsOn', confidence: 'low' }
    ]),
    createDoc('auth-001', 'architectureModel', 'Auth Arch', [
      { sourceId: 'auth-001', targetId: 'sec-001', relationshipType: 'verifies', confidence: 'high' }
    ]),
    createDoc('perf-001', 'softwareComponent', 'Perf Component', [
      { sourceId: 'perf-001', targetId: 'sec-001', relationshipType: 'refines', confidence: 'medium' }
    ]),
    createDoc('scaling-002', 'testCase', 'Scale Test Case', [
      { sourceId: 'scaling-002', targetId: 'sec-001', relationshipType: 'conflictsWith', confidence: 'high' },
      { sourceId: 'scaling-002', targetId: 'perf-001', relationshipType: 'dependsOn', confidence: 'low' }
    ]),
    createDoc('sec-001', 'requirement', 'Sec Standards', [])
  ]
}

function freshDb(): GraphDatabase {
  const db = new GraphDatabase(':memory:')
  db.initialize()
  return db
}

describe('GraphDatabase', () => {
  it('builds graph nodes and edges from parsed docs', () => {
    const db = freshDb()
    db.buildGraphFromParsed(sampleParsedDocs())
    expect(db.getGraphNodes()).toHaveLength(5)
    expect(db.getGraphEdges()).toHaveLength(7)
    db.close()
  })

  it('assigns only valid node types', () => {
    const db = freshDb()
    db.buildGraphFromParsed(sampleParsedDocs())
    const valid = new Set(['requirement', 'architectureModel', 'softwareComponent', 'testCase'])
    for (const n of db.getGraphNodes()) {
      expect(valid.has(n.type)).toBe(true)
    }
    db.close()
  })

  it('filters edges by relationship type', () => {
    const db = freshDb()
    db.buildGraphFromParsed(sampleParsedDocs())
    const result = db.buildGraph(undefined, undefined, ['verifies'])
    expect(result.edges.every((e) => e.relationship_type === 'verifies')).toBe(true)
    expect(result.edges).toHaveLength(1)
    db.close()
  })

  it('upserts nodes without duplication', () => {
    const db = freshDb()
    db.upsertNode({ id: 'node-1', type: 'requirement', title: 'Test Node' })
    expect(db.getNode('node-1')?.title).toBe('Test Node')
    const before = db.getGraphNodes().length
    db.upsertNode({ id: 'node-1', type: 'requirement', title: 'Updated Node' })
    expect(db.getGraphNodes()).toHaveLength(before)
    expect(db.getNode('node-1')?.title).toBe('Updated Node')
    db.close()
  })

  it('upserts edges without duplication', () => {
    const db = freshDb()
    const edge = { sourceId: 'a', targetId: 'b', relationshipType: 'tracesTo', confidence: 'high' as const }
    db.upsertEdge(edge)
    expect(db.getGraphEdges()).toHaveLength(1)
    db.upsertEdge({ ...edge, confidence: 'medium' })
    expect(db.getGraphEdges()).toHaveLength(1)
    db.close()
  })

  it('returns nodes by type', () => {
    const db = freshDb()
    db.buildGraphFromParsed(sampleParsedDocs())
    expect(db.getNodesByType('requirement').length).toBeGreaterThan(0)
    db.close()
  })

  it('produces consistent totals in buildGraph', () => {
    const db = freshDb()
    db.buildGraphFromParsed(sampleParsedDocs())
    const result = db.buildGraph()
    expect(result.totalNodes).toBe(result.nodes.length)
    expect(result.totalEdges).toBe(result.edges.length)
    db.close()
  })
})
