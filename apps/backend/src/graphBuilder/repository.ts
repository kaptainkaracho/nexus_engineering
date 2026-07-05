import type { TraceLink } from '@nexus-engineering/shared'
import type { ParsedDocument } from '../parsers/repositoryParser'
import { GraphBuilder, type TraceabilityGraph } from './graphBuilder.js'
import type { GraphNodeRow, GraphEdgeRow } from './graphDatabase'
import { getGraphDatabase } from './graphDatabase'

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

const db = getGraphDatabase()

export class GraphRepository {
  async getTraceabilityGraph(): Promise<TraceabilityGraph> {
    try {
      const rows = db.buildGraph()
      return this._rowsToGraph(rows)
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
      const rows = db.buildGraph(sourceTypes, targetTypes, relationships)
      return this._rowsToGraph(rows)
    } catch (error) {
      throw error
    }
  }

  async getConfidenceSortedTraceabilityGraph(
    descending: boolean = true
  ): Promise<TraceabilityGraph> {
    try {
      const traceLinks: TraceLink[] = this._rowsToTraceLinks(db.getGraphEdges())
      return new GraphBuilder(traceLinks).sortByConfidence(descending)
    } catch (error) {
      throw error
    }
  }

  async upsertNodes(nodes: Array<{ id: string; type: string; title?: string; name?: string }>): Promise<void> {
    try {
      db.upsertNodes(nodes)
    } catch (error) {
      throw error
    }
  }

  async upsertEdges(edge: { sourceId: string; targetId: string; relationshipType: string; confidence: 'high' | 'medium' | 'low'; description?: string }): Promise<void> {
    try {
      db.upsertEdge(edge)
    } catch (error) {
      throw error
    }
  }

  async buildFromParsed(parsedDocs: ParsedDocument[]): Promise<{ nodes: GraphNodeRow[]; edges: GraphEdgeRow[] }> {
    db.buildGraphFromParsed(parsedDocs)
    const rows = db.buildGraph()
    return { nodes: rows.nodes, edges: rows.edges }
  }

  private _rowsToGraph(rows: { nodes: GraphNodeRow[]; edges: GraphEdgeRow[] }): TraceabilityGraph {
    const nodes: Array<{ id: string; type: string; title?: string; name?: string }> = rows.nodes.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      name: n.name,
    }))
    const edges: Array<{ sourceId: string; targetId: string; relationshipType: string; confidence: 'high' | 'medium' | 'low'; description?: string }> = rows.edges.map((e) => ({
      sourceId: e.source_id,
      targetId: e.target_id,
      relationshipType: e.relationship_type,
      confidence: e.confidence,
      description: e.description || undefined,
    }))
    return { nodes, edges, totalNodes: rows.totalNodes, totalEdges: rows.totalEdges }
  }

  private _rowsToTraceLinks(rows: GraphEdgeRow[]): TraceLink[] {
    return rows.map((r) => ({
      id: '',
      version: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      source: '',
      sourceId: r.source_id,
      sourceType: '' as any,
      targetId: r.target_id,
      targetType: '' as any,
      relationshipType: r.relationship_type as TraceLink['relationshipType'],
      confidence: r.confidence,
      description: r.description || undefined,
    }))
  }
}

export const graphRepository = new GraphRepository()
