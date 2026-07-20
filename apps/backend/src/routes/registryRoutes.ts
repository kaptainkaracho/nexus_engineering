import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import type { ArtifactRegistry, RegistryCredentials, RegistryProviderType } from '@nexus-engineering/shared'
import { orgRepository } from '../organizations/repository'
import { authenticate, requirePermission, requireOrgRole } from '../auth/middleware'
import { artifactRegistry as artifactRegistryStore } from '../artifacts/repository'
import { registryScanner } from '../scanners/registryScanner'

const VALID_REGISTRY_TYPES: RegistryProviderType[] = ['npm', 'pypi', 'maven', 'generic']
const VALID_AUTH_TYPES = ['none', 'basic', 'token', 'env'] as const

function validateRegistryType(type: string): type is RegistryProviderType {
  return VALID_REGISTRY_TYPES.includes(type as RegistryProviderType)
}

// --- Registry Handlers ---

// Org-scoped list resolved from the authenticated user (used by the frontend
// Private Registry dashboard, which calls GET /api/registries with no orgId).
async function listMyRegistries(request: FastifyRequest, reply: FastifyReply) {
  try {
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
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to list registries' })
  }
}

async function listRegistries(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { orgId } = request.params as { orgId: string }

    if (!orgId) {
      return reply.status(400).send({ error: 'Organization ID is required' })
    }

    const organization = await orgRepository.getOrganization(orgId)
    if (!organization) {
      return reply.status(404).send({ error: 'Organization not found' })
    }

    const registries = await orgRepository.listRegistriesByOrganization(orgId)
    return reply.send({ registries, total: registries.length })
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to list registries' })
  }
}

async function createRegistry(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { orgId } = request.params as { orgId: string }
    const body = request.body as Partial<ArtifactRegistry>

    if (!orgId) {
      return reply.status(400).send({ error: 'Organization ID is required' })
    }

    if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
      return reply.status(400).send({ error: 'Registry name is required' })
    }

    if (body.name.trim().length > 128) {
      return reply.status(400).send({ error: 'Registry name must not exceed 128 characters' })
    }

    if (body.visibility && !['private', 'team', 'organization'].includes(body.visibility)) {
      return reply.status(400).send({ error: 'Visibility must be "private", "team", or "organization"' })
    }

    if (body.registryType && !validateRegistryType(body.registryType)) {
      return reply.status(400).send({ error: `Registry type must be one of: ${VALID_REGISTRY_TYPES.join(', ')}` })
    }

    const organization = await orgRepository.getOrganization(orgId)
    if (!organization) {
      return reply.status(404).send({ error: 'Organization not found' })
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
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to create registry' })
  }
}

async function getRegistry(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }

    if (!id) {
      return reply.status(400).send({ error: 'Registry ID is required' })
    }

    const registry = await orgRepository.getRegistry(id)
    if (!registry) {
      return reply.status(404).send({ error: 'Registry not found' })
    }

    return reply.send(registry)
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to get registry' })
  }
}

async function updateRegistry(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }
    const body = request.body as Partial<ArtifactRegistry>

    if (!id) {
      return reply.status(400).send({ error: 'Registry ID is required' })
    }

    if (body.name !== undefined && (typeof body.name !== 'string' || body.name.trim().length === 0)) {
      return reply.status(400).send({ error: 'Registry name must be a non-empty string' })
    }

    if (body.visibility && !['private', 'team', 'organization'].includes(body.visibility)) {
      return reply.status(400).send({ error: 'Visibility must be "private", "team", or "organization"' })
    }

    if (body.registryType && !validateRegistryType(body.registryType)) {
      return reply.status(400).send({ error: `Registry type must be one of: ${VALID_REGISTRY_TYPES.join(', ')}` })
    }

    const existing = await orgRepository.getRegistry(id)
    if (!existing) {
      return reply.status(404).send({ error: 'Registry not found' })
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
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to update registry' })
  }
}

async function deleteRegistry(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }

    if (!id) {
      return reply.status(400).send({ error: 'Registry ID is required' })
    }

    const existing = await orgRepository.getRegistry(id)
    if (!existing) {
      return reply.status(404).send({ error: 'Registry not found' })
    }

    const success = await orgRepository.deleteRegistry(id)
    if (!success) {
      return reply.status(404).send({ error: 'Registry not found' })
    }

    return reply.send({ message: `Registry ${id} deleted successfully` })
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to delete registry' })
  }
}

// --- Registry Artifact Handlers ---

async function listRegistryArtifacts(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }

    if (!id) {
      return reply.status(400).send({ error: 'Registry ID is required' })
    }

    const registry = await orgRepository.getRegistry(id)
    if (!registry) {
      return reply.status(404).send({ error: 'Registry not found' })
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
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to list registry artifacts' })
  }
}

async function addArtifactToRegistry(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }
    const body = request.body as { artifactId: string; metadata?: Record<string, unknown> }

    if (!id || !body.artifactId) {
      return reply.status(400).send({ error: 'Registry ID and artifact ID are required' })
    }

    const registry = await orgRepository.getRegistry(id)
    if (!registry) {
      return reply.status(404).send({ error: 'Registry not found' })
    }

    const artifact = artifactRegistryStore.get(body.artifactId)
    if (!artifact) {
      return reply.status(404).send({ error: 'Artifact not found' })
    }

    const existing = await orgRepository.getRegistryArtifact(id, body.artifactId)
    if (existing) {
      return reply.status(409).send({ error: 'Artifact is already in this registry' })
    }

    const ra = await orgRepository.addArtifactToRegistry(id, body.artifactId, request.user!.sub, body.metadata)
    return reply.status(201).send(ra)
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to add artifact to registry' })
  }
}

async function removeArtifactFromRegistry(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id, artifactId } = request.params as { id: string; artifactId: string }

    if (!id || !artifactId) {
      return reply.status(400).send({ error: 'Registry ID and artifact ID are required' })
    }

    const registry = await orgRepository.getRegistry(id)
    if (!registry) {
      return reply.status(404).send({ error: 'Registry not found' })
    }

    const success = await orgRepository.removeArtifactFromRegistry(id, artifactId)
    if (!success) {
      return reply.status(404).send({ error: 'Artifact not found in registry' })
    }

    return reply.send({ message: 'Artifact removed from registry successfully' })
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to remove artifact from registry' })
  }
}

// --- Registry Credential Handlers ---

async function getRegistryCredentials(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }

    if (!id) {
      return reply.status(400).send({ error: 'Registry ID is required' })
    }

    const registry = await orgRepository.getRegistry(id)
    if (!registry) {
      return reply.status(404).send({ error: 'Registry not found' })
    }

    const creds = await orgRepository.getRegistryCredentials(id)
    if (!creds) {
      return reply.status(404).send({ error: 'No credentials configured for this registry' })
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
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to get registry credentials' })
  }
}

async function upsertRegistryCredentials(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }
    const body = request.body as {
      authType?: string
      username?: string
      secretValue?: string
      envVar?: string
    }

    if (!id) {
      return reply.status(400).send({ error: 'Registry ID is required' })
    }

    const registry = await orgRepository.getRegistry(id)
    if (!registry) {
      return reply.status(404).send({ error: 'Registry not found' })
    }

    if (body.authType && !VALID_AUTH_TYPES.includes(body.authType as typeof VALID_AUTH_TYPES[number])) {
      return reply.status(400).send({ error: `Auth type must be one of: ${VALID_AUTH_TYPES.join(', ')}` })
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
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to save registry credentials' })
  }
}

async function deleteRegistryCredentials(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }

    if (!id) {
      return reply.status(400).send({ error: 'Registry ID is required' })
    }

    const registry = await orgRepository.getRegistry(id)
    if (!registry) {
      return reply.status(404).send({ error: 'Registry not found' })
    }

    const success = await orgRepository.deleteRegistryCredentials(id)
    if (!success) {
      return reply.status(404).send({ error: 'No credentials found for this registry' })
    }

    return reply.send({ message: 'Registry credentials deleted successfully' })
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to delete registry credentials' })
  }
}

// --- Registry Scan Handler ---

async function scanRegistry(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }

    if (!id) {
      return reply.status(400).send({ error: 'Registry ID is required' })
    }

    const registry = await orgRepository.getRegistry(id)
    if (!registry) {
      return reply.status(404).send({ error: 'Registry not found' })
    }

    if (!registry.enabled) {
      return reply.status(400).send({ error: 'Registry is disabled. Enable it before scanning.' })
    }

    if (!registry.url) {
      return reply.status(400).send({ error: 'Registry has no URL configured. Set a URL before scanning.' })
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
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to scan registry' })
  }
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
