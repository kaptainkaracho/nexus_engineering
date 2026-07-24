import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import type { ProcessRun, ClassificationOptions } from '../services/recoveryReworkClassifier'
import { classifyRuns, toMinervaEvents } from '../services/recoveryReworkClassifier'
import { AppError } from '../lib/errorHandler'
import { ingestRecoveryRework, getIngestionHistory, getIngestionRun, getIngestionEvents } from '../minerva/ingestRecoveryRework'

interface ClassifyBody {
  runs?: unknown
  options?: ClassificationOptions
}

interface EnrichBody {
  runs?: unknown
  options?: ClassificationOptions
}

interface IngestBody {
  limit?: number
}

function isProcessRun(value: unknown): value is ProcessRun {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return typeof v.id === 'string' && typeof v.issueId === 'string' && typeof v.status === 'string'
}

export async function postClassifyRecoveryRework(request: FastifyRequest, reply: FastifyReply) {
  const body = (request.body ?? {}) as ClassifyBody
  const runs = body.runs

  if (!Array.isArray(runs)) {
    throw new AppError(400, 'Request body must include a "runs" array.', { param: 'runs' })
  }

  const invalid = runs.findIndex(r => !isProcessRun(r))
  if (invalid !== -1) {
    throw new AppError(400, `runs[${invalid}] must be an object with string "id", "issueId", and "status".`, { param: 'runs', index: invalid })
  }

  const report = classifyRuns(runs as ProcessRun[], body.options ?? {})
  return reply.send(report)
}

export async function postEnrichMinervaEvents(request: FastifyRequest, reply: FastifyReply) {
  const body = (request.body ?? {}) as EnrichBody
  const runs = body.runs

  if (!Array.isArray(runs)) {
    throw new AppError(400, 'Request body must include a "runs" array.', { param: 'runs' })
  }

  const invalid = runs.findIndex(r => !isProcessRun(r))
  if (invalid !== -1) {
    throw new AppError(400, `runs[${invalid}] must be an object with string "id", "issueId", and "status".`, { param: 'runs', index: invalid })
  }

  const report = classifyRuns(runs as ProcessRun[], body.options ?? {})
  const events = toMinervaEvents(report)
  return reply.send({ events, summary: report })
}

export async function postIngestRecoveryRework(request: FastifyRequest, reply: FastifyReply) {
  const body = (request.body ?? {}) as IngestBody
  const limit = body.limit ?? 200

  const result = await ingestRecoveryRework(limit)
  return reply.send(result)
}

export async function getIngestionHistory(request: FastifyRequest, reply: FastifyReply) {
  const limit = Math.min(Number(request.query.limit) || 20, 100)
  const runs = getIngestionHistory(limit)
  return reply.send({ runs, total: runs.length })
}

export async function getIngestionRun(request: FastifyRequest, reply: FastifyReply) {
  const runId = String((request.params as { runId: string }).runId)
  const run = getIngestionRun(runId)

  if (!run) {
    throw new AppError(404, `Ingestion run ${runId} not found.`, { param: 'runId' })
  }

  return reply.send(run)
}

export async function getIngestionRunEvents(request: FastifyRequest, reply: FastifyReply) {
  const runId = String((request.params as { runId: string }).runId)
  const events = getIngestionEvents(runId)
  return reply.send({ runId, events, total: events.length })
}

export function recoveryReworkRoutes(server: FastifyInstance) {
  server.post('/api/recovery-rework/classify', postClassifyRecoveryRework)
  server.post('/api/recovery-rework/enrich', postEnrichMinervaEvents)
  server.post('/api/recovery-rework/ingest', postIngestRecoveryRework)
  server.get('/api/recovery-rework/ingestion/history', getIngestionHistory)
  server.get('/api/recovery-rework/ingestion/:runId', getIngestionRun)
  server.get('/api/recovery-rework/ingestion/:runId/events', getIngestionRunEvents)
}
