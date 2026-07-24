import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import type { TraceLink } from '@nexus-engineering/shared'
import { traceLinkRepository } from '../traceabilityLinks/repository'
import { AppError } from '../lib/errorHandler'

export async function listTraceLinks (_: FastifyRequest, reply: FastifyReply) {
  const traceLinks = await traceLinkRepository.listTraceLinks()
  return reply.send({
    traceLinks,
    total: traceLinks.length
  })
}

export async function getTraceLink (request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }

  if (!id) {
    throw new AppError(400, 'Trace link ID is required', { param: 'id' })
  }

  const traceLink = await traceLinkRepository.getTraceLink(id)
  if (!traceLink) {
    throw new AppError(404, 'Traceability link not found', { resourceId: id })
  }

  return reply.send(traceLink)
}

export async function createTraceLink (request: FastifyRequest, reply: FastifyReply) {
  const traceLink = request.body as TraceLink

  if (!traceLink.sourceId || !traceLink.sourceType || !traceLink.targetId || !traceLink.targetType || !traceLink.relationshipType || traceLink.confidence === undefined) {
    throw new AppError(400, 'Source ID, source type, target ID, target type, relationship type and confidence are required', {
      param: 'sourceId, sourceType, targetId, targetType, relationshipType, confidence'
    })
  }

  const createdTraceLink = await traceLinkRepository.createTraceLink({
    ...traceLink,
    id: '', // Will be generated
    version: '1.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })

  return reply.status(201).send(createdTraceLink)
}

export async function updateTraceLink (request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  const updates = request.body as Partial<TraceLink>

  if (!id) {
    throw new AppError(400, 'Trace link ID is required', { param: 'id' })
  }

  const updatedTraceLink = await traceLinkRepository.updateTraceLink(id, updates)
  if (!updatedTraceLink) {
    throw new AppError(404, 'Traceability link not found', { resourceId: id })
  }

  return reply.send(updatedTraceLink)
}

export async function deleteTraceLink (request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }

  if (!id) {
    throw new AppError(400, 'Trace link ID is required', { param: 'id' })
  }

  const success = await traceLinkRepository.deleteTraceLink(id)
  if (!success) {
    throw new AppError(404, 'Traceability link not found', { resourceId: id })
  }

  return reply.send({ message: `Traceability link ${id} deleted successfully` })
}

export async function getTraceLinksBySource (request: FastifyRequest, reply: FastifyReply) {
  const { sourceType, sourceId } = request.params as { sourceType: string; sourceId: string }

  if (!sourceType || !sourceId) {
    throw new AppError(400, 'Source type and ID are required', { param: 'sourceType, sourceId' })
  }

  const traceLinks = await traceLinkRepository.getTraceLinksBySource(sourceType, sourceId)
  return reply.send({
    traceLinks,
    sourceType,
    sourceId,
    total: traceLinks.length
  })
}

export async function getTraceLinksByTarget (request: FastifyRequest, reply: FastifyReply) {
  const { targetType, targetId } = request.params as { targetType: string; targetId: string }

  if (!targetType || !targetId) {
    throw new AppError(400, 'Target type and ID are required', { param: 'targetType, targetId' })
  }

  const traceLinks = await traceLinkRepository.getTraceLinksByTarget(targetType, targetId)
  return reply.send({
    traceLinks,
    targetType,
    targetId,
    total: traceLinks.length
  })
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
