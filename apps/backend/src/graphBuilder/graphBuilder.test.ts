import { describe, it, expect } from 'vitest'
import { GraphBuilder } from './graphBuilder'
import type { TraceLink } from '@nexus-engineering/shared'

const mockLink = {
  id: 'link-1',
  version: '1.0',
  createdAt: new Date(),
  updatedAt: new Date(),
  source: 'test',
  sourceId: 'req-1',
  sourceType: 'requirement',
  targetId: 'test-1',
  targetType: 'testCase',
  relationshipType: 'verifies',
  confidence: 'high',
  description: 'Test link'
} as unknown as TraceLink

describe('GraphBuilder', () => {
  it('builds nodes and edges from trace links', () => {
    const graph = new GraphBuilder([mockLink]).buildGraph()
    expect(graph.nodes).toHaveLength(2)
    expect(graph.edges).toHaveLength(1)
    expect(graph.nodes[0].id).toBe('req-1')
    expect(graph.nodes[1].id).toBe('test-1')
    expect(graph.edges[0].sourceId).toBe('req-1')
    expect(graph.edges[0].targetId).toBe('test-1')
    expect(graph.totalNodes).toBe(2)
    expect(graph.totalEdges).toBe(1)
  })

  it('filters by source type', () => {
    const graph = new GraphBuilder([mockLink]).filterBySourceType(['requirement']).buildGraph()
    expect(graph.edges).toHaveLength(1)
    const empty = new GraphBuilder([mockLink]).filterBySourceType(['testCase']).buildGraph()
    expect(empty.edges).toHaveLength(0)
  })

  it('sorts edges by confidence', () => {
    const lowLink = { ...mockLink, sourceId: 'req-2', targetId: 'test-2', confidence: 'low' } as unknown as TraceLink
    const desc = new GraphBuilder([lowLink, mockLink]).sortByConfidence(true)
    const asc = new GraphBuilder([lowLink, mockLink]).sortByConfidence(false)
    expect(desc.edges[0].confidence).not.toBe(asc.edges[0].confidence)
    expect(asc.edges[0].confidence).toBe('high')
  })

  it('creates a builder via static factory', () => {
    const graph = GraphBuilder.fromTraceLinks([mockLink]).buildGraph()
    expect(graph.totalNodes).toBe(2)
  })
})
