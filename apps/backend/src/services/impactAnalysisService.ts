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
import { V_MODEL_AXES, CONFIDENCE_SCORE } from '@nexus-engineering/shared'
import type { GraphNodeRow, GraphEdgeRow, GraphDatabase } from '../graphBuilder/graphDatabase'
import { getGraphDatabase } from '../graphBuilder/graphDatabase'

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

function getDb(db?: GraphDatabase) {
  if (db) return db
  return getGraphDatabase()
}

/**
 * Impact analysis service that computes transitive impact of a change to a node.
 * Uses BFS from the source node in both directions (upstream + downstream).
 */
export class ImpactAnalysisService {
  /**
   * Compute which artifacts are affected by a change to the given scope.
   */
  analyze(scope: ImpactScope, db?: GraphDatabase): ImpactAnalysis {
    const database = getDb(db)
    const allNodes = database.getGraphNodes()
    const allEdges = database.getGraphEdges()

    const affected = this._computeAffected(scope, allNodes, allEdges)
    const directCount = affected.filter(a => a.impactLevel === 'direct').length
    const indirectCount = affected.filter(a => a.impactLevel === 'indirect').length
    const transitiveCount = affected.filter(a => a.impactLevel === 'transitive').length

    return {
      scope,
      artifacts: affected,
      summary: { totalAffected: affected.length, directCount, indirectCount, transitiveCount },
    }
  }

  /**
   * v2: confidence-scored chains + graph-ready structures.
   */
  analyzeV2(scope: ImpactScope, db?: GraphDatabase): ImpactAnalysisV2 {
    const database = getDb(db)
    const allNodes = database.getGraphNodes()
    const allEdges = database.getGraphEdges()

    const affected = this._computeAffectedV2(scope, allNodes, allEdges)
    const impactGraph = this._buildImpactGraph(scope, affected, allNodes, allEdges)
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
      summary: { totalAffected: affected.length, directCount, indirectCount, transitiveCount, minConfidence, maxConfidence },
    }
  }

  /**
   * Get upstream dependencies for a node (what this node depends ON).
   * i.e. all nodes that have edges pointing TO the target node.
   */
  getUpstreamDependencies(nodeId: string, maxDepth = 5, db?: GraphDatabase): { dependencies: Dependency[]; total: number } {
    const database = getDb(db)
    const allEdges = database.getGraphEdges()
    const allNodes = database.getGraphNodes()
    const nodeMap = new Map(allNodes.map(n => [n.id, n]))

    const node = nodeMap.get(nodeId)
    if (!node) {
      return { dependencies: [], total: 0 }
    }

    const dependencies: Dependency[] = []
    const visited = new Set<string>()
    visited.add(nodeId)

    const adjacency = this._buildReverseAdjacency(allEdges)
    let frontier: string[] = [nodeId]

    for (let depth = 1; depth <= maxDepth && frontier.length > 0; depth++) {
      const next: string[] = []
      for (const id of frontier) {
        const incoming = adjacency.get(id) || []
        for (const edge of incoming) {
          const sourceId = edge.source_id
          if (visited.has(sourceId)) continue
          visited.add(sourceId)

          const sourceNode = nodeMap.get(sourceId)
          dependencies.push({
            id: sourceId,
            type: sourceNode?.type ?? 'unknown',
            title: sourceNode?.title ?? sourceNode?.name,
            relationshipType: edge.relationship_type,
            confidence: edge.confidence,
            confidenceScore: confidenceToScore(edge.confidence),
            depth,
            impactLevel: depth === 1 ? 'direct' : depth <= 3 ? 'indirect' : 'transitive',
          })
          next.push(sourceId)
        }
      }
      frontier = next
    }

    return { dependencies, total: dependencies.length }
  }

  /**
   * Get downstream dependents for a node (what depends ON this node).
   * i.e. all nodes reachable by following edges FROM the target node.
   */
  getDownstreamDependents(nodeId: string, maxDepth = 5, db?: GraphDatabase): { dependents: Dependent[]; total: number } {
    const database = getDb(db)
    const allEdges = database.getGraphEdges()
    const allNodes = database.getGraphNodes()
    const nodeMap = new Map(allNodes.map(n => [n.id, n]))

    const node = nodeMap.get(nodeId)
    if (!node) {
      return { dependents: [], total: 0 }
    }

    const dependents: Dependent[] = []
    const visited = new Set<string>()
    visited.add(nodeId)

    const adjacency = this._buildForwardAdjacency(allEdges)
    let frontier: string[] = [nodeId]

    for (let depth = 1; depth <= maxDepth && frontier.length > 0; depth++) {
      const next: string[] = []
      for (const id of frontier) {
        const outgoing = adjacency.get(id) || []
        for (const edge of outgoing) {
          const targetId = edge.target_id
          if (visited.has(targetId)) continue
          visited.add(targetId)

          const targetNode = nodeMap.get(targetId)
          dependents.push({
            id: targetId,
            type: targetNode?.type ?? 'unknown',
            title: targetNode?.title ?? targetNode?.name,
            relationshipType: edge.relationship_type,
            confidence: edge.confidence,
            confidenceScore: confidenceToScore(edge.confidence),
            depth,
            impactLevel: depth === 1 ? 'direct' : depth <= 3 ? 'indirect' : 'transitive',
          })
          next.push(targetId)
        }
      }
      frontier = next
    }

    return { dependents, total: dependents.length }
  }

  /**
   * Full dependency graph for a node: both upstream and downstream.
   */
  getFullDependencyGraph(nodeId: string, maxDepth = 5, db?: GraphDatabase): {
    upstream: Dependency[]
    downstream: Dependent[]
    totalUpstream: number
    totalDownstream: number
    criticality: 'high' | 'medium' | 'low'
  } {
    const upstream = this.getUpstreamDependencies(nodeId, maxDepth, db)
    const downstream = this.getDownstreamDependents(nodeId, maxDepth, db)
    const total = upstream.total + downstream.total

    let criticality: 'high' | 'medium' | 'low' = 'low'
    if (total >= 10) criticality = 'high'
    else if (total >= 3) criticality = 'medium'

    return {
      upstream: upstream.dependencies,
      downstream: downstream.dependents,
      totalUpstream: upstream.total,
      totalDownstream: downstream.total,
      criticality,
    }
  }

  // ---- Private helpers ----

  private _computeAffected(scope: ImpactScope, allNodes: GraphNodeRow[], allEdges: GraphEdgeRow[], db?: GraphDatabase): AffectedArtifact[] {
    const affected: AffectedArtifact[] = []
    const visited = new Set<string>()

    for (const artifactId of scope.artifactIds) {
      if (visited.has(artifactId)) continue
      visited.add(artifactId)

      const bfs = this._bfs(artifactId, allEdges, visited)
      for (const [id, depth] of bfs) {
        if (id === artifactId) continue
        const edge = allEdges.find(e =>
          (e.source_id === artifactId && e.target_id === id) ||
          (e.target_id === artifactId && e.source_id === id)
        )
        const node = allNodes.find(n => n.id === id)
        const impactLevel: AffectedArtifact['impactLevel'] =
          depth === 1 ? 'direct' : depth <= 3 ? 'indirect' : 'transitive'
        affected.push({
          id,
          type: node?.type ?? 'unknown',
          title: node?.title ?? node?.name ?? '',
          impactLevel,
          relationshipType: edge?.relationship_type ?? 'unknown',
          confidence: edge?.confidence ?? 'low',
          path: [artifactId, ...this._reconstructPath(artifactId, id, allEdges)],
        })
      }
    }

    return affected
  }

  private _computeAffectedV2(scope: ImpactScope, allNodes: GraphNodeRow[], allEdges: GraphEdgeRow[]): AffectedArtifactV2[] {
    const affected: AffectedArtifactV2[] = []
    const visited = new Set<string>()

    for (const artifactId of scope.artifactIds) {
      if (visited.has(artifactId)) continue
      visited.add(artifactId)

      const bfs = this._bfs(artifactId, allEdges, visited)
      for (const [id, depth] of bfs) {
        if (id === artifactId) continue
        const edge = allEdges.find(e =>
          (e.source_id === artifactId && e.target_id === id) ||
          (e.target_id === artifactId && e.source_id === id)
        )
        const node = allNodes.find(n => n.id === id)
        const impactLevel: AffectedArtifactV2['impactLevel'] =
          depth === 1 ? 'direct' : depth <= 3 ? 'indirect' : 'transitive'
        const baseScore = LEVEL_DECAY[impactLevel]
        const confScore = edge ? confidenceToScore(edge.confidence) : 0.4
        const confidenceScore = Math.round((baseScore * confScore) * 100)

        affected.push({
          id,
          type: node?.type ?? 'unknown',
          title: node?.title ?? node?.name ?? '',
          impactLevel,
          relationshipType: edge?.relationship_type ?? 'unknown',
          confidence: edge?.confidence ?? 'low',
          confidenceScore,
          path: [artifactId, ...this._reconstructPath(artifactId, id, allEdges)],
        })
      }
    }

    return affected
  }

  private _buildImpactGraph(scope: ImpactScope, affected: AffectedArtifactV2[], allNodes: GraphNodeRow[], allEdges: GraphEdgeRow[]): ImpactGraph {
    const affectedIds = new Set(scope.artifactIds.concat(affected.map(a => a.id)))
    const nodeIdSet = new Set(affectedIds)

    const nodes: ImpactGraphNode[] = []
    for (const id of affectedIds) {
      const node = allNodes.find(n => n.id === id)
      if (node) {
        nodes.push({
          id: node.id,
          type: node.type,
          title: node.title,
        })
      }
    }

    const edges: ImpactGraphEdge[] = []
    for (const edge of allEdges) {
      if (!nodeIdSet.has(edge.source_id) || !nodeIdSet.has(edge.target_id)) continue
      edges.push({
        sourceId: edge.source_id,
        targetId: edge.target_id,
        relationshipType: edge.relationship_type,
        confidence: edge.confidence,
        confidenceScore: confidenceToScore(edge.confidence),
      })
    }

    return { nodes, edges }
  }

  private _bfs(start: string, allEdges: GraphEdgeRow[], visited: Set<string>): Map<string, number> {
    const result = new Map<string, number>()
    const queue: [string, number][] = [[start, 0]]

    while (queue.length > 0) {
      const [current, depth] = queue.shift()!
      const edges = allEdges.filter(e =>
        e.source_id === current || e.target_id === current
      )

      for (const edge of edges) {
        const neighbor = edge.source_id === current ? edge.target_id : edge.source_id
        if (visited.has(neighbor)) continue
        visited.add(neighbor)
        const newDepth = depth + 1
        result.set(neighbor, newDepth)
        queue.push([neighbor, newDepth])
      }
    }

    return result
  }

  private _reconstructPath(from: string, to: string, allEdges: GraphEdgeRow[]): string[] {
    const forwardAdj = this._buildForwardAdjacency(allEdges)
    const queue: [string, string[]][] = [[from, [from]]]
    const visited = new Set<string>([from])

    while (queue.length > 0) {
      const [current, path] = queue.shift()!
      if (current === to) return path
      const edges = forwardAdj.get(current) || []
      for (const edge of edges) {
        const next = edge.target_id
        if (visited.has(next)) continue
        visited.add(next)
        queue.push([next, [...path, next]])
      }
    }
    return [from, to]
  }

  private _buildForwardAdjacency(edges: GraphEdgeRow[]): Map<string, GraphEdgeRow[]> {
    const adj = new Map<string, GraphEdgeRow[]>()
    for (const e of edges) {
      if (!adj.has(e.source_id)) adj.set(e.source_id, [])
      adj.get(e.source_id)!.push(e)
    }
    return adj
  }

  private _buildReverseAdjacency(edges: GraphEdgeRow[]): Map<string, GraphEdgeRow[]> {
    const adj = new Map<string, GraphEdgeRow[]>()
    for (const e of edges) {
      if (!adj.has(e.target_id)) adj.set(e.target_id, [])
      adj.get(e.target_id)!.push(e)
    }
    return adj
  }
}

export interface Dependency {
  id: string
  type: string
  title?: string
  relationshipType: string
  confidence: string
  confidenceScore: number
  depth: number
  impactLevel: 'direct' | 'indirect' | 'transitive'
}

export interface Dependent {
  id: string
  type: string
  title?: string
  relationshipType: string
  confidence: string
  confidenceScore: number
  depth: number
  impactLevel: 'direct' | 'indirect' | 'transitive'
}

export const impactAnalysisService = new ImpactAnalysisService()
