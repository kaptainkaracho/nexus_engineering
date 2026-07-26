import { mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { tmpdir } from 'node:os'
import { nanoid } from 'nanoid'
import PDFDocument from 'pdfkit'
import { getComplianceDatabase, complianceDb, type ComplianceReportRow, type ReportType, type ReportFormat, type AggregationResult, type Soc2ControlMapping, type Soc2Category, SOC2_CATEGORIES, SOC2_CATEGORY_LABELS } from './database'
import { getGraphDatabase } from '../graphBuilder/graphDatabase'
import { getTraceLinkDatabase } from '../traceabilityLinks/database'
import { getArtifactStorage } from '../artifacts/repositorySQLite'
import { getAuditLogDatabase } from '../auditLog/database'
import { AppError } from '../lib/errorHandler'

export interface GenerateReportInput {
  title: string
  reportType: ReportType
  format: ReportFormat
  createdBy: string
  orgId?: string
  config?: Record<string, unknown>
}

export interface ComplianceReportMeta {
  id: string
  title: string
  reportType: ReportType
  format: ReportFormat
  status: 'generating' | 'completed' | 'failed'
  config: Record<string, unknown>
  summary: AggregationResult | null
  filePath: string | null
  errorMessage: string | null
  createdBy: string
  orgId: string | null
  createdAt: string
  completedAt: string | null
}

function mapRowToMeta(row: ComplianceReportRow): ComplianceReportMeta {
  return {
    id: row.id,
    title: row.title,
    reportType: row.report_type,
    format: row.format,
    status: row.status,
    config: JSON.parse(row.config || '{}'),
    summary: row.summary ? JSON.parse(row.summary) : null,
    filePath: row.file_path,
    errorMessage: row.error_message,
    createdBy: row.created_by,
    orgId: row.org_id,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  }
}

function collectAggregations(): AggregationResult {
  const db = getComplianceDatabase()
  const graphDb = getGraphDatabase()
  const nodes = graphDb.getGraphNodes()
  const edges = graphDb.getGraphEdges()

  const nodesByType: Record<string, number> = {}
  for (const n of nodes) {
    nodesByType[n.type] = (nodesByType[n.type] || 0) + 1
  }

  const edgesByRelationship: Record<string, number> = {}
  for (const e of edges) {
    edgesByRelationship[e.relationship_type] = (edgesByRelationship[e.relationship_type] || 0) + 1
  }

  let artifactTotal = 0
  const artifactsByType: Record<string, number> = {}
  const artifactsByLifecycle: Record<string, number> = {}
  try {
    const artStore = getArtifactStorage()
    const allArtifacts = artStore.findAll()
    artifactTotal = allArtifacts.length
    for (const a of allArtifacts) {
      artifactsByType[a.type] = (artifactsByType[a.type] || 0) + 1
      artifactsByLifecycle[a.lifecycle] = (artifactsByLifecycle[a.lifecycle] || 0) + 1
    }
  } catch { /* artifacts DB may not be available */ }

  let auditTotal = 0
  const auditByAction: Record<string, number> = {}
  let recentActivity = 0
  try {
    const auditDb = getAuditLogDatabase()
    const allAudit = auditDb.findAll({ limit: 10000 })
    auditTotal = allAudit.total
    for (const a of allAudit.entries) {
      auditByAction[a.action] = (auditByAction[a.action] || 0) + 1
    }
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    recentActivity = auditDb.findAll({ startDate: thirtyDaysAgo, limit: 0 }).total
  } catch { /* audit DB may not be available */ }

  let overallCoveragePercent = 0
  const axes: Array<{ axis: string; total: number; linked: number; percent: number }> = []
  const gapCounts: Record<string, { count: number; severity: string }> = {}

  try {
    const traceDb = getTraceLinkDatabase()
    const allLinks = traceDb.findAll()

    const linkSourceTypes = new Set(allLinks.map(l => l.sourceType))
    const linkTargetTypes = new Set(allLinks.map(l => l.targetType))

    for (const st of linkSourceTypes) {
      const total = nodes.filter(n => n.type === st).length
      const linked = allLinks.filter(l => l.sourceType === st).length
      const percent = total > 0 ? Math.round((linked / total) * 100) : 0
      axes.push({ axis: st, total, linked, percent })
    }
    for (const tt of linkTargetTypes) {
      if (!linkSourceTypes.has(tt)) {
        const total = nodes.filter(n => n.type === tt).length
        const linked = allLinks.filter(l => l.targetType === tt).length
        const percent = total > 0 ? Math.round((linked / total) * 100) : 0
        axes.push({ axis: tt, total, linked, percent })
      }
    }

    if (axes.length > 0) {
      const totalCovered = axes.reduce((s, a) => s + a.linked, 0)
      const totalPossible = axes.reduce((s, a) => s + a.total, 0)
      overallCoveragePercent = totalPossible > 0 ? Math.round((totalCovered / totalPossible) * 100) : 0
    }

    const gaps: Record<string, number> = {}
    for (const l of allLinks) {
      if (l.confidence === 'low') {
        gaps['low_confidence'] = (gaps['low_confidence'] || 0) + 1
      }
    }
    const orphanNodes = nodes.filter(n => !edges.some(e => e.source_id === n.id || e.target_id === n.id))
    if (orphanNodes.length > 0) {
      gaps['orphan_nodes'] = orphanNodes.length
    }
    for (const [k, v] of Object.entries(gaps)) {
      const severity = v > 10 ? 'high' : v > 3 ? 'medium' : 'low'
      gapCounts[k] = { count: v, severity }
    }
  } catch { /* trace DB may not be available */ }

  const gaps = Object.entries(gapCounts).map(([type, val]) => ({ type, count: val.count, severity: val.severity }))

  let soc2TotalMappings = 0
  let soc2CoveragePercent = 0
  const soc2ByCategory: Record<string, { total: number; compliant: number; nonCompliant: number; notAssessed: number }> = {}
  const soc2ByStatus: Record<string, number> = {}
  try {
    const soc2Agg = db.getSoc2Aggregation()
    soc2TotalMappings = soc2Agg.totalMappings
    Object.assign(soc2ByCategory, soc2Agg.byCategory)
    Object.assign(soc2ByStatus, soc2Agg.byStatus)
    const assessedCategories = Object.values(soc2ByCategory).filter(c => c.total > 0).length
    soc2CoveragePercent = assessedCategories > 0
      ? Math.round((Object.values(soc2ByCategory).filter(c => c.compliant > 0).length / SOC2_CATEGORIES.length) * 100)
      : 0
  } catch { /* SOC2 table may be empty */ }

  return {
    summary: {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      nodesByType,
      edgesByRelationship,
    },
    coverage: {
      overallCoveragePercent,
      axes,
    },
    artifacts: {
      total: artifactTotal,
      byType: artifactsByType,
      byLifecycle: artifactsByLifecycle,
    },
    audit: {
      totalEntries: auditTotal,
      byAction: auditByAction,
      recentActivity,
    },
    gaps,
    soc2: {
      totalMappings: soc2TotalMappings,
      coveragePercent: soc2CoveragePercent,
      byCategory: soc2ByCategory,
      byStatus: soc2ByStatus,
    },
  }
}

function generateCsv(aggregation: AggregationResult): string {
  const lines: string[] = []

  lines.push('Compliance Report - CSV Export')
  lines.push(`Generated,${new Date().toISOString()}`)
  lines.push('')

  lines.push('Section,Metric,Value')
  lines.push(`Summary,Total Nodes,${aggregation.summary.totalNodes}`)
  lines.push(`Summary,Total Edges,${aggregation.summary.totalEdges}`)
  for (const [type, count] of Object.entries(aggregation.summary.nodesByType)) {
    lines.push(`Nodes,${type},${count}`)
  }
  for (const [rel, count] of Object.entries(aggregation.summary.edgesByRelationship)) {
    lines.push(`Edges,${rel},${count}`)
  }

  lines.push('')
  lines.push(`Coverage,Overall,${aggregation.coverage.overallCoveragePercent}%`)
  for (const a of aggregation.coverage.axes) {
    lines.push(`Coverage,${a.axis},${a.percent}% (${a.linked}/${a.total})`)
  }

  lines.push('')
  lines.push(`Artifacts,Total,${aggregation.artifacts.total}`)
  for (const [type, count] of Object.entries(aggregation.artifacts.byType)) {
    lines.push(`Artifacts,${type},${count}`)
  }
  for (const [lc, count] of Object.entries(aggregation.artifacts.byLifecycle)) {
    lines.push(`Artifact Lifecycle,${lc},${count}`)
  }

  lines.push('')
  lines.push(`Audit,Total Entries,${aggregation.audit.totalEntries}`)
  lines.push(`Audit,Recent 30d,${aggregation.audit.recentActivity}`)
  for (const [action, count] of Object.entries(aggregation.audit.byAction)) {
    lines.push(`Audit Action,${action},${count}`)
  }

  lines.push('')
  lines.push(`Gaps,Total,${aggregation.gaps.length}`)
  for (const g of aggregation.gaps) {
    lines.push(`Gap,${g.type} (${g.severity}),${g.count}`)
  }

  lines.push('')
  lines.push(`SOC2,Mappings,${aggregation.soc2.totalMappings}`)
  lines.push(`SOC2,Coverage,${aggregation.soc2.coveragePercent}%`)
  lines.push(`SOC2,Compliant,${aggregation.soc2.byStatus.compliant ?? 0}`)
  lines.push(`SOC2,Non-Compliant,${aggregation.soc2.byStatus.non_compliant ?? 0}`)
  lines.push(`SOC2,Not Assessed,${aggregation.soc2.byStatus.not_assessed ?? 0}`)
  for (const [cat, data] of Object.entries(aggregation.soc2.byCategory)) {
    lines.push(`SOC2 Category,${cat},${data.compliant}/${data.total} compliant`)
  }

  return lines.join('\n')
}

function generatePdf(aggregation: AggregationResult): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' })
      const chunks: Buffer[] = []
      doc.on('data', (chunk: Buffer) => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      const pageWidth = doc.page.width - 100
      let y = 50

      function addLine(text: string, opts?: { size?: number; bold?: boolean; color?: string }) {
        if (y > 720) { doc.addPage(); y = 50 }
        doc
          .font(opts?.bold ? 'Helvetica-Bold' : 'Helvetica')
          .fontSize(opts?.size ?? 11)
          .fillColor(opts?.color ?? '#000000')
          .text(text, 50, y, { width: pageWidth })
        y += (opts?.size ?? 11) * 1.5
      }

      function addSeparator() {
        if (y > 735) { doc.addPage(); y = 50 }
        y += 6
        doc.moveTo(50, y).lineTo(50 + pageWidth, y).strokeColor('#cccccc').stroke()
        y += 10
      }

      doc.font('Helvetica-Bold').fontSize(22).fillColor('#1a1a2e').text('Compliance Report', 50, y)
      y += 30
      doc.font('Helvetica').fontSize(10).fillColor('#666666').text(`Generated: ${new Date().toISOString()}`, 50, y)
      y += 25

      addLine('Executive Summary', { size: 16, bold: true, color: '#1a1a2e' })
      addLine(`Nodes in graph: ${aggregation.summary.totalNodes}`)
      addLine(`Edges in graph: ${aggregation.summary.totalEdges}`)
      addLine(`Overall traceability coverage: ${aggregation.coverage.overallCoveragePercent}%`)
      addLine(`Artifacts registered: ${aggregation.artifacts.total}`)
      addLine(`Audit log entries: ${aggregation.audit.totalEntries}`)
      addLine(`Identified gaps: ${aggregation.gaps.length}`)

      addSeparator()

      addLine('Coverage by Domain', { size: 16, bold: true, color: '#1a1a2e' })
      if (aggregation.coverage.axes.length === 0) {
        addLine('No coverage data available.')
      } else {
        for (const a of aggregation.coverage.axes) {
          addLine(`${a.axis}: ${a.percent}% (${a.linked}/${a.total} linked)`)
        }
      }

      addSeparator()

      addLine('Node Distribution', { size: 16, bold: true, color: '#1a1a2e' })
      for (const [type, count] of Object.entries(aggregation.summary.nodesByType)) {
        addLine(`${type}: ${count}`)
      }

      addSeparator()

      addLine('Artifact Summary', { size: 16, bold: true, color: '#1a1a2e' })
      addLine(`Total: ${aggregation.artifacts.total}`)
      for (const [type, count] of Object.entries(aggregation.artifacts.byType)) {
        addLine(`  ${type}: ${count}`)
      }

      addSeparator()

      addLine('Audit Activity', { size: 16, bold: true, color: '#1a1a2e' })
      addLine(`Total entries: ${aggregation.audit.totalEntries}`)
      addLine(`Last 30 days: ${aggregation.audit.recentActivity}`)
      for (const [action, count] of Object.entries(aggregation.audit.byAction)) {
        addLine(`  ${action}: ${count}`)
      }

      addSeparator()

      addLine('Gaps & Risks', { size: 16, bold: true, color: '#1a1a2e' })
      if (aggregation.gaps.length === 0) {
        addLine('No gaps detected.')
      } else {
        for (const g of aggregation.gaps) {
          const color = g.severity === 'high' ? '#cc0000' : g.severity === 'medium' ? '#cc8800' : '#888888'
          addLine(`[${g.severity.toUpperCase()}] ${g.type}: ${g.count}`, { color })
        }
      }

      addSeparator()

      addLine('SOC2 Control Coverage', { size: 16, bold: true, color: '#1a1a2e' })
      addLine(`Total mappings: ${aggregation.soc2.totalMappings}`)
      addLine(`Overall coverage: ${aggregation.soc2.coveragePercent}%`)
      addLine(`Compliant: ${aggregation.soc2.byStatus.compliant ?? 0} | Non-compliant: ${aggregation.soc2.byStatus.non_compliant ?? 0} | Not assessed: ${aggregation.soc2.byStatus.not_assessed ?? 0}`)
      for (const [cat, data] of Object.entries(aggregation.soc2.byCategory)) {
        const label = SOC2_CATEGORY_LABELS[cat as Soc2Category] ?? cat
        const statusColor = data.compliant === data.total ? '#009900' : data.nonCompliant > 0 ? '#cc0000' : '#cc8800'
        addLine(`${cat} — ${label}: ${data.compliant}/${data.total} compliant`, { color: statusColor })
      }

      doc.end()
    } catch (err) {
      reject(err)
    }
  })
}

const EXPORT_DIR = process.env.COMPLIANCE_EXPORT_DIR || join(tmpdir(), 'nexus-compliance')

class ComplianceReportRepository {
  async list(filters?: { orgId?: string; reportType?: ReportType; limit?: number; offset?: number }) {
    const db = getComplianceDatabase()
    const result = db.findAll(filters)
    return { items: result.items.map(mapRowToMeta), total: result.total }
  }

  async getById(id: string): Promise<ComplianceReportMeta> {
    const db = getComplianceDatabase()
    const row = db.findById(id)
    if (!row) {
      throw new AppError(404, 'Compliance report not found', { reportId: id })
    }
    return mapRowToMeta(row)
  }

  async generate(input: GenerateReportInput): Promise<ComplianceReportMeta> {
    const db = getComplianceDatabase()
    const id = nanoid(12)
    const now = new Date().toISOString()

    const reportRow: ComplianceReportRow = {
      id,
      title: input.title,
      report_type: input.reportType,
      format: input.format,
      status: 'generating',
      config: JSON.stringify(input.config ?? {}),
      summary: null,
      file_path: null,
      error_message: null,
      created_by: input.createdBy,
      org_id: input.orgId ?? null,
      created_at: now,
      completed_at: null,
    }

    db.insert(reportRow)

    try {
      const aggregation = collectAggregations()

      let filePath: string | null = null
      const serializedSummary = JSON.stringify(aggregation)

      if (input.format === 'json') {
        const content = JSON.stringify({ generatedAt: now, reportType: input.reportType, ...aggregation }, null, 2)
        filePath = await this.writeFile(id, 'json', content)
      } else if (input.format === 'csv') {
        const content = generateCsv(aggregation)
        filePath = await this.writeFile(id, 'csv', content)
      } else if (input.format === 'pdf') {
        const buffer = await generatePdf(aggregation)
        filePath = await this.writeFile(id, 'pdf', buffer)
      }

      db.updateStatus(id, 'completed', { summary: serializedSummary, filePath: filePath ?? undefined })
      return this.getById(id)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error generating report'
      db.updateStatus(id, 'failed', { errorMessage: message })
      throw new AppError(500, `Report generation failed: ${message}`, { reportId: id })
    }
  }

  async delete(id: string): Promise<void> {
    const db = getComplianceDatabase()
    const row = db.findById(id)
    if (!row) {
      throw new AppError(404, 'Compliance report not found', { reportId: id })
    }
    if (row.file_path && existsSync(row.file_path)) {
      try { await import('node:fs').then(fs => fs.promises.unlink(row.file_path as string)) } catch {}
    }
    db.delete(id)
  }

  getAggregations(): AggregationResult {
    return collectAggregations()
  }

  async listSoc2Mappings(filters?: { category?: Soc2Category; status?: string; limit?: number; offset?: number }) {
    const db = getComplianceDatabase()
    return db.findAllSoc2Mappings(filters)
  }

  async createSoc2Mapping(input: { category: Soc2Category; artifactId: string; artifactType: string; notes?: string; evidencePath?: string; createdBy: string }): Promise<Soc2ControlMapping> {
    const db = getComplianceDatabase()
    const now = new Date().toISOString()
    const mapping: Soc2ControlMapping = {
      id: nanoid(12),
      category: input.category,
      artifact_id: input.artifactId,
      artifact_type: input.artifactType,
      notes: input.notes ?? null,
      evidence_path: input.evidencePath ?? null,
      status: 'not_assessed',
      created_by: input.createdBy,
      created_at: now,
      updated_at: now,
    }
    db.insertSoc2Mapping(mapping)
    return mapping
  }

  async updateSoc2Mapping(id: string, updates: { status?: string; notes?: string; evidencePath?: string }): Promise<Soc2ControlMapping> {
    const db = getComplianceDatabase()
    const existing = db.findSoc2Mapping(id)
    if (!existing) throw new AppError(404, 'SOC2 mapping not found', { mappingId: id })
    const statusUpdates: Record<string, string | undefined> = {}
    if (updates.status) statusUpdates.status = updates.status
    if (updates.notes !== undefined) statusUpdates.notes = updates.notes
    if (updates.evidencePath !== undefined) statusUpdates.evidence_path = updates.evidencePath
    db.updateSoc2Mapping(id, statusUpdates as any)
    return db.findSoc2Mapping(id)!
  }

  async deleteSoc2Mapping(id: string): Promise<void> {
    const db = getComplianceDatabase()
    const existing = db.findSoc2Mapping(id)
    if (!existing) throw new AppError(404, 'SOC2 mapping not found', { mappingId: id })
    db.deleteSoc2Mapping(id)
  }

  private async writeFile(id: string, ext: string, content: string | Buffer): Promise<string> {
    if (!existsSync(EXPORT_DIR)) {
      mkdirSync(EXPORT_DIR, { recursive: true })
    }
    const filePath = join(EXPORT_DIR, `${id}.${ext}`)
    writeFileSync(filePath, content)
    return filePath
  }
}

export const complianceRepo = new ComplianceReportRepository()
