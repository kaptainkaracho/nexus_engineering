import type {
  TraceRecommendation,
  RecommendationType,
  RecommendationSeverity,
  RecommendationQuery,
  RecommendationResponse,
  AutoFixSuggestion,
} from '@nexus-engineering/shared'
import type { GraphNodeRow, GraphEdgeRow } from '../graphBuilder/graphDatabase'
import { getGraphDatabase } from '../graphBuilder/graphDatabase'
import { customAlphabet } from 'nanoid'

const nanoid = customAlphabet('1234567890abcdef', 10)

function domainOf(id: string): string {
  const m = id.match(/^([^:-]+)/)
  return m ? m[1] : 'default'
}

export interface GraphInput {
  nodes: Array<{ id: string; type: string; title?: string; name?: string }>
  edges: Array<{ source_id: string; target_id: string; relationship_type: string; confidence: string }>
}

/**
 * Coverage Gap Analyzer + Recommendation Engine (THE-288).
 *
 * Analyzes the traceability graph for structural gaps — orphan artifacts,
 * requirements without downstream feature links, features without test
 * coverage, ADRs not linked to implementation, and stale/low-confidence trace
 * links — and emits confidence-scored recommendations with auto-fix
 * suggestions.
 *
 * Pure by design: `analyze(graph)` takes nodes/edges directly so it is
 * trivially unit-testable without a live database. `generateFromGraph()`
 * pulls from the singleton graph store for the API layer.
 */
export class RecommendationEngine {
  analyze(graph: GraphInput): TraceRecommendation[] {
    const nodes = graph.nodes
    const edges = graph.edges

    const adj = new Map<string, Set<string>>()
    const incoming = new Map<string, Set<string>>()
    const edgeConfidence = new Map<string, string>()
    for (const n of nodes) {
      adj.set(n.id, new Set())
      incoming.set(n.id, new Set())
    }
    for (const e of edges) {
      adj.get(e.source_id)?.add(e.target_id)
      incoming.get(e.target_id)?.add(e.source_id)
      edgeConfidence.set(`${e.source_id}->${e.target_id}:${e.relationship_type}`, e.confidence)
    }

    const byId = new Map(nodes.map(n => [n.id, n]))
    const byType = new Map<string, GraphNodeRow[]>()
    for (const n of nodes as GraphNodeRow[]) {
      if (!byType.has(n.type)) byType.set(n.type, [])
      byType.get(n.type)!.push(n)
    }
    const featuresByDomain = this.groupByDomain(byType.get('feature') ?? [])
    const testsByDomain = this.groupByDomain(byType.get('testCase') ?? [])
    const componentsByDomain = this.groupByDomain(byType.get('softwareComponent') ?? [])

    const recs: TraceRecommendation[] = []

    // 1. Orphan artifacts (no links at all).
    for (const n of nodes) {
      const hasLink = (adj.get(n.id)?.size ?? 0) > 0 || (incoming.get(n.id)?.size ?? 0) > 0
      if (hasLink) continue
      recs.push(this.make({
        type: 'removeOrphan',
        severity: 'medium',
        title: `Orphan artifact: ${n.title || n.id}`,
        description: `Artifact "${n.id}" (${n.type}) has no trace links. It is neither referenced nor references anything.`,
        targetIds: [n.id],
        confidence: 0.85,
        autoFix: {
          action: `Investigate whether "${n.id}" should be linked to related artifacts or removed if obsolete.`,
          confidence: 0.85,
        },
        rationale: 'Orphan artifacts break the traceability chain and reduce coverage confidence.',
      }))
    }

    // 2. Requirements without a downstream `satisfies` link to a feature.
    for (const req of byType.get('requirement') ?? []) {
      const downstream = [...(adj.get(req.id) ?? [])]
      const hasSatisfies = edges.some(e => e.source_id === req.id && e.relationship_type === 'satisfies')
      if (hasSatisfies) continue
      const candidateFeature = this.candidateForDomain(featuresByDomain, domainOf(req.id))
      const autoFix: AutoFixSuggestion = candidateFeature
        ? {
            action: `Add a satisfies link from "${req.id}" to "${candidateFeature.id}".`,
            suggestedLink: { sourceId: req.id, targetId: candidateFeature.id, relationshipType: 'satisfies', confidence: 'medium' },
            confidence: 0.72,
          }
        : {
            action: `Create a feature that satisfies "${req.id}" and link it with a satisfies relationship.`,
            confidence: 0.5,
          }
      recs.push(this.make({
        type: 'linkRequirementToFeature',
        severity: downstream.length === 0 ? 'high' : 'medium',
        title: `Requirement has no downstream feature link: ${req.title || req.id}`,
        description: `Requirement "${req.id}" is not linked via "satisfies" to any feature.`,
        targetIds: candidateFeature ? [req.id, candidateFeature.id] : [req.id],
        confidence: candidateFeature ? 0.72 : 0.5,
        autoFix,
        rationale: 'V-Model requires every requirement to be satisfied by a feature for coverage.',
      }))
    }

    // 3. Features without test coverage (no `verifies` edge to a testCase).
    for (const feat of byType.get('feature') ?? []) {
      const hasVerifies = edges.some(e => e.source_id === feat.id && e.relationship_type === 'verifies')
      if (hasVerifies) continue
      const candidateTest = this.candidateForDomain(testsByDomain, domainOf(feat.id))
      const autoFix: AutoFixSuggestion = candidateTest
        ? {
            action: `Add a verifies link from "${feat.id}" to "${candidateTest.id}".`,
            suggestedLink: { sourceId: feat.id, targetId: candidateTest.id, relationshipType: 'verifies', confidence: 'medium' },
            confidence: 0.7,
          }
        : {
            action: `Write a test case that verifies "${feat.id}" and link it.`,
            confidence: 0.5,
          }
      recs.push(this.make({
        type: 'addTestCoverage',
        severity: 'high',
        title: `Feature lacks test coverage: ${feat.title || feat.id}`,
        description: `Feature "${feat.id}" has no trace link verifying it with a test case.`,
        targetIds: candidateTest ? [feat.id, candidateTest.id] : [feat.id],
        confidence: candidateTest ? 0.7 : 0.5,
        autoFix,
        rationale: 'Unverified features carry delivery risk and are uncovered in the trace matrix.',
      }))
    }

    // 4. ADRs (architectureModel) not linked to any implementation component.
    for (const adr of byType.get('architectureModel') ?? []) {
      const linkedToImpl = [...(adj.get(adr.id) ?? [])]
        .concat([...(incoming.get(adr.id) ?? [])])
        .some(id => byId.get(id)?.type === 'softwareComponent')
      if (linkedToImpl) continue
      const candidateComp = this.candidateForDomain(componentsByDomain, domainOf(adr.id))
      const autoFix: AutoFixSuggestion = candidateComp
        ? {
            action: `Link "${adr.id}" to implementation "${candidateComp.id}".`,
            suggestedLink: { sourceId: adr.id, targetId: candidateComp.id, relationshipType: 'tracesTo', confidence: 'medium' },
            confidence: 0.68,
          }
        : {
            action: `Identify the software component implementing "${adr.id}" and create a tracesTo link.`,
            confidence: 0.5,
          }
      recs.push(this.make({
        type: 'linkAdrToImplementation',
        severity: 'medium',
        title: `ADR not linked to implementation: ${adr.title || adr.id}`,
        description: `Architecture decision "${adr.id}" is not linked to any software component.`,
        targetIds: candidateComp ? [adr.id, candidateComp.id] : [adr.id],
        confidence: candidateComp ? 0.68 : 0.5,
        autoFix,
        rationale: 'ADRs must be traced to implementation to avoid architectural drift.',
      }))
    }

    // 5. Stale / unverified (low-confidence) trace links.
    for (const e of edges) {
      if (e.confidence !== 'low') continue
      recs.push(this.make({
        type: 'verifyStaleTraceLink',
        severity: 'low',
        title: `Stale/low-confidence trace link: ${e.source_id} → ${e.target_id}`,
        description: `Trace link "${e.source_id}" → "${e.target_id}" (${e.relationship_type}) is marked low confidence and should be re-verified.`,
        targetIds: [e.source_id, e.target_id],
        confidence: 0.6,
        autoFix: {
          action: `Re-verify the link from "${e.source_id}" to "${e.target_id}" and bump confidence if still valid.`,
          confidence: 0.6,
        },
        rationale: 'Low-confidence links erode trust in the trace matrix and should be confirmed.',
      }))
    }

    return recs.sort((a, b) => b.confidence - a.confidence)
  }

  query(recommendations: TraceRecommendation[], query: RecommendationQuery = {}): RecommendationResponse {
    let filtered = [...recommendations]

    if (query.severity?.length) {
      const set = new Set(query.severity)
      filtered = filtered.filter(r => set.has(r.severity))
    }
    if (query.type?.length) {
      const set = new Set(query.type)
      filtered = filtered.filter(r => set.has(r.type))
    }
    if (typeof query.minConfidence === 'number') {
      filtered = filtered.filter(r => r.confidence >= query.minConfidence!)
    }

    const total = recommendations.length
    const filteredCount = filtered.length

    if (typeof query.limit === 'number' && query.limit > 0) {
      filtered = filtered.slice(0, query.limit)
    }

    const summary = {
      high: filtered.filter(r => r.severity === 'high').length,
      medium: filtered.filter(r => r.severity === 'medium').length,
      low: filtered.filter(r => r.severity === 'low').length,
    }

    return {
      total,
      filtered: filteredCount,
      recommendations: filtered,
      summary,
      generatedAt: new Date().toISOString(),
    }
  }

  async generateFromGraph(): Promise<TraceRecommendation[]> {
    const db = getGraphDatabase()
    const graph: GraphInput = {
      nodes: db.getGraphNodes().map(n => ({ id: n.id, type: n.type, title: n.title, name: n.name })),
      edges: db.getGraphEdges().map((e: GraphEdgeRow) => ({
        source_id: e.source_id,
        target_id: e.target_id,
        relationship_type: e.relationship_type,
        confidence: e.confidence,
      })),
    }
    return this.analyze(graph)
  }

  private make(input: {
    type: RecommendationType
    severity: RecommendationSeverity
    title: string
    description: string
    targetIds: string[]
    confidence: number
    autoFix: AutoFixSuggestion
    rationale: string
  }): TraceRecommendation {
    return {
      id: nanoid() + '-rec',
      ...input,
    }
  }

  private groupByDomain(nodes: GraphNodeRow[]): Map<string, GraphNodeRow[]> {
    const map = new Map<string, GraphNodeRow[]>()
    for (const n of nodes) {
      const d = domainOf(n.id)
      if (!map.has(d)) map.set(d, [])
      map.get(d)!.push(n)
    }
    return map
  }

  private candidateForDomain(map: Map<string, GraphNodeRow[]>, domain: string): GraphNodeRow | undefined {
    return (map.get(domain) ?? [])[0]
  }
}

export const recommendationEngine = new RecommendationEngine()
