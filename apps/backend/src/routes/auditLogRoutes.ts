import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import type { AuditLogFilter, AuditAction } from '@nexus-engineering/shared'
import { auditLogRepository } from '../auditLog/repository'
import { authenticate, requirePermission, requireOrgRole } from '../auth/middleware'

async function listAuditLogs(request: FastifyRequest, reply: FastifyReply) {
  try {
    const query = request.query as Record<string, string>

    const action = query.action as AuditAction | undefined
    const page = query.page ? parseInt(query.page, 10) : 0
    const limit = query.limit ? parseInt(query.limit, 10) : 50

    const filter: AuditLogFilter = {
      startDate: query.from || query.startDate,
      endDate: query.to || query.endDate,
      userId: query.userId,
      action,
      resourceType: query.resourceType,
      search: query.search,
      orgId: query.orgId,
      page,
      limit,
    }

    const result = await auditLogRepository.list(filter)

    const finalLimit = filter.limit ?? 50
    const finalPage = filter.page ?? 0

    return reply.send({
      entries: result.entries,
      pagination: {
        total: result.total,
        limit: finalLimit,
        page: finalPage,
        hasMore: (finalPage > 0 ? finalPage * finalLimit : finalLimit) < result.total,
      },
    })
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to list audit logs' })
  }
}

async function exportAuditLogs(request: FastifyRequest, reply: FastifyReply) {
  try {
    const query = request.query as Record<string, string>
    const format = query.format === 'csv' ? 'csv' : 'json'

    const filter: AuditLogFilter = {
      startDate: query.startDate,
      endDate: query.endDate,
      userId: query.userId,
      action: query.action as AuditAction | undefined,
      resourceType: query.resourceType,
      search: query.search,
      orgId: query.orgId,
      limit: 10000,
      offset: 0,
    }

    const result = await auditLogRepository.list(filter)

    auditLogRepository.log(
      request.user!.sub,
      request.user!.email,
      'EXPORT',
      'auditLog',
      '',
      JSON.stringify({ format, count: result.entries.length, filter }),
      request.ip,
      request.user!.orgId,
    )

    if (format === 'csv') {
      const headers = ['ID', 'Timestamp', 'User ID', 'User Email', 'Action', 'Resource Type', 'Resource ID', 'Details', 'IP Address', 'Org ID']
      const csvRows = result.entries.map(entry => [
        escapeCsv(entry.id),
        escapeCsv(entry.timestamp),
        escapeCsv(entry.userId),
        escapeCsv(entry.userEmail),
        escapeCsv(entry.action),
        escapeCsv(entry.resourceType),
        escapeCsv(entry.resourceId),
        escapeCsv(entry.details || ''),
        escapeCsv(entry.ipAddress || ''),
        escapeCsv(entry.orgId || ''),
      ].join(','))

      const csv = [headers.join(','), ...csvRows].join('\n')

      reply.header('Content-Type', 'text/csv')
      reply.header('Content-Disposition', `attachment; filename="audit-log-export-${Date.now()}.csv"`)
      return reply.send(csv)
    }

    return reply.send({
      exportedAt: new Date().toISOString(),
      exportedBy: request.user!.email,
      count: result.entries.length,
      entries: result.entries,
    })
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to export audit logs' })
  }
}

async function getAuditLog(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }

    if (!id) {
      return reply.status(400).send({ error: 'Audit log ID is required' })
    }

    const entry = await auditLogRepository.getById(id)
    if (!entry) {
      return reply.status(404).send({ error: 'Audit log entry not found' })
    }

    return reply.send(entry)
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to get audit log entry' })
  }
}

async function getRetentionConfig(request: FastifyRequest, reply: FastifyReply) {
  try {
    const config = auditLogRepository.getRetentionConfig()
    return reply.send(config)
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to get retention config' })
  }
}

async function updateRetentionConfig(request: FastifyRequest, reply: FastifyReply) {
  try {
    const body = request.body as { ttlDays?: number; enabled?: boolean }

    if (body.ttlDays !== undefined && (typeof body.ttlDays !== 'number' || body.ttlDays < 1)) {
      return reply.status(400).send({ error: 'ttlDays must be a positive integer' })
    }

    const config = auditLogRepository.setRetentionConfig({
      ttlDays: body.ttlDays,
      enabled: body.enabled,
    })

    auditLogRepository.log(
      request.user!.sub,
      request.user!.email,
      'UPDATE',
      'auditRetentionConfig',
      '',
      JSON.stringify(body),
      request.ip,
      request.user!.orgId,
    )

    return reply.send(config)
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to update retention config' })
  }
}

async function purgeAuditLogs(request: FastifyRequest, reply: FastifyReply) {
  try {
    const purged = await auditLogRepository.purgeOldEntries()

    auditLogRepository.log(
      request.user!.sub,
      request.user!.email,
      'DELETE',
      'auditLogPurge',
      '',
      JSON.stringify({ purgedCount: purged }),
      request.ip,
      request.user!.orgId,
    )

    return reply.send({ purged, message: `Purged ${purged} old audit log entries` })
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to purge audit logs' })
  }
}

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function auditLogRoutes(server: FastifyInstance) {
  server.get('/api/audit-logs', { preHandler: [authenticate, requirePermission('admin:all')] }, listAuditLogs)
  server.get('/api/audit-logs/export', { preHandler: [authenticate, requirePermission('admin:all')] }, exportAuditLogs)
  server.get('/api/audit-logs/:id', { preHandler: [authenticate, requirePermission('admin:all')] }, getAuditLog)
  server.get('/api/audit-logs/retention/config', { preHandler: [authenticate, requirePermission('admin:all')] }, getRetentionConfig)
  server.put('/api/audit-logs/retention/config', { preHandler: [authenticate, requirePermission('admin:all')] }, updateRetentionConfig)
  server.post('/api/audit-logs/purge', { preHandler: [authenticate, requirePermission('admin:all')] }, purgeAuditLogs)
}
