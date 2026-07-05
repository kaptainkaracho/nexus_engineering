import type { TraceLink } from '@nexus-engineering/shared'
import { GraphBuilder, type TraceabilityGraph } from './graphBuilder.js'

export interface TraceLinkRow {
  id: string
  sourceId: string
  sourceType: string
  targetId: string
  targetType: string
  relationshipType: string
  confidence: 'high' | 'medium' | 'low'
  description?: string
}

/**
 * In-memory persistence for traceability graph nodes and edges.
 * No database driver is wired yet — the GraphRepository stores everything in memory
 * so the API can return meaningful data once parsed artifacts are fed in via upsertNodes/upsertEdges.
 */
export class GraphDatabase {
  private traceLinks: TraceLinkRow[] = []

  upsertNodes(nodes: Array<{ id: string; type: string; title?: string, name?: string }>): void {
    // Nodes are implicit from edges in the current model.
  }

  upsertEdges(edges: Array<{ sourceId: string; targetId: string; relationshipType: string; confidence: 'high' | 'medium' | 'low' }>): void {
    for (const edge of edges) {
      const existing = this.traceLinks.find(l => l.sourceId === edge.sourceId && l.targetId === edge.targetId)
      if (existing) {
        Object.assign(existing, edge)
      } else {
        this.traceLinks.push({
          id: `${edge.sourceId}→${edge.targetId}`,
          sourceId: edge.sourceId,
          sourceType: 'unknown',
          targetId: edge.targetId,
          targetType: 'unknown',
          relationshipType: edge.relationshipType,
          confidence: edge.confidence
        })
      }
    }
  }

  getTraceLinks(): TraceLinkRow[] {
    return this.traceLinks
  }
}

export const db = new GraphDatabase()

export class GraphRepository {
  
  async getTraceabilityGraph(): Promise<TraceabilityGraph> {
    try {
      const traceLinks: TraceLink[] = this._rowsToTraceLinks(db.getTraceLinks())
      return new GraphBuilder(traceLinks).buildGraph()
    } catch (error) {
      throw error
    }
  }
  
  async getFilteredTraceabilityGraph(
    sourceTypes?: string[],
    targetTypes?: string[],
    relationships?: string[]
  ): Promise<TraceabilityGraph> {
    try {
      const traceLinks = this._filterLinks(db.getTraceLinks(), sourceTypes, targetTypes, relationships)
      let builder = new GraphBuilder(traceLinks)
      
      if (sourceTypes && sourceTypes.length > 0) {
        builder = builder.filterBySourceType(sourceTypes)
      }
      
      if (targetTypes && targetTypes.length > 0) {
        builder = builder.filterByTargetType(targetTypes)
      }
        
      if (relationships && relationships.length > 0) {
        builder = builder.filterByRelationship(relationships)
      }
  
      return builder.buildGraph()
    } catch (error) {
      throw error
    }
  }
  
  async getConfidenceSortedTraceabilityGraph(
    descending: boolean = true
  ): Promise<TraceabilityGraph> {
    try {
      const traceLinks = this._rowsToTraceLinks(db.getTraceLinks())
      return new GraphBuilder(traceLinks).sortByConfidence(descending)
    } catch (error) {
      throw error
    }
  }
  
  async upsertNodes(nodes: Array<{ id: string; type: string; title?: string, name?: string }>): Promise<void> {
    db.upsertNodes(nodes)
  }
  
  async upsertEdges(edges: Array<{ sourceId: string; targetId: string; relationshipType: string; confidence: 'high' | 'medium' | 'low' }>): Promise<void> {
    db.upsertEdges(edges)
  }

  private _rowsToTraceLinks(rows: TraceLinkRow[]): TraceLink[] {
    return rows.map(r => ({
      sourceId: r.sourceId,
      sourceType: r.sourceType,
      targetId: r.targetId,
      targetType: r.targetType,
      relationshipType: r.relationshipType as TraceLink['relationshipType'],
      confidence: r.confidence,
      description: r.description
    } satisfies TraceLink))
  }

  private _filterLinks(
    links: TraceLinkRow[],
    sourceTypes?: string[],
    targetTypes?: string[],
    relationships?: string[]
  ): TraceLink[] {
    return links.filter(link => {
      if (sourceTypes?.length && !sourceTypes.includes(link.sourceType)) return false
      if (targetTypes?.length && !targetTypes.includes(link.targetType)) return false
      if (relationships?.length && !relationships.includes(link.relationshipType)) return false
      return true
    })
  }
}

export const graphRepository = new GraphRepository()
