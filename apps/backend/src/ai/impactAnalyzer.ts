import type { ImpactScope, AffectedArtifact, ImpactAnalysis } from '@nexus-engineering/shared'
import type { GraphNodeRow, GraphEdgeRow } from '../graphBuilder/graphDatabase'
import { getGraphDatabase } from '../graphBuilder/graphDatabase'
import { getLLMClient } from './llmClient'
import { buildImpactAnalysisPrompt } from './promptTemplates'

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

      const messages = buildImpactAnalysisPrompt({
        changedArtifacts: scope.artifactIds.map(id => ({
          id,
          type: scope.artifactTypes?.[0] || 'unknown',
          title: id,
        })),
        graph: {
          nodes: allNodes.map(n => ({ id: n.id, type: n.type, title: n.title || n.name })),
          edges: allEdges.map(e => ({
            sourceId: e.source_id,
            targetId: e.target_id,
            relationshipType: e.relationship_type,
            confidence: e.confidence,
          })),
        },
      })

      const response = await llmClient.complete({ messages })

      return {
        ...baseAnalysis,
        _llmAnalysis: response.content,
      } as ImpactAnalysis & { _llmAnalysis: string }
    } catch {
      return baseAnalysis
    }
  }

  private computeAffected(
    scope: ImpactScope,
    nodes: GraphNodeRow[],
    edges: GraphEdgeRow[]
  ): AffectedArtifact[] {
    const changedIds = new Set(scope.artifactIds)
    const nodeMap = new Map(nodes.map(n => [n.id, n]))

    const adjacency = new Map<string, Array<{ targetId: string; relationshipType: string; confidence: string }>>()
    const reverseAdjacency = new Map<string, Array<{ sourceId: string; relationshipType: string; confidence: string }>>()

    for (const edge of edges) {
      if (!adjacency.has(edge.source_id)) {
        adjacency.set(edge.source_id, [])
      }
      adjacency.get(edge.source_id)!.push({
        targetId: edge.target_id,
        relationshipType: edge.relationship_type,
        confidence: edge.confidence,
      })

      if (!reverseAdjacency.has(edge.target_id)) {
        reverseAdjacency.set(edge.target_id, [])
      }
      reverseAdjacency.get(edge.target_id)!.push({
        sourceId: edge.source_id,
        relationshipType: edge.relationship_type,
        confidence: edge.confidence,
      })
    }

    const affected: AffectedArtifact[] = []
    const visited = new Set<string>()

    for (const artifactId of scope.artifactIds) {
      visited.add(artifactId)
    }

    for (const changedId of changedIds) {
      const outgoing = adjacency.get(changedId) || []
      const incoming = reverseAdjacency.get(changedId) || []

      for (const rel of outgoing) {
        if (!visited.has(rel.targetId)) {
          visited.add(rel.targetId)
          const targetNode = nodeMap.get(rel.targetId)
          affected.push({
            id: rel.targetId,
            type: targetNode?.type || 'unknown',
            title: targetNode?.title || targetNode?.name || rel.targetId,
            impactLevel: 'direct',
            relationshipType: rel.relationshipType,
            confidence: rel.confidence,
            path: [changedId, rel.targetId],
          })
        }
      }

      for (const rel of incoming) {
        if (!visited.has(rel.sourceId)) {
          visited.add(rel.sourceId)
          const sourceNode = nodeMap.get(rel.sourceId)
          affected.push({
            id: rel.sourceId,
            type: sourceNode?.type || 'unknown',
            title: sourceNode?.title || sourceNode?.name || rel.sourceId,
            impactLevel: 'direct',
            relationshipType: rel.relationshipType,
            confidence: rel.confidence,
            path: [rel.sourceId, changedId],
          })
        }
      }
    }

    const beforeVisit = new Set(visited)
    const twoHopAffected = affected.filter(a => a.impactLevel === 'direct')

    for (const direct of twoHopAffected) {
      const outgoing = adjacency.get(direct.id) || []
      const incoming = reverseAdjacency.get(direct.id) || []

      for (const rel of outgoing) {
        if (!visited.has(rel.targetId)) {
          visited.add(rel.targetId)
          const targetNode = nodeMap.get(rel.targetId)
          affected.push({
            id: rel.targetId,
            type: targetNode?.type || 'unknown',
            title: targetNode?.title || targetNode?.name || rel.targetId,
            impactLevel: 'indirect',
            relationshipType: rel.relationshipType,
            confidence: rel.confidence,
            path: [...scope.artifactIds.filter(id => beforeVisit.has(id)), direct.id, rel.targetId],
          })
        }
      }

      for (const rel of incoming) {
        if (!visited.has(rel.sourceId)) {
          visited.add(rel.sourceId)
          const sourceNode = nodeMap.get(rel.sourceId)
          affected.push({
            id: rel.sourceId,
            type: sourceNode?.type || 'unknown',
            title: sourceNode?.title || sourceNode?.name || rel.sourceId,
            impactLevel: 'indirect',
            relationshipType: rel.relationshipType,
            confidence: rel.confidence,
            path: [...scope.artifactIds.filter(id => beforeVisit.has(id)), direct.id, rel.sourceId],
          })
        }
      }
    }

    const beforeTransitive = new Set(visited)
    const indirectAffected = affected.filter(a => a.impactLevel === 'indirect')

    for (const indirect of indirectAffected) {
      const outgoing = adjacency.get(indirect.id) || []
      const incoming = reverseAdjacency.get(indirect.id) || []

      for (const rel of outgoing) {
        if (!visited.has(rel.targetId)) {
          visited.add(rel.targetId)
          const targetNode = nodeMap.get(rel.targetId)
          affected.push({
            id: rel.targetId,
            type: targetNode?.type || 'unknown',
            title: targetNode?.title || targetNode?.name || rel.targetId,
            impactLevel: 'transitive',
            relationshipType: rel.relationshipType,
            confidence: rel.confidence,
            path: [changedIds.values().next().value as string, indirect.id, rel.targetId],
          })
        }
      }

      for (const rel of incoming) {
        if (!visited.has(rel.sourceId)) {
          visited.add(rel.sourceId)
          const sourceNode = nodeMap.get(rel.sourceId)
          affected.push({
            id: rel.sourceId,
            type: sourceNode?.type || 'unknown',
            title: sourceNode?.title || sourceNode?.name || rel.sourceId,
            impactLevel: 'transitive',
            relationshipType: rel.relationshipType,
            confidence: rel.confidence,
            path: [changedIds.values().next().value as string, indirect.id, rel.sourceId],
          })
        }
      }
    }

    return affected
  }
}

export const impactAnalyzer = new ImpactAnalyzer()
