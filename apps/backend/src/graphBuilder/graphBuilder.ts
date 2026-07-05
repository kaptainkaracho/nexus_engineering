import type { TraceLink } from '@nexus-engineering/shared'

export interface GraphNode {
  id: string
  type: 'requirement' | 'architectureModel' | 'softwareComponent' | 'testCase'
  title?: string
  name?: string
}

export interface GraphEdge {
  sourceId: string
  targetId: string
  relationshipType: string
  confidence: 'high' | 'medium' | 'low'
  description?: string
}

export interface TraceabilityGraph {
  nodes: GraphNode[]
  edges: GraphEdge[]
  totalNodes: number
  totalEdges: number
}

export class GraphBuilder {
  private traceLinks: TraceLink[]
  
  constructor(traceLinks: TraceLink[] = []) {
    this.traceLinks = traceLinks
  }
  
  buildGraph(): TraceabilityGraph {
    const nodesMap = new Map<string, GraphNode>()
    const edges: GraphEdge[] = []
    
    // Process all trace links to extract nodes and relationships
    for (const link of this.traceLinks) {
      // Add source node
      if (!nodesMap.has(link.sourceId)) {
        nodesMap.set(link.sourceId, {
          id: link.sourceId,
          type: link.sourceType,
        })
      }
      
      // Add target node  
      if (!nodesMap.has(link.targetId)) {
        nodesMap.set(link.targetId, {
          id: link.targetId,
          type: link.targetType,
        })
      }
      
      // Add edge (relationship)
      edges.push({
        sourceId: link.sourceId,
        targetId: link.targetId,
        relationshipType: link.relationshipType,
        confidence: link.confidence,
        description: link.description
      })
    }
    
    const nodes = Array.from(nodesMap.values())
    
    return {
      nodes,
      edges,
      totalNodes: nodes.length,
      totalEdges: edges.length
    }
  }
  
  filterBySourceType(sourceTypes: string[]): GraphBuilder {
    this.traceLinks = this.traceLinks.filter(link => sourceTypes.includes(link.sourceType))
    return this
  }
  
  filterByTargetType(targetTypes: string[]): GraphBuilder {
    this.traceLinks = this.traceLinks.filter(link => targetTypes.includes(link.targetType))
    return this
  }
  
  filterByRelationship(relationships: string[]): GraphBuilder {
    this.traceLinks = this.traceLinks.filter(link => relationships.includes(link.relationshipType))
    return this
  }
  
  sortByConfidence(descending: boolean = true): TraceabilityGraph {
    const graph = this.buildGraph()
    
    // Sort edges by confidence
    graph.edges.sort((a, b) => {
      const confidenceOrder: Record<string, number> = { high: 0, medium: 1, low: 2 }
      return descending
        ? confidenceOrder[b.confidence] - confidenceOrder[a.confidence]
        : confidenceOrder[a.confidence] - confidenceOrder[b.confidence]
    })
    
    return graph
  }
  
  static fromTraceLinks(traceLinks: TraceLink[]): GraphBuilder {
    return new GraphBuilder(traceLinks)
  }
}
