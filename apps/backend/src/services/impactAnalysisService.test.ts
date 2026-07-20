import { describe, it, expect, afterEach, beforeEach } from 'vitest'
import { ImpactAnalysisService } from '../services/impactAnalysisService'
import { GraphDatabase } from '../graphBuilder/graphDatabase'
import type { ParsedDocument } from '../parsers/repositoryParser'

function createDoc(
  id: string,
  type: string,
  title: string,
  links: Array<{ sourceId: string; targetId: string; relationshipType: string; confidence: 'high' | 'medium' | 'low' }>
): ParsedDocument {
  return {
    id,
    filePath: `/artifact-${id}.yaml`,
    relativePath: `artifact-${id}.yaml`,
    type: 'Json' as any,
    detectedType: type as any,
    content: {},
    metadata: { title },
    traceLinks: links as any,
  } as unknown as ParsedDocument
}

function buildTestGraph(): GraphDatabase {
  const db = new GraphDatabase(':memory:')
  db.initialize()
  db.buildGraphFromParsed([
    createDoc('req-001', 'requirement', 'User Auth Req', [
      { sourceId: 'req-001', targetId: 'feat-001', relationshipType: 'satisfies', confidence: 'high' },
      { sourceId: 'req-001', targetId: 'feat-002', relationshipType: 'satisfies', confidence: 'medium' },
    ]),
    createDoc('req-002', 'requirement', 'Data Privacy Req', [
      { sourceId: 'req-002', targetId: 'feat-002', relationshipType: 'satisfies', confidence: 'high' },
      { sourceId: 'req-002', targetId: 'comp-001', relationshipType: 'tracesTo', confidence: 'high' },
    ]),
    createDoc('req-003', 'requirement', 'Performance Req', [
      { sourceId: 'req-003', targetId: 'feat-003', relationshipType: 'satisfies', confidence: 'low' },
    ]),
    createDoc('feat-001', 'feature', 'Login Feature', [
      { sourceId: 'feat-001', targetId: 'comp-001', relationshipType: 'realizedBy', confidence: 'high' },
      { sourceId: 'feat-001', targetId: 'test-001', relationshipType: 'coveredBy', confidence: 'high' },
    ]),
    createDoc('feat-002', 'feature', 'Privacy Settings Feature', [
      { sourceId: 'feat-002', targetId: 'comp-001', relationshipType: 'realizedBy', confidence: 'high' },
      { sourceId: 'feat-002', targetId: 'comp-002', relationshipType: 'realizedBy', confidence: 'medium' },
      { sourceId: 'feat-002', targetId: 'test-002', relationshipType: 'coveredBy', confidence: 'medium' },
    ]),
    createDoc('feat-003', 'feature', 'Performance Optimization Feature', [
      { sourceId: 'feat-003', targetId: 'comp-002', relationshipType: 'realizedBy', confidence: 'high' },
      { sourceId: 'feat-003', targetId: 'test-003', relationshipType: 'coveredBy', confidence: 'low' },
    ]),
    createDoc('comp-001', 'softwareComponent', 'Auth Service', [
      { sourceId: 'comp-001', targetId: 'test-001', relationshipType: 'verifiedBy', confidence: 'high' },
    ]),
    createDoc('comp-002', 'softwareComponent', 'Data Processor', [
      { sourceId: 'comp-002', targetId: 'test-002', relationshipType: 'verifiedBy', confidence: 'medium' },
      { sourceId: 'comp-002', targetId: 'test-003', relationshipType: 'verifiedBy', confidence: 'low' },
    ]),
    createDoc('test-001', 'testCase', 'Login Test Case', []),
    createDoc('test-002', 'testCase', 'Privacy Test Case', []),
    createDoc('test-003', 'testCase', 'Performance Test Case', []),
  ])
  return db
}

describe('ImpactAnalysisService', () => {
  let service: ImpactAnalysisService
  let db: GraphDatabase

  beforeEach(() => {
    service = new ImpactAnalysisService()
    db = buildTestGraph()
  })

  afterEach(() => {
    db.close()
  })

  describe('analyze', () => {
    it('returns affected artifacts for a single node', () => {
      const result = service.analyze({ artifactIds: ['req-001'] }, db)

      expect(result.summary.totalAffected).toBeGreaterThan(0)
      expect(result.summary.directCount).toBeGreaterThan(0)
      expect(result.artifacts.every(a => a.id !== 'req-001')).toBe(true)
    })

    it('classifies impact levels correctly', () => {
      const result = service.analyze({ artifactIds: ['req-001'] }, db)

      const direct = result.artifacts.filter(a => a.impactLevel === 'direct')
      expect(direct.length).toBeGreaterThan(0)
      expect(direct.every(a => a.impactLevel === 'direct')).toBe(true)
    })

    it('handles bulk artifactIds', () => {
      const result = service.analyze({ artifactIds: ['req-001', 'req-002'] }, db)
      expect(result.summary.totalAffected).toBeGreaterThan(result.summary.directCount)
    })
  })

  describe('analyzeV2', () => {
    it('returns confidence scores for each artifact', () => {
      const result = service.analyzeV2({ artifactIds: ['req-001'] }, db)

      expect(result.artifacts.length).toBeGreaterThan(0)
      expect(result.artifacts.every(a => a.confidenceScore >= 0 && a.confidenceScore <= 100)).toBe(true)
      expect(result.chains.length).toBeGreaterThan(0)
      expect(result.chains.every(c => c.confidenceScore >= 0 && c.confidenceScore <= 100)).toBe(true)
    })

    it('builds impact graph with nodes and edges', () => {
      const result = service.analyzeV2({ artifactIds: ['req-001'] }, db)

      expect(result.impactGraph.nodes.length).toBeGreaterThan(0)
      expect(result.impactGraph.edges.length).toBeGreaterThan(0)
      expect(result.impactGraph.nodes.some(n => n.id === 'req-001')).toBe(true)
    })

    it('computes min/max confidence in summary', () => {
      const result = service.analyzeV2({ artifactIds: ['req-001'] }, db)
      const scores = result.artifacts.map(a => a.confidenceScore)
      if (scores.length > 0) {
        expect(result.summary.minConfidence).toBe(Math.min(...scores))
        expect(result.summary.maxConfidence).toBe(Math.max(...scores))
      }
    })
  })

  describe('getUpstreamDependencies', () => {
    it('returns upstream dependencies for a node', () => {
      // comp-001 is depended on by feat-001, feat-002, req-002
      const result = service.getUpstreamDependencies('comp-001', 3, db)

      expect(result.total).toBeGreaterThan(0)
      expect(result.dependencies.some(d => d.id === 'feat-001')).toBe(true)
      expect(result.dependencies.some(d => d.id === 'feat-002')).toBe(true)
    })

    it('classifies direct dependencies at depth 1', () => {
      const result = service.getUpstreamDependencies('comp-001', 1, db)
      const direct = result.dependencies.filter(d => d.depth === 1)
      expect(direct.length).toBeGreaterThan(0)
      expect(direct.every(d => d.impactLevel === 'direct')).toBe(true)
    })

    it('returns empty for unknown node', () => {
      const result = service.getUpstreamDependencies('nonexistent', 3, db)
      expect(result.total).toBe(0)
      expect(result.dependencies).toEqual([])
    })

    it('computes confidence scores', () => {
      const result = service.getUpstreamDependencies('comp-001', 3, db)
      expect(result.dependencies.every(d => d.confidenceScore >= 0 && d.confidenceScore <= 100)).toBe(true)
    })
  })

  describe('getDownstreamDependents', () => {
    it('returns downstream dependents for a node', () => {
      // req-001 -> feat-001, feat-002
      const result = service.getDownstreamDependents('req-001', 3, db)

      expect(result.total).toBeGreaterThan(0)
      expect(result.dependents.some(d => d.id === 'feat-001')).toBe(true)
      expect(result.dependents.some(d => d.id === 'feat-002')).toBe(true)
    })

    it('classifies direct dependents at depth 1', () => {
      const result = service.getDownstreamDependents('req-001', 1, db)
      const direct = result.dependents.filter(d => d.depth === 1)
      expect(direct.length).toBeGreaterThan(0)
      expect(direct.every(d => d.impactLevel === 'direct')).toBe(true)
    })

    it('returns empty for unknown node', () => {
      const result = service.getDownstreamDependents('nonexistent', 3, db)
      expect(result.total).toBe(0)
      expect(result.dependents).toEqual([])
    })

    it('follows transitive dependencies', () => {
      const result = service.getDownstreamDependents('req-001', 5, db)

      // Should reach comp-001, test-001, test-002 through feat-001 and feat-002
      const ids = result.dependents.map(d => d.id)
      expect(ids).toContain('comp-001')
    })
  })

  describe('getFullDependencyGraph', () => {
    it('returns both upstream and downstream', () => {
      const result = service.getFullDependencyGraph('comp-001', 3, db)

      expect(result.totalUpstream).toBeGreaterThan(0)
      expect(result.totalDownstream).toBeGreaterThan(0)
    })

    it('computes criticality correctly', () => {
      const result = service.getFullDependencyGraph('comp-001', 5, db)
      const total = result.totalUpstream + result.totalDownstream
      if (total >= 10) expect(result.criticality).toBe('high')
      else if (total >= 3) expect(result.criticality).toBe('medium')
      else expect(result.criticality).toBe('low')
    })

    it('returns empty for unknown node', () => {
      const result = service.getFullDependencyGraph('nonexistent', 3, db)
      expect(result.totalUpstream).toBe(0)
      expect(result.totalDownstream).toBe(0)
      expect(result.criticality).toBe('low')
    })
  })

  describe('BFS traversal', () => {
    it('does not revisit nodes', () => {
      const result = service.getDownstreamDependents('req-001', 5, db)
      const ids = result.dependents.map(d => d.id)
      const uniqueIds = new Set(ids)
      expect(ids.length).toBe(uniqueIds.size)
    })

    it('respects maxDepth', () => {
      const result1 = service.getDownstreamDependents('req-001', 1, db)
      const result5 = service.getDownstreamDependents('req-001', 5, db)
      expect(result5.total).toBeGreaterThanOrEqual(result1.total)
    })
  })
})
