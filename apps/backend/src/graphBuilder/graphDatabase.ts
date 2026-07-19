import Database from 'better-sqlite3'
import type { TraceLink } from '@nexus-engineering/shared'
import type { ParsedDocument, ParsedTraceLink } from '../parsers/repositoryParser'

export interface GraphNodeRow {
  id: string
  type: 'requirement' | 'architectureModel' | 'softwareComponent' | 'testCase' | 'feature' | 'result'
  title?: string
  name?: string
  created_at: string
  updated_at: string
}

export interface GraphEdgeRow {
  id: string
  source_id: string
  target_id: string
  relationship_type: string
  confidence: 'high' | 'medium' | 'low'
  description?: string
  created_at: string
  updated_at: string
}

export class GraphDatabase {
  private db: Database.Database
  private initialized = false

  constructor(databasePath: string = ':memory:') {
    this.db = new Database(databasePath)
    this.db.pragma('journal_mode = WAL')
    this.db.pragma('foreign_keys = ON')
  }

  initialize() {
    if (this.initialized) return

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS graph_nodes (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL CHECK(type IN ('requirement', 'architectureModel', 'softwareComponent', 'testCase', 'feature', 'result')),
        title TEXT,
        name TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS graph_edges (
        id TEXT PRIMARY KEY,
        source_id TEXT NOT NULL,
        target_id TEXT NOT NULL,
        relationship_type TEXT NOT NULL,
        confidence TEXT NOT NULL CHECK(confidence IN ('high', 'medium', 'low')),
        description TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)

    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_graph_edges_source ON graph_edges (source_id)`)
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_graph_edges_target ON graph_edges (target_id)`)
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_graph_edges_relationship ON graph_edges (relationship_type)`)
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_graph_edges_confidence ON graph_edges (confidence)`)
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_graph_nodes_type ON graph_nodes (type)`)

    this.initialized = true
  }

  getNode(id: string): GraphNodeRow |undefined {
    const stmt = this.db.prepare(`SELECT * FROM graph_nodes WHERE id = ?`)
    return stmt.get(id) as GraphNodeRow | undefined
  }

  getNodesByType(type: string): GraphNodeRow[] {
    const stmt = this.db.prepare(`SELECT * FROM graph_nodes WHERE type = ?`)
    return stmt.all(type) as GraphNodeRow[]
  }

  getGraphNodes(): GraphNodeRow[] {
    const stmt = this.db.prepare(`SELECT * FROM graph_nodes ORDER BY updated_at DESC`)
    return stmt.all() as GraphNodeRow[]
  }

  upsertNode(node: { id: string; type: string; title?: string; name?: string }) {
    if (this.getNode(node.id)) {
      const stmt = this.db.prepare(`
        UPDATE graph_nodes SET type = ?, title = ?, name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `)
      stmt.run(node.type, node.title ?? null, node.name ?? null, node.id)
    } else {
      const stmt = this.db.prepare(`
        INSERT INTO graph_nodes (id, type, title, name, created_at, updated_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `)
      stmt.run(node.id, node.type, node.title ?? null, node.name ?? null)
    }
  }

  upsertNodes(nodes: Array<{ id: string; type: string; title?: string; name?: string }>) {
    const insertNode = this.db.prepare(`
      INSERT OR IGNORE INTO graph_nodes (id, type, title, name, created_at, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `)
    const updateNode = this.db.prepare(`
      UPDATE graph_nodes SET type = ?, title = ?, name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `)

    const insertMany = this.db.transaction((nodesToInsert: Array<{ id: string; type: string; title?: string; name?: string }>) => {
      for (const node of nodesToInsert) {
        insertNode.run(node.id, node.type, node.title ?? null, node.name ?? null)
      }
    })

    insertMany(nodes)

    for (const node of nodes) {
      updateNode.run(node.type, node.title ?? null, node.name ?? null, node.id)
    }
  }

  upsertEdge(edge: TraceLink | { sourceId: string; targetId: string; relationshipType: string; confidence: 'high' | 'medium' | 'low'; description?: string }) {
    const edgeId = `${edge.sourceId}→${edge.targetId}→${edge.relationshipType}`

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO graph_edges (id, source_id, target_id, relationship_type, confidence, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    stmt.run(edgeId, edge.sourceId, edge.targetId, edge.relationshipType, edge.confidence, edge.description ?? null)

    return edgeId
  }

  getGraphEdges(): GraphEdgeRow[] {
    const stmt = this.db.prepare(`SELECT * FROM graph_edges ORDER BY updated_at DESC`)
    return stmt.all() as GraphEdgeRow[]
  }

  filterRows(
    nodes: GraphNodeRow[],
    edges: GraphEdgeRow[],
    sourceTypes?: string[],
    targetTypes?: string[],
    relationships?: string[]
  ): { filteredNodes: GraphNodeRow[]; filteredEdges: GraphEdgeRow[] } {
    let edgeIds = new Set<string>()

    if (sourceTypes?.length) {
      const ids = this.db
        .prepare(`SELECT DISTINCT source_id FROM graph_edges WHERE type IN (${sourceTypes.map(() => '?').join(',')})`)
        .all(...sourceTypes) as { source_id: string }[]
      // Build a temporary in-memory approach using filtering
    }

    let filteredEdges = edges

    if (sourceTypes?.length) {
      filteredEdges = filteredEdges.filter((e) => sourceTypes.includes(e.source_id.split('→')[0]))
    }
    if (targetTypes?.length) {
      filteredEdges = filteredEdges.filter((e) => targetTypes.includes(e.target_id.split('→')[0]))
    }
    if (relationships?.length) {
      filteredEdges = filteredEdges.filter((e) => relationships.includes(e.relationship_type))
    }

    const nodeIds = new Set<string>()
    for (const edge of filteredEdges) {
      nodeIds.add(edge.source_id)
      nodeIds.add(edge.target_id)
    }
    const filteredNodes = nodes.filter((n) => nodeIds.has(n.id))

    return { filteredNodes, filteredEdges }
  }

   buildGraph(
     sourceTypes?: string[],
     targetTypes?: string[],
     relationships?: string[]
   ): { nodes: GraphNodeRow[]; edges: GraphEdgeRow[]; totalNodes: number; totalEdges: number } {
     const allNodes = this.getGraphNodes()

     let allEdges: GraphEdgeRow[] = []
     if (sourceTypes?.length || targetTypes?.length || relationships?.length) {
       let sql = 'SELECT * FROM graph_edges'
       const conditions: string[] = []
       const params: unknown[] = []

       if (sourceTypes?.length) {
         conditions.push('source_id IN (' + sourceTypes.map(() => '?').join(',') + ')')
         params.push(...sourceTypes)
       }
       if (targetTypes?.length) {
         conditions.push('target_id IN (' + targetTypes.map(() => '?').join(',') + ')')
         params.push(...targetTypes)
       }

       if (conditions.length > 0 && relationships?.length) {
         conditions.push('relationship_type IN (' + relationships.map(() => '?').join(',') + ')')
         params.push(...relationships)
       } else if (relationships?.length) {
         conditions.push('relationship_type IN (' + relationships.map(() => '?').join(',') + ')')
         params.push(...relationships)
       }

       if (conditions.length > 0) {
         allEdges = this.db.prepare(sql + ' WHERE ' + conditions.join(' AND')).all(...params) as GraphEdgeRow[]
       } else {
         allEdges = this.db.prepare(sql).all() as GraphEdgeRow[]
       }
     } else {
       allEdges = this.db.prepare(`SELECT * FROM graph_edges ORDER BY updated_at DESC`).all() as GraphEdgeRow[]
     }

     const nodeIds = new Set<string>()
     for (const edge of allEdges) {
       nodeIds.add(edge.source_id)
       nodeIds.add(edge.target_id)
     }
     const filteredNodes = allNodes.filter((n) => nodeIds.has(n.id))

     return {
       nodes: filteredNodes,
       edges: allEdges,
       totalNodes: filteredNodes.length,
       totalEdges: allEdges.length,
     }
   }

  buildGraphFromParsed(parsedDocs: ParsedDocument[]): void {
    const allNodes: Array<{ id: string; type: string; title?: string; name?: string }> = []
    const nodeIds = new Set<string>()

    for (const doc of parsedDocs) {
      if (!doc.traceLinks || doc.traceLinks.length === 0) continue

      const sourceDocType = this.docTypeToGraphNodeType(doc.type, doc.detectedType)
      const sourceId = doc.id
      const title = doc.metadata?.title as string | undefined

      allNodes.push({ id: sourceId, type: sourceDocType, title })

      for (const link of doc.traceLinks) {
        if (!nodeIds.has(link.targetId)) {
          nodeIds.add(link.targetId)
          const targetId = link.targetId
          let targetType: 'requirement' | 'architectureModel' | 'softwareComponent' | 'testCase' = 'requirement'

          if (sourceDocType === 'requirement') targetType = 'requirement'
          else if (sourceDocType === 'architectureModel') targetType = 'architectureModel'
          else if (sourceDocType === 'softwareComponent') targetType = 'softwareComponent'
          else if (sourceDocType === 'testCase') targetType = 'testCase'

          allNodes.push({ id: targetId, type: targetType })

          this.upsertEdge({
            sourceId,
            targetId,
            relationshipType: link.relationshipType,
            confidence: link.confidence,
            description: undefined,
          })
        } else {
          this.upsertEdge({
            sourceId,
            targetId: link.targetId,
            relationshipType: link.relationshipType,
            confidence: link.confidence,
            description: undefined,
          })
        }
      }
    }

    const allUniqueNodeIds = new Set<string>()
    for (const node of allNodes) {
      allUniqueNodeIds.add(node.id)
    }

    const uniqueNodes = allNodes.filter((n) => true)
    this.upsertNodes(uniqueNodes)
  }

  private docTypeToGraphNodeType(docType: string, detectedType?: string): 'requirement' | 'architectureModel' | 'softwareComponent' | 'testCase' | 'feature' | 'result' {
    if (docType === 'Json') return 'requirement'
    if (detectedType) {
      for (const key of ['requirement', 'architectureModel', 'softwareComponent', 'testCase', 'feature', 'result']) {
        if (key === detectedType) return key as 'requirement' | 'architectureModel' | 'softwareComponent' | 'testCase' | 'feature' | 'result'
      }
    }
    return 'requirement'
  }

  close() {
    this.db.close()
  }
}

let databaseInstance: GraphDatabase | null = null

export function getGraphDatabase(databasePath?: string): GraphDatabase {
  if (!databaseInstance) {
    databaseInstance = new GraphDatabase(databasePath)
    databaseInstance.initialize()
  }
  return databaseInstance
}
