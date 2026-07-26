import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { complianceRepo } from '../complianceReports/repository'
import type { Soc2Category, ReportType, ReportFormat } from '../complianceReports/database'
import { SOC2_CATEGORIES } from '../complianceReports/database'
import { AppError } from '../lib/errorHandler'
import { authenticate, requirePermission } from '../auth/middleware'
import { complianceRateLimit, reportGenerationRateLimit } from '../lib/rateLimiter'

const VALID_REPORT_TYPES = ['coverage', 'traceability', 'audit', 'gap_analysis', 'soc2', 'full'] as const
const VALID_FORMATS = ['json', 'csv', 'pdf'] as const

export async function listComplianceReports(request: FastifyRequest, reply: FastifyReply) {
  const query = request.query as {
    limit?: string
    offset?: string
    orgId?: string
    reportType?: string
  }

  const orgId = query.orgId
  const reportType = VALID_REPORT_TYPES.includes(query.reportType as any)
    ? (query.reportType as ReportType)
    : undefined
  const limit = query.limit ? Number(query.limit) : undefined
  const offset = query.offset ? Number(query.offset) : undefined

  const result = await complianceRepo.list({ orgId, reportType, limit, offset })
  return reply.send(result)
}

export async function getComplianceReport(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  if (!id) {
    throw new AppError(400, 'Report ID is required', { param: 'id' })
  }
  const report = await complianceRepo.getById(id)
  return reply.send(report)
}

export async function downloadComplianceReport(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  if (!id) {
    throw new AppError(400, 'Report ID is required', { param: 'id' })
  }

  const report = await complianceRepo.getById(id)
  if (!report.filePath) {
    throw new AppError(404, 'Report file not available', { reportId: id })
  }

  const mimeTypes: Record<string, string> = {
    json: 'application/json',
    csv: 'text/csv',
    pdf: 'application/pdf',
  }

  const contentType = mimeTypes[report.format] ?? 'application/octet-stream'
  const disposition = `attachment; filename="${report.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.${report.format}"`

  try {
    const { readFileSync } = await import('node:fs')
    const content = readFileSync(report.filePath)
    return reply
      .header('Content-Type', contentType)
      .header('Content-Disposition', disposition)
      .send(content)
  } catch {
    throw new AppError(500, 'Failed to read report file', { reportId: id })
  }
}

export async function generateComplianceReport(request: FastifyRequest, reply: FastifyReply) {
  const body = request.body as {
    title?: string
    reportType?: string
    format?: string
    config?: Record<string, unknown>
  }

  if (!body.title || !body.title.trim()) {
    throw new AppError(400, 'Report title is required', { param: 'title' })
  }
  if (!body.reportType || !VALID_REPORT_TYPES.includes(body.reportType as any)) {
    throw new AppError(400, `Report type must be one of: ${VALID_REPORT_TYPES.join(', ')}`, { param: 'reportType', received: body.reportType })
  }
  if (!body.format || !VALID_FORMATS.includes(body.format as any)) {
    throw new AppError(400, `Format must be one of: ${VALID_FORMATS.join(', ')}`, { param: 'format', received: body.format })
  }

  const report = await complianceRepo.generate({
    title: body.title.trim(),
    reportType: body.reportType as ReportType,
    format: body.format as ReportFormat,
    createdBy: request.user?.sub ?? 'system',
    orgId: (request.query as any)?.orgId || undefined,
    config: body.config,
  })

  return reply.status(201).send(report)
}

export async function deleteComplianceReport(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  if (!id) {
    throw new AppError(400, 'Report ID is required', { param: 'id' })
  }
  await complianceRepo.delete(id)
  return reply.send({ message: `Report ${id} deleted` })
}

export async function getComplianceAggregations(request: FastifyRequest, reply: FastifyReply) {
  const aggregations = complianceRepo.getAggregations()
  return reply.send({ generatedAt: new Date().toISOString(), ...aggregations })
}

// ─── SOC2 Control Mapping Handlers ─────────────────────────────────────────

export async function listSoc2Mappings(request: FastifyRequest, reply: FastifyReply) {
  const query = request.query as { category?: string; status?: string; limit?: string; offset?: string }
  const category = SOC2_CATEGORIES.includes(query.category as Soc2Category) ? (query.category as Soc2Category) : undefined
  const status = query.status
  const limit = query.limit ? Number(query.limit) : undefined
  const offset = query.offset ? Number(query.offset) : undefined
  const result = await complianceRepo.listSoc2Mappings({ category, status, limit, offset })
  return reply.send(result)
}

export async function createSoc2Mapping(request: FastifyRequest, reply: FastifyReply) {
  const body = request.body as {
    category?: string
    artifactId?: string
    artifactType?: string
    notes?: string
    evidencePath?: string
  }

  if (!body.category || !SOC2_CATEGORIES.includes(body.category as Soc2Category)) {
    throw new AppError(400, `Category must be one of: ${SOC2_CATEGORIES.join(', ')}`, { param: 'category', received: body.category })
  }
  if (!body.artifactId || !body.artifactId.trim()) {
    throw new AppError(400, 'Artifact ID is required', { param: 'artifactId' })
  }
  if (!body.artifactType || !body.artifactType.trim()) {
    throw new AppError(400, 'Artifact type is required', { param: 'artifactType' })
  }

  const mapping = await complianceRepo.createSoc2Mapping({
    category: body.category as Soc2Category,
    artifactId: body.artifactId.trim(),
    artifactType: body.artifactType.trim(),
    notes: body.notes,
    evidencePath: body.evidencePath,
    createdBy: request.user?.sub ?? 'system',
  })

  return reply.status(201).send(mapping)
}

export async function updateSoc2Mapping(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  if (!id) throw new AppError(400, 'Mapping ID is required', { param: 'id' })

  const body = request.body as { status?: string; notes?: string; evidencePath?: string }
  if (body.status && !['compliant', 'non_compliant', 'not_assessed'].includes(body.status)) {
    throw new AppError(400, 'Status must be compliant, non_compliant, or not_assessed', { param: 'status', received: body.status })
  }

  const mapping = await complianceRepo.updateSoc2Mapping(id, body)
  return reply.send(mapping)
}

export async function deleteSoc2Mapping(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  if (!id) throw new AppError(400, 'Mapping ID is required', { param: 'id' })
  await complianceRepo.deleteSoc2Mapping(id)
  return reply.send({ message: `SOC2 mapping ${id} deleted` })
}

export function complianceRoutes(server: FastifyInstance) {
  const readGuard = { preHandler: [authenticate, requirePermission('compliance:read')] }
  const writeGuard = { preHandler: [authenticate, requirePermission('compliance:write')] }
  const generateGuard = { preHandler: [authenticate, requirePermission('compliance:write'), reportGenerationRateLimit] }
  const readWithRateLimit = { preHandler: [authenticate, requirePermission('compliance:read'), complianceRateLimit] }

  server.get('/api/compliance/reports', readWithRateLimit, listComplianceReports)
  server.post('/api/compliance/reports', generateGuard, generateComplianceReport)
  server.get('/api/compliance/reports/:id', readGuard, getComplianceReport)
  server.get('/api/compliance/reports/:id/download', readGuard, downloadComplianceReport)
  server.delete('/api/compliance/reports/:id', writeGuard, deleteComplianceReport)
  server.get('/api/compliance/aggregations', readWithRateLimit, getComplianceAggregations)

  // SOC2 control mapping endpoints
  server.get('/api/compliance/soc2/mappings', readWithRateLimit, listSoc2Mappings)
  server.post('/api/compliance/soc2/mappings', writeGuard, createSoc2Mapping)
  server.put('/api/compliance/soc2/mappings/:id', writeGuard, updateSoc2Mapping)
  server.delete('/api/compliance/soc2/mappings/:id', writeGuard, deleteSoc2Mapping)
}
