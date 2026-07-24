import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import type { HeartbeatRun, ReclassificationOptions } from '../services/livenessReclassification'
import { reclassifyRuns, reconcileRun } from '../services/livenessReclassification'
import { AppError } from '../lib/errorHandler'

interface ReclassifyBody {
  runs?: unknown
  options?: ReclassificationOptions
}

function isRun(value: unknown): value is HeartbeatRun {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return typeof v.id === 'string' && typeof v.status === 'string'
}

export async function postReclassifyLiveness(request: FastifyRequest, reply: FastifyReply) {
  const body = (request.body ?? {}) as ReclassifyBody
  const runs = body.runs

  if (!Array.isArray(runs)) {
    throw new AppError(400, 'Request body must include a "runs" array.', { param: 'runs' })
  }

  const invalid = runs.findIndex(r => !isRun(r))
  if (invalid !== -1) {
    throw new AppError(400, `runs[${invalid}] must be an object with string "id" and "status".`, { param: 'runs', index: invalid })
  }

  const report = reclassifyRuns(runs as HeartbeatRun[], body.options ?? {})
  return reply.send(report)
}

export async function postReconcileLiveness(request: FastifyRequest, reply: FastifyReply) {
  const body = (request.body ?? {}) as {
    run?: unknown
    issueStatus?: string
    options?: ReclassificationOptions
  }

  if (!isRun(body.run)) {
    throw new AppError(400, 'Request body must include a "run" object with string "id" and "status".', { param: 'run' })
  }
  if (typeof body.issueStatus !== 'string') {
    throw new AppError(400, 'Request body must include a string "issueStatus".', { param: 'issueStatus' })
  }

  const outcome = reconcileRun(body.run as HeartbeatRun, body.issueStatus, body.options ?? {})
  return reply.send({ id: (body.run as HeartbeatRun).id, outcome })
}

export function livenessRoutes(server: FastifyInstance) {
  server.post('/api/liveness/reclassify', postReclassifyLiveness)
  server.post('/api/liveness/reconcile', postReconcileLiveness)
}
