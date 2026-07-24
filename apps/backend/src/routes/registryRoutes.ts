import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import type { ArtifactRegistry, RegistryCredentials, RegistryProviderType } from '@nexus-engineering/shared'
import { orgRepository } from '../organizations/repository'
import { authenticate, requirePermission, requireOrgRole } from '../auth/middleware'
import { artifactRegistry as artifactRegistryStore } from '../artifacts/repository'
import { registryScanner } from '../scanners/registryScanner'
import { AppError } from '../lib/errorHandler'

const VALID_REGISTRY_TYPES: RegistryProviderType[] = ['npm', 'pypi', 'maven', 'generic']
const VALID_AUTH_TYPES = ['none', 'basic', 'token', 'env'] as const

function validateRegistryType(type: string): type is RegistryProviderType {
  return VALID_REGISTRY_TYPES.includes(type as RegistryProviderType)
}

// --- Registry Handlers ---

// Org-scoped list resolved from the authenticated user (used by the frontend
// Private Registry dashboard, which calls GET /api/registries with no orgId).
async function listMyRegistries(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user!.sub

  const orgs = await orgRepository.listOrganizations(userId)
  if (!orgs.length) {
    return reply.send({ data: [], total: 0 })
  }

  const orgId = orgs[0].id
  const registries = await orgRepository.listRegistriesByOrganization(orgId)

  const data = await Promise.all(
    registries.map(async (registry) => ({
      ...registry,
      artifactCount: (await orgRepository.listRegistryArtifacts(registry.id)).length,
    })),
  )

  return reply.send({ data, total: data.length })
}

async function listRegistries(request: FastifyRequest, reply: FastifyReply) {
  const { orgId } = request.params as { orgId: string }

  if (!orgId) {
    throw new AppError(400, 'Organization ID is required', { param: 'orgId' })
  }

  const organization = await orgRepository.getOrganization(orgId)
  if (!organization) {
    throw new AppError(404, 'Organization not found', { resourceId: orgId })
  }

  const registries = await orgRepository.listRegistriesByOrganization(orgId)
  return reply.send({ registries, total: registries.length })
}

async function createRegistry(request: FastifyRequest, reply: FastifyReply) {
  const { orgId } = request.params as { orgId: string }
  const body = request.body as Partial<ArtifactRegistry>

  if (!orgId) {
    throw new AppError(400, 'Organization ID is required', { param: 'orgId' })
  }

  if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
    throw new AppError(400, 'Registry name is required', { param: 'name' })
  }

  if (body.name.trim().length > 128) {
    throw new AppError(400, 'Registry name must not exceed 128 characters', { param: 'name', maxLength: 128 })
  }

  if (body.visibility && !['private', 'team', 'organization'].includes(body.visibility)) {
    throw new AppError(400, 'Visibility must be "private", "team", or "organization"', { param: 'visibility', allowed: ['private', 'team', 'organization'] })
  }

  if (body.registryType && !validateRegistryType(body.registryType)) {
    throw new AppError(400, `Registry type must be one of: ${VALID_REGISTRY_TYPES.join(', ')}`, { param: 'registryType', allowed: VALID_REGISTRY_TYPES })
  }

  const organization = await orgRepository.getOrganization(orgId)
  if (!organization) {
    throw new AppError(404, 'Organization not found', { resourceId: orgId })
  }

  const registry = await orgRepository.createRegistry(orgId, {
    name: body.name.trim(),
    description: body.description ?? null,
    visibility: body.visibility || 'private',
    allowedRoles: body.allowedRoles || null,
    registryType: body.registryType || 'generic',
    url: body.url || null,
    enabled: body.enabled ?? true,
    createdBy: request.user!.sub,
  })

  return reply.status(201).send(registry)
}

async function getRegistry(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }

  if (!id) {
    throw new AppError(400, 'Registry ID is required', { param: 'id' })
  }

  const registry = await orgRepository.getRegistry(id)
  if (!registry) {
    throw new AppError(404, 'Registry not found', { resourceId: id })
  }

  return reply.send(registry)
}

async function updateRegistry(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  const body = request.body as Partial<ArtifactRegistry>

  if (!id) {
    throw new AppError(400, 'Registry ID is required', { param: 'id' })
  }

  if (body.name !== undefined && (typeof body.name !== 'string' || body.name.trim().length === 0)) {
    throw new AppError(400, 'Registry name must be a non-empty string', { param: 'name' })
  }

  if (body.visibility && !['private', 'team', 'organization'].includes(body.visibility)) {
    throw new AppError(400, 'Visibility must be "private", "team", or "organization"', { param: 'visibility', allowed: ['private', 'team', 'organization'] })
  }

  if (body.registryType && !validateRegistryType(body.registryType)) {
    throw new AppError(400, `Registry type must be one of: ${VALID_REGISTRY_TYPES.join(', ')}`, { param: 'registryType', allowed: VALID_REGISTRY_TYPES })
  }

  const existing = await orgRepository.getRegistry(id)
  if (!existing) {
    throw new AppError(404, 'Registry not found', { resourceId: id })
  }

  const updates: Partial<ArtifactRegistry> = {}
  if (body.name !== undefined) updates.name = body.name.trim()
  if (body.description !== undefined) updates.description = body.description
  if (body.visibility !== undefined) updates.visibility = body.visibility
  if (body.allowedRoles !== undefined) updates.allowedRoles = body.allowedRoles
  if (body.registryType !== undefined) updates.registryType = body.registryType
  if (body.url !== undefined) updates.url = body.url
  if (body.enabled !== undefined) updates.enabled = body.enabled

  const updated = await orgRepository.updateRegistry(id, updates)
  return reply.send(updated)
}

async function deleteRegistry(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }

  if (!id) {
    throw new AppError(400, 'Registry ID is required', { param: 'id' })
  }

  const existing = await orgRepository.getRegistry(id)
  if (!existing) {
    throw new AppError(404, 'Registry not found', { resourceId: id })
  }

  const success = await orgRepository.deleteRegistry(id)
  if (!success) {
    throw new AppError(404, 'Registry not found', { resourceId: id })
  }

  return reply.send({ message: `Registry ${id} deleted successfully` })
}

// --- Registry Artifact Handlers ---

async function listRegistryArtifacts(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }

  if (!id) {
    throw new AppError(400, 'Registry ID is required', { param: 'id' })
  }

  const registry = await orgRepository.getRegistry(id)
  if (!registry) {
    throw new AppError(404, 'Registry not found', { resourceId: id })
  }

  const registryArtifacts = await orgRepository.listRegistryArtifacts(id)
  const artifactIds = registryArtifacts.map(ra => ra.artifactId)
  const artifacts = artifactIds
    .map(aid => artifactRegistryStore.get(aid))
    .filter(Boolean)

  return reply.send({
    data: artifacts,
    links: registryArtifacts,
    total: artifacts.length,
  })
}

async function addArtifactToRegistry(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  const body = request.body as { artifactId: string; metadata?: Record<string, unknown> }

  if (!id || !body.artifactId) {
    throw new AppError(400, 'Registry ID and artifact ID are required', { param: 'id, artifactId' })
  }

  const registry = await orgRepository.getRegistry(id)
  if (!registry) {
    throw new AppError(404, 'Registry not found', { resourceId: id })
  }

  const artifact = artifactRegistryStore.get(body.artifactId)
  if (!artifact) {
    throw new AppError(404, 'Artifact not found', { resourceId: body.artifactId })
  }

  const existing = await orgRepository.getRegistryArtifact(id, body.artifactId)
  if (existing) {
    throw new AppError(409, 'Artifact is already in this registry', { resourceId: body.artifactId })
  }

  const ra = await orgRepository.addArtifactToRegistry(id, body.artifactId, request.user!.sub, body.metadata)
  return reply.status(201).send(ra)
}

async function removeArtifactFromRegistry(request: FastifyRequest, reply: FastifyReply) {
  const { id, artifactId } = request.params as { id: string; artifactId: string }

  if (!id || !artifactId) {
    throw new AppError(400, 'Registry ID and artifact ID are required', { param: 'id, artifactId' })
  }

  const registry = await orgRepository.getRegistry(id)
  if (!registry) {
    throw new AppError(404, 'Registry not found', { resourceId: id })
  }

  const success = await orgRepository.removeArtifactFromRegistry(id, artifactId)
  if (!success) {
    throw new AppError(404, 'Artifact not found in registry', { resourceId: artifactId })
  }

  return reply.send({ message: 'Artifact removed from registry successfully' })
}

// --- Registry Credential Handlers ---

async function getRegistryCredentials(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }

  if (!id) {
    throw new AppError(400, 'Registry ID is required', { param: 'id' })
  }

  const registry = await orgRepository.getRegistry(id)
  if (!registry) {
    throw new AppError(404, 'Registry not found', { resourceId: id })
  }

  const creds = await orgRepository.getRegistryCredentials(id)
  if (!creds) {
    throw new AppError(404, 'No credentials configured for this registry', { resourceId: id })
  }

  // Never expose the secret value in API responses
  return reply.send({
    id: creds.id,
    registryId: creds.registryId,
    authType: creds.authType,
    username: creds.username,
    envVar: creds.envVar,
    hasSecret: !!creds.secretValue,
    createdAt: creds.createdAt,
    updatedAt: creds.updatedAt,
  })
}

async function upsertRegistryCredentials(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  const body = request.body as {
    authType?: string
    username?: string
    secretValue?: string
    envVar?: string
  }

  if (!id) {
    throw new AppError(400, 'Registry ID is required', { param: 'id' })
  }

  const registry = await orgRepository.getRegistry(id)
  if (!registry) {
    throw new AppError(404, 'Registry not found', { resourceId: id })
  }

  if (body.authType && !VALID_AUTH_TYPES.includes(body.authType as typeof VALID_AUTH_TYPES[number])) {
    throw new AppError(400, `Auth type must be one of: ${VALID_AUTH_TYPES.join(', ')}`, { param: 'authType', allowed: VALID_AUTH_TYPES })
  }

  const creds = await orgRepository.upsertRegistryCredentials(id, {
    authType: (body.authType || 'none') as RegistryCredentials['authType'],
    username: body.username ?? null,
    secretValue: body.secretValue ?? null,
    envVar: body.envVar ?? null,
  })

  return reply.send({
    id: creds.id,
    registryId: creds.registryId,
    authType: creds.authType,
    username: creds.username,
    envVar: creds.envVar,
    hasSecret: !!creds.secretValue,
    createdAt: creds.createdAt,
    updatedAt: creds.updatedAt,
  })
}

async function deleteRegistryCredentials(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }

  if (!id) {
    throw new AppError(400, 'Registry ID is required', { param: 'id' })
  }

  const registry = await orgRepository.getRegistry(id)
  if (!registry) {
    throw new AppError(404, 'Registry not found', { resourceId: id })
  }

  const success = await orgRepository.deleteRegistryCredentials(id)
  if (!success) {
    throw new AppError(404, 'No credentials found for this registry', { resourceId: id })
  }

  return reply.send({ message: 'Registry credentials deleted successfully' })
}

// --- Registry Scan Handler ---

async function scanRegistry(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }

  if (!id) {
    throw new AppError(400, 'Registry ID is required', { param: 'id' })
  }

  const registry = await orgRepository.getRegistry(id)
  if (!registry) {
    throw new AppError(404, 'Registry not found', { resourceId: id })
  }

  if (!registry.enabled) {
    throw new AppError(400, 'Registry is disabled. Enable it before scanning.', { resourceId: id, enabled: registry.enabled })
  }

  if (!registry.url) {
    throw new AppError(400, 'Registry has no URL configured. Set a URL before scanning.', { resourceId: id })
  }

  // Build auth header from credentials if available
  let authHeader: string | undefined
  const creds = await orgRepository.getRegistryCredentials(id)
  if (creds) {
    if (creds.authType === 'basic' && creds.username && creds.secretValue) {
      const encoded = Buffer.from(`${creds.username}:${creds.secretValue}`).toString('base64')
      authHeader = `Basic ${encoded}`
    } else if (creds.authType === 'token' && creds.secretValue) {
      authHeader = `Bearer ${creds.secretValue}`
    } else if (creds.authType === 'env' && creds.envVar) {
      const envValue = process.env[creds.envVar]
      if (envValue) {
        authHeader = `Bearer ${envValue}`
      }
    }
  }

  const result = await registryScanner.scanRegistry({
    registryId: id,
    registryType: registry.registryType,
    url: registry.url,
    authHeader,
  })

  return reply.status(202).send(result)
}

// --- Route Registration ---

export function registryRoutes(server: FastifyInstance) {
  // Registry CRUD (scoped to organization)
  server.get('/api/organizations/:orgId/registries', { preHandler: [authenticate] }, listRegistries)
  server.post('/api/organizations/:orgId/registries', { preHandler: [authenticate, requireOrgRole('org:admin')] }, createRegistry)

  // Org-scoped registry list resolved from the authenticated user (frontend dashboard)
  server.get('/api/registries', { preHandler: [authenticate] }, listMyRegistries)

  // Registry CRUD (direct access)
  server.get('/api/registries/:id', { preHandler: [authenticate] }, getRegistry)
  server.put('/api/registries/:id', { preHandler: [authenticate, requireOrgRole('org:admin')] }, updateRegistry)
  server.delete('/api/registries/:id', { preHandler: [authenticate, requireOrgRole('org:admin')] }, deleteRegistry)

  // Registry Artifacts
  server.get('/api/registries/:id/artifacts', { preHandler: [authenticate] }, listRegistryArtifacts)
  server.post('/api/registries/:id/artifacts', { preHandler: [authenticate, requireOrgRole('org:admin')] }, addArtifactToRegistry)
  server.delete('/api/registries/:id/artifacts/:artifactId', { preHandler: [authenticate, requireOrgRole('org:admin')] }, removeArtifactFromRegistry)

  // Registry Credentials
  server.get('/api/registries/:id/credentials', { preHandler: [authenticate] }, getRegistryCredentials)
  server.put('/api/registries/:id/credentials', { preHandler: [authenticate, requireOrgRole('org:admin')] }, upsertRegistryCredentials)
  server.delete('/api/registries/:id/credentials', { preHandler: [authenticate, requireOrgRole('org:admin')] }, deleteRegistryCredentials)

  // Registry Scan
  server.post('/api/registries/:id/scan', { preHandler: [authenticate, requireOrgRole('org:admin')] }, scanRegistry)
}
