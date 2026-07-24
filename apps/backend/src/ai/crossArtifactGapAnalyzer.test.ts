import { describe, it, expect } from 'vitest'
import { computeCrossArtifactGaps } from './crossArtifactGapAnalyzer'
import type { GraphNodeRow, GraphEdgeRow } from '../graphBuilder/graphDatabase'

const nodes: GraphNodeRow[] = [
  { id: 'R1', type: 'requirement', title: 'R1', created_at: '', updated_at: '' },
  { id: 'pay-R2', type: 'requirement', title: 'R2', created_at: '', updated_at: '' },
  { id: 'F1', type: 'feature', title: 'F1', created_at: '', updated_at: '' },
  { id: 'T1', type: 'testCase', title: 'T1', created_at: '', updated_at: '' },
  { id: 'Res1', type: 'result', title: 'Res1', created_at: '', updated_at: '' },
]

const edges: GraphEdgeRow[] = [
  { id: 'e1', source_id: 'R1', target_id: 'F1', relationship_type: 'satisfies', confidence: 'high', created_at: '', updated_at: '' },
  { id: 'e2', source_id: 'F1', target_id: 'T1', relationship_type: 'verifies', confidence: 'medium', created_at: '', updated_at: '' },
  { id: 'e3', source_id: 'T1', target_id: 'Res1', relationship_type: 'produces', confidence: 'high', created_at: '', updated_at: '' },
  { id: 'e4', source_id: 'pay-R2', target_id: 'F1', relationship_type: 'satisfies', confidence: 'low', created_at: '', updated_at: '' },
]

function gapFor(gaps: ReturnType<typeof computeCrossArtifactGaps>, s: string, t: string) {
  return gaps.find(g => g.sourceType === s && g.targetType === t)
}

describe('computeCrossArtifactGaps', () => {
  it('returns one gap per ordered distinct type pair', () => {
    const gaps = computeCrossArtifactGaps(nodes, edges)
    const typeCount = new Set(nodes.map(n => n.type)).size
    expect(gaps.length).toBe(typeCount * (typeCount - 1))
  })

  it('computes full coverage when all source->target links exist', () => {
    const g = gapFor(computeCrossArtifactGaps(nodes, edges), 'feature', 'testCase')
    expect(g).toBeDefined()
    expect(g!.totalPairs).toBe(1)
    expect(g!.coveredPairs).toBe(1)
    expect(g!.gapPercent).toBe(0)
    expect(g!.sampleGaps).toHaveLength(0)
  })

  it('computes 100% gap with sample pairs when no links exist', () => {
    const g = gapFor(computeCrossArtifactGaps(nodes, edges), 'requirement', 'testCase')
    expect(g).toBeDefined()
    expect(g!.totalPairs).toBe(2)
    expect(g!.coveredPairs).toBe(0)
    expect(g!.gapPercent).toBe(100)
    expect(g!.sampleGaps).toEqual([
      { sourceId: 'R1', targetId: 'T1' },
      { sourceId: 'pay-R2', targetId: 'T1' },
    ])
  })

  it('caps sample gaps', () => {
    const manyNodes: GraphNodeRow[] = []
    const manyEdges: GraphEdgeRow[] = []
    for (let i = 0; i < 10; i++) {
      manyNodes.push({ id: `SR${i}`, type: 'requirement', title: '', created_at: '', updated_at: '' })
      manyNodes.push({ id: `TT${i}`, type: 'testCase', title: '', created_at: '', updated_at: '' })
    }
    const gaps = computeCrossArtifactGaps(manyNodes, manyEdges)
    const g = gaps.find(x => x.sourceType === 'requirement' && x.targetType === 'testCase')!
    expect(g.sampleGaps.length).toBeLessThanOrEqual(25)
  })

  it('returns no gaps for an empty graph', () => {
    expect(computeCrossArtifactGaps([], [])).toEqual([])
  })
})
