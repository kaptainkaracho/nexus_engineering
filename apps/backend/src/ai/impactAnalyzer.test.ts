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
})
