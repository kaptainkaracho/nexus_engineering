import type { GraphNodeRow, GraphEdgeRow } from '../graphBuilder/graphDatabase'
import { getGraphDatabase } from '../graphBuilder/graphDatabase'
import { impactAnalyzer } from './impactAnalyzer'
import type {
  NLQueryIntent,
  NLQueryEntityFilters,
  ParsedNLQuery,
  NLQueryTraceLink,
  NLQueryResultItem,
  NLQueryResult,
} from '@nexus-engineering/shared'

/**
 * NL Query Parser + Executor (THE-293).
 *
 * A keyword-based (non-NLP) natural-language query engine over the
 * traceability graph. `NLQueryParser.parse()` is pure and trivially
 * unit-testable. `NLQueryExecutor.execute()` resolves the parsed intent
 * against the live graph via the existing services (graph database, impact
 * analyzer, recommendation engine).
 *
 * Examples handled:
 *  - "Show me all untested requirements in the auth module"
 *  - "What features are affected by changes to login.ts?"
 *  - "Which ADRs are linked to the RBAC implementation?"
 */

export class NLQueryParser {
  parse(query: string): ParsedNLQuery {
    const raw = typeof query === 'string' ? query : ''
    const text = raw.toLowerCase()
    const intent = this.classifyIntent(text)
    const entityFilters = this.extractEntities(raw, text)
    return { intent, entityFilters, rawQuery: raw }
  }

  private classifyIntent(text: string): NLQueryIntent {
    if (/\b(impact|affected|changes?|changed)\b/.test(text)) return 'impact_query'
    if (/\badrs?\b|architecture decision|architecture model|architectural decision/.test(text)) return 'adr_query'
    if (/\brequirements?\b/.test(text)) return 'requirement_query'
    if (/\bfeatures?\b/.test(text)) return 'feature_query'
    return 'test_query'
  }

  private extractEntities(raw: string, text: string): NLQueryEntityFilters {
    const filters: NLQueryEntityFilters = {}

    // File: "changes to <file>", "changed <file>", "file <file>", or any
    // bare source-file token (e.g. login.ts).
    const fileMatch =
      raw.match(/\b(?:changes?\s+to|changed?|file)\s+([\w./\\-]+\.[a-z0-9]+)/i) ??
      raw.match(/\b([\w./\\-]+\.(?:ts|tsx|js|jsx|py|go|java|rb|rs|cs))\b/i)
    if (fileMatch) filters.file = fileMatch[1]

    // Module: "in|for|within|module [the] <X>" or "linked to [the] <X> implementation".
    const moduleMatch =
      raw.match(/\b(?:in|for|within|module)\s+(?:the\s+)?([a-z0-9_-]+)/i) ??
      raw.match(/\blinked\s+to\s+(?:the\s+)?([a-z0-9_-]+)\s+implementation/i)
    if (moduleMatch) {
      let m = moduleMatch[1]
      if (m.toLowerCase() === 'module') {
        const alt = raw.match(/\bmodule\s+([a-z0-9_-]+)/i)
        if (alt) m = alt[1]
      }
      filters.module = m
    }

    // Status keyword.
    if (/\buntested\b/.test(text)) filters.status = 'untested'
    else if (/\borphan\b/.test(text)) filters.status = 'orphan'
    else if (/\bstale\b/.test(text)) filters.status = 'stale'
    else if (/\blinked\b/.test(text)) filters.status = 'linked'

    return filters
  }
}

export class NLQueryExecutor {
  async execute(parsed: ParsedNLQuery): Promise<NLQueryResult> {
    const start = Date.now()
    const db = getGraphDatabase()
    const nodes = db.getGraphNodes()
    const edges = db.getGraphEdges()

    let results: NLQueryResultItem[] = []

    switch (parsed.intent) {
      case 'impact_query':
        results = await this.executeImpact(parsed, nodes, edges)
        break
      case 'requirement_query':
        results = this.executeByType('requirement', parsed, nodes, edges)
        break
      case 'feature_query':
        results = this.executeByType('feature', parsed, nodes, edges)
        break
      case 'adr_query':
        results = this.executeByType('architectureModel', parsed, nodes, edges)
        break
      case 'test_query':
        results = this.executeByType('testCase', parsed, nodes, edges)
        break
    }

    return {
      query: parsed,
      results,
      totalResults: results.length,
      metadata: {
        parsedIntent: parsed.intent,
        executionTimeMs: Date.now() - start,
      },
    }
  }

  private async executeImpact(
    parsed: ParsedNLQuery,
    nodes: GraphNodeRow[],
    edges: GraphEdgeRow[]
  ): Promise<NLQueryResultItem[]> {
    const nodeMap = new Map(nodes.map(n => [n.id, n]))
    let seedIds: string[] = []

    if (parsed.entityFilters.file) {
      seedIds = resolveFileToArtifactIds(parsed.entityFilters.file, nodes)
    }
    if (seedIds.length === 0 && parsed.entityFilters.module) {
      const mod = parsed.entityFilters.module.toLowerCase()
      seedIds = nodes
        .filter(n => n.id.toLowerCase().includes(mod) || (n.title ?? '').toLowerCase().includes(mod))
        .map(n => n.id)
    }
    if (seedIds.length === 0) return []

    return impactAnalyzer
      .analyzeV2({ artifactIds: seedIds })
      .then(analysis =>
        analysis.artifacts.map(a =>
          buildResultItem(
            { id: a.id, type: a.type, title: a.title, name: undefined },
            edges,
            nodeMap
          )
        )
      )
      .catch(() => [])
  }

  private executeByType(
    type: GraphNodeRow['type'],
    parsed: ParsedNLQuery,
    nodes: GraphNodeRow[],
    edges: GraphEdgeRow[]
  ): NLQueryResultItem[] {
    const nodeMap = new Map(nodes.map(n => [n.id, n]))
    const outgoing = new Map<string, GraphEdgeRow[]>()
    const incoming = new Map<string, GraphEdgeRow[]>()
    for (const n of nodes) {
      outgoing.set(n.id, [])
      incoming.set(n.id, [])
    }
    for (const e of edges) {
      outgoing.get(e.source_id)?.push(e)
      incoming.get(e.target_id)?.push(e)
    }

    let filtered = nodes.filter(n => n.type === type)

    if (parsed.entityFilters.module) {
      const mod = parsed.entityFilters.module.toLowerCase()
      filtered = filtered.filter(
        n => n.id.toLowerCase().includes(mod) || (n.title ?? '').toLowerCase().includes(mod)
      )
    }

    const status = parsed.entityFilters.status
    if (status === 'untested') {
      // No downstream (outgoing) trace link — nothing it depends on / satisfies.
      filtered = filtered.filter(n => (outgoing.get(n.id)?.length ?? 0) === 0)
    } else if (status === 'orphan') {
      // No links at all.
      filtered = filtered.filter(
        n =>
          (outgoing.get(n.id)?.length ?? 0) === 0 &&
          (incoming.get(n.id)?.length ?? 0) === 0
      )
    } else if (status === 'linked') {
      filtered = filtered.filter(n => (outgoing.get(n.id)?.length ?? 0) > 0)
    } else if (status === 'stale') {
      // Has at least one low-confidence edge.
      filtered = filtered.filter(
        n => [...(outgoing.get(n.id) ?? []), ...(incoming.get(n.id) ?? [])].some(e => e.confidence === 'low')
      )
    }

    return filtered.map(n => buildResultItem(n, edges, nodeMap))
  }
}

function buildResultItem(
  node: { id: string; type: string; title?: string; name?: string },
  edges: GraphEdgeRow[],
  nodeMap: Map<string, GraphNodeRow>
): NLQueryResultItem {
  const outgoing = edges.filter(e => e.source_id === node.id)
  const traceLinks: NLQueryTraceLink[] = outgoing.map(e => ({
    targetId: e.target_id,
    targetType: nodeMap.get(e.target_id)?.type ?? '',
    relationshipType: e.relationship_type,
    confidence: e.confidence,
  }))
  return {
    id: node.id,
    type: node.type,
    title: node.title,
    name: node.name,
    traceLinks: traceLinks.length ? traceLinks : undefined,
  }
}

/**
 * Deterministically resolve a changed file path to traceable artifact ids.
 * Mirrors the resolution used in the traceability routes so impact queries
 * behave consistently. Uses exact id, file-stem, and node-stem matching.
 */
function resolveFileToArtifactIds(file: string, nodes: GraphNodeRow[]): string[] {
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

export const nlQueryParser = new NLQueryParser()
export const nlQueryExecutor = new NLQueryExecutor()
