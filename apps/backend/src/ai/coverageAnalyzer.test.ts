import { describe, it, expect } from 'vitest'
import { CoverageAnalyzer } from './coverageAnalyzer'
import { V_MODEL_AXES } from '@nexus-engineering/shared'

function node(id: string, type: string) {
  return { id, type, title: id }
}

const EDGES = [
  { source_id: 'auth-R1', target_id: 'auth-F1', relationship_type: 'satisfies', confidence: 'high' as const },
  { source_id: 'auth-F1', target_id: 'auth-T1', relationship_type: 'verifies', confidence: 'high' as const },
  { source_id: 'auth-T1', target_id: 'auth-Res1', relationship_type: 'produces', confidence: 'medium' as const },
]

describe('CoverageAnalyzer', () => {
  const analyzer = new CoverageAnalyzer()

  it('flags a requirement with no downstream link as a high-risk gap', () => {
    const nodes = [
      node('auth-R1', 'requirement'),
      node('auth-R2', 'requirement'),
      node('auth-F1', 'feature'),
    ]
    const edges = [{ source_id: 'auth-R1', target_id: 'auth-F1', relationship_type: 'satisfies', confidence: 'high' as const }]
    const report = analyzer.analyze(nodes, edges)

    const r2Gap = report.crossArtifactGaps.find(g => g.artifactId === 'auth-R2')
    expect(r2Gap).toBeDefined()
    expect(r2Gap?.severity).toBe('high')
    expect(r2Gap?.gapType).toBe('missingDownstream')
  })

  it('flags a feature with no test coverage as high-risk', () => {
    const nodes = [node('auth-F1', 'feature'), node('auth-R1', 'requirement')]
    const edges = [{ source_id: 'auth-R1', target_id: 'auth-F1', relationship_type: 'satisfies', confidence: 'high' as const }]
    const report = analyzer.analyze(nodes, edges)

    const gap = report.crossArtifactGaps.find(g => g.artifactId === 'auth-F1' && g.gapType === 'missingDownstream')
    expect(gap).toBeDefined()
    expect(gap?.severity).toBe('high')
  })

  it('computes per-axis and overall coverage across the V-Model', () => {
    const nodes = [
      node('auth-R1', 'requirement'),
      node('auth-F1', 'feature'),
      node('auth-T1', 'testCase'),
      node('auth-Res1', 'result'),
    ]
    const report = analyzer.analyze(nodes, EDGES)

    const reqAxis = report.axes.find(a => a.axis === 'requirement')!
    const featAxis = report.axes.find(a => a.axis === 'feature')!
    const testAxis = report.axes.find(a => a.axis === 'testCase')!
    const resAxis = report.axes.find(a => a.axis === 'result')!

    expect(reqAxis.total).toBe(1)
    expect(reqAxis.linked).toBe(1)
    expect(featAxis.total).toBe(1)
    expect(featAxis.linked).toBe(1)
    expect(testAxis.total).toBe(1)
    expect(testAxis.linked).toBe(1)
    expect(resAxis.total).toBe(1)
    expect(resAxis.linked).toBe(1)
    expect(report.overallCoveragePercent).toBe(100)
    expect(V_MODEL_AXES).toEqual(['requirement', 'feature', 'testCase', 'result'])
  })

  it('computes coverage scoring per domain', () => {
    const nodes = [
      node('auth-R1', 'requirement'),
      node('auth-F1', 'feature'),
      node('auth-T1', 'testCase'),
      node('auth-Res1', 'result'),
      node('pay-R2', 'requirement'), // no downstream → gap
      node('pay-F2', 'feature'),
    ]
    const edges = [
      ...EDGES,
      { source_id: 'pay-R2', target_id: 'pay-F2', relationship_type: 'satisfies', confidence: 'low' as const },
    ]
    const report = analyzer.analyze(nodes, edges)

    const auth = report.domainCoverage.find(d => d.domain === 'auth')!
    const pay = report.domainCoverage.find(d => d.domain === 'pay')!
    expect(auth.coveragePercent).toBe(100)
    expect(pay.coveragePercent).toBeLessThan(100)
    expect(pay.totalArtifacts).toBe(2)
  })

  it('detects a test with no associated result (unexecuted)', () => {
    const nodes = [node('auth-T1', 'testCase')]
    const report = analyzer.analyze(nodes, [])
    const gap = report.crossArtifactGaps.find(g => g.artifactId === 'auth-T1' && g.gapType === 'missingDownstream')
    expect(gap).toBeDefined()
    expect(gap?.severity).toBe('high')
  })
})
