import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { LifecycleState, artifactRegistry, now } from './repository'
import type { ArtifactType } from './repository'

export async function artifactRegistryRoutes(server: FastifyInstance) {
  // =========================================================
  // GET /api/artifacts/registry
  // Returns all artifacts and aggregate summary
  // =========================================================
  server.get('/api/artifacts/registry', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const all = artifactRegistry.getAll()
      const summary = artifactRegistry.getSummary()
      return reply.send({ data: all, summary })
    } catch (error) {
      server.log.error(error as Error)
      return reply.status(500).send({ error: 'Failed to list artifacts' })
    }
  })

  // =========================================================
  // GET /api/artifacts/registry/type/:type
  // Filter by artifact type (requirement, architecture, adr, spec)
  // =========================================================
  server.get('/api/artifacts/registry/type/:type', async (request: FastifyRequest, reply: FastifyReply) => {
    const { type } = request.params as { type: ArtifactType }

    if (!['requirement', 'architecture', 'adr', 'spec', 'unknown'].includes(type)) {
      return reply.status(400).send({ error: `Invalid artifact type '${type}'. Allowed: requirement, architecture, adr, spec` })
    }

    try {
      const artifacts = artifactRegistry.getByType(type)
      return reply.send({ data: artifacts, total: artifacts.length, filter: { type } })
    } catch (error) {
      server.log.error(error as Error)
      return reply.status(500).send({ error: 'Failed to query artifacts' })
    }
  })

  // =========================================================
  // GET /api/artifacts/registry/:id
  // Get artifact by ID with full lifecycle details
  // =========================================================
  server.get('/api/artifacts/registry/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string }

    try {
      const artifact = artifactRegistry.get(id)
      if (!artifact) {
        return reply.status(404).send({ error: 'Artifact not found' })
      }
      return reply.send({ data: artifact })
    } catch (error) {
      server.log.error(error as Error)
      return reply.status(500).send({ error: 'Failed to get artifact' })
    }
  })

  // =========================================================
  // PATCH /api/artifacts/registry/:id
  // Update lifecycle state and/or metadata
  // =========================================================
  server.patch('/api/artifacts/registry/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string }
    const body = (request.body ?? {}) as Record<string, unknown>

    // Validate allowed transitions
    const allowedTransitions: Record<LifecycleState, string[]> = {
      discovered: ['parsed', 'error'],
      parsed: ['indexed'],
      indexed: ['related'],
      related: [],
      error: ['discovered'],
    }

    const currentArtifact = artifactRegistry.get(id)
    if (!currentArtifact) {
      return reply.status(404).send({ error: 'Artifact not found' })
    }

    const lifecycleTarget = body.lifecycle as LifecycleState | undefined
    if (lifecycleTarget && !allowedTransitions[currentArtifact.lifecycle].includes(lifecycleTarget)) {
      const allowedStr = allowedTransitions[lifecycleTarget]?.join(', ') ?? '<none>'
      return reply.status(409).send({ error: `Cannot transition from '${currentArtifact.lifecycle}' to '${lifecycleTarget}'. Allowed: ${allowedStr}` })
    }

    // Validate lifecycle value if provided
    const validLifecycle: LifecycleState[] = ['discovered', 'parsed', 'indexed', 'related', 'error']
    if (body.lifecycle && !validLifecycle.includes(body.lifecycle as LifecycleState)) {
      return reply.status(400).send({ error: `Invalid lifecycle state '${body.lifecycle}'.` })
    }

    const patchBody = {
      lifecycle: body.lifecycle,
      metadata: typeof body.metadata === 'object' ? (body.metadata as Record<string, unknown>) : undefined,
    }

    try {
      // If setting lifecycle to parsed or error without an explicit message, set a default message
      const updated = artifactRegistry.update(id, patchBody)
      if (!updated) return reply.status(404).send({ error: 'Artifact not found' })

      return reply.send({ data: updated, success: true })
    } catch (error) {
      server.log.error(error as Error)
      return reply.status(500).send({ error: 'Failed to update artifact' })
    }
  })

  // =========================================================
  // POST /api/artifacts/registry/:id/reparse
  // Reset to discovered and mark for re-parse
  // =========================================================
  server.post('/api/artifacts/registry/:id/reparse', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string }

    try {
      const artifact = artifactRegistry.get(id)
      if (!artifact) {
        return reply.status(404).send({ error: 'Artifact not found' })
      }

      const updated = artifactRegistry.update(id, { lifecycle: 'discovered', metadata: { reparseRequestedAt: now(), originalLifecycle: artifact.lifecycle } })
      if (!updated) return reply.status(404).send({ error: 'Artifact not found' })

      return reply.send({ data: updated, success: true })
    } catch (error) {
      server.log.error(error as Error)
      return reply.status(500).send({ error: 'Failed to re-parse artifact' })
    }
  })
}
