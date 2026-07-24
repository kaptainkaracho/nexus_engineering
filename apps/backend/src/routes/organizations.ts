import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import type { Organization, Team } from '@nexus-engineering/shared'
import { orgRepository } from '../organizations/repository'
import { authenticate, requirePermission, requireOrgRole } from '../auth/middleware'
import { logAuditAction } from '../auditLog/middleware'
import { AppError } from '../lib/errorHandler'

// --- Organization Handlers ---

export async function listOrganizations(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user?.sub
  const organizations = await orgRepository.listOrganizations(userId)
  return reply.send({ organizations, total: organizations.length })
}

export async function getOrganization(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }

  if (!id) {
    throw new AppError(400, 'Organization ID is required', { param: 'id' })
  }

  const organization = await orgRepository.getOrganization(id)
  if (!organization) {
    throw new AppError(404, 'Organization not found', { resourceId: id })
  }

  return reply.send(organization)
}

export async function createOrganization(request: FastifyRequest, reply: FastifyReply) {
  const body = request.body as Partial<Organization>

  if (!body.name || !body.slug) {
    throw new AppError(400, 'Organization name and slug are required', { param: 'name, slug' })
  }

  if (!/^[a-z0-9-]+$/.test(body.slug)) {
    throw new AppError(400, 'Slug must contain only lowercase letters, numbers, and hyphens', { param: 'slug', pattern: '^[a-z0-9-]+$' })
  }

  const existing = await orgRepository.getOrganizationBySlug(body.slug)
  if (existing) {
    throw new AppError(409, 'Organization with this slug already exists', { slug: body.slug })
  }

  const organization = await orgRepository.createOrganization({
    ...body,
    ownerId: request.user!.sub,
  })

  await orgRepository.addOrganizationMember(organization.id, request.user!.sub, 'org:admin')

  logAuditAction(request, 'CREATE', 'organization', organization.id)
  return reply.status(201).send(organization)
}

export async function updateOrganization(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  const updates = request.body as Partial<Organization>

  if (!id) {
    throw new AppError(400, 'Organization ID is required', { param: 'id' })
  }

  if (updates.slug && !/^[a-z0-9-]+$/.test(updates.slug)) {
    throw new AppError(400, 'Slug must contain only lowercase letters, numbers, and hyphens', { param: 'slug', pattern: '^[a-z0-9-]+$' })
  }

  if (updates.slug) {
    const existing = await orgRepository.getOrganizationBySlug(updates.slug)
    if (existing && existing.id !== id) {
      throw new AppError(409, 'Organization with this slug already exists', { slug: updates.slug })
    }
  }

  const updated = await orgRepository.updateOrganization(id, updates)
  if (!updated) {
    throw new AppError(404, 'Organization not found', { resourceId: id })
  }

  logAuditAction(request, 'UPDATE', 'organization', id, JSON.stringify(Object.keys(updates)))
  return reply.send(updated)
}

export async function deleteOrganization(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }

  if (!id) {
    throw new AppError(400, 'Organization ID is required', { param: 'id' })
  }

  const success = await orgRepository.deleteOrganization(id)
  if (!success) {
    throw new AppError(404, 'Organization not found', { resourceId: id })
  }

  logAuditAction(request, 'DELETE', 'organization', id)
  return reply.send({ message: `Organization ${id} deleted successfully` })
}

// --- Organization Member Handlers ---

export async function listOrganizationMembers(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }

  if (!id) {
    throw new AppError(400, 'Organization ID is required', { param: 'id' })
  }

  const organization = await orgRepository.getOrganization(id)
  if (!organization) {
    throw new AppError(404, 'Organization not found', { resourceId: id })
  }

  const members = await orgRepository.listOrganizationMembers(id)
  return reply.send({ members, total: members.length })
}

export async function addOrganizationMember(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }
    const body = request.body as { userId: string; role?: 'org:admin' | 'org:member' | 'org:viewer' }

    if (!id || !body.userId) {
      return reply.status(400).send({ error: 'Organization ID and user ID are required' })
    }

    const organization = await orgRepository.getOrganization(id)
    if (!organization) {
      return reply.status(404).send({ error: 'Organization not found' })
    }

    const existing = await orgRepository.getOrganizationMember(id, body.userId)
    if (existing) {
      return reply.status(409).send({ error: 'User is already a member of this organization' })
    }

    const member = await orgRepository.addOrganizationMember(id, body.userId, body.role || 'org:member')
    logAuditAction(request, 'CREATE', 'organizationMember', `${id}:${body.userId}`)
    return reply.status(201).send(member)
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to add organization member' })
  }
}

export async function updateOrganizationMember(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id, userId } = request.params as { id: string; userId: string }
    const body = request.body as { role: string }

    if (!id || !userId || !body.role) {
      return reply.status(400).send({ error: 'Organization ID, user ID, and role are required' })
    }

    if (!['org:admin', 'org:member', 'org:viewer'].includes(body.role)) {
      return reply.status(400).send({ error: 'Role must be "org:admin", "org:member", or "org:viewer"' })
    }

    const updated = await orgRepository.updateOrganizationMemberRole(id, userId, body.role)
    if (!updated) {
      return reply.status(404).send({ error: 'Organization member not found' })
    }

    logAuditAction(request, 'UPDATE', 'organizationMember', `${id}:${userId}`, `role=${body.role}`)
    return reply.send(updated)
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to update organization member' })
  }
}

export async function removeOrganizationMember(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id, userId } = request.params as { id: string; userId: string }

    if (!id || !userId) {
      return reply.status(400).send({ error: 'Organization ID and user ID are required' })
    }

    const success = await orgRepository.removeOrganizationMember(id, userId)
    if (!success) {
      return reply.status(404).send({ error: 'Organization member not found' })
    }

    logAuditAction(request, 'DELETE', 'organizationMember', `${id}:${userId}`)
    return reply.send({ message: 'Member removed from organization successfully' })
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to remove organization member' })
  }
}

// --- Invite / Join / Leave ---

export async function inviteMember(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }
    const body = request.body as { userId: string; role?: 'org:admin' | 'org:member' | 'org:viewer' }

    if (!id || !body.userId) {
      return reply.status(400).send({ error: 'Organization ID and user ID are required' })
    }

    const member = await orgRepository.inviteMember(id, body.userId, body.role)
    logAuditAction(request, 'CREATE', 'invite', `${id}:${body.userId}`)
    return reply.status(201).send(member)
  } catch (error) {
    const msg = (error as Error).message
    if (msg.includes('already a member')) {
      return reply.status(409).send({ error: msg })
    }
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to invite member' })
  }
}

export async function joinOrganization(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }
    if (!id) {
      return reply.status(400).send({ error: 'Organization ID is required' })
    }

    const member = await orgRepository.joinOrganization(id, request.user!.sub)
    logAuditAction(request, 'CREATE', 'join', `${id}:${request.user!.sub}`)
    return reply.status(201).send(member)
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to join organization' })
  }
}

export async function leaveOrganization(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }
    if (!id) {
      return reply.status(400).send({ error: 'Organization ID is required' })
    }

    await orgRepository.leaveOrganization(id, request.user!.sub)
    logAuditAction(request, 'DELETE', 'leave', `${id}:${request.user!.sub}`)
    return reply.send({ message: 'Left organization successfully' })
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to leave organization' })
  }
}

// --- Team Handlers ---

export async function listTeams(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { orgId } = request.params as { orgId: string }

    if (!orgId) {
      return reply.status(400).send({ error: 'Organization ID is required' })
    }

    const organization = await orgRepository.getOrganization(orgId)
    if (!organization) {
      return reply.status(404).send({ error: 'Organization not found' })
    }

    const teams = await orgRepository.listTeamsByOrganization(orgId)
    return reply.send({ teams, total: teams.length })
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to list teams' })
  }
}

export async function getTeam(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }

    if (!id) {
      return reply.status(400).send({ error: 'Team ID is required' })
    }

    const team = await orgRepository.getTeam(id)
    if (!team) {
      return reply.status(404).send({ error: 'Team not found' })
    }

    return reply.send(team)
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to get team' })
  }
}

export async function createTeam(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { orgId } = request.params as { orgId: string }
    const body = request.body as Partial<Team>

    if (!orgId || !body.name) {
      return reply.status(400).send({ error: 'Organization ID and team name are required' })
    }

    const organization = await orgRepository.getOrganization(orgId)
    if (!organization) {
      return reply.status(404).send({ error: 'Organization not found' })
    }

    const team = await orgRepository.createTeam(orgId, body)
    logAuditAction(request, 'CREATE', 'team', team.id, `orgId=${orgId}`)
    return reply.status(201).send(team)
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to create team' })
  }
}

export async function updateTeam(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }
    const updates = request.body as Partial<Team>

    if (!id) {
      return reply.status(400).send({ error: 'Team ID is required' })
    }

    const updated = await orgRepository.updateTeam(id, updates)
    if (!updated) {
      return reply.status(404).send({ error: 'Team not found' })
    }

    logAuditAction(request, 'UPDATE', 'team', id, JSON.stringify(Object.keys(updates)))
    return reply.send(updated)
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to update team' })
  }
}

export async function deleteTeam(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }

    if (!id) {
      return reply.status(400).send({ error: 'Team ID is required' })
    }

    const success = await orgRepository.deleteTeam(id)
    if (!success) {
      return reply.status(404).send({ error: 'Team not found' })
    }

    logAuditAction(request, 'DELETE', 'team', id)
    return reply.send({ message: `Team ${id} deleted successfully` })
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to delete team' })
  }
}

// --- Team Member Handlers ---

export async function listTeamMembers(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }

    if (!id) {
      return reply.status(400).send({ error: 'Team ID is required' })
    }

    const team = await orgRepository.getTeam(id)
    if (!team) {
      return reply.status(404).send({ error: 'Team not found' })
    }

    const members = await orgRepository.listTeamMembers(id)
    return reply.send({ members, total: members.length })
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to list team members' })
  }
}

export async function addTeamMember(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }
    const body = request.body as { userId: string; role?: 'lead' | 'member' }

    if (!id || !body.userId) {
      return reply.status(400).send({ error: 'Team ID and user ID are required' })
    }

    const team = await orgRepository.getTeam(id)
    if (!team) {
      return reply.status(404).send({ error: 'Team not found' })
    }

    const existing = await orgRepository.getTeamMember(id, body.userId)
    if (existing) {
      return reply.status(409).send({ error: 'User is already a member of this team' })
    }

    const member = await orgRepository.addTeamMember(id, body.userId, body.role || 'member')
    logAuditAction(request, 'CREATE', 'teamMember', `${id}:${body.userId}`)
    return reply.status(201).send(member)
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to add team member' })
  }
}

export async function updateTeamMember(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id, userId } = request.params as { id: string; userId: string }
    const body = request.body as { role: string }

    if (!id || !userId || !body.role) {
      return reply.status(400).send({ error: 'Team ID, user ID, and role are required' })
    }

    if (!['lead', 'member'].includes(body.role)) {
      return reply.status(400).send({ error: 'Role must be "lead" or "member"' })
    }

    const updated = await orgRepository.updateTeamMemberRole(id, userId, body.role)
    if (!updated) {
      return reply.status(404).send({ error: 'Team member not found' })
    }

    logAuditAction(request, 'UPDATE', 'teamMember', `${id}:${userId}`, `role=${body.role}`)
    return reply.send(updated)
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to update team member' })
  }
}

export async function removeTeamMember(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id, userId } = request.params as { id: string; userId: string }

    if (!id || !userId) {
      return reply.status(400).send({ error: 'Team ID and user ID are required' })
    }

    const success = await orgRepository.removeTeamMember(id, userId)
    if (!success) {
      return reply.status(404).send({ error: 'Team member not found' })
    }

    logAuditAction(request, 'DELETE', 'teamMember', `${id}:${userId}`)
    return reply.send({ message: 'Member removed from team successfully' })
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to remove team member' })
  }
}

// --- Route Registration ---

function registerOrgRoutes(server: FastifyInstance, prefix: string) {
  // Organizations
  server.get(`${prefix}`, { preHandler: [authenticate] }, listOrganizations)
  server.get(`${prefix}/:id`, { preHandler: [authenticate] }, getOrganization)
  server.post(`${prefix}`, { preHandler: [authenticate] }, createOrganization)
  server.put(`${prefix}/:id`, { preHandler: [authenticate, requireOrgRole('org:admin')] }, updateOrganization)
  server.delete(`${prefix}/:id`, { preHandler: [authenticate, requireOrgRole('org:admin')] }, deleteOrganization)

  // Organization Members
  server.get(`${prefix}/:id/members`, { preHandler: [authenticate] }, listOrganizationMembers)
  server.post(`${prefix}/:id/members`, { preHandler: [authenticate, requireOrgRole('org:admin')] }, addOrganizationMember)
  server.put(`${prefix}/:id/members/:userId`, { preHandler: [authenticate, requireOrgRole('org:admin')] }, updateOrganizationMember)
  server.delete(`${prefix}/:id/members/:userId`, { preHandler: [authenticate, requireOrgRole('org:admin')] }, removeOrganizationMember)

  // Invite / Join / Leave
  server.post(`${prefix}/:id/invite`, { preHandler: [authenticate, requireOrgRole('org:admin')] }, inviteMember)
  server.post(`${prefix}/:id/join`, { preHandler: [authenticate] }, joinOrganization)
  server.post(`${prefix}/:id/leave`, { preHandler: [authenticate] }, leaveOrganization)

  // Teams (scoped to organization)
  server.get(`${prefix}/:orgId/teams`, { preHandler: [authenticate] }, listTeams)
  server.post(`${prefix}/:orgId/teams`, { preHandler: [authenticate, requireOrgRole('org:admin')] }, createTeam)

}

function registerTeamRoutes(server: FastifyInstance) {
  // Teams (direct access)
  server.get(`/api/teams/:id`, { preHandler: [authenticate] }, getTeam)
  server.put(`/api/teams/:id`, { preHandler: [authenticate, requireOrgRole('org:admin')] }, updateTeam)
  server.delete(`/api/teams/:id`, { preHandler: [authenticate, requireOrgRole('org:admin')] }, deleteTeam)

  // Team Members
  server.get(`/api/teams/:id/members`, { preHandler: [authenticate] }, listTeamMembers)
  server.post(`/api/teams/:id/members`, { preHandler: [authenticate, requireOrgRole('org:admin')] }, addTeamMember)
  server.put(`/api/teams/:id/members/:userId`, { preHandler: [authenticate, requireOrgRole('org:admin')] }, updateTeamMember)
  server.delete(`/api/teams/:id/members/:userId`, { preHandler: [authenticate, requireOrgRole('org:admin')] }, removeTeamMember)
}

export function organizationsRoutes(server: FastifyInstance) {
  registerOrgRoutes(server, '/api/organizations')
  registerOrgRoutes(server, '/api/orgs')
  registerTeamRoutes(server)
}
