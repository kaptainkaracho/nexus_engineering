import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import type { ProcessRun, ClassificationOptions } from '../services/recoveryReworkClassifier'
import { classifyRuns, toMinervaEvents } from '../services/recoveryReworkClassifier'
import { AppError } from '../lib/errorHandler'

interface ClassifyBody {
  runs?: unknown
  options?: ClassificationOptions
}

interface EnrichBody {
  runs?: unknown
  options?: ClassificationOptions
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

export function recoveryReworkRoutes(server: FastifyInstance) {
  server.post('/api/recovery-rework/classify', postClassifyRecoveryRework)
  server.post('/api/recovery-rework/enrich', postEnrichMinervaEvents)
}
