import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import type { TraceLink } from '@nexus-engineering/shared'
import { traceLinkRepository } from '../traceabilityLinks/repository'

export async function listTraceLinks (_: FastifyRequest, reply: FastifyReply) {
  try {
    const traceLinks = await traceLinkRepository.listTraceLinks()
    return reply.send({
      traceLinks,
      total: traceLinks.length
    })
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to list traceability links' })
  }
}

export async function getTraceLink (request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }

    if (!id) {
      return reply.status(400).send({ error: 'Trace link ID is required' })
    }

    const traceLink = await traceLinkRepository.getTraceLink(id)
    
    if (!traceLink) {
      return reply.status(404).send({ error: 'Traceability link not found' })
    }

    return reply.send(traceLink)
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to get traceability link' })
  }
}

export async function createTraceLink (request: FastifyRequest, reply: FastifyReply) {
  try {
    const traceLink = request.body as TraceLink

  if (!traceLink.sourceId || !traceLink.sourceType || !traceLink.targetId || !traceLink.targetType || !traceLink.relationshipType || traceLink.confidence === undefined) {
    return reply.status(400).send({ error: 'Source ID, source type, target ID, target type, relationship type and confidence are required' })
  }

    const createdTraceLink = await traceLinkRepository.createTraceLink({
      ...traceLink,
      id: '', // Will be generated
      version: '1.0',
      createdAt: new Date(),
      updatedAt: new Date()
    })

    return reply.status(201).send(createdTraceLink)
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to create traceability link' })
  }
}

export async function updateTraceLink (request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }
    const updates = request.body as Partial<TraceLink>

    if (!id) {
      return reply.status(400).send({ error: 'Trace link ID is required' })
    }

    const updatedTraceLink = await traceLinkRepository.updateTraceLink(id, updates)
    
    if (!updatedTraceLink) {
      return reply.status(404).send({ error: 'Traceability link not found' })
    }

    return reply.send(updatedTraceLink)
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to update traceability link' })
  }
}

export async function deleteTraceLink (request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }

    if (!id) {
      return reply.status(400).send({ error: 'Trace link ID is required' })
    }

    const success = await traceLinkRepository.deleteTraceLink(id)
    
    if (!success) {
      return reply.status(404).send({ error: 'Traceability link not found' })
    }

    return reply.send({ message: `Traceability link ${id} deleted successfully` })
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to delete traceability link' })
  }
}

export async function getTraceLinksBySource (request: FastifyRequest, reply: FastifyReply) {
  try {
    const { sourceType, sourceId } = request.params as { sourceType: string; sourceId: string }

    if (!sourceType || !sourceId) {
      return reply.status(400).send({ error: 'Source type and ID are required' })
    }

    const traceLinks = await traceLinkRepository.getTraceLinksBySource(sourceType, sourceId)
    
    return reply.send({
      traceLinks,
      sourceType,
      sourceId,
      total: traceLinks.length
    })
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to filter traceability links by source' })
  }
}

export async function getTraceLinksByTarget (request: FastifyRequest, reply: FastifyReply) {
  try {
    const { targetType, targetId } = request.params as { targetType: string; targetId: string }

    if (!targetType || !targetId) {
      return reply.status(400).send({ error: 'Target type and ID are required' })
    }

    const traceLinks = await traceLinkRepository.getTraceLinksByTarget(targetType, targetId)

    return reply.send({
      traceLinks,
      targetType,
      targetId,
      total: traceLinks.length
    })
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to filter traceability links by target' })
  }
}

export function traceabilityLinksRoutes (server: FastifyInstance) {
  server.get('/api/trace-links', listTraceLinks)
  server.get('/api/trace-links/:id', getTraceLink)
  server.get('/api/trace-links/source/:sourceType/:sourceId', getTraceLinksBySource)
  server.get('/api/trace-links/target/:targetType/:targetId', getTraceLinksByTarget)
  server.post('/api/trace-links', createTraceLink)
  server.put('/api/trace-links/:id', updateTraceLink)
  server.delete('/api/trace-links/:id', deleteTraceLink)
}
