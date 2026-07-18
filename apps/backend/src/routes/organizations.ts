import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import type { Organization, Team } from '@nexus-engineering/shared'
import { orgRepository } from '../organizations/repository'
import { authenticate, requirePermission } from '../auth/middleware'
import { getOrgDatabase } from '../organizations/database'
import { logAuditAction } from '../auditLog/middleware'

// --- Organization Handlers ---

export async function listOrganizations(request: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = request.user?.sub
    const organizations = await orgRepository.listOrganizations(userId)
    return reply.send({ organizations, total: organizations.length })
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to list organizations' })
  }
}

export async function getOrganization(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }
    if (!id) {
      return reply.status(400).send({ error: 'Organization ID is required' })
    }

    const organization = await orgRepository.getOrganization(id)
    if (!organization) {
      return reply.status(404).send({ error: 'Organization not found' })
    }

    return reply.send(organization)
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to get organization' })
  }
}

export async function createOrganization(request: FastifyRequest, reply: FastifyReply) {
  try {
    const body = request.body as Partial<Organization>

    if (!body.name || !body.slug) {
      return reply.status(400).send({ error: 'Organization name and slug are required' })
    }

    if (!/^[a-z0-9-]+$/.test(body.slug)) {
      return reply.status(400).send({ error: 'Slug must contain only lowercase letters, numbers, and hyphens' })
    }

    const existing = await orgRepository.getOrganizationBySlug(body.slug)
    if (existing) {
      return reply.status(409).send({ error: 'Organization with this slug already exists' })
    }

    const organization = await orgRepository.createOrganization({
      ...body,
      ownerId: request.user!.sub,
    })

    await orgRepository.addOrganizationMember(organization.id, request.user!.sub, 'admin')

    logAuditAction(request, 'CREATE', 'organization', organization.id)
    return reply.status(201).send(organization)
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to create organization' })
  }
}

export async function updateOrganization(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }
    const updates = request.body as Partial<Organization>

    if (!id) {
      return reply.status(400).send({ error: 'Organization ID is required' })
    }

    if (updates.slug && !/^[a-z0-9-]+$/.test(updates.slug)) {
      return reply.status(400).send({ error: 'Slug must contain only lowercase letters, numbers, and hyphens' })
    }

    if (updates.slug) {
      const existing = await orgRepository.getOrganizationBySlug(updates.slug)
      if (existing && existing.id !== id) {
        return reply.status(409).send({ error: 'Organization with this slug already exists' })
      }
    }

    const updated = await orgRepository.updateOrganization(id, updates)
    if (!updated) {
      return reply.status(404).send({ error: 'Organization not found' })
    }

    logAuditAction(request, 'UPDATE', 'organization', id, JSON.stringify(Object.keys(updates)))
    return reply.send(updated)
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to update organization' })
  }
}

export async function deleteOrganization(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }

    if (!id) {
      return reply.status(400).send({ error: 'Organization ID is required' })
    }

    const success = await orgRepository.deleteOrganization(id)
    if (!success) {
      return reply.status(404).send({ error: 'Organization not found' })
    }

    logAuditAction(request, 'DELETE', 'organization', id)
    return reply.send({ message: `Organization ${id} deleted successfully` })
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to delete organization' })
  }
}

// --- Organization Member Handlers ---

export async function listOrganizationMembers(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }

    if (!id) {
      return reply.status(400).send({ error: 'Organization ID is required' })
    }

    const organization = await orgRepository.getOrganization(id)
    if (!organization) {
      return reply.status(404).send({ error: 'Organization not found' })
    }

    const members = await orgRepository.listOrganizationMembers(id)
    return reply.send({ members, total: members.length })
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to list organization members' })
  }
}

export async function addOrganizationMember(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }
    const body = request.body as { userId: string; role?: 'admin' | 'member' }

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

    const member = await orgRepository.addOrganizationMember(id, body.userId, body.role || 'member')
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

    if (!['admin', 'member'].includes(body.role)) {
      return reply.status(400).send({ error: 'Role must be "admin" or "member"' })
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

export function organizationsRoutes(server: FastifyInstance) {
  // Organizations
  server.get('/api/organizations', { preHandler: [authenticate] }, listOrganizations)
  server.get('/api/organizations/:id', { preHandler: [authenticate] }, getOrganization)
  server.post('/api/organizations', { preHandler: [authenticate] }, createOrganization)
  server.put('/api/organizations/:id', { preHandler: [authenticate, requirePermission('admin:all')] }, updateOrganization)
  server.delete('/api/organizations/:id', { preHandler: [authenticate, requirePermission('admin:all')] }, deleteOrganization)

  // Organization Members
  server.get('/api/organizations/:id/members', { preHandler: [authenticate] }, listOrganizationMembers)
  server.post('/api/organizations/:id/members', { preHandler: [authenticate, requirePermission('admin:all')] }, addOrganizationMember)
  server.put('/api/organizations/:id/members/:userId', { preHandler: [authenticate, requirePermission('admin:all')] }, updateOrganizationMember)
  server.delete('/api/organizations/:id/members/:userId', { preHandler: [authenticate, requirePermission('admin:all')] }, removeOrganizationMember)

  // Teams (scoped to organization)
  server.get('/api/organizations/:orgId/teams', { preHandler: [authenticate] }, listTeams)
  server.post('/api/organizations/:orgId/teams', { preHandler: [authenticate, requirePermission('admin:all')] }, createTeam)

  // Teams (direct access)
  server.get('/api/teams/:id', { preHandler: [authenticate] }, getTeam)
  server.put('/api/teams/:id', { preHandler: [authenticate, requirePermission('admin:all')] }, updateTeam)
  server.delete('/api/teams/:id', { preHandler: [authenticate, requirePermission('admin:all')] }, deleteTeam)

  // Team Members
  server.get('/api/teams/:id/members', { preHandler: [authenticate] }, listTeamMembers)
  server.post('/api/teams/:id/members', { preHandler: [authenticate, requirePermission('admin:all')] }, addTeamMember)
  server.put('/api/teams/:id/members/:userId', { preHandler: [authenticate, requirePermission('admin:all')] }, updateTeamMember)
  server.delete('/api/teams/:id/members/:userId', { preHandler: [authenticate, requirePermission('admin:all')] }, removeTeamMember)
}
