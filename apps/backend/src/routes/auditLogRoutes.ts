import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import type { AuditLogFilter, AuditAction } from '@nexus-engineering/shared'
import { auditLogRepository } from '../auditLog/repository'
import { authenticate, requirePermission } from '../auth/middleware'

async function listAuditLogs(request: FastifyRequest, reply: FastifyReply) {
  try {
    const query = request.query as Record<string, string>

    const filter: AuditLogFilter = {
      startDate: query.startDate,
      endDate: query.endDate,
      userId: query.userId,
      action: query.action as AuditAction | undefined,
      resourceType: query.resourceType,
      search: query.search,
      limit: query.limit ? parseInt(query.limit, 10) : 50,
      offset: query.offset ? parseInt(query.offset, 10) : 0,
    }

    const result = await auditLogRepository.list(filter)

    const limit = filter.limit ?? 50
    const offset = filter.offset ?? 0

    return reply.send({
      entries: result.entries,
      pagination: {
        total: result.total,
        limit,
        offset,
        hasMore: offset + limit < result.total,
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
    )

    if (format === 'csv') {
      const headers = ['ID', 'Timestamp', 'User ID', 'User Email', 'Action', 'Resource Type', 'Resource ID', 'Details', 'IP Address']
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
}
