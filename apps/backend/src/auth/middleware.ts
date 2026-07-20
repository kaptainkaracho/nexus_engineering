import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { verify } from './jwt'
import type { JwtPayload } from '@nexus-engineering/shared'
import { orgRepository } from '../organizations/repository'

declare module 'fastify' {
  interface FastifyRequest {
    user?: JwtPayload
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const authHeader = request.headers.authorization
  if (!authHeader) {
    reply.status(401).send({ error: 'Authorization header is required' })
    return
  }

  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    reply.status(401).send({ error: 'Invalid authorization header format. Use: Bearer <token>' })
    return
  }

  const token = parts[1]
  if (!token) {
    reply.status(401).send({ error: 'Token is required' })
    return
  }

  try {
    const payload = await verify(token) as unknown as JwtPayload
    request.user = {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      permissions: payload.permissions,
      orgId: payload.orgId,
    }
  } catch (err) {
    const message = (err as Error).message
    if (message === 'Token expired') {
      reply.status(401).send({ error: 'Token expired' })
    } else {
      reply.status(401).send({ error: 'Invalid token' })
    }
  }
}

export function requirePermission(...allowedPermissions: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!request.user) {
      reply.status(401).send({ error: 'Authentication required' })
      return
    }

    const userPerms = request.user.permissions || []

    const hasPermission = allowedPermissions.some(p => userPerms.includes(p) || userPerms.includes('admin:all'))
    if (!hasPermission) {
      reply.status(403).send({ error: 'Insufficient permissions' })
      return
    }
  }
}

export function requireRole(...allowedRoles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!request.user) {
      reply.status(401).send({ error: 'Authentication required' })
      return
    }

    if (!allowedRoles.includes(request.user.role)) {
      reply.status(403).send({ error: `Role '${request.user.role}' is not allowed. Required: ${allowedRoles.join(', ')}` })
      return
    }
  }
}

export function requireOrgRole(...allowedRoles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!request.user) {
      reply.status(401).send({ error: 'Authentication required' })
      return
    }

    const params = request.params as Record<string, string | undefined>
    const orgId = params.orgId || params.id || request.user.orgId
    if (!orgId) {
      reply.status(400).send({ error: 'Organization ID is required' })
      return
    }

    const member = await orgRepository.getOrganizationMember(orgId, request.user.sub)
    if (!member) {
      reply.status(403).send({ error: 'Not a member of this organization' })
      return
    }

    if (!allowedRoles.includes(member.role) && !allowedRoles.some(r => member.role === r)) {
      reply.status(403).send({ error: `Org role '${member.role}' is not allowed. Required: ${allowedRoles.join(', ')}` })
      return
    }
  }
}

export async function optionalAuth(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  const authHeader = request.headers.authorization
  if (!authHeader) return

  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') return

  const token = parts[1]
  if (!token) return

  try {
    const payload = await verify(token) as unknown as JwtPayload
    request.user = {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      permissions: payload.permissions,
      orgId: payload.orgId,
    }
  } catch {
    // Silently ignore invalid tokens for optional auth
  }
}

export function registerAuthHooks(server: FastifyInstance) {
  server.decorateRequest('user', undefined)
}
