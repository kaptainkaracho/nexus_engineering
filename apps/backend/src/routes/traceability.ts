import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import type { ImpactScope, TraceabilityReport, DomainCoverage } from '@nexus-engineering/shared'
import { traverseGraph } from '../services/traceabilityService'
import { impactAnalyzer } from '../ai/impactAnalyzer'
import { coverageAnalyzer } from '../ai/coverageAnalyzer'
import { getLLMClient } from '../ai/llmClient'
import { buildTraceabilityReportPrompt } from '../ai/promptTemplates'

function parseList(value: unknown): string[] | undefined {
  if (value === undefined || value === null) return undefined
  if (Array.isArray(value)) return value.map(String)
  return String(value)
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
}

export async function getTraceabilityGraph (request: FastifyRequest, reply: FastifyReply) {
  try {
    const query = request.query as { depth?: string; filter?: string | string[]; relationships?: string | string[] }
    const depth = query.depth ? Number(query.depth) : undefined
    const filter = parseList(query.filter)
    const relationships = parseList(query.relationships)

    const graph = traverseGraph({ depth, filter, relationshipTypes: relationships })
    return reply.send(graph)
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to traverse traceability graph' })
  }
}

export async function getTraceabilityImpact (request: FastifyRequest, reply: FastifyReply) {
  try {
    const { artifactId } = request.params as { artifactId: string }
    if (!artifactId) {
      return reply.status(400).send({ error: 'Artifact ID is required' })
    }

    const query = request.query as { confidenceThreshold?: string; artifactType?: string }
    const confidenceThreshold = query.confidenceThreshold ? Number(query.confidenceThreshold) : 0

    const scope: ImpactScope = {
      artifactIds: [artifactId],
      artifactTypes: query.artifactType ? [query.artifactType] : undefined,
    }

    const analysis = await impactAnalyzer.analyzeV2(scope)

    const filteredArtifacts = analysis.artifacts.filter(a => a.confidenceScore >= confidenceThreshold)
    const filteredNodeIds = new Set(filteredArtifacts.map(a => a.id))
    const filteredGraph = {
      nodes: analysis.impactGraph.nodes.filter(n => n.id === artifactId || filteredNodeIds.has(n.id)),
      edges: analysis.impactGraph.edges.filter(e => filteredNodeIds.has(e.sourceId) && filteredNodeIds.has(e.targetId)),
    }

    return reply.send({
      scope: analysis.scope,
      artifactId,
      confidenceThreshold,
      artifacts: filteredArtifacts,
      impactGraph: filteredGraph,
      chains: analysis.chains.filter(c => c.confidenceScore >= confidenceThreshold),
      summary: {
        ...analysis.summary,
        totalAffected: filteredArtifacts.length,
        directCount: filteredArtifacts.filter(a => a.impactLevel === 'direct').length,
        indirectCount: filteredArtifacts.filter(a => a.impactLevel === 'indirect').length,
        transitiveCount: filteredArtifacts.filter(a => a.impactLevel === 'transitive').length,
      },
    })
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to analyze traceability impact' })
  }
}

export async function getTraceabilityCoverage (request: FastifyRequest, reply: FastifyReply) {
  try {
    const query = request.query as { domain?: string }
    const report = await coverageAnalyzer.analyzeFromGraph()

    if (query.domain) {
      const domain: DomainCoverage | undefined = report.domainCoverage.find(d => d.domain === query.domain)
      if (!domain) {
        return reply.status(404).send({ error: `Domain "${query.domain}" not found`, available: report.domainCoverage.map(d => d.domain) })
      }
      return reply.send({ domain: query.domain, coverage: domain, overallCoveragePercent: report.overallCoveragePercent })
    }

    return reply.send(report)
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to compute traceability coverage' })
  }
}

export async function getTraceabilityReport (request: FastifyRequest, reply: FastifyReply) {
  try {
    const query = request.query as { format?: string }
    const format = (query.format === 'json' ? 'json' : 'markdown') as 'markdown' | 'json'

    const report = await coverageAnalyzer.analyzeFromGraph()
    const llmClient = getLLMClient()

    let llmAnalysis: string | undefined

    if (llmClient.isConfigured()) {
      try {
        const messages = buildTraceabilityReportPrompt({
          axes: report.axes,
          crossArtifactGaps: report.crossArtifactGaps,
          domainCoverage: report.domainCoverage,
          overallCoveragePercent: report.overallCoveragePercent,
        })
        const response = await llmClient.complete({ messages })
        llmAnalysis = response.content
      } catch {
        llmAnalysis = undefined
      }
    }

    const content = llmAnalysis ?? nativeMarkdownReport(report)

    const payload: TraceabilityReport = {
      generatedAt: new Date().toISOString(),
      format,
      content,
      coverage: report,
      gaps: report.crossArtifactGaps,
      llmAnalysis,
    }

    if (format === 'json') {
      return reply.send(payload)
    }
    return reply.type('text/markdown').send(content)
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to generate traceability report' })
  }
}

function nativeMarkdownReport(report: Awaited<ReturnType<typeof coverageAnalyzer.analyzeFromGraph>>): string {
  const lines: string[] = []
  lines.push('# Traceability Status Report')
  lines.push('')
  lines.push(`_Generated ${new Date().toISOString()}_`)
  lines.push('')
  lines.push(`## Executive Summary`)
  lines.push('')
  lines.push(`Overall V-Model coverage: **${report.overallCoveragePercent}%**`)
  lines.push(`Artifacts analyzed: ${report.summary.totalArtifacts} · Gaps detected: ${report.summary.totalGaps} (${report.summary.highRiskCount} high, ${report.summary.mediumRiskCount} medium, ${report.summary.lowRiskCount} low)`)
  lines.push('')
  lines.push('## Coverage by Axis')
  lines.push('')
  lines.push('| Axis | Covered | Total | % |')
  lines.push('| --- | --- | --- | --- |')
  for (const a of report.axes) {
    lines.push(`| ${a.axis} | ${a.linked} | ${a.total} | ${a.coveragePercent}% |`)
  }
  lines.push('')
  lines.push('## Domain Breakdown')
  lines.push('')
  for (const d of report.domainCoverage) {
    lines.push(`- **${d.domain}**: ${d.coveragePercent}% (${d.coveredArtifacts}/${d.totalArtifacts})`)
  }
  lines.push('')
  if (report.crossArtifactGaps.length) {
    lines.push('## Key Gaps & Risks')
    lines.push('')
    for (const g of report.crossArtifactGaps.slice(0, 25)) {
      lines.push(`- [${g.severity}] ${g.axis}/\`${g.artifactId}\`: ${g.detail}`)
    }
    lines.push('')
  }
  lines.push('## Recommended Actions')
  lines.push('')
  lines.push('- Close high-risk gaps first (requirements without downstream links, features/tests without coverage).')
  lines.push('- Improve trace link density across under-covered domains.')
  return lines.join('\n')
}

export function traceabilityRoutes (server: FastifyInstance) {
  server.get('/api/traceability/graph', getTraceabilityGraph)
  server.get('/api/traceability/impact/:artifactId', getTraceabilityImpact)
  server.get('/api/traceability/coverage', getTraceabilityCoverage)
  server.get('/api/traceability/report', getTraceabilityReport)
}
