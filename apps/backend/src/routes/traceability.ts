import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import type { ImpactScope, TraceabilityReport, DomainCoverage } from '@nexus-engineering/shared'
import { traverseGraph } from '../services/traceabilityService'
import { resolveNodeRepo } from '../services/crossRepoTraversal'
import { impactAnalyzer } from '../ai/impactAnalyzer'
import { coverageAnalyzer } from '../ai/coverageAnalyzer'
import { getLLMClient } from '../ai/llmClient'
import { buildTraceabilityReportPrompt } from '../ai/promptTemplates'
import { getGraphDatabase } from '../graphBuilder/graphDatabase'

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

export async function getTraceabilityDependencies (request: FastifyRequest, reply: FastifyReply) {
  try {
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
      return reply.status(400).send({ error: 'Invalid depth parameter. Must be a number between 0 and 100.' })
    }

    // Validate direction parameter
    const validDirections = ['both', 'upstream', 'downstream'] as const
    const parsedDirection = (direction as typeof validDirections[number]) ?? 'both'
    if (!validDirections.includes(parsedDirection)) {
      return reply.status(400).send({ error: `Invalid direction parameter. Must be one of: ${validDirections.join(', ')}` })
    }

    // Validate artifactId if provided
    if (artifactId) {
      const db = getGraphDatabase()
      const node = db.getNode(artifactId)
      if (!node) {
        return reply.status(404).send({ error: `Artifact "${artifactId}" not found`, availableArtifacts: db.getGraphNodes().map(n => ({ id: n.id, type: n.type, title: n.title || n.name })) })
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

    let nodeIdSet = new Set(filteredEdges.map(e => e.source_id).concat(filteredEdges.map(e => e.target_id)))
    let filteredNodes = result.nodes.filter(n => nodeIdSet.has(n.id))

    // Cross-repo scoping: when repoUrl is supplied, restrict the unified graph to
    // the requested repositories and annotate every node/edge with repo boundary
    // information so the client can render a merged multi-repo dependency tree.
    let crossRepo: { repos: string[]; crossRepoEdgeCount: number } | undefined
    if (repos && repos.length) {
      const repoScope = new Set(repos)
      filteredNodes = filteredNodes.filter(n => repoScope.has(resolveNodeRepo(n.id)))
      nodeIdSet = new Set(filteredNodes.map(n => n.id))
      filteredEdges = filteredEdges.filter(e => nodeIdSet.has(e.source_id) && nodeIdSet.has(e.target_id))
    }

    if (repos !== undefined) {
      filteredNodes = filteredNodes.map(n => ({ ...n, repo: resolveNodeRepo(n.id) })) as typeof filteredNodes
      filteredEdges = filteredEdges.map(e => {
        const sourceRepo = resolveNodeRepo(e.source_id)
        const targetRepo = resolveNodeRepo(e.target_id)
        return { ...e, sourceRepo, targetRepo, crossRepo: sourceRepo !== targetRepo }
      }) as typeof filteredEdges
      crossRepo = {
        repos: Array.from(new Set(filteredNodes.map(n => resolveNodeRepo(n.id)))).sort(),
        crossRepoEdgeCount: filteredEdges.filter(e => resolveNodeRepo(e.source_id) !== resolveNodeRepo(e.target_id)).length,
      }
    }

    const response: {
      artifactId?: string
      depth?: number
      direction: string
      relationshipTypes?: string[]
      repoUrl?: string[]
      repos?: string[]
      crossRepoEdgeCount?: number
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
      repoUrl: repos,
      repos: crossRepo?.repos,
      crossRepoEdgeCount: crossRepo?.crossRepoEdgeCount,
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
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to compute dependency graph' })
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
  server.get('/api/traceability/dependencies', getTraceabilityDependencies)
  server.get('/api/traceability/coverage', getTraceabilityCoverage)
  server.get('/api/traceability/report', getTraceabilityReport)
}
