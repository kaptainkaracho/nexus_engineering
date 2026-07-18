import type { FastifyRequest } from 'fastify'
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
  )
}

export function auditLogAction(action: AuditAction, resourceType: string, getResourceId: (request: FastifyRequest) => string, getDetails?: (request: FastifyRequest) => string | null) {
  return async (request: FastifyRequest, _reply: unknown) => {
    const resourceId = getResourceId(request)
    const details = getDetails ? getDetails(request) : null
    await logAuditAction(request, action, resourceType, resourceId, details)
  }
}
