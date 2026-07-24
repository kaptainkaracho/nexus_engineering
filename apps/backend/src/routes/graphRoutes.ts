import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import type { GraphNode, GraphEdge, TraceabilityGraph } from '../graphBuilder/graphBuilder'
import { graphRepository } from '../graphBuilder/repository'
import { AppError } from '../lib/errorHandler'

export async function getTraceabilityGraph (_: FastifyRequest, reply: FastifyReply) {
  const graph = await graphRepository.getTraceabilityGraph()
  return reply.send(graph)
}

export async function getFilteredTraceabilityGraph (request: FastifyRequest, reply: FastifyReply) {
  const {
    sourceTypes,
    targetTypes,
    relationships
  } = request.query as {
    sourceTypes?: string[]
    targetTypes?: string[]
    relationships?: string[]
  }

  const graph = await graphRepository.getFilteredTraceabilityGraph(
    sourceTypes,
    targetTypes,
    relationships
  )

  return reply.send({
    ...graph,
    filters: {
      sourceTypes,
      targetTypes,
      relationships
    }
  })
}

export async function getConfidenceSortedTraceabilityGraph (
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { descending = true } = request.query as { descending?: boolean }

  const graph = await graphRepository.getConfidenceSortedTraceabilityGraph(descending)

  return reply.send({
    ...graph,
    sort: {
      by: 'confidence',
      descending
    }
  })
}

export async function getTraceGraph(_: FastifyRequest, reply: FastifyReply) {
  const graph = await graphRepository.getTraceabilityGraph()
  return reply.send({
    nodes: graph.nodes as GraphNode[],
    edges: graph.edges as GraphEdge[],
    totalNodes: graph.totalNodes,
    totalEdges: graph.totalEdges
  })
}

export function graphBuilderRoutes (server: FastifyInstance) {
  server.get('/api/graph/traceability', getTraceabilityGraph)
  server.get('/api/graph/traceability/filtered', getFilteredTraceabilityGraph)
  server.get('/api/graph/traceability/sorted', getConfidenceSortedTraceabilityGraph)
  server.get('/api/trace-graph', getTraceGraph)
}
