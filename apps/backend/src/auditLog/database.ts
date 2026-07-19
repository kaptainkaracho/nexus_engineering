import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import type { AuditLog, AuditLogFilter, AuditAction, AuditLogRetentionConfig } from '@nexus-engineering/shared'
import Database from 'better-sqlite3'

export const DEFAULT_AUDIT_DB_PATH = process.env.DATABASE_PATH
  ? `${process.env.DATABASE_PATH}.audit`
  : ':memory:'

export const DEFAULT_RETENTION_TTL_DAYS = 90

export class AuditLogDatabase {
  private db: Database.Database
  private initialized = false
  private retentionConfig: AuditLogRetentionConfig = { ttlDays: DEFAULT_RETENTION_TTL_DAYS, enabled: true }

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
        ip_address TEXT,
        org_id TEXT
      )
    `)

    this.db.exec('CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs (timestamp)')
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_audit_user_id ON audit_logs (user_id)')
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs (action)')
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_audit_resource_type ON audit_logs (resource_type)')
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_audit_org_id ON audit_logs (org_id)')

    try { this.db.exec(`ALTER TABLE audit_logs ADD COLUMN org_id TEXT`) } catch {}

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS audit_retention_config (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        ttl_days INTEGER NOT NULL DEFAULT ${DEFAULT_RETENTION_TTL_DAYS},
        enabled INTEGER NOT NULL DEFAULT 1,
        updated_at TEXT NOT NULL
      )
    `)

    this.db.exec(`
      INSERT OR IGNORE INTO audit_retention_config (id, ttl_days, enabled, updated_at)
      VALUES (1, ${DEFAULT_RETENTION_TTL_DAYS}, 1, ?)
    `, [new Date().toISOString()])

    this._loadRetentionConfig()

    this.initialized = true
  }

  private _loadRetentionConfig(): void {
    const row = this.db.prepare('SELECT * FROM audit_retention_config WHERE id = 1').get() as any
    if (row) {
      this.retentionConfig = { ttlDays: row.ttl_days, enabled: row.enabled === 1 }
    }
  }

  insert(entry: AuditLog): AuditLog {
    const stmt = this.db.prepare(`
      INSERT INTO audit_logs (id, timestamp, user_id, user_email, action, resource_type, resource_id, details, ip_address, org_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      entry.ipAddress || null,
      entry.orgId || null,
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
    if (filter.orgId) {
      conditions.push('org_id = ?')
      params.push(filter.orgId)
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const countRow = this.db.prepare(`SELECT COUNT(*) as count FROM audit_logs ${where}`).get(...params) as any
    const total = countRow.count

    let page = filter.page ?? 0
    let limit = filter.limit ?? 50
    limit = Math.min(Math.max(1, limit), 1000)

    let offset = filter.offset ?? 0
    if (page > 0 && !filter.offset && filter.offset !== 0) {
      offset = (page - 1) * limit
    }
    offset = Math.max(0, offset)

    const rows = this.db.prepare(
      `SELECT * FROM audit_logs ${where} ORDER BY timestamp DESC LIMIT ? OFFSET ?`
    ).all(...params, limit, offset) as any[]

    return {
      entries: rows.map(row => this.mapRow(row)),
      total,
    }
  }

  purgeOldEntries(): number {
    if (!this.retentionConfig.enabled) return 0
    const cutoff = new Date(Date.now() - this.retentionConfig.ttlDays * 24 * 60 * 60 * 1000).toISOString()
    const result = this.db.prepare('DELETE FROM audit_logs WHERE timestamp < ?').run(cutoff)
    return result.changes
  }

  getRetentionConfig(): AuditLogRetentionConfig {
    return { ...this.retentionConfig }
  }

  setRetentionConfig(config: Partial<AuditLogRetentionConfig>): AuditLogRetentionConfig {
    if (config.ttlDays !== undefined) {
      this.retentionConfig.ttlDays = Math.max(1, config.ttlDays)
    }
    if (config.enabled !== undefined) {
      this.retentionConfig.enabled = config.enabled
    }
    this.db.prepare(`
      UPDATE audit_retention_config SET ttl_days = ?, enabled = ?, updated_at = ? WHERE id = 1
    `).run(this.retentionConfig.ttlDays, this.retentionConfig.enabled ? 1 : 0, new Date().toISOString())
    return this.getRetentionConfig()
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
      orgId: row.org_id || null,
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
