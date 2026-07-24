/**
 * Minerva BPMN Ingestion Pipeline for Recovery/Rework Events (THE-340).
 *
 * This pipeline:
 *  1. Fetches recent process runs from the Paperclip API
 *  2. Classifies them as recovery/rework/intervention events
 *  3. Converts classified events to Minerva BPMN-compatible format
 *  4. Pushes them to Minerva's BPMN classifier endpoint
 *  5. Persists ingestion metadata to the BPMN ingestion database
 */

import { nanoid } from 'nanoid'
import { classifyRuns, toMinervaEvents, type ProcessRun, type ClassificationReport } from '../services/recoveryReworkClassifier'
import {
  getBpmnIngestionDatabase,
  type BpmnIngestionEventRow,
} from './bpmnIngestionDatabase'

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const MINERVA_BASE = process.env.MINERVA_URL ?? 'http://localhost:8002'
const MINERVA_API_KEY = process.env.MINERVA_API_KEY ?? ''
const MINERVA_TENANT = process.env.MINERVA_TENANT ?? 'paperclip_company'
const PAPERCLIP_API = process.env.PAPERCLIP_API_URL ?? 'http://127.0.0.1:3100'
const PAPERCLIP_KEY = process.env.PAPERCLIP_API_KEY ?? ''

// ---------------------------------------------------------------------------
// Step 1: Fetch runs from Paperclip
// ---------------------------------------------------------------------------

export interface PaperclipRun {
  id: string
  issueId: string
  issueTitle?: string
  status: string
  agentRole?: string
  startedAt?: string
  finishedAt?: string
  durationMs?: number
  previousStatus?: string
  wasPaused?: boolean
  blockerDeclared?: boolean
}

async function fetchRunsFromPaperclip(limit: number = 200): Promise<PaperclipRun[]> {
  const url = `${PAPERCLIP_API}/api/runs?limit=${limit}&status=failed,in_progress,blocked,cancelled`

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${PAPERCLIP_KEY}`,
      'Content-Type': 'application/json',
    },
    signal: AbortSignal.timeout(30_000),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`Paperclip API error (${response.status}): ${body || response.statusText}`)
  }

  const data = await response.json() as { data?: PaperclipRun[]; runs?: PaperclipRun[]; results?: PaperclipRun[] }
  const runs = data.data ?? data.runs ?? data.results ?? []
  return runs as PaperclipRun[]
}

// ---------------------------------------------------------------------------
// Step 2: Classify runs
// ---------------------------------------------------------------------------

function classifyPaperclipRuns(rawRuns: PaperclipRun[]): ClassificationReport {
  const runs: ProcessRun[] = rawRuns.map(r => ({
    id: r.id,
    issueId: r.issueId,
    issueTitle: r.issueTitle,
    status: r.status,
    agentRole: r.agentRole,
    startedAt: r.startedAt,
    finishedAt: r.finishedAt,
    durationMs: r.durationMs,
    previousStatus: r.previousStatus,
    wasPaused: r.wasPaused,
    blockerDeclared: r.blockerDeclared,
  }))

  return classifyRuns(runs)
}

// ---------------------------------------------------------------------------
// Step 3: Push to Minerva BPMN classifier
// ---------------------------------------------------------------------------

async function pushToMinervaBpmnClassify(events: Array<{
  case_id: string
  activity: string
  recovery_type: string | null
  metadata: {
    classification_confidence: number
    classification_reason: string
  }
}>): Promise<{ runId: string }> {
  if (events.length === 0) {
    return { runId: '' }
  }

  const response = await fetch(`${MINERVA_BASE}/process-mining/bpmn/classify`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MINERVA_API_KEY}`,
      'X-Tenant-Id': MINERVA_TENANT,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ tool_calls: events }),
    signal: AbortSignal.timeout(60_000),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`Minerva BPMN classify error (${response.status}): ${body || response.statusText}`)
  }

  const data = await response.json() as { runId?: string; run_id?: string }
  const runId = data.runId ?? data.run_id ?? ''

  return { runId }
}

// ---------------------------------------------------------------------------
// Step 4: Persist to BPMN ingestion database
// ---------------------------------------------------------------------------

function persistEvents(
  runId: string,
  report: ClassificationReport,
): { persisted: number } {
  const db = getBpmnIngestionDatabase()
  const events: Array<{
    id: string
    ingestionRunId: string
    caseId: string
    activity: string
    recoveryType: string | null
    classificationConfidence: number
    classificationReason: string
    rawPayload: string
  }> = report.perRun
    .filter(cr => cr.recoveryType !== null)
    .map(cr => ({
      id: nanoid(),
      ingestionRunId: runId,
      caseId: cr.issueId,
      activity: `Run.${cr.originalStatus}`,
      recoveryType: cr.recoveryType,
      classificationConfidence: cr.confidence,
      classificationReason: cr.reason,
      rawPayload: JSON.stringify({
        case_id: cr.issueId,
        activity: `Run.${cr.originalStatus}`,
        recovery_type: cr.recoveryType,
        metadata: {
          classification_confidence: cr.confidence,
          classification_reason: cr.reason,
        },
      }),
    }))

  if (events.length > 0) {
    db.insertEventsBatch(events)
  }

  return { persisted: events.length }
}

// ---------------------------------------------------------------------------
// Pipeline orchestration
// ---------------------------------------------------------------------------

export interface IngestionResult {
  runId: string
  status: 'completed' | 'failed'
  runsFetched: number
  runsClassified: number
  recoveryEvents: number
  reworkEvents: number
  interventionEvents: number
  unclassified: number
  eventsPushed: number
  eventsPersisted: number
  minervaRunId: string | null
  errorMessage: string | null
}

export async function ingestRecoveryRework(limit: number = 200): Promise<IngestionResult> {
  const pipelineRunId = nanoid()
  const db = getBpmnIngestionDatabase()

  // Create ingestion run record
  db.createRun({ id: pipelineRunId })

  try {
    // Update status to processing
    db.updateRunStatus(pipelineRunId, 'processing')

    // Step 1: Fetch runs
    const rawRuns = await fetchRunsFromPaperclip(limit)

    db.updateRunStatus(pipelineRunId, 'processing')
    db.updateRunMetrics(pipelineRunId, { runsFetched: rawRuns.length })

    // Step 2: Classify
    const report = classifyPaperclipRuns(rawRuns)

    db.updateRunMetrics(pipelineRunId, {
      runsClassified: report.classified,
      recoveryEvents: report.recoveryEvents,
      reworkEvents: report.reworkEvents,
      interventionEvents: report.interventionEvents,
    })

    // Step 3: Convert to Minerva events
    const events = toMinervaEvents(report)

    // Step 4: Push to Minerva
    let minervaRunId: string | null = null
    let eventsPushed = 0

    if (events.length > 0) {
      const result = await pushToMinervaBpmnClassify(events)
      minervaRunId = result.runId || null
      eventsPushed = events.length
    }

    db.updateRunMetrics(pipelineRunId, { eventsPushed, minervaRunId })

    // Step 5: Persist events
    const { persisted } = persistEvents(pipelineRunId, report)

    // Mark complete
    db.updateRunStatus(pipelineRunId, 'completed')

    return {
      runId: pipelineRunId,
      status: 'completed' as const,
      runsFetched: report.totalRuns,
      runsClassified: report.classified,
      recoveryEvents: report.recoveryEvents,
      reworkEvents: report.reworkEvents,
      interventionEvents: report.interventionEvents,
      unclassified: report.unclassified,
      eventsPushed,
      eventsPersisted: persisted,
      minervaRunId,
      errorMessage: null,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    db.updateRunStatus(pipelineRunId, 'failed')
    db.updateRunMetrics(pipelineRunId, { errorMessage: message })

    return {
      runId: pipelineRunId,
      status: 'failed' as const,
      runsFetched: 0,
      runsClassified: 0,
      recoveryEvents: 0,
      reworkEvents: 0,
      interventionEvents: 0,
      unclassified: 0,
      eventsPushed: 0,
      eventsPersisted: 0,
      minervaRunId: null,
      errorMessage: message,
    }
  }
}

// ---------------------------------------------------------------------------
// Convenience: get ingestion history
// ---------------------------------------------------------------------------

export function getIngestionHistory(limit: number = 20) {
  const db = getBpmnIngestionDatabase()
  return db.listRecentRuns(limit)
}

export function getIngestionRun(runId: string) {
  const db = getBpmnIngestionDatabase()
  return db.findRunById(runId)
}

export function getIngestionEvents(runId: string) {
  const db = getBpmnIngestionDatabase()
  return db.getEventsByRun(runId)
}

export function resetBpmnIngestionDatabase() {
  const db = getBpmnIngestionDatabase()
  db.clear()
}
