import type { FastifyInstance, FastifyRequest } from 'fastify'
import type { AuditAction } from '@nexus-engineering/shared'
import { auditLogRepository } from './repository'

export async function logAuditAction(
  request: FastifyRequest,
  action: AuditAction,
  resourceType: string,
  resourceId: string,
  details?: string | null,
) {
  if (!request.user) return

  await auditLogRepository.log(
    request.user.sub,
    request.user.email,
    action,
    resourceType,
    resourceId,
    details,
    request.ip,
    request.user.orgId,
  )
}

export function auditLogAction(action: AuditAction, resourceType: string, getResourceId: (request: FastifyRequest) => string, getDetails?: (request: FastifyRequest) => string | null) {
  return async (request: FastifyRequest, _reply: unknown) => {
    const resourceId = getResourceId(request)
    const details = getDetails ? getDetails(request) : null
    await logAuditAction(request, action, resourceType, resourceId, details)
  }
}

export function registerAuditLogHook(server: FastifyInstance) {
  server.addHook('onResponse', async (request, reply) => {
    if (!request.user) return
    if (request.method === 'GET') return
    if (!request.url?.startsWith('/api/')) return
    if (reply.statusCode >= 400) return

    const action = methodToAction(request.method)
    if (!action) return

    const urlParts = request.url.split('/').filter(Boolean)
    const resourceType = urlParts[1] || 'unknown'

    await auditLogRepository.log(
      request.user.sub,
      request.user.email,
      action,
      resourceType,
      '',
      null,
      request.ip,
      request.user.orgId,
    )
  })
}

function methodToAction(method: string): AuditAction | null {
  switch (method) {
    case 'POST': return 'CREATE'
    case 'PUT': return 'UPDATE'
    case 'PATCH': return 'UPDATE'
    case 'DELETE': return 'DELETE'
    default: return null
  }
}
