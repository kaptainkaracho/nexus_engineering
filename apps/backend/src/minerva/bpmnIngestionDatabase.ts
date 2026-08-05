import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import Database from 'better-sqlite3'

export const DEFAULT_BPMN_DB_PATH = process.env.BPMN_DB_PATH
  ? `${process.env.BPMN_DB_PATH}.bpmn`
  : ':memory:'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BpmnIngestionEventRow {
  id: string
  ingestionRunId: string
  caseId: string
  activity: string
  recoveryType: string | null
  classificationConfidence: number
  classificationReason: string
  rawPayload: string
  receivedAt: string
}

export interface BpmnIngestionRunRow {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  runsFetched: number
  runsClassified: number
  recoveryEvents: number
  reworkEvents: number
  interventionEvents: number
  eventsPushed: number
  minervaRunId: string | null
  errorMessage: string | null
  startedAt: string
  completedAt: string | null
}

// ---------------------------------------------------------------------------
// Database class
// ---------------------------------------------------------------------------

export class BpmnIngestionDatabase {
  private db: Database.Database
  private initialized = false

  constructor(databasePath: string = DEFAULT_BPMN_DB_PATH) {
    let dbPath = databasePath
    if (dbPath !== ':memory:') {
      try {
        mkdirSync(dirname(dbPath), { recursive: true })
      } catch {
        dbPath = ':memory:'
      }
    }
    this.db = new Database(dbPath)
    this.db.pragma('journal_mode = WAL')
    this.db.pragma('foreign_keys = ON')
  }

  initialize() {
    if (this.initialized) return

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS bpmn_ingestion_runs (
        id TEXT PRIMARY KEY,
        status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'completed', 'failed')),
        runs_fetched INTEGER NOT NULL DEFAULT 0,
        runs_classified INTEGER NOT NULL DEFAULT 0,
        recovery_events INTEGER NOT NULL DEFAULT 0,
        rework_events INTEGER NOT NULL DEFAULT 0,
        intervention_events INTEGER NOT NULL DEFAULT 0,
        events_pushed INTEGER NOT NULL DEFAULT 0,
        minerva_run_id TEXT,
        error_message TEXT,
        started_at TEXT NOT NULL,
        completed_at TEXT
      )
    `)

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS bpmn_ingestion_events (
        id TEXT PRIMARY KEY,
        ingestion_run_id TEXT NOT NULL,
        case_id TEXT NOT NULL,
        activity TEXT NOT NULL,
        recovery_type TEXT,
        classification_confidence REAL NOT NULL,
        classification_reason TEXT NOT NULL,
        raw_payload TEXT NOT NULL,
        received_at TEXT NOT NULL,
        FOREIGN KEY (ingestion_run_id) REFERENCES bpmn_ingestion_runs(id) ON DELETE CASCADE
      )
    `)

    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_bpmn_events_run ON bpmn_ingestion_events (ingestion_run_id)`)
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_bpmn_events_case ON bpmn_ingestion_events (case_id)`)
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_bpmn_events_recovery_type ON bpmn_ingestion_events (recovery_type)`)
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_bpmn_runs_status ON bpmn_ingestion_runs (status)`)
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_bpmn_runs_started ON bpmn_ingestion_runs (started_at DESC)`)

    this.initialized = true
  }

  // ---------------------------------------------------------------------------
  // Run operations
  // ---------------------------------------------------------------------------

  createRun(run: {
    id: string
    runsFetched?: number
    runsClassified?: number
    recoveryEvents?: number
    reworkEvents?: number
    interventionEvents?: number
    eventsPushed?: number
    minervaRunId?: string | null
    errorMessage?: string | null
  }): BpmnIngestionRunRow {
    const now = new Date().toISOString()
    const stmt = this.db.prepare(`
      INSERT INTO bpmn_ingestion_runs (
        id, status, runs_fetched, runs_classified,
        recovery_events, rework_events, intervention_events, events_pushed,
        minerva_run_id, error_message, started_at, completed_at
      ) VALUES (?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
    `)
    stmt.run(
      run.id,
      run.runsFetched ?? 0,
      run.runsClassified ?? 0,
      run.recoveryEvents ?? 0,
      run.reworkEvents ?? 0,
      run.interventionEvents ?? 0,
      run.eventsPushed ?? 0,
      run.minervaRunId ?? null,
      run.errorMessage ?? null,
      now,
    )
    return this.findRunById(run.id)!
  }

  findRunById(id: string): BpmnIngestionRunRow | undefined {
    const row = this.db.prepare(
      'SELECT * FROM bpmn_ingestion_runs WHERE id = ?',
    ).get(id) as Record<string, unknown> | undefined
    if (!row) return undefined
    return {
      id: row.id as string,
      status: row.status as BpmnIngestionRunRow['status'],
      runsFetched: (row.runs_fetched as number) ?? 0,
      runsClassified: (row.runs_classified as number) ?? 0,
      recoveryEvents: (row.recovery_events as number) ?? 0,
      reworkEvents: (row.rework_events as number) ?? 0,
      interventionEvents: (row.intervention_events as number) ?? 0,
      eventsPushed: (row.events_pushed as number) ?? 0,
      minervaRunId: (row.minerva_run_id as string | null) ?? null,
      errorMessage: (row.error_message as string | null) ?? null,
      startedAt: row.started_at as string,
      completedAt: (row.completed_at as string | null) ?? null,
    }
  }

  updateRunStatus(id: string, status: BpmnIngestionRunRow['status']): void {
    const now = status === 'completed' || status === 'failed'
      ? new Date().toISOString()
      : null
    const sql = now
      ? 'UPDATE bpmn_ingestion_runs SET status = ?, completed_at = ? WHERE id = ?'
      : 'UPDATE bpmn_ingestion_runs SET status = ? WHERE id = ?'
    if (now) {
      this.db.prepare(sql).run(status, now, id)
    } else {
      this.db.prepare(sql).run(status, id)
    }
  }

  updateRunMetrics(id: string, metrics: {
    runsFetched?: number
    runsClassified?: number
    recoveryEvents?: number
    reworkEvents?: number
    interventionEvents?: number
    eventsPushed?: number
    minervaRunId?: string | null
    errorMessage?: string | null
  }): void {
    const parts: string[] = []
    const values: unknown[] = []

    if (metrics.runsFetched !== undefined) {
      parts.push('runs_fetched = ?')
      values.push(metrics.runsFetched)
    }
    if (metrics.runsClassified !== undefined) {
      parts.push('runs_classified = ?')
      values.push(metrics.runsClassified)
    }
    if (metrics.recoveryEvents !== undefined) {
      parts.push('recovery_events = ?')
      values.push(metrics.recoveryEvents)
    }
    if (metrics.reworkEvents !== undefined) {
      parts.push('rework_events = ?')
      values.push(metrics.reworkEvents)
    }
    if (metrics.interventionEvents !== undefined) {
      parts.push('intervention_events = ?')
      values.push(metrics.interventionEvents)
    }
    if (metrics.eventsPushed !== undefined) {
      parts.push('events_pushed = ?')
      values.push(metrics.eventsPushed)
    }
    if (metrics.minervaRunId !== undefined) {
      parts.push('minerva_run_id = ?')
      values.push(metrics.minervaRunId)
    }
    if (metrics.errorMessage !== undefined) {
      parts.push('error_message = ?')
      values.push(metrics.errorMessage)
    }

    if (parts.length === 0) return

    const sql = `UPDATE bpmn_ingestion_runs SET ${parts.join(', ')} WHERE id = ?`
    values.push(id)
    this.db.prepare(sql).run(...values)
  }

  listRecentRuns(limit: number = 20): BpmnIngestionRunRow[] {
    const rows = this.db.prepare(
      'SELECT * FROM bpmn_ingestion_runs ORDER BY started_at DESC LIMIT ?',
    ).all(limit) as Record<string, unknown>[]
    return rows.map(row => ({
      id: row.id as string,
      status: row.status as BpmnIngestionRunRow['status'],
      runsFetched: (row.runs_fetched as number) ?? 0,
      runsClassified: (row.runs_classified as number) ?? 0,
      recoveryEvents: (row.recovery_events as number) ?? 0,
      reworkEvents: (row.rework_events as number) ?? 0,
      interventionEvents: (row.intervention_events as number) ?? 0,
      eventsPushed: (row.events_pushed as number) ?? 0,
      minervaRunId: (row.minerva_run_id as string | null) ?? null,
      errorMessage: (row.error_message as string | null) ?? null,
      startedAt: row.started_at as string,
      completedAt: (row.completed_at as string | null) ?? null,
    }))
  }

  // ---------------------------------------------------------------------------
  // Event operations
  // ---------------------------------------------------------------------------

  insertEvent(event: {
    id: string
    ingestionRunId: string
    caseId: string
    activity: string
    recoveryType: string | null
    classificationConfidence: number
    classificationReason: string
    rawPayload: string
  }): BpmnIngestionEventRow {
    const now = new Date().toISOString()
    const stmt = this.db.prepare(`
      INSERT INTO bpmn_ingestion_events (
        id, ingestion_run_id, case_id, activity,
        recovery_type, classification_confidence, classification_reason,
        raw_payload, received_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    stmt.run(
      event.id,
      event.ingestionRunId,
      event.caseId,
      event.activity,
      event.recoveryType,
      event.classificationConfidence,
      event.classificationReason,
      event.rawPayload,
      now,
    )
    return {
      id: event.id,
      ingestionRunId: event.ingestionRunId,
      caseId: event.caseId,
      activity: event.activity,
      recoveryType: event.recoveryType,
      classificationConfidence: event.classificationConfidence,
      classificationReason: event.classificationReason,
      rawPayload: event.rawPayload,
      receivedAt: now,
    }
  }

  insertEventsBatch(events: Array<{
    id: string
    ingestionRunId: string
    caseId: string
    activity: string
    recoveryType: string | null
    classificationConfidence: number
    classificationReason: string
    rawPayload: string
  }>): void {
    const now = new Date().toISOString()
    const stmt = this.db.prepare(`
      INSERT INTO bpmn_ingestion_events (
        id, ingestion_run_id, case_id, activity,
        recovery_type, classification_confidence, classification_reason,
        raw_payload, received_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const tx = this.db.transaction((batch: typeof events) => {
      for (const e of batch) {
        stmt.run(
          e.id, e.ingestionRunId, e.caseId, e.activity,
          e.recoveryType, e.classificationConfidence, e.classificationReason,
          e.rawPayload, now,
        )
      }
    })
    tx(events)
  }

  getEventsByRun(runId: string): BpmnIngestionEventRow[] {
    const rows = this.db.prepare(
      'SELECT * FROM bpmn_ingestion_events WHERE ingestion_run_id = ? ORDER BY received_at',
    ).all(runId) as Record<string, unknown>[]
    return rows.map(row => ({
      id: row.id as string,
      ingestionRunId: row.ingestion_run_id as string,
      caseId: row.case_id as string,
      activity: row.activity as string,
      recoveryType: (row.recovery_type as string | null) ?? null,
      classificationConfidence: (row.classification_confidence as number) ?? 0,
      classificationReason: row.classification_reason as string,
      rawPayload: row.raw_payload as string,
      receivedAt: row.received_at as string,
    }))
  }

  getEventsByRecoveryType(runId: string, recoveryType: string): BpmnIngestionEventRow[] {
    const rows = this.db.prepare(
      'SELECT * FROM bpmn_ingestion_events WHERE ingestion_run_id = ? AND recovery_type = ? ORDER BY received_at',
    ).all(runId, recoveryType) as Record<string, unknown>[]
    return rows.map(row => ({
      id: row.id as string,
      ingestionRunId: row.ingestion_run_id as string,
      caseId: row.case_id as string,
      activity: row.activity as string,
      recoveryType: (row.recovery_type as string | null) ?? null,
      classificationConfidence: (row.classification_confidence as number) ?? 0,
      classificationReason: row.classification_reason as string,
      rawPayload: row.raw_payload as string,
      receivedAt: row.received_at as string,
    }))
  }

  getEventCount(runId: string): number {
    const row = this.db.prepare(
      'SELECT COUNT(*) AS count FROM bpmn_ingestion_events WHERE ingestion_run_id = ?',
    ).get(runId) as { count: number }
    return row.count
  }

  close() {
    try { this.db.close() } catch {}
  }

  clear() {
    this.db.exec('DELETE FROM bpmn_ingestion_events')
    this.db.exec('DELETE FROM bpmn_ingestion_runs')
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

let databaseInstance: BpmnIngestionDatabase | null = null

export function getBpmnIngestionDatabase(databasePath?: string): BpmnIngestionDatabase {
  if (!databaseInstance) {
    databaseInstance = new BpmnIngestionDatabase(databasePath)
    databaseInstance.initialize()
  }
  return databaseInstance
}

export function resetBpmnIngestionDatabase(): void {
  if (databaseInstance) {
    databaseInstance.close()
    databaseInstance = null
  }
}
