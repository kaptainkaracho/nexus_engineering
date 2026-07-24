import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { LifecycleState, artifactRegistry, now } from '../artifacts/repository'
import type { ArtifactType, PatchArtifactInput } from '../artifacts/repository'
import { AppError } from '../lib/errorHandler'

const VALID_ARTIFACT_TYPES = ['requirement', 'architecture', 'adr', 'spec', 'unknown'] as const
const VALID_LIFECYCLE_STATES: LifecycleState[] = ['discovered', 'parsed', 'indexed', 'related', 'error']

export async function artifactRegistryRoutes(server: FastifyInstance) {
  // =========================================================
  // GET /api/artifacts/registry
  // Returns all artifacts and aggregate summary
  // =========================================================
  server.get('/api/artifacts/registry', async (_request: FastifyRequest, reply: FastifyReply) => {
    const all = artifactRegistry.getAll()
    const summary = artifactRegistry.getSummary()
    return reply.send({ data: all, summary })
  })

  // =========================================================
  // GET /api/artifacts/registry/type/:type
  // Filter by artifact type (requirement, architecture, adr, spec)
  // =========================================================
  server.get('/api/artifacts/registry/type/:type', async (request: FastifyRequest, reply: FastifyReply) => {
    const { type } = request.params as { type: ArtifactType }

    if (!(VALID_ARTIFACT_TYPES as readonly string[]).includes(type)) {
      throw new AppError(400, `Invalid artifact type '${type}'`, { allowed: VALID_ARTIFACT_TYPES })
    }

    const artifacts = artifactRegistry.getByType(type)
    return reply.send({ data: artifacts, total: artifacts.length, filter: { type } })
  })

  // =========================================================
  // GET /api/artifacts/registry/:id
  // Get artifact by ID with full lifecycle details
  // =========================================================
  server.get('/api/artifacts/registry/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string }

    if (!id) {
      throw new AppError(400, 'Artifact ID is required', { param: 'id' })
    }

    const artifact = artifactRegistry.get(id)
    if (!artifact) {
      throw new AppError(404, 'Artifact not found', { resourceId: id })
    }
    return reply.send({ data: artifact })
  })

  // =========================================================
  // PATCH /api/artifacts/registry/:id
  // Update lifecycle state and/or metadata
  // =========================================================
  server.patch('/api/artifacts/registry/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string }
    const body = (request.body ?? {}) as Record<string, unknown>

    if (!id) {
      throw new AppError(400, 'Artifact ID is required', { param: 'id' })
    }

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
      throw new AppError(404, 'Artifact not found', { resourceId: id })
    }

    // Validate lifecycle value if provided
    if (body.lifecycle && !(VALID_LIFECYCLE_STATES as readonly string[]).includes(body.lifecycle as string)) {
      throw new AppError(400, `Invalid lifecycle state '${body.lifecycle}'`, { allowed: VALID_LIFECYCLE_STATES })
    }

    const lifecycleTarget = body.lifecycle as LifecycleState | undefined
    if (lifecycleTarget && !allowedTransitions[currentArtifact.lifecycle].includes(lifecycleTarget)) {
      const allowed = allowedTransitions[currentArtifact.lifecycle]
      throw new AppError(409, `Cannot transition from '${currentArtifact.lifecycle}' to '${lifecycleTarget}'`, { allowed })
    }

    const patchBody: PatchArtifactInput = {
      lifecycle: body.lifecycle as LifecycleState,
      metadata: typeof body.metadata === 'object' ? (body.metadata as Record<string, unknown>) : undefined,
    }

    const updated = artifactRegistry.update(id, patchBody)
    if (!updated) {
      throw new AppError(404, 'Artifact not found', { resourceId: id })
    }

    return reply.send({ data: updated, success: true })
  })

  // =========================================================
  // POST /api/artifacts/registry/:id/reparse
  // Reset to discovered and mark for re-parse
  // =========================================================
  server.post('/api/artifacts/registry/:id/reparse', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string }

    if (!id) {
      throw new AppError(400, 'Artifact ID is required', { param: 'id' })
    }

    const artifact = artifactRegistry.get(id)
    if (!artifact) {
      throw new AppError(404, 'Artifact not found', { resourceId: id })
    }

    const updated = artifactRegistry.update(id, { lifecycle: 'discovered', metadata: { reparseRequestedAt: now(), originalLifecycle: artifact.lifecycle } })
    if (!updated) {
      throw new AppError(404, 'Artifact not found', { resourceId: id })
    }

    return reply.send({ data: updated, success: true })
  })
}
