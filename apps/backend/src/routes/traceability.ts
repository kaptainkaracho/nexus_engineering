import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import type { ImpactScope, TraceabilityReport, DomainCoverage, RecommendationType, RecommendationSeverity, TraceGateConfig, GateMetrics, GateMode } from '@nexus-engineering/shared'
import { evaluateGate, normalizeGateConfig, validateGateConfig } from '@nexus-engineering/shared'
import { traverseGraph } from '../services/traceabilityService'
import { resolveNodeRepo } from '../services/crossRepoTraversal'
import { impactAnalyzer } from '../ai/impactAnalyzer'
import { coverageAnalyzer } from '../ai/coverageAnalyzer'
import { crossArtifactGapAnalyzer } from '../ai/crossArtifactGapAnalyzer'
import { recommendationEngine } from '../ai/recommendationEngine'
import { getLLMClient } from '../ai/llmClient'
import { buildTraceabilityReportPrompt } from '../ai/promptTemplates'
import { existsSync } from 'fs'
import { execFileSync } from 'child_process'
import { getGraphDatabase } from '../graphBuilder/graphDatabase'
import { ImpactReportGenerator } from '../services/impactReportGenerator'
import { getGateConfig, putGateConfig } from '../services/traceGateStore'
import { AppError } from '../lib/errorHandler'

function parseList(value: unknown): string[] | undefined {
  if (value === undefined || value === null) return undefined
  if (Array.isArray(value)) return value.map(String)
  return String(value)
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
}

export async function getTraceabilityGraph (request: FastifyRequest, reply: FastifyReply) {
  const query = request.query as { depth?: string; filter?: string | string[]; relationships?: string | string[] }
  const depth = query.depth ? Number(query.depth) : undefined
  const filter = parseList(query.filter)
  const relationships = parseList(query.relationships)

  const graph = traverseGraph({ depth, filter, relationshipTypes: relationships })
  return reply.send(graph)
}

export async function getTraceabilityImpact (request: FastifyRequest, reply: FastifyReply) {
  const { artifactId } = request.params as { artifactId: string }

  if (!artifactId) {
    throw new AppError(400, 'Artifact ID is required', { param: 'artifactId' })
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
}

export async function getTraceabilityCoverage (request: FastifyRequest, reply: FastifyReply) {
  const query = request.query as { domain?: string }
  const report = await coverageAnalyzer.analyzeFromGraph()

  if (query.domain) {
    const domain: DomainCoverage | undefined = report.domainCoverage.find(d => d.domain === query.domain)
    if (!domain) {
      throw new AppError(404, `Domain "${query.domain}" not found`, { available: report.domainCoverage.map(d => d.domain) })
    }
    return reply.send({ domain: query.domain, coverage: domain, overallCoveragePercent: report.overallCoveragePercent })
  }

  return reply.send(report)
}

export async function getTraceabilityDependencies (request: FastifyRequest, reply: FastifyReply) {
  const query = request.query as {
    artifactId?: string
    depth?: string
    direction?: string
    relationshipTypes?: string
    includeMetadata?: string
    repoUrl?: string
  }

  const { artifactId, depth, direction, relationshipTypes, includeMetadata, repoUrl } = query
  const repos = repoUrl ? String(repoUrl).split(',').map(s => s.trim()).filter(Boolean) : undefined

  // Validate depth parameter
  const parsedDepth = depth ? Number(depth) : undefined
  if (depth && (isNaN(parsedDepth) || parsedDepth < 0 || parsedDepth > 100)) {
    throw new AppError(400, 'Invalid depth parameter. Must be a number between 0 and 100.', { param: 'depth', min: 0, max: 100 })
  }

  // Validate direction parameter
  const validDirections = ['both', 'upstream', 'downstream'] as const
  const parsedDirection = (direction as typeof validDirections[number]) ?? 'both'
  if (!validDirections.includes(parsedDirection)) {
    throw new AppError(400, `Invalid direction parameter. Must be one of: ${validDirections.join(', ')}`, { param: 'direction', allowed: validDirections })
  }

  // Validate artifactId if provided
  if (artifactId) {
    const db = getGraphDatabase()
    const node = db.getNode(artifactId)
    if (!node) {
      throw new AppError(404, `Artifact "${artifactId}" not found`, { resourceId: artifactId })
    }
  }

  const relTypes = relationshipTypes ? String(relationshipTypes).split(',').map(s => s.trim()).filter(Boolean) : undefined

  // Build traversal options
  const traversalOptions: Parameters<typeof traverseGraph>[0] = {
    depth: parsedDepth,
    relationshipTypes: relTypes,
  }

  // If artifactId specified, seed from that specific node
  if (artifactId) {
    traversalOptions.seedIds = [artifactId]
  }

  const result = traverseGraph(traversalOptions)

  // If direction is specified, filter edges accordingly
  let filteredEdges = result.edges
    if (direction === 'downstream' || direction === 'upstream') {
      // For direction filtering, we need to identify upstream vs downstream nodes
      // from the original seed (artifactId or all nodes if no seed)
      const seeds = artifactId ? [artifactId] : result.nodes.map(n => n.id)
      const downstreamNodes = new Set<string>(seeds)

      // BFS to find downstream nodes
      if (direction === 'downstream') {
        const adj = new Map<string, string[]>()
        for (const edge of result.edges) {
          if (!adj.has(edge.source_id)) adj.set(edge.source_id, [])
          adj.get(edge.source_id)!.push(edge.target_id)
        }
        const queue = [...seeds]
        while (queue.length) {
          const current = queue.shift()!
          if (!adj.has(current)) continue
          for (const neighbor of adj.get(current)!) {
            if (!downstreamNodes.has(neighbor)) {
              downstreamNodes.add(neighbor)
              queue.push(neighbor)
            }
          }
        }
        // Keep only edges where source is in downstream set
        filteredEdges = result.edges.filter(e => downstreamNodes.has(e.source_id))
      } else {
        const adj = new Map<string, string[]>()
        for (const edge of result.edges) {
          if (!adj.has(edge.target_id)) adj.set(edge.target_id, [])
          adj.get(edge.target_id)!.push(edge.source_id)
        }
        const queue = [...seeds]
        while (queue.length) {
          const current = queue.shift()!
          if (!adj.has(current)) continue
          for (const neighbor of adj.get(current)!) {
            if (!downstreamNodes.has(neighbor)) {
              downstreamNodes.add(neighbor)
              queue.push(neighbor)
            }
          }
        }
        // Keep only edges where source is in upstream set
        filteredEdges = result.edges.filter(e => downstreamNodes.has(e.source_id))
      }
    }

    const nodeIdSet = new Set(filteredEdges.map(e => e.source_id).concat(filteredEdges.map(e => e.target_id)))
    const filteredNodes = result.nodes.filter(n => nodeIdSet.has(n.id))

    const response: {
      artifactId?: string
      depth?: number
      direction: string
      relationshipTypes?: string[]
      nodes: typeof filteredNodes
      edges: typeof filteredEdges
      totalNodes: number
      totalEdges: number
      metadata?: {
        includeMetadata: boolean
        seedNode?: { id: string; type: string; title?: string }
      }
    } = {
      artifactId,
      depth: parsedDepth,
      direction: parsedDirection,
      relationshipTypes: relTypes,
      nodes: filteredNodes,
      edges: filteredEdges,
      totalNodes: filteredNodes.length,
      totalEdges: filteredEdges.length,
    }

    if (includeMetadata === 'true') {
      response.metadata = {
        includeMetadata: true,
        seedNode: artifactId ? { id: artifactId, type: result.nodes.find(n => n.id === artifactId)?.type, title: result.nodes.find(n => n.id === artifactId)?.title || result.nodes.find(n => n.id === artifactId)?.name } : undefined,
      }
    }

  return reply.send(response)
}

export async function getTraceabilityReport (request: FastifyRequest, reply: FastifyReply) {
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

export async function getTraceabilityImpactReport (request: FastifyRequest, reply: FastifyReply) {
  const query = request.query as { file?: string; branch?: string; base?: string }

  const file = query.file
  if (!file) {
    throw new AppError(400, 'file query parameter is required', { param: 'file' })
  }

  const branch = query.branch || 'main'
  const base = query.base || 'HEAD~1'

  // 404 for a file that does not exist on disk.
  if (!existsSync(file)) {
    throw new AppError(404, `File "${file}" not found`, { file })
  }

  // Resolve the changed file to traceable artifact ids deterministically so
  // the report is produced regardless of how the underlying generator resolves
  // files. The generator still receives the file change for its own analysis.
  const resolvedIds = resolveFileToArtifactIds(file)
  const generator = new ImpactReportGenerator()
  const report = await generator.generate({ fileChanges: [file], artifactIds: resolvedIds })

  const commitCount = countCommits(base, branch)

  return reply.send({
    report,
    generatedAt: new Date().toISOString(),
    metadata: { file, branch, base, commitCount },
  })
}

/**
 * Deterministically resolve a changed file path to traceable artifact ids in
 * the graph. Uses exact id match and file-stem matching so the resolution does
 * not depend on generator internals.
 */
function resolveFileToArtifactIds(file: string): string[] {
  const db = getGraphDatabase()
  const nodes = db.getGraphNodes()
  const ids = new Set(nodes.map(n => n.id))
  const base = file.split(/[\\/]/).pop() ?? file
  const stem = base.replace(/\.[^.]+$/, '')

  const resolved = new Set<string>()
  if (ids.has(file)) resolved.add(file)
  else if (ids.has(stem)) resolved.add(stem)
  else {
    for (const n of nodes) {
      const nodeStem = n.id.split(/[\\/]/).pop()?.replace(/\.[^.]+$/, '') ?? n.id
      if (nodeStem === stem) resolved.add(n.id)
    }
  }
  return [...resolved]
}

/**
 * Count commits between `base` and `branch` using git. Best-effort: returns 0
 * when git is unavailable or the range is invalid so the report can still be
 * produced.
 */
function countCommits(base: string, branch: string): number {
  try {
    const out = execFileSync('git', ['rev-list', '--count', `${base}..${branch}`], {
      cwd: process.cwd(),
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 5000,
    })
    const parsed = parseInt(out.trim(), 10)
    return Number.isFinite(parsed) ? parsed : 0
  } catch {
    return 0
  }
}

export async function getTraceabilityRecommendations (request: FastifyRequest, reply: FastifyReply) {
  const query = request.query as {
    severity?: string | string[]
    type?: string | string[]
    limit?: string
    minConfidence?: string
  }

  const severity = parseList(query.severity) as RecommendationSeverity[] | undefined
  const type = parseList(query.type) as RecommendationType[] | undefined
  const limit = query.limit ? Number(query.limit) : undefined
  const minConfidence = query.minConfidence ? Number(query.minConfidence) : undefined

  if (query.limit && (isNaN(limit!) || limit! < 0)) {
    throw new AppError(400, 'Invalid limit parameter. Must be a non-negative number.', { param: 'limit', value: limit })
  }
  if (query.minConfidence && (isNaN(minConfidence!) || minConfidence! < 0 || minConfidence! > 1)) {
    throw new AppError(400, 'Invalid minConfidence parameter. Must be between 0 and 1.', { param: 'minConfidence', value: minConfidence })
  }

  const recommendations = await recommendationEngine.generateFromGraph()
  const response = recommendationEngine.query(recommendations, { severity, type, limit, minConfidence })

  return reply.send({ ...response, data: response.recommendations })
}

/**
 * Derive gate metrics from the live graph: overall coverage %, cross-artifact
 * gap count, and which required trace types are absent.
 */
async function computeGateMetrics(config: TraceGateConfig): Promise<GateMetrics> {
  const coverage = await coverageAnalyzer.analyzeFromGraph()
  const gaps = crossArtifactGapAnalyzer.analyzeFromGraph()
  const presentTypes = new Set(getGraphDatabase().getGraphNodes().map(n => String(n.type)))
  const missingTypes = config.requireTypes.filter(t => !presentTypes.has(t))
  return { coveragePercent: coverage.overallCoveragePercent, gapCount: gaps.length, missingTypes }
}

export async function getTraceabilityGate (request: FastifyRequest, reply: FastifyReply) {
  const query = request.query as {
    coverageThreshold?: string
    maxGaps?: string
    requireTypes?: string | string[]
    mode?: string
  }

  const base = getGateConfig()

  const overrides: Partial<TraceGateConfig> = {}
  if (query.coverageThreshold !== undefined) {
    const v = Number(query.coverageThreshold)
    if (!Number.isFinite(v)) throw new AppError(400, 'coverageThreshold must be a number', { param: 'coverageThreshold', value: query.coverageThreshold })
    overrides.coverageThreshold = v
  }
  if (query.maxGaps !== undefined) {
    const v = Number(query.maxGaps)
    if (!Number.isFinite(v)) throw new AppError(400, 'maxGaps must be a number', { param: 'maxGaps', value: query.maxGaps })
    overrides.maxGaps = v
  }
  const requireTypes = parseList(query.requireTypes)
  if (requireTypes) overrides.requireTypes = requireTypes
  if (query.mode === 'block' || query.mode === 'warn') overrides.mode = query.mode as GateMode

  const config = normalizeGateConfig({ ...base, ...overrides })
  const metrics = await computeGateMetrics(config)
  const result = evaluateGate(metrics, config)

  return reply.send(result)
}

export async function getTraceabilityGateConfig (request: FastifyRequest, reply: FastifyReply) {
  return reply.send(getGateConfig())
}

export async function putTraceabilityGateConfig (request: FastifyRequest, reply: FastifyReply) {
  const body = request.body as Partial<TraceGateConfig> | undefined
  const { config, errors } = validateGateConfig(body)
  if (errors.length > 0) {
    throw new AppError(400, 'Invalid gate config', { errors })
  }

  const saved = putGateConfig(config ?? {})
  return reply.send(saved)
}

export function traceabilityRoutes (server: FastifyInstance) {
  server.get('/api/traceability/graph', getTraceabilityGraph)
  server.get('/api/traceability/impact/:artifactId', getTraceabilityImpact)
  server.get('/api/traceability/dependencies', getTraceabilityDependencies)
  server.get('/api/traceability/coverage', getTraceabilityCoverage)
  server.get('/api/traceability/report', getTraceabilityReport)
  server.get('/api/traceability/impact-report', getTraceabilityImpactReport)
  server.get('/api/traceability/recommendations', getTraceabilityRecommendations)
  server.get('/api/traceability/gate', getTraceabilityGate)
  server.get('/api/traceability/gate-config', getTraceabilityGateConfig)
  server.put('/api/traceability/gate-config', putTraceabilityGateConfig)
}
