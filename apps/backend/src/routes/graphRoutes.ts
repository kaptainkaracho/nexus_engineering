import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import type { GraphNode, GraphEdge, TraceabilityGraph } from '../graphBuilder/graphBuilder'
import { graphRepository } from '../graphBuilder/repository'

export async function getTraceabilityGraph (_: FastifyRequest, reply: FastifyReply) {
  try {
    const graph = await graphRepository.getTraceabilityGraph()
    return reply.send(graph)
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to generate traceability graph' })
  }
}

export async function getFilteredTraceabilityGraph (request: FastifyRequest, reply: FastifyReply) {
  try {
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
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to generate filtered traceability graph' })
  }
}

export async function getConfidenceSortedTraceabilityGraph (
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const { descending = true } = request.query as { descending?: boolean }
    
    const graph = await graphRepository.getConfidenceSortedTraceabilityGraph(descending)
    
    return reply.send({
      ...graph,
      sort: {
        by: 'confidence',
        descending
      }
    })
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to generate confidence-sorted traceability graph' })
  }
}

export async function getTraceGraph(_: FastifyRequest, reply: FastifyReply) {
  try {
    const graph = await graphRepository.getTraceabilityGraph()
    return reply.send({
      nodes: graph.nodes as GraphNode[],
      edges: graph.edges as GraphEdge[],
      totalNodes: graph.totalNodes,
      totalEdges: graph.totalEdges
    })
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to generate traceability graph' })
  }
}

export function graphBuilderRoutes (server: FastifyInstance) {
  server.get('/api/graph/traceability', getTraceabilityGraph)
  server.get('/api/graph/traceability/filtered', getFilteredTraceabilityGraph)
  server.get('/api/graph/traceability/sorted', getConfidenceSortedTraceabilityGraph)
  server.get('/api/trace-graph', getTraceGraph)
}
