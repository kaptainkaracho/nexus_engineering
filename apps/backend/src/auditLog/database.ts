import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import type { AuditLog, AuditLogFilter, AuditAction } from '@nexus-engineering/shared'
import Database from 'better-sqlite3'

export const DEFAULT_AUDIT_DB_PATH = process.env.DATABASE_PATH
  ? `${process.env.DATABASE_PATH}.audit`
  : ':memory:'

export class AuditLogDatabase {
  private db: Database.Database
  private initialized = false

  constructor(databasePath: string = DEFAULT_AUDIT_DB_PATH) {
    if (databasePath !== ':memory:') mkdirSync(dirname(databasePath), { recursive: true })
    this.db = new Database(databasePath)
    this.db.pragma('journal_mode = WAL')
    this.db.pragma('foreign_keys = ON')
  }

  initialize() {
    if (this.initialized) return

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        user_id TEXT NOT NULL,
        user_email TEXT NOT NULL,
        action TEXT NOT NULL,
        resource_type TEXT NOT NULL,
        resource_id TEXT,
        details TEXT,
        ip_address TEXT
      )
    `)

    this.db.exec('CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs (timestamp)')
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_audit_user_id ON audit_logs (user_id)')
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs (action)')
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_audit_resource_type ON audit_logs (resource_type)')

    this.initialized = true
  }

  insert(entry: AuditLog): AuditLog {
    const stmt = this.db.prepare(`
      INSERT INTO audit_logs (id, timestamp, user_id, user_email, action, resource_type, resource_id, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run(
      entry.id,
      entry.timestamp,
      entry.userId,
      entry.userEmail,
      entry.action,
      entry.resourceType,
      entry.resourceId || null,
      entry.details || null,
      entry.ipAddress || null
    )

    return entry
  }

  findById(id: string): AuditLog | undefined {
    const row = this.db.prepare('SELECT * FROM audit_logs WHERE id = ?').get(id) as any
    return row ? this.mapRow(row) : undefined
  }

  findAll(filter: AuditLogFilter): { entries: AuditLog[]; total: number } {
    const conditions: string[] = []
    const params: any[] = []

    if (filter.startDate) {
      conditions.push('timestamp >= ?')
      params.push(filter.startDate)
    }
    if (filter.endDate) {
      conditions.push('timestamp <= ?')
      params.push(filter.endDate)
    }
    if (filter.userId) {
      conditions.push('user_id = ?')
      params.push(filter.userId)
    }
    if (filter.action) {
      conditions.push('action = ?')
      params.push(filter.action)
    }
    if (filter.resourceType) {
      conditions.push('resource_type = ?')
      params.push(filter.resourceType)
    }
    if (filter.search) {
      conditions.push('(user_email LIKE ? OR resource_id LIKE ? OR details LIKE ?)')
      const q = `%${filter.search}%`
      params.push(q, q, q)
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const countRow = this.db.prepare(`SELECT COUNT(*) as count FROM audit_logs ${where}`).get(...params) as any
    const total = countRow.count

    const limit = Math.min(Math.max(1, filter.limit || 50), 1000)
    const offset = Math.max(0, filter.offset || 0)

    const rows = this.db.prepare(
      `SELECT * FROM audit_logs ${where} ORDER BY timestamp DESC LIMIT ? OFFSET ?`
    ).all(...params, limit, offset) as any[]

    return {
      entries: rows.map(row => this.mapRow(row)),
      total,
    }
  }

  clear() {
    this.db.exec('DELETE FROM audit_logs')
  }

  private mapRow(row: any): AuditLog {
    return {
      id: row.id,
      timestamp: row.timestamp,
      userId: row.user_id,
      userEmail: row.user_email,
      action: row.action as AuditAction,
      resourceType: row.resource_type,
      resourceId: row.resource_id || '',
      details: row.details || null,
      ipAddress: row.ip_address || null,
    }
  }

  close() {
    this.db.close()
  }
}

let databaseInstance: AuditLogDatabase | null = null

export function getAuditLogDatabase(databasePath?: string): AuditLogDatabase {
  if (!databaseInstance) {
    databaseInstance = new AuditLogDatabase(databasePath)
    databaseInstance.initialize()
  }
  return databaseInstance
}
