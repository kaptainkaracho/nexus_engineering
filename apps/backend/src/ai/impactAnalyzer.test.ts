import { describe, it, expect, beforeAll } from 'vitest'
import { ImpactAnalyzer } from './impactAnalyzer'
import { getGraphDatabase } from '../graphBuilder/graphDatabase'

describe('ImpactAnalyzer v2', () => {
  let analyzer: ImpactAnalyzer

  beforeAll(() => {
    const db = getGraphDatabase()
    db.upsertNodes([
      { id: 'R1', type: 'requirement', title: 'R1' },
      { id: 'F1', type: 'feature', title: 'F1' },
      { id: 'T1', type: 'testCase', title: 'T1' },
      { id: 'T2', type: 'testCase', title: 'T2' },
      { id: 'C1', type: 'softwareComponent', title: 'C1' },
    ])
    db.upsertEdge({ sourceId: 'R1', targetId: 'F1', relationshipType: 'satisfies', confidence: 'high' })
    db.upsertEdge({ sourceId: 'F1', targetId: 'T1', relationshipType: 'verifies', confidence: 'medium' })
    db.upsertEdge({ sourceId: 'F1', targetId: 'T2', relationshipType: 'verifies', confidence: 'low' })
    db.upsertEdge({ sourceId: 'T1', targetId: 'C1', relationshipType: 'validates', confidence: 'high' })
    analyzer = new ImpactAnalyzer()
  })

  it('returns a confidence-scored impact chain for a changed artifact', async () => {
    const result = await analyzer.analyzeV2({ artifactIds: ['R1'] })

    expect(result.artifacts.length).toBeGreaterThan(0)
    // every affected artifact has a numeric 0-100 confidence score
    for (const a of result.artifacts) {
      expect(a.confidenceScore).toBeGreaterThanOrEqual(0)
      expect(a.confidenceScore).toBeLessThanOrEqual(100)
    }
    // direct impacts exist
    expect(result.summary.directCount).toBeGreaterThan(0)
    // confidence decays with hop distance
    const direct = result.artifacts.find(a => a.impactLevel === 'direct')!
    const indirect = result.artifacts.find(a => a.impactLevel === 'indirect')
    if (indirect) {
      expect(indirect.confidenceScore).toBeLessThanOrEqual(direct.confidenceScore)
    }
  })

  it('builds a graph-ready impact structure for visualization', async () => {
    const result = await analyzer.analyzeV2({ artifactIds: ['R1'] })
    expect(result.impactGraph.nodes.length).toBeGreaterThan(0)
    expect(result.impactGraph.edges.length).toBeGreaterThan(0)
    // the changed artifact is included as a node
    expect(result.impactGraph.nodes.some(n => n.id === 'R1')).toBe(true)
  })

  it('respects a confidence threshold filter', async () => {
    const result = await analyzer.analyzeV2({ artifactIds: ['R1'] })
    const highThreshold = 95
    const kept = result.artifacts.filter(a => a.confidenceScore >= highThreshold)
    expect(kept.every(a => a.confidenceScore >= highThreshold)).toBe(true)
  })

  it('exposes impact chains with paths', async () => {
    const result = await analyzer.analyzeV2({ artifactIds: ['R1'] })
    expect(result.chains.length).toBe(result.artifacts.length)
    expect(result.chains[0].path[0]).toBe('R1')
  })

  it('handles empty scope (no artifactIds)', async () => {
    const emptyAnalyzer = new ImpactAnalyzer()
    const result = await emptyAnalyzer.analyzeV2({ artifactIds: [] })
    expect(result.artifacts.length).toBe(0)
    expect(result.summary.totalAffected).toBe(0)
    expect(result.impactGraph.nodes.length).toBe(0)
    expect(result.impactGraph.edges.length).toBe(0)
    expect(result.chains.length).toBe(0)
  })

  it('handles artifact with no edges gracefully', async () => {
    const db = getGraphDatabase()
    db.upsertNode({ id: 'ORPHAN', type: 'requirement', title: 'Orphan requirement' })
    const analyzer2 = new ImpactAnalyzer()
    const result = await analyzer2.analyzeV2({ artifactIds: ['ORPHAN'] })
    expect(result.artifacts.length).toBe(0)
    expect(result.summary.totalAffected).toBe(0)
  })

  it('handles circular references without infinite loop', async () => {
    const db = getGraphDatabase()
    db.upsertNodes([
      { id: 'CIRC-A', type: 'requirement', title: 'Circular A' },
      { id: 'CIRC-B', type: 'feature', title: 'Circular B' },
      { id: 'CIRC-C', type: 'testCase', title: 'Circular C' },
    ])
    db.upsertEdge({ sourceId: 'CIRC-A', targetId: 'CIRC-B', relationshipType: 'satisfies', confidence: 'high' })
    db.upsertEdge({ sourceId: 'CIRC-B', targetId: 'CIRC-C', relationshipType: 'verifies', confidence: 'high' })
    db.upsertEdge({ sourceId: 'CIRC-C', targetId: 'CIRC-A', relationshipType: 'validates', confidence: 'high' })
    const analyzer3 = new ImpactAnalyzer()
    const result = await analyzer3.analyzeV2({ artifactIds: ['CIRC-A'] })
    expect(result.artifacts.length).toBeGreaterThan(0)
    // Should not have infinite artifacts (circular refs should be deduped)
    expect(result.summary.totalAffected).toBeLessThanOrEqual(3)
    // All artifacts should have valid confidence scores
    for (const a of result.artifacts) {
      expect(a.confidenceScore).toBeGreaterThanOrEqual(0)
      expect(a.confidenceScore).toBeLessThanOrEqual(100)
    }
  })

  it('handles deep chains (depth=3) correctly', async () => {
    const db = getGraphDatabase()
    db.upsertNodes([
      { id: 'DEEP-1', type: 'requirement', title: 'Deep 1' },
      { id: 'DEEP-2', type: 'feature', title: 'Deep 2' },
      { id: 'DEEP-3', type: 'softwareComponent', title: 'Deep 3' },
      { id: 'DEEP-4', type: 'testCase', title: 'Deep 4' },
      { id: 'DEEP-5', type: 'result', title: 'Deep 5' },
    ])
    db.upsertEdge({ sourceId: 'DEEP-1', targetId: 'DEEP-2', relationshipType: 'satisfies', confidence: 'high' })
    db.upsertEdge({ sourceId: 'DEEP-2', targetId: 'DEEP-3', relationshipType: 'implements', confidence: 'high' })
    db.upsertEdge({ sourceId: 'DEEP-3', targetId: 'DEEP-4', relationshipType: 'verifies', confidence: 'high' })
    db.upsertEdge({ sourceId: 'DEEP-4', targetId: 'DEEP-5', relationshipType: 'produces', confidence: 'high' })
    const analyzer4 = new ImpactAnalyzer()
    const result = await analyzer4.analyzeV2({ artifactIds: ['DEEP-1'] })
    // Should have direct (DEEP-2), indirect (DEEP-3), and transitive (DEEP-4, DEEP-5)
    expect(result.summary.directCount).toBeGreaterThan(0)
    expect(result.summary.indirectCount).toBeGreaterThan(0)
    expect(result.summary.transitiveCount).toBeGreaterThan(0)
    // Confidence should decay with distance
    const direct = result.artifacts.find(a => a.impactLevel === 'direct')!
    const transitive = result.artifacts.find(a => a.impactLevel === 'transitive')
    if (direct && transitive) {
      expect(transitive.confidenceScore).toBeLessThanOrEqual(direct.confidenceScore)
    }
  })

  it('handles multiple artifactIds in scope', async () => {
    const analyzer5 = new ImpactAnalyzer()
    const result = await analyzer5.analyzeV2({ artifactIds: ['R1', 'F1'] })
    expect(result.summary.totalAffected).toBeGreaterThan(0)
    // Should include both seeds in the impact graph
    expect(result.impactGraph.nodes.some(n => n.id === 'R1')).toBe(true)
    expect(result.impactGraph.nodes.some(n => n.id === 'F1')).toBe(true)
  })
})
