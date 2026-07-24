import { describe, it, expect } from 'vitest'
import { RecommendationEngine } from './recommendationEngine'
import type { GraphInput } from './recommendationEngine'

const engine = new RecommendationEngine()

function buildGraph(): GraphInput {
  return {
    nodes: [
      // Fully linked V-Model chain (should produce no gap recommendations).
      { id: 'req-1', type: 'requirement', title: 'Linked requirement' },
      { id: 'feature-1', type: 'feature', title: 'Linked feature' },
      { id: 'test-1', type: 'testCase', title: 'Linked test' },
      // Orphans / gap artifacts.
      { id: 'req-2', type: 'requirement', title: 'Requirement with no downstream link' },
      { id: 'feat-2', type: 'feature', title: 'Feature with no test coverage' },
      { id: 'adr-1', type: 'architectureModel', title: 'ADR with no implementation' },
      { id: 'comp-1', type: 'softwareComponent', title: 'Orphan component' },
      // Same-domain group that should yield concrete auto-fix suggestions.
      { id: 'grp-req', type: 'requirement', title: 'Group requirement' },
      { id: 'grp-feat', type: 'feature', title: 'Group feature' },
      { id: 'grp-test', type: 'testCase', title: 'Group test' },
    ],
    edges: [
      { source_id: 'req-1', target_id: 'feature-1', relationship_type: 'satisfies', confidence: 'high' },
      { source_id: 'feature-1', target_id: 'test-1', relationship_type: 'verifies', confidence: 'medium' },
      // Stale/low-confidence link to trigger verifyStaleTraceLink.
      { source_id: 'req-1', target_id: 'test-1', relationship_type: 'tracesTo', confidence: 'low' },
    ],
  }
}

describe('RecommendationEngine.analyze', () => {
  it('detects a requirement without a downstream feature link', () => {
    const recs = engine.analyze(buildGraph())
    const linkRec = recs.find(r => r.type === 'linkRequirementToFeature' && r.targetIds.includes('req-2'))
    expect(linkRec).toBeDefined()
    expect(linkRec!.severity).toBe('high')
    expect(linkRec!.confidence).toBeGreaterThan(0)
  })

  it('detects a requirement without a downstream link but suggests a same-domain feature', () => {
    const recs = engine.analyze(buildGraph())
    const linkRec = recs.find(r => r.type === 'linkRequirementToFeature' && r.targetIds.includes('grp-req'))
    expect(linkRec).toBeDefined()
    expect(linkRec!.autoFix.suggestedLink?.relationshipType).toBe('satisfies')
    expect(linkRec!.autoFix.suggestedLink?.targetId).toBe('grp-feat')
  })

  it('detects a feature without test coverage', () => {
    const recs = engine.analyze(buildGraph())
    const testRec = recs.find(r => r.type === 'addTestCoverage' && r.targetIds.includes('feat-2'))
    expect(testRec).toBeDefined()
    expect(testRec!.severity).toBe('high')
  })

  it('detects a feature without test coverage and suggests a same-domain test', () => {
    const recs = engine.analyze(buildGraph())
    const testRec = recs.find(r => r.type === 'addTestCoverage' && r.targetIds.includes('grp-feat'))
    expect(testRec).toBeDefined()
    expect(testRec!.autoFix.suggestedLink?.relationshipType).toBe('verifies')
    expect(testRec!.autoFix.suggestedLink?.targetId).toBe('grp-test')
  })

  it('detects an ADR not linked to implementation', () => {
    const recs = engine.analyze(buildGraph())
    const adrRec = recs.find(r => r.type === 'linkAdrToImplementation' && r.targetIds.includes('adr-1'))
    expect(adrRec).toBeDefined()
  })

  it('detects orphan artifacts', () => {
    const recs = engine.analyze(buildGraph())
    const orphanRec = recs.find(r => r.type === 'removeOrphan' && r.targetIds.includes('comp-1'))
    expect(orphanRec).toBeDefined()
    expect(orphanRec!.severity).toBe('medium')
  })

  it('detects stale/low-confidence trace links', () => {
    const recs = engine.analyze(buildGraph())
    const staleRec = recs.find(r => r.type === 'verifyStaleTraceLink' && r.targetIds.includes('req-1'))
    expect(staleRec).toBeDefined()
    expect(staleRec!.autoFix.suggestedLink).toBeUndefined()
  })

  it('does not flag well-linked artifacts', () => {
    const recs = engine.analyze(buildGraph())
    expect(recs.find(r => r.targetIds.includes('req-1') && r.type === 'linkRequirementToFeature')).toBeUndefined()
    expect(recs.find(r => r.targetIds.includes('feature-1') && r.type === 'addTestCoverage')).toBeUndefined()
  })

  it('every recommendation has a confidence between 0 and 1', () => {
    const recs = engine.analyze(buildGraph())
    expect(recs.length).toBeGreaterThan(0)
    for (const r of recs) {
      expect(r.confidence).toBeGreaterThanOrEqual(0)
      expect(r.confidence).toBeLessThanOrEqual(1)
      expect(r.autoFix.confidence).toBeGreaterThanOrEqual(0)
      expect(r.autoFix.confidence).toBeLessThanOrEqual(1)
    }
  })
})

describe('RecommendationEngine.query', () => {
  const recs = engine.analyze(buildGraph())

  it('filters by severity', () => {
    const res = engine.query(recs, { severity: ['high'] })
    expect(res.recommendations.every(r => r.severity === 'high')).toBe(true)
    expect(res.total).toBe(recs.length)
    expect(res.filtered).toBe(res.recommendations.length)
  })

  it('filters by type', () => {
    const res = engine.query(recs, { type: ['addTestCoverage'] })
    expect(res.recommendations.every(r => r.type === 'addTestCoverage')).toBe(true)
  })

  it('limits the result set', () => {
    const res = engine.query(recs, { limit: 2 })
    expect(res.recommendations.length).toBe(2)
  })

  it('filters by minimum confidence', () => {
    const res = engine.query(recs, { minConfidence: 0.8 })
    expect(res.recommendations.every(r => r.confidence >= 0.8)).toBe(true)
  })

  it('produces a severity summary', () => {
    const res = engine.query(recs)
    expect(res.summary.high + res.summary.medium + res.summary.low).toBe(res.recommendations.length)
  })
})
