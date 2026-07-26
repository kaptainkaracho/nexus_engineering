import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import Database from 'better-sqlite3'

export type ReportType = 'coverage' | 'traceability' | 'audit' | 'gap_analysis' | 'soc2' | 'full'
export type ReportFormat = 'json' | 'csv' | 'pdf'
export type ReportStatus = 'generating' | 'completed' | 'failed'

export interface ComplianceReportRow {
  id: string
  title: string
  report_type: ReportType
  format: ReportFormat
  status: ReportStatus
  config: string
  summary: string | null
  file_path: string | null
  error_message: string | null
  created_by: string
  org_id: string | null
  created_at: string
  completed_at: string | null
}

export type Soc2Category =
  | 'CC1' | 'CC2' | 'CC3' | 'CC4' | 'CC5'
  | 'CC6' | 'CC7' | 'CC8' | 'CC9'
  | 'A1' | 'A2' | 'C1' | 'PI1' | 'P1' | 'P2' | 'P3' | 'P4'

export const SOC2_CATEGORIES: Soc2Category[] = [
  'CC1', 'CC2', 'CC3', 'CC4', 'CC5',
  'CC6', 'CC7', 'CC8', 'CC9',
  'A1', 'A2', 'C1', 'PI1',
  'P1', 'P2', 'P3', 'P4',
]

export const SOC2_CATEGORY_LABELS: Record<Soc2Category, string> = {
  CC1: 'Control Environment',
  CC2: 'Communication and Information',
  CC3: 'Risk Assessment',
  CC4: 'Monitoring Activities',
  CC5: 'Control Activities',
  CC6: 'Logical and Physical Access',
  CC7: 'System Operations',
  CC8: 'Change Management',
  CC9: 'Risk Mitigation',
  A1: 'Availability — Capacity Management',
  A2: 'Availability — Disaster Recovery',
  C1: 'Confidentiality — Protection',
  PI1: 'Processing Integrity — Accuracy',
  P1: 'Privacy — Notice and Communication',
  P2: 'Privacy — Choice and Consent',
  P3: 'Privacy — Data Minimization',
  P4: 'Privacy — Data Quality and Retention',
}

export interface Soc2ControlMapping {
  id: string
  category: Soc2Category
  artifact_id: string
  artifact_type: string
  notes: string | null
  evidence_path: string | null
  status: 'compliant' | 'non_compliant' | 'not_assessed'
  created_by: string
  created_at: string
  updated_at: string
}

export interface AggregationResult {
  summary: {
    totalNodes: number
    totalEdges: number
    nodesByType: Record<string, number>
    edgesByRelationship: Record<string, number>
  }
  coverage: {
    overallCoveragePercent: number
    axes: Array<{ axis: string; total: number; linked: number; percent: number }>
  }
  artifacts: {
    total: number
    byType: Record<string, number>
    byLifecycle: Record<string, number>
  }
  audit: {
    totalEntries: number
    byAction: Record<string, number>
    recentActivity: number
  }
  gaps: Array<{ type: string; count: number; severity: string }>
  soc2: {
    totalMappings: number
    coveragePercent: number
    byCategory: Record<string, { total: number; compliant: number; nonCompliant: number; notAssessed: number }>
    byStatus: Record<string, number>
  }
}

export const DEFAULT_COMPLIANCE_DB_PATH = process.env.DATABASE_PATH
  ? `${process.env.DATABASE_PATH}.compliance`
  : ':memory:'

class ComplianceReportDatabase {
  private db: Database.Database
  private initialized = false

  constructor(databasePath: string = DEFAULT_COMPLIANCE_DB_PATH) {
    if (databasePath !== ':memory:') mkdirSync(dirname(databasePath), { recursive: true })
    this.db = new Database(databasePath)
    this.db.pragma('journal_mode = WAL')
  }

  initialize() {
    if (this.initialized) return

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS compliance_reports (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        report_type TEXT NOT NULL CHECK(report_type IN ('coverage','traceability','audit','gap_analysis','soc2','full')),
        format TEXT NOT NULL CHECK(format IN ('json','csv','pdf')),
        status TEXT NOT NULL DEFAULT 'generating' CHECK(status IN ('generating','completed','failed')),
        config TEXT NOT NULL DEFAULT '{}',
        summary TEXT,
        file_path TEXT,
        error_message TEXT,
        created_by TEXT NOT NULL,
        org_id TEXT,
        created_at TEXT NOT NULL,
        completed_at TEXT
      )
    `)

    this.db.exec('CREATE INDEX IF NOT EXISTS idx_compliance_reports_type ON compliance_reports (report_type)')
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_compliance_reports_status ON compliance_reports (status)')
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_compliance_reports_created_at ON compliance_reports (created_at DESC)')
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_compliance_reports_org ON compliance_reports (org_id)')

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS soc2_control_mappings (
        id TEXT PRIMARY KEY,
        category TEXT NOT NULL,
        artifact_id TEXT NOT NULL,
        artifact_type TEXT NOT NULL,
        notes TEXT,
        evidence_path TEXT,
        status TEXT NOT NULL DEFAULT 'not_assessed' CHECK(status IN ('compliant','non_compliant','not_assessed')),
        created_by TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `)

    this.db.exec('CREATE INDEX IF NOT EXISTS idx_soc2_category ON soc2_control_mappings (category)')
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_soc2_artifact ON soc2_control_mappings (artifact_id)')
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_soc2_status ON soc2_control_mappings (status)')

    this.initialized = true
  }

  insert(report: ComplianceReportRow): ComplianceReportRow {
    const stmt = this.db.prepare(`
      INSERT INTO compliance_reports (id, title, report_type, format, status, config, summary, file_path, error_message, created_by, org_id, created_at, completed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    stmt.run(
      report.id,
      report.title,
      report.report_type,
      report.format,
      report.status,
      report.config,
      report.summary ?? null,
      report.file_path ?? null,
      report.error_message ?? null,
      report.created_by,
      report.org_id ?? null,
      report.created_at,
      report.completed_at ?? null,
    )
    return report
  }

  findById(id: string): ComplianceReportRow | undefined {
    const row = this.db.prepare('SELECT * FROM compliance_reports WHERE id = ?').get(id) as ComplianceReportRow | undefined
    return row
  }

  findAll(filters?: { orgId?: string; reportType?: ReportType; limit?: number; offset?: number }): { items: ComplianceReportRow[]; total: number } {
    const conditions: string[] = []
    const params: unknown[] = []

    if (filters?.orgId) {
      conditions.push('org_id = ?')
      params.push(filters.orgId)
    }
    if (filters?.reportType) {
      conditions.push('report_type = ?')
      params.push(filters.reportType)
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const limit = Math.min(Math.max(1, filters?.limit ?? 50), 200)
    const offset = Math.max(0, filters?.offset ?? 0)

    const countRow = this.db.prepare(`SELECT COUNT(*) as count FROM compliance_reports ${where}`).get(...params) as any
    const total = countRow.count

    const rows = this.db.prepare(
      `SELECT * FROM compliance_reports ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    ).all(...params, limit, offset) as ComplianceReportRow[]

    return { items: rows, total }
  }

  updateStatus(id: string, status: ReportStatus, extra?: { summary?: string; filePath?: string; errorMessage?: string }): boolean {
    const parts: string[] = ['status = ?']
    const values: unknown[] = [status]

    if (extra?.summary !== undefined) {
      parts.push('summary = ?')
      values.push(extra.summary)
    }
    if (extra?.filePath !== undefined) {
      parts.push('file_path = ?')
      values.push(extra.filePath)
    }
    if (extra?.errorMessage !== undefined) {
      parts.push('error_message = ?')
      values.push(extra.errorMessage)
    }
    if (status === 'completed' || status === 'failed') {
      parts.push('completed_at = ?')
      values.push(new Date().toISOString())
    }

    const setClause = parts.join(', ')
    values.push(id)
    const result = this.db.prepare(`UPDATE compliance_reports SET ${setClause} WHERE id = ?`).run(...values)
    return result.changes > 0
  }

  delete(id: string): boolean {
    const result = this.db.prepare('DELETE FROM compliance_reports WHERE id = ?').run(id)
    return result.changes > 0
  }

  insertSoc2Mapping(mapping: Soc2ControlMapping): Soc2ControlMapping {
    this.db.prepare(`
      INSERT INTO soc2_control_mappings (id, category, artifact_id, artifact_type, notes, evidence_path, status, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      mapping.id, mapping.category, mapping.artifact_id, mapping.artifact_type,
      mapping.notes ?? null, mapping.evidence_path ?? null,
      mapping.status, mapping.created_by, mapping.created_at, mapping.updated_at,
    )
    return mapping
  }

  findSoc2Mapping(id: string): Soc2ControlMapping | undefined {
    return this.db.prepare('SELECT * FROM soc2_control_mappings WHERE id = ?').get(id) as Soc2ControlMapping | undefined
  }

  findAllSoc2Mappings(filters?: { category?: Soc2Category; status?: string; limit?: number; offset?: number }): { items: Soc2ControlMapping[]; total: number } {
    const conditions: string[] = []
    const params: unknown[] = []
    if (filters?.category) { conditions.push('category = ?'); params.push(filters.category) }
    if (filters?.status) { conditions.push('status = ?'); params.push(filters.status) }
    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const limit = Math.min(Math.max(1, filters?.limit ?? 200), 1000)
    const offset = Math.max(0, filters?.offset ?? 0)
    const total = (this.db.prepare(`SELECT COUNT(*) as count FROM soc2_control_mappings ${where}`).get(...params) as any).count
    const rows = this.db.prepare(`SELECT * FROM soc2_control_mappings ${where} ORDER BY category, artifact_id LIMIT ? OFFSET ?`).all(...params, limit, offset) as Soc2ControlMapping[]
    return { items: rows, total }
  }

  updateSoc2Mapping(id: string, updates: Partial<Pick<Soc2ControlMapping, 'status' | 'notes' | 'evidence_path'>>): boolean {
    const parts: string[] = ['updated_at = ?']
    const values: unknown[] = [new Date().toISOString()]
    if (updates.status !== undefined) { parts.push('status = ?'); values.push(updates.status) }
    if (updates.notes !== undefined) { parts.push('notes = ?'); values.push(updates.notes) }
    if (updates.evidence_path !== undefined) { parts.push('evidence_path = ?'); values.push(updates.evidence_path) }
    values.push(id)
    return this.db.prepare(`UPDATE soc2_control_mappings SET ${parts.join(', ')} WHERE id = ?`).run(...values).changes > 0
  }

  deleteSoc2Mapping(id: string): boolean {
    return this.db.prepare('DELETE FROM soc2_control_mappings WHERE id = ?').run(id).changes > 0
  }

  getSoc2Aggregation(): { byCategory: Record<string, { total: number; compliant: number; nonCompliant: number; notAssessed: number }>; byStatus: Record<string, number>; totalMappings: number } {
    const rows = this.db.prepare('SELECT category, status, COUNT(*) as cnt FROM soc2_control_mappings GROUP BY category, status').all() as Array<{ category: string; status: string; cnt: number }>
    const byCategory: Record<string, { total: number; compliant: number; nonCompliant: number; notAssessed: number }> = {}
    const byStatus: Record<string, number> = {}
    let totalMappings = 0
    for (const r of rows) {
      if (!byCategory[r.category]) byCategory[r.category] = { total: 0, compliant: 0, nonCompliant: 0, notAssessed: 0 }
      byCategory[r.category].total += r.cnt
      byCategory[r.category][r.status as keyof typeof byCategory[string]] += r.cnt
      byStatus[r.status] = (byStatus[r.status] || 0) + r.cnt
      totalMappings += r.cnt
    }
    return { byCategory, byStatus, totalMappings }
  }

  clearAll() {
    this.db.exec('DELETE FROM compliance_reports')
    this.db.exec('DELETE FROM soc2_control_mappings')
  }

  close() {
    try { this.db.close() } catch {}
  }
}

let databaseInstance: ComplianceReportDatabase | null = null

export function getComplianceDatabase(databasePath?: string): ComplianceReportDatabase {
  if (!databaseInstance) {
    databaseInstance = new ComplianceReportDatabase(databasePath)
    databaseInstance.initialize()
  }
  return databaseInstance
}

export function resetComplianceDatabase() {
  if (databaseInstance) {
    databaseInstance.close()
    databaseInstance = null
  }
}

export const complianceDb = getComplianceDatabase
