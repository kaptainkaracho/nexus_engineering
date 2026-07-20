import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { impactAnalysisService } from '../services/impactAnalysisService'
import { traverseGraph } from '../services/traceabilityService'

function parseList(value: unknown): string[] | undefined {
  if (value === undefined || value === null) return undefined
  if (Array.isArray(value)) return value.map(String)
  return String(value)
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
}

function parseNumber(value: unknown, fallback: number): number {
  if (value === undefined || value === null) return fallback
  const n = Number(value)
  return isNaN(n) ? fallback : Math.max(1, n)
}

// ---------------------------------------------------------------------------
// A.1 Impact API — GET /api/traceability/impact?artifactId=<id>
// Return ranked upstream AND downstream dependents with confidence scores
// Response contract (must match THE-259):
//   { artifactId, upstream: [{id, type, label, confidence}], downstream: [{id, type, label, confidence}] }
// ---------------------------------------------------------------------------

export async function getImpactByArtifact(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { artifactId } = request.query as { artifactId: string }
    if (!artifactId) {
      return reply.status(400).send({ error: 'artifactId query parameter is required' })
    }

    const depth = parseNumber((request.query as any).depth, 3)
    const confidenceThreshold = parseNumber((request.query as any).confidence, 0)

    const upstream = impactAnalysisService.getUpstreamDependencies(artifactId, depth)
    const downstream = impactAnalysisService.getDownstreamDependents(artifactId, depth)

    const mapDep = (d: { id: string; type: string; title?: string; confidenceScore: number }) => ({
      id: d.id,
      type: d.type,
      label: d.title ?? d.id,
      confidence: d.confidenceScore / 100,
    })

    const upstreamList = upstream.dependencies
      .filter(d => (d.confidenceScore / 100) >= confidenceThreshold)
      .map(mapDep)

    const downstreamList = downstream.dependents
      .filter(d => (d.confidenceScore / 100) >= confidenceThreshold)
      .map(mapDep)

    return reply.send({
      artifactId,
      upstream: upstreamList,
      downstream: downstreamList,
    })
  } catch (error) {
    request.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to perform impact analysis' })
  }
}

// ---------------------------------------------------------------------------
// C.1 Dependency API — GET /api/traceability/dependency?types=requirement,test
// Return dependency graph across ALL artifact types with type-based filtering
// Response contract (must match THE-259):
//   { nodes: [{id, type, label}], edges: [{source, target, type}] }
// ---------------------------------------------------------------------------

export async function getDependencyGraph(request: FastifyRequest, reply: FastifyReply) {
  try {
    const query = request.query as { types?: string; depth?: string }
    const types = parseList(query.types)
    const depth = parseNumber(query.depth, 3)

    const graph = traverseGraph({
      filter: types,
      depth,
    })

    const nodes = graph.nodes.map(n => ({
      id: n.id,
      type: n.type,
      label: n.title ?? n.name ?? n.id,
    }))

    const edges = graph.edges.map(e => ({
      source: e.source_id,
      target: e.target_id,
      type: e.relationship_type,
    }))

    return reply.send({ nodes, edges })
  } catch (error) {
    request.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to build dependency graph' })
  }
}

// ---------------------------------------------------------------------------
// Route registration
// ---------------------------------------------------------------------------

export function impactRoutes(server: FastifyInstance) {
  // A.1 Impact API (THE-260)
  server.get('/api/traceability/impact', getImpactByArtifact)

  // C.1 Dependency API (THE-257)
  server.get('/api/traceability/dependency', getDependencyGraph)
}
