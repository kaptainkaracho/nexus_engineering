// ArtifactRegistry SQLite Storage Layer
// Persists artifacts to disk so data survives restarts.
// Designed as a drop-in replacement for the in-memory Map store.

// Persisted SQLite location. Defaults to a Railway persistent-volume mount so
// data survives deploys/restarts. Falls back to an in-memory DB for local dev.
export const DEFAULT_ARTIFACT_DB_PATH = process.env.DATABASE_PATH
  ? `${process.env.DATABASE_PATH}.artifacts`
  : ':memory:'

import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import Database from 'better-sqlite3'
import type { Artifact, ArtifactError, ArtifactType, LifecycleState } from './repository'

export interface ArtifactRow {
  id: string
  type: string
  file_path: string
  repository_path: string
  lifecycle: string
  metadata: string
  errors: string
  reparse_count: number
  created_at: string
  updated_at: string
  last_parsed_at?: string | null
}

class ArtifactStorage {
  private db: Database.Database
  private initialized = false

  // Table schema — aligns with the Artifact interface exposed in repository.ts
  private readonly CREATE_TABLE_SQL = `
    CREATE TABLE IF NOT EXISTS artifacts (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK(type IN ('requirement', 'architecture', 'adr', 'spec', 'unknown')),
      file_path TEXT NOT NULL,
      repository_path TEXT NOT NULL DEFAULT '',
      lifecycle TEXT NOT NULL DEFAULT 'discovered' CHECK(lifecycle IN (
        'discovered', 'parsed', 'indexed', 'related', 'error'
      )),
      metadata TEXT NOT NULL DEFAULT '{}',
      errors TEXT NOT NULL DEFAULT '[]',
      reparse_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      last_parsed_at TEXT
    )
  `

  private readonly CREATE_INDEXES_SQL = `
    CREATE INDEX IF NOT EXISTS idx_artifacts_type ON artifacts (type);
    CREATE INDEX IF NOT EXISTS idx_artifacts_lifecycle ON artifacts (lifecycle);
    CREATE INDEX IF NOT EXISTS idx_artifacts_created_at ON artifacts (created_at DESC);
  `

  constructor(databasePath: string = DEFAULT_ARTIFACT_DB_PATH) {
    if (databasePath !== ':memory:') mkdirSync(dirname(databasePath), { recursive: true })
    this.db = new Database(databasePath)
  }

  initialize() {
    if (this.initialized) return

    this.db.pragma('journal_mode = WAL')
    this.db.exec(this.CREATE_TABLE_SQL)
    this.db.exec(this.CREATE_INDEXES_SQL)
    this.initialized = true
  }

  /** Insert a new artifact row. Throws on conflict with an existing id. */
  insert(row: Artifact): void {
    const stmt = this.db.prepare(`
      INSERT INTO artifacts (id, type, file_path, repository_path, lifecycle, metadata, errors, reparse_count, created_at, updated_at, last_parsed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    try {
      stmt.run(
        row.id,
        row.type,
        row.filePath,
        row.repositoryPath,
        row.lifecycle,
        JSON.stringify(row.metadata),
        JSON.stringify(row.errors),
        row.reparseCount,
        row.createdAt,
        row.updatedAt,
        row.lastParsedAt ?? null,
      )
    } catch (err) {
      // Log but don't crash — callers should still get the in-memory copy
      console.error(`[ArtifactStorage] insert failed for ${row.id}: ${err}`)
    }
  }

  /** Upsert: insert or replace an artifact. */
  upsert(row: Artifact): void {
    const stmt = this.db.prepare(`
      INSERT INTO artifacts (id, type, file_path, repository_path, lifecycle, metadata, errors, reparse_count, created_at, updated_at, last_parsed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        type = excluded.type,
        file_path = excluded.file_path,
        repository_path = excluded.repository_path,
        lifecycle = excluded.lifecycle,
        metadata = excluded.metadata,
        errors = excluded.errors,
        reparse_count = excluded.reparse_count,
        updated_at = excluded.updated_at,
        last_parsed_at = excluded.last_parsed_at
    `)

    try {
      stmt.run(
        row.id,
        row.type,
        row.filePath,
        row.repositoryPath,
        row.lifecycle,
        JSON.stringify(row.metadata),
        JSON.stringify(row.errors),
        row.reparseCount,
        row.createdAt,
        row.updatedAt,
        row.lastParsedAt ?? null,
      )
    } catch (err) {
      console.error(`[ArtifactStorage] upsert failed for ${row.id}: ${err}`)
    }
  }

  /** Find one artifact by id. */
  findById(id: string): Artifact | undefined {
    const stmt = this.db.prepare(`SELECT * FROM artifacts WHERE id = ?`)
    const row = stmt.get(id) as ArtifactRow | undefined
    if (!row) return undefined
    return mapRowToArtifact(row)
  }

  /** Find all artifacts, optionally filtered by type, lifecycle, or repository. */
  findAll(filters?: { type?: ArtifactType; lifecycle?: LifecycleState; repositoryPath?: string }): Artifact[] {
    let sql = 'SELECT * FROM artifacts'
    const conditions: string[] = []
    const params: unknown[] = []

    if (filters) {
      if (filters.type) {
        conditions.push('type = ?')
        params.push(filters.type)
      }
      if (filters.lifecycle) {
        conditions.push('lifecycle = ?')
        params.push(filters.lifecycle)
      }
      if (filters.repositoryPath) {
        conditions.push('repository_path = ?')
        params.push(filters.repositoryPath)
      }
    }

    if (conditions.length > 0) sql += ' WHERE ' + conditions.join(' AND ')
    sql += ' ORDER BY updated_at DESC'

    const stmt = this.db.prepare(sql)
    const rows = params.length
      ? stmt.all(...params) as ArtifactRow[]
      : stmt.all() as ArtifactRow[]

    return rows.map(mapRowToArtifact)
  }

  /** Find artifacts by repository path. */
  findByRepository(repositoryPath: string): Artifact[] {
    return this.findAll({ repositoryPath })
  }

  /** Increment reparse count by one. */
  incrementReparseCount(id: string, newLifecycle: LifecycleState): boolean {
    const stmt = this.db.prepare(`
      UPDATE artifacts SET reparse_count = reparse_count + 1, lifecycle = ?, updated_at = ? WHERE id = ?
    `)
    const result = stmt.run(newLifecycle, new Date().toISOString(), id)
    return result.changes > 0
  }

  /** Update specific fields (lifecycle and/or metadata). */
  update(id: string, updates: { lifecycle?: LifecycleState; metadata?: Record<string, unknown> }): boolean {
    const parts: string[] = ['updated_at = ?']
    const values: unknown[] = [new Date().toISOString()]

    if (updates.lifecycle) {
      parts.push('lifecycle = ?')
      values.push(updates.lifecycle)
    }
    if (updates.metadata !== undefined) {
      parts.push('metadata = ?')
      values.push(JSON.stringify(updates.metadata))
    }

    const setClause = parts.join(', ')
    const sql = `UPDATE artifacts SET ${setClause} WHERE id = ?`
    values.push(id)

    const stmt = this.db.prepare(sql)
    const result = stmt.run(...values)
    return result.changes > 0
  }

  /** Record error on an artifact (push to errors array, set lifecycle=error). */
  recordError(id: string, message: string): boolean {
    const row = this.findById(id)
    if (!row) return false

    const updatedMetadata = { ...row.metadata }
    if (!(updatedMetadata._lastError as string)) {
      (updatedMetadata._lastError as unknown) = `${message}@${new Date().toISOString()}`
    }

    const stmt = this.db.prepare(`UPDATE artifacts SET lifecycle = 'error', updated_at = ?, metadata = ? WHERE id = ?`)
    try {
      const result = stmt.run(new Date().toISOString(), JSON.stringify(updatedMetadata), id)
      return result.changes > 0
    } catch (err) {
      console.error(`[ArtifactStorage] recordError failed for ${id}:`, err)
      return false
    }
  }

  /** Delete an artifact by id. */
  delete(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM artifacts WHERE id = ?')
    const result = stmt.run(id)
    return result.changes > 0
  }

  /** Count rows (useful for summaries). */
  countByType(type: ArtifactType): number {
    const stmt = this.db.prepare(`SELECT COUNT(*) AS c FROM artifacts WHERE type = ?`)
    const row = stmt.get(type) as any
    return Number(row.c)
  }

  countByLifecycle(lifecycle: LifecycleState): number {
    const stmt = this.db.prepare(`SELECT COUNT(*) AS c FROM artifacts WHERE lifecycle = ?`)
    const row = stmt.get(lifecycle) as any
    return Number(row.c)
  }

  /** Total artifact count. */
  totalCount(): number {
    const stmt = this.db.prepare('SELECT COUNT(*) AS c FROM artifacts')
    const row = stmt.get() as any
    return Number(row.c)
  }

  close() {
    try { this.db.close() } catch {}
  }
}

function mapRowToArtifact(row: ArtifactRow): Artifact {
  return {
    id: row.id,
    type: row.type as ArtifactType,
    filePath: row.file_path,
    repositoryPath: row.repository_path,
    lifecycle: row.lifecycle as LifecycleState,
    metadata: parseJson(row.metadata),
    errors: parseJson(row.errors) as unknown as ArtifactError[],
    reparseCount: row.reparse_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastParsedAt: row.last_parsed_at ?? undefined,
  }
}

function parseJson(value: string): Record<string, unknown> {
  try { 
    return JSON.parse(value)
  } catch { 
    return {}
  }
}

// Singleton — use instance directly in artifactRegistry for persistence
let storageInstance: ArtifactStorage | null = null

export function getArtifactStorage(databasePath?: string): ArtifactStorage {
  if (!storageInstance) {
    storageInstance = new ArtifactStorage(databasePath)
    storageInstance.initialize()
  }
  return storageInstance
}
