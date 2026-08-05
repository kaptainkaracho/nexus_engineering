import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { TraceLink } from '@nexus-engineering/shared'
import Database from 'better-sqlite3'

// Persisted SQLite location. Defaults to a Railway persistent-volume mount so
// data survives deploys/restarts. Falls back to an in-memory DB for local dev.
export const DEFAULT_TRACE_DB_PATH = process.env.DATABASE_PATH
  ? `${process.env.DATABASE_PATH}.trace`
  : ':memory:'

class TraceLinkDatabase {
  private db: Database.Database
  private initialized = false

  constructor(databasePath: string = DEFAULT_TRACE_DB_PATH) {
    let dbPath = databasePath
    if (dbPath !== ':memory:') {
      try {
        mkdirSync(dirname(dbPath), { recursive: true })
      } catch {
        dbPath = ':memory:'
      }
    }
    this.db = new Database(dbPath)
  }

  initialize() {
    if (this.initialized) return

    // Create trace links table
    const createTableSql = `
      CREATE TABLE IF NOT EXISTS trace_links (
        id TEXT PRIMARY KEY,
        version TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        source TEXT NOT NULL,
        source_id TEXT NOT NULL,
        source_type TEXT NOT NULL,
        target_id TEXT NOT NULL,
        target_type TEXT NOT NULL,
        relationship_type TEXT NOT NULL,
        confidence TEXT NOT NULL,
        description TEXT
      )
    `
    
    // Create indexes for faster queries
    const createIndexSourceSql = `
      CREATE INDEX IF NOT EXISTS idx_trace_links_source ON trace_links (source_type, source_id)
    `
    
    const createIndexTargetSql = `
      CREATE INDEX IF NOT EXISTS idx_trace_links_target ON trace_links (target_type, target_id)
    `

    this.db.exec(createTableSql)
    this.db.exec(createIndexSourceSql)
    this.db.exec(createIndexTargetSql)
    this.initialized = true
  }

  insert(traceLink: TraceLink): TraceLink {
    const { 
      id, 
      version, 
      createdAt, 
      updatedAt, 
      source,
      sourceId,
      sourceType,
      targetId,
      targetType,
      relationshipType,
      confidence,
      description
    } = traceLink

    const stmt = this.db.prepare(`
      INSERT INTO trace_links (
        id, version, created_at, updated_at, source, 
        source_id, source_type, target_id, target_type, 
        relationship_type, confidence, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run(
      id,
      version,
      new Date(createdAt).toISOString(),
      new Date(updatedAt).toISOString(),
      source,
      sourceId,
      sourceType,
      targetId,
      targetType,
      relationshipType,
      confidence,
      description || null
    )

    return traceLink
  }

  findById(id: string): TraceLink | undefined {
    const stmt = this.db.prepare(`
      SELECT * FROM trace_links WHERE id = ?
    `)
    
    const row = stmt.get() as any
    if (!row) return undefined

    return this.mapRowToTraceLink(row)
  }

  findAll(): TraceLink[] {
    const stmt = this.db.prepare(`SELECT * FROM trace_links ORDER BY updated_at DESC`)
    const rows = stmt.all() as any[]
    
    return rows.map(row => this.mapRowToTraceLink(row))
  }

  findBySource(sourceType: string, sourceId: string): TraceLink[] {
    const stmt = this.db.prepare(`
      SELECT * FROM trace_links 
      WHERE source_type = ? AND source_id = ?
      ORDER BY updated_at DESC
    `)
    
    const rows = stmt.all(sourceType, sourceId) as any[]
    return rows.map(row => this.mapRowToTraceLink(row))
  }

  findByTarget(targetType: string, targetId: string): TraceLink[] {
    const stmt = this.db.prepare(`
      SELECT * FROM trace_links 
      WHERE target_type = ? AND target_id = ?
      ORDER BY updated_at DESC
    `)
    
    const rows = stmt.all(targetType, targetId) as any[]
    return rows.map(row => this.mapRowToTraceLink(row))
  }

  update(id: string, updates: Partial<TraceLink>): TraceLink | undefined {
    const existing = this.findById(id)
    if (!existing) return undefined

    const { 
      version,
      createdAt,
      updatedAt,
      source,
      sourceId,
      sourceType,
      targetId,
      targetType,
      relationshipType,
      confidence,
      description
    } = {
      ...existing,
      ...updates,
      version: '1.1',
      updatedAt: new Date().toISOString(), // Always update timestamp
    }

    const stmt = this.db.prepare(`
      UPDATE trace_links SET 
        version = ?,
        updated_at = ?,
        source = ?,
        source_id = ?,
        source_type = ?,
        target_id = ?,
        target_type = ?,
        relationship_type = ?,
        confidence = ?,
        description = ?
      WHERE id = ?
    `)

    const result = stmt.run(
      version,
      updatedAt,
      source,
      sourceId,
      sourceType,
      targetId,
      targetType,
      relationshipType,
      confidence,
      description || null,
      id
    )

    if (result.changes === 0) return undefined

    return {
      ...existing,
      ...updates,
      version: '1.1',
      updatedAt,
    }
  }

  delete(id: string): boolean {
    const stmt = this.db.prepare(`DELETE FROM trace_links WHERE id = ?`)
    const result = stmt.run(id)
    return result.changes > 0
  }

  clear() {
    this.db.exec('DELETE FROM trace_links')
  }

  private mapRowToTraceLink(row: any): TraceLink {
    return {
      id: row.id,
      version: row.version,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      source: row.source,
      sourceId: row.source_id,
      sourceType: row.source_type,
      targetId: row.target_id,
      targetType: row.target_type,
      relationshipType: row.relationship_type,
      confidence: row.confidence,
      description: row.description
    }
  }

  close() {
    this.db.close()
  }
}

// Singleton instance
let databaseInstance: TraceLinkDatabase | null = null

export function getTraceLinkDatabase(databasePath?: string): TraceLinkDatabase {
  if (!databaseInstance) {
    databaseInstance = new TraceLinkDatabase(databasePath)
    databaseInstance.initialize()
  }
  return databaseInstance
}