import type {
  CoverageAnalysisReport,
  AxisCoverage,
  CrossArtifactGap,
  DomainCoverage,
  TraceabilityAxis,
} from '@nexus-engineering/shared'
import { V_MODEL_AXES } from '@nexus-engineering/shared'
import type { GraphNodeRow, GraphEdgeRow } from '../graphBuilder/graphDatabase'
import { getGraphDatabase } from '../graphBuilder/graphDatabase'

export interface GraphNodeLite {
  id: string
  type: string
  title?: string
  name?: string
}

export interface GraphEdgeLite {
  source_id: string
  target_id: string
  relationship_type: string
  confidence: string
}

const AXIS_ORDER: TraceabilityAxis[] = ['requirement', 'feature', 'testCase', 'result']

const NEXT_AXIS: Record<TraceabilityAxis, TraceabilityAxis | null> = {
  requirement: 'feature',
  feature: 'testCase',
  testCase: 'result',
  result: null,
}

const PREV_AXIS: Record<TraceabilityAxis, TraceabilityAxis | null> = {
  requirement: null,
  feature: 'requirement',
  testCase: 'feature',
  result: 'testCase',
}

function domainOf(id: string): string {
  const m = id.match(/^([^:-]+)/)
  return m ? m[1] : 'default'
}

const SEVERITY_RANK: Record<CrossArtifactGap['severity'], number> = {
  high: 3,
  medium: 2,
  low: 1,
}

/**
 * Multi-dimensional coverage analysis across the full V-Model:
 * Requirements ↔ Features ↔ Tests ↔ Results.
 *
 * Pure by design: pass graph nodes/edges directly so it is trivially testable
 * without a live database. `analyzeFromGraph()` pulls from the singleton store.
 */
export class CoverageAnalyzer {
  async analyzeFromGraph(): Promise<CoverageAnalysisReport> {
    const db = getGraphDatabase()
    return this.analyze(db.getGraphNodes(), db.getGraphEdges())
  }

  analyze(
    nodes: GraphNodeLite[],
    edges: GraphEdgeLite[]
  ): CoverageAnalysisReport {
    const outgoing = new Map<string, GraphEdgeLite[]>()
    const incoming = new Map<string, GraphEdgeLite[]>()

    for (const e of edges) {
      if (!outgoing.has(e.source_id)) outgoing.set(e.source_id, [])
      outgoing.get(e.source_id)!.push(e)
      if (!incoming.has(e.target_id)) incoming.set(e.target_id, [])
      incoming.get(e.target_id)!.push(e)
    }

    const nodeMap = new Map(nodes.map(n => [n.id, n]))

    const axes: AxisCoverage[] = []
    const crossArtifactGaps: CrossArtifactGap[] = []
    const domainMap = new Map<string, DomainCoverage>()

    let totalArtifacts = 0
    let totalCovered = 0

    for (const axis of AXIS_ORDER) {
      const axisNodes = nodes.filter(n => n.type === axis)
      const total = axisNodes.length
      let linked = 0

      const axisCoverage: AxisCoverage = {
        axis,
        total,
        linked: 0,
        coveragePercent: total > 0 ? 0 : 100,
      }

      for (const node of axisNodes) {
        const out = outgoing.get(node.id) || []
        const inc = incoming.get(node.id) || []

        const downstreamAxis = NEXT_AXIS[axis]
        const upstreamAxis = PREV_AXIS[axis]

        const hasDownstream = downstreamAxis
          ? out.some(e => nodeMap.get(e.target_id)?.type === downstreamAxis)
          : false
        const hasUpstream = upstreamAxis
          ? inc.some(e => nodeMap.get(e.source_id)?.type === upstreamAxis)
          : false
        const hasAnyLink = out.length > 0 || inc.length > 0

        // A node is "covered" if it participates in the V-Model chain:
        // requirement/testCase need downstream; feature needs both directions;
        // result needs upstream.
        let covered = false
        const gaps: CrossArtifactGap[] = []

        if (axis === 'requirement') {
          if (!hasDownstream) {
            gaps.push(this.gap(axis, node, 'missingDownstream', 'Requirement has no downstream feature/test link', 'high'))
          } else {
            covered = true
          }
        } else if (axis === 'feature') {
          if (!hasUpstream) {
            gaps.push(this.gap(axis, node, 'missingUpstream', 'Feature has no upstream requirement link', 'medium'))
          }
          if (!hasDownstream) {
            gaps.push(this.gap(axis, node, 'missingDownstream', 'Feature exists but has no test coverage', 'high'))
          }
          covered = hasDownstream
        } else if (axis === 'testCase') {
          if (!hasUpstream) {
            gaps.push(this.gap(axis, node, 'missingUpstream', 'Test case has no upstream feature/requirement link', 'medium'))
          }
          if (!hasDownstream) {
            gaps.push(this.gap(axis, node, 'missingDownstream', 'Test has no associated result (unexecuted)', 'high'))
          }
          covered = hasDownstream
        } else if (axis === 'result') {
          if (!hasUpstream) {
            gaps.push(this.gap(axis, node, 'missingUpstream', 'Result is not linked to any test case', 'low'))
            covered = hasAnyLink
          } else {
            covered = true
          }
        }

        if (covered) linked++
        crossArtifactGaps.push(...gaps)

        // Accumulate per-domain
        const domain = domainOf(node.id)
        if (!domainMap.has(domain)) {
          domainMap.set(domain, {
            domain,
            totalArtifacts: 0,
            coveredArtifacts: 0,
            coveragePercent: 0,
            axes: AXIS_ORDER.map(a => ({ axis: a, total: 0, linked: 0, coveragePercent: 0 })),
            gaps: [],
          })
        }
        const dc = domainMap.get(domain)!
        dc.totalArtifacts++
        if (covered) dc.coveredArtifacts++
        const dcAxis = dc.axes.find(a => a.axis === axis)!
        dcAxis.total++
        if (covered) dcAxis.linked++
        dc.gaps.push(...gaps)
      }

      axisCoverage.linked = linked
      axisCoverage.coveragePercent = total > 0 ? Math.round((linked / total) * 100) : 100
      axes.push(axisCoverage)

      totalArtifacts += total
      totalCovered += linked
    }

    const domainCoverage: DomainCoverage[] = Array.from(domainMap.values()).map(dc => ({
      ...dc,
      coveragePercent: dc.totalArtifacts > 0 ? Math.round((dc.coveredArtifacts / dc.totalArtifacts) * 100) : 100,
      axes: dc.axes.map(a => ({ ...a, coveragePercent: a.total > 0 ? Math.round((a.linked / a.total) * 100) : 100 })),
    }))

    const highRiskCount = crossArtifactGaps.filter(g => g.severity === 'high').length
    const mediumRiskCount = crossArtifactGaps.filter(g => g.severity === 'medium').length
    const lowRiskCount = crossArtifactGaps.filter(g => g.severity === 'low').length

    return {
      overallCoveragePercent: totalArtifacts > 0 ? Math.round((totalCovered / totalArtifacts) * 100) : 100,
      axes,
      crossArtifactGaps,
      domainCoverage,
      summary: {
        totalArtifacts,
        totalGaps: crossArtifactGaps.length,
        highRiskCount,
        mediumRiskCount,
        lowRiskCount,
      },
    }
  }

  private gap(
    axis: TraceabilityAxis,
    node: GraphNodeLite,
    gapType: CrossArtifactGap['gapType'],
    detail: string,
    severity: CrossArtifactGap['severity']
  ): CrossArtifactGap {
    return {
      axis,
      artifactId: node.id,
      artifactTitle: node.title || node.name,
      gapType,
      detail,
      severity,
    }
  }

  /**
   * Filter the full report down to a single domain.
   */
  byDomain(report: CoverageAnalysisReport, domain: string): DomainCoverage | undefined {
    return report.domainCoverage.find(d => d.domain === domain)
  }
}

export const coverageAnalyzer = new CoverageAnalyzer()
export { SEVERITY_RANK }
