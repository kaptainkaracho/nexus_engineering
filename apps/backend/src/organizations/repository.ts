import type { Organization, Team, OrganizationMember, TeamMember } from '@nexus-engineering/shared'
import { getOrgStore } from './store'
import { customAlphabet } from 'nanoid'

const nanoid = customAlphabet('1234567890abcdef', 10)

export class OrgRepository {
  private store = getOrgStore()

  // --- Organizations ---

  async getOrganization(id: string): Promise<Organization | undefined> {
    return this.store.findOrganizationById(id)
  }

  async getOrganizationBySlug(slug: string): Promise<Organization | undefined> {
    return this.store.findOrganizationBySlug(slug)
  }

  async listOrganizations(userId?: string): Promise<Organization[]> {
    if (userId) {
      return this.store.listOrganizationsForUser(userId)
    }
    return this.store.listOrganizations()
  }

  async createOrganization(org: Partial<Organization>): Promise<Organization> {
    const now = new Date().toISOString()
    const newOrg: Organization = {
      id: `org_${nanoid()}`,
      name: org.name || '',
      slug: org.slug || '',
      description: org.description || null,
      ownerId: org.ownerId || '',
      settings: org.settings || null,
      createdAt: now,
      updatedAt: now,
    }
    this.store.insertOrganization(newOrg)
    return newOrg
  }

  async updateOrganization(id: string, updates: Partial<Organization>): Promise<Organization | undefined> {
    return this.store.updateOrganization(id, updates)
  }

  async deleteOrganization(id: string): Promise<boolean> {
    return this.store.deleteOrganization(id)
  }

  // --- Teams ---

  async getTeam(id: string): Promise<Team | undefined> {
    return this.store.findTeamById(id)
  }

  async listTeamsByOrganization(organizationId: string): Promise<Team[]> {
    return this.store.listTeamsByOrganization(organizationId)
  }

  async createTeam(orgId: string, team: Partial<Team>): Promise<Team> {
    const now = new Date().toISOString()
    const newTeam: Team = {
      id: `team_${nanoid()}`,
      name: team.name || '',
      description: team.description || null,
      organizationId: orgId,
      createdAt: now,
      updatedAt: now,
    }
    this.store.insertTeam(newTeam)
    return newTeam
  }

  async updateTeam(id: string, updates: Partial<Team>): Promise<Team | undefined> {
    return this.store.updateTeam(id, updates)
  }

  async deleteTeam(id: string): Promise<boolean> {
    return this.store.deleteTeam(id)
  }

  // --- Organization Members ---

  async addOrganizationMember(organizationId: string, userId: string, role: 'admin' | 'member' = 'member'): Promise<OrganizationMember> {
    const now = new Date().toISOString()
    const member: OrganizationMember = {
      id: `orgmem_${nanoid()}`,
      organizationId,
      userId,
      role,
      joinedAt: now,
    }
    this.store.insertOrganizationMember(member)
    return member
  }

  async getOrganizationMember(organizationId: string, userId: string): Promise<OrganizationMember | undefined> {
    return this.store.findOrganizationMember(organizationId, userId)
  }

  async listOrganizationMembers(organizationId: string): Promise<OrganizationMember[]> {
    return this.store.listOrganizationMembers(organizationId)
  }

  async updateOrganizationMemberRole(organizationId: string, userId: string, role: string): Promise<OrganizationMember | undefined> {
    return this.store.updateOrganizationMember(organizationId, userId, role)
  }

  async removeOrganizationMember(organizationId: string, userId: string): Promise<boolean> {
    return this.store.deleteOrganizationMember(organizationId, userId)
  }

  // --- Team Members ---

  async addTeamMember(teamId: string, userId: string, role: 'lead' | 'member' = 'member'): Promise<TeamMember> {
    const now = new Date().toISOString()
    const member: TeamMember = {
      id: `teammem_${nanoid()}`,
      teamId,
      userId,
      role,
      joinedAt: now,
    }
    this.store.insertTeamMember(member)
    return member
  }

  async getTeamMember(teamId: string, userId: string): Promise<TeamMember | undefined> {
    return this.store.findTeamMember(teamId, userId)
  }

  async listTeamMembers(teamId: string): Promise<TeamMember[]> {
    return this.store.listTeamMembers(teamId)
  }

  async updateTeamMemberRole(teamId: string, userId: string, role: string): Promise<TeamMember | undefined> {
    return this.store.updateTeamMember(teamId, userId, role)
  }

  async removeTeamMember(teamId: string, userId: string): Promise<boolean> {
    return this.store.deleteTeamMember(teamId, userId)
  }
}

export const orgRepository = new OrgRepository()
