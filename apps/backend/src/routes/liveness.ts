import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import type { HeartbeatRun, ReclassificationOptions } from '../services/livenessReclassification'
import { reclassifyRuns, reconcileRun } from '../services/livenessReclassification'

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
  try {
    const body = (request.body ?? {}) as ReclassifyBody
    const runs = body.runs

    if (!Array.isArray(runs)) {
      return reply.status(400).send({ error: 'Request body must include a "runs" array.' })
    }

    const invalid = runs.findIndex(r => !isRun(r))
    if (invalid !== -1) {
      return reply.status(400).send({ error: `runs[${invalid}] must be an object with string "id" and "status".` })
    }

    const report = reclassifyRuns(runs as HeartbeatRun[], body.options ?? {})
    return reply.send(report)
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to reclassify liveness runs' })
  }
}

export async function postReconcileLiveness(request: FastifyRequest, reply: FastifyReply) {
  try {
    const body = (request.body ?? {}) as {
      run?: unknown
      issueStatus?: string
      options?: ReclassificationOptions
    }

    if (!isRun(body.run)) {
      return reply.status(400).send({ error: 'Request body must include a "run" object with string "id" and "status".' })
    }
    if (typeof body.issueStatus !== 'string') {
      return reply.status(400).send({ error: 'Request body must include a string "issueStatus".' })
    }

    const outcome = reconcileRun(body.run as HeartbeatRun, body.issueStatus, body.options ?? {})
    return reply.send({ id: (body.run as HeartbeatRun).id, outcome })
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to reconcile liveness run' })
  }
}

export function livenessRoutes(server: FastifyInstance) {
  server.post('/api/liveness/reclassify', postReclassifyLiveness)
  server.post('/api/liveness/reconcile', postReconcileLiveness)
}
