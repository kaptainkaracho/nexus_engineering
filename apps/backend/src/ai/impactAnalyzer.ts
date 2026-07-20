import type {
  ImpactScope,
  AffectedArtifact,
  ImpactAnalysis,
  ImpactAnalysisV2,
  AffectedArtifactV2,
  ImpactGraph,
  ImpactGraphNode,
  ImpactGraphEdge,
  ImpactChain,
} from '@nexus-engineering/shared'
import { V_MODEL_AXES } from '@nexus-engineering/shared'
import type { GraphNodeRow, GraphEdgeRow } from '../graphBuilder/graphDatabase'
import { getGraphDatabase } from '../graphBuilder/graphDatabase'
import { getLLMClient } from './llmClient'
import { buildImpactBriefingPrompt } from './promptTemplates'
import { parseStructuredLLM } from './llmResponseParser'

const LEVEL_DECAY: Record<AffectedArtifact['impactLevel'], number> = {
  direct: 1.0,
  indirect: 0.85,
  transitive: 0.7,
}

const VALID_TYPES = new Set<string>([...V_MODEL_AXES, 'architectureModel', 'softwareComponent'])

function confidenceToScore(confidence: string): number {
  if (confidence === 'high') return 1.0
  if (confidence === 'medium') return 0.7
  return 0.4
}

export class ImpactAnalyzer {
  async analyze(scope: ImpactScope): Promise<ImpactAnalysis> {
    try {
      const db = getGraphDatabase()
      const allNodes = db.getGraphNodes()
      const allEdges = db.getGraphEdges()

      const affected = this.computeAffected(scope, allNodes, allEdges)

      const directCount = affected.filter(a => a.impactLevel === 'direct').length
      const indirectCount = affected.filter(a => a.impactLevel === 'indirect').length
      const transitiveCount = affected.filter(a => a.impactLevel === 'transitive').length

      return {
        scope,
        artifacts: affected,
        summary: {
          totalAffected: affected.length,
          directCount,
          indirectCount,
          transitiveCount,
        },
      }
    } catch (error) {
      throw error
    }
  }

  /**
   * Change Impact v2: impact chain with numeric confidence scores (0-100) and a
   * graph-ready structure for downstream visualization.
   */
  async analyzeV2(scope: ImpactScope): Promise<ImpactAnalysisV2> {
    const db = getGraphDatabase()
    const allNodes = db.getGraphNodes()
    const allEdges = db.getGraphEdges()

    const affected = this.computeAffectedV2(scope, allNodes, allEdges)
    const impactGraph = this.buildImpactGraph(scope, affected, allNodes, allEdges)
    const chains: ImpactChain[] = affected.map(a => ({
      artifactId: a.id,
      confidenceScore: a.confidenceScore,
      level: a.impactLevel,
      path: a.path,
    }))

    const directCount = affected.filter(a => a.impactLevel === 'direct').length
    const indirectCount = affected.filter(a => a.impactLevel === 'indirect').length
    const transitiveCount = affected.filter(a => a.impactLevel === 'transitive').length
    const scores = affected.map(a => a.confidenceScore)
    const minConfidence = scores.length ? Math.min(...scores) : 0
    const maxConfidence = scores.length ? Math.max(...scores) : 0

    return {
      scope,
      artifacts: affected,
      impactGraph,
      chains,
      summary: {
        totalAffected: affected.length,
        directCount,
        indirectCount,
        transitiveCount,
        minConfidence,
        maxConfidence,
      },
    }
  }

  async analyzeWithLLM(scope: ImpactScope): Promise<ImpactAnalysis> {
    const baseAnalysis = await this.analyze(scope)
    const llmClient = getLLMClient()

    if (!llmClient.isConfigured()) {
      return baseAnalysis
    }

    try {
      const db = getGraphDatabase()
      const allNodes = db.getGraphNodes()
      const allEdges = db.getGraphEdges()

      const messages = buildImpactBriefingPrompt({
        changedArtifactId: scope.artifactIds[0] ?? 'unknown',
        changedArtifactType: scope.artifactTypes?.[0] || 'unknown',
        affectedArtifacts: baseAnalysis.artifacts.map(a => ({
          id: a.id,
          type: a.type,
          impactLevel: a.impactLevel,
          confidenceScore: 0,
          path: a.path,
        })),
        totalAffected: baseAnalysis.artifacts.length,
      })

      const response = await llmClient.complete({ messages })
      parseStructuredLLM(response, 'impact_briefing')

      return {
        ...baseAnalysis,
        _llmAnalysis: response.content,
      } as ImpactAnalysis & { _llmAnalysis: string }
    } catch {
      return baseAnalysis
    }
  }

  private scoreFor(a: { impactLevel: AffectedArtifact['impactLevel']; confidence: string }): number {
    const base = confidenceToScore(a.confidence)
    const decay = LEVEL_DECAY[a.impactLevel]
    return Math.round(base * decay * 100)
  }

  private computeAffected(
    scope: ImpactScope,
    nodes: GraphNodeRow[],
    edges: GraphEdgeRow[]
  ): AffectedArtifact[] {
    return this.computeAffectedV2(scope, nodes, edges)
  }

  private computeAffectedV2(
    scope: ImpactScope,
    nodes: GraphNodeRow[],
    edges: GraphEdgeRow[]
  ): AffectedArtifactV2[] {
    const changedIds = new Set(scope.artifactIds)
    const nodeMap = new Map(nodes.map(n => [n.id, n]))

    const adjacency = new Map<string, Array<{ targetId: string; relationshipType: string; confidence: string }>>()
    const reverseAdjacency = new Map<string, Array<{ sourceId: string; relationshipType: string; confidence: string }>>()

    for (const edge of edges) {
      if (!adjacency.has(edge.source_id)) adjacency.set(edge.source_id, [])
      adjacency.get(edge.source_id)!.push({ targetId: edge.target_id, relationshipType: edge.relationship_type, confidence: edge.confidence })

      if (!reverseAdjacency.has(edge.target_id)) reverseAdjacency.set(edge.target_id, [])
      reverseAdjacency.get(edge.target_id)!.push({ sourceId: edge.source_id, relationshipType: edge.relationship_type, confidence: edge.confidence })
    }

    const affected: AffectedArtifactV2[] = []
    const visited = new Set<string>(scope.artifactIds)

    const traverse = (
      fromIds: string[],
      level: 'direct' | 'indirect' | 'transitive',
      basePath: string[]
    ) => {
      for (const fromId of fromIds) {
        const outgoing = adjacency.get(fromId) || []
        const incoming = reverseAdjacency.get(fromId) || []

        for (const rel of outgoing) {
          if (visited.has(rel.targetId)) continue
          visited.add(rel.targetId)
          const targetNode = nodeMap.get(rel.targetId)
          const confidenceScore = this.scoreFor({ impactLevel: level, confidence: rel.confidence })
          affected.push({
            id: rel.targetId,
            type: targetNode?.type || 'unknown',
            title: targetNode?.title || targetNode?.name || rel.targetId,
            impactLevel: level,
            relationshipType: rel.relationshipType,
            confidence: rel.confidence,
            confidenceScore,
            path: [...basePath, rel.targetId],
          })
        }

        for (const rel of incoming) {
          if (visited.has(rel.sourceId)) continue
          visited.add(rel.sourceId)
          const sourceNode = nodeMap.get(rel.sourceId)
          const confidenceScore = this.scoreFor({ impactLevel: level, confidence: rel.confidence })
          affected.push({
            id: rel.sourceId,
            type: sourceNode?.type || 'unknown',
            title: sourceNode?.title || sourceNode?.name || rel.sourceId,
            impactLevel: level,
            relationshipType: rel.relationshipType,
            confidence: rel.confidence,
            confidenceScore,
            path: [...basePath, rel.sourceId],
          })
        }
      }
    }

    // 1 hop — direct
    traverse(scope.artifactIds, 'direct', [...scope.artifactIds])
    const directIds = affected.filter(a => a.impactLevel === 'direct').map(a => a.id)
    // 2 hop — indirect
    traverse(directIds, 'indirect', [...scope.artifactIds])
    const indirectIds = affected.filter(a => a.impactLevel === 'indirect').map(a => a.id)
    // 3 hop — transitive
    traverse(indirectIds, 'transitive', [...scope.artifactIds])

    return affected
  }

  private buildImpactGraph(
    scope: ImpactScope,
    affected: AffectedArtifactV2[],
    nodes: GraphNodeRow[],
    edges: GraphEdgeRow[]
  ): ImpactGraph {
    const relevantIds = new Set<string>([...scope.artifactIds, ...affected.map(a => a.id)])
    const nodeMap = new Map(nodes.map(n => [n.id, n]))

    const graphNodes: ImpactGraphNode[] = []
    for (const id of relevantIds) {
      const node = nodeMap.get(id)
      const aff = affected.find(a => a.id === id)
      graphNodes.push({
        id,
        type: node?.type || 'unknown',
        title: node?.title || node?.name,
        confidenceScore: aff?.confidenceScore,
      })
    }

    const edgeKey = (e: GraphEdgeRow) => `${e.source_id}->${e.target_id}:${e.relationship_type}`
    const seen = new Set<string>()
    const graphEdges: ImpactGraphEdge[] = []

    for (const aff of affected) {
      // include the edge linking each consecutive pair in the path
      for (let i = 0; i < aff.path.length - 1; i++) {
        const src = aff.path[i]
        const tgt = aff.path[i + 1]
        const edge = edges.find(e =>
          (e.source_id === src && e.target_id === tgt) ||
          (e.source_id === tgt && e.target_id === src)
        )
        if (!edge) continue
        const key = edgeKey(edge)
        if (seen.has(key)) continue
        seen.add(key)
        graphEdges.push({
          sourceId: edge.source_id,
          targetId: edge.target_id,
          relationshipType: edge.relationship_type,
          confidence: edge.confidence,
          confidenceScore: Math.round(confidenceToScore(edge.confidence) * 100),
        })
      }
    }

    return { nodes: graphNodes, edges: graphEdges }
  }
}

export const impactAnalyzer = new ImpactAnalyzer()
export { VALID_TYPES }
