import type { Organization, Team, OrganizationMember, TeamMember, ArtifactRegistry, RegistryArtifact, RegistryCredentials } from '@nexus-engineering/shared'
import { getOrgStore } from './store'
import { customAlphabet } from 'nanoid'

const nanoid = customAlphabet('1234567890abcdef', 10)

export class OrgRepository {
  // --- Organizations ---

  async getOrganization(id: string): Promise<Organization | undefined> {
    return getOrgStore().findOrganizationById(id)
  }

  async getOrganizationBySlug(slug: string): Promise<Organization | undefined> {
    return getOrgStore().findOrganizationBySlug(slug)
  }

  async listOrganizations(userId?: string): Promise<Organization[]> {
    if (userId) {
      return getOrgStore().listOrganizationsForUser(userId)
    }
    return getOrgStore().listOrganizations()
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
    getOrgStore().insertOrganization(newOrg)
    return newOrg
  }

  async updateOrganization(id: string, updates: Partial<Organization>): Promise<Organization | undefined> {
    return getOrgStore().updateOrganization(id, updates)
  }

  async deleteOrganization(id: string): Promise<boolean> {
    return getOrgStore().deleteOrganization(id)
  }

  // --- Teams ---

  async getTeam(id: string): Promise<Team | undefined> {
    return getOrgStore().findTeamById(id)
  }

  async listTeamsByOrganization(organizationId: string): Promise<Team[]> {
    return getOrgStore().listTeamsByOrganization(organizationId)
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
    getOrgStore().insertTeam(newTeam)
    return newTeam
  }

  async updateTeam(id: string, updates: Partial<Team>): Promise<Team | undefined> {
    return getOrgStore().updateTeam(id, updates)
  }

  async deleteTeam(id: string): Promise<boolean> {
    return getOrgStore().deleteTeam(id)
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
    getOrgStore().insertOrganizationMember(member)
    return member
  }

  async getOrganizationMember(organizationId: string, userId: string): Promise<OrganizationMember | undefined> {
    return getOrgStore().findOrganizationMember(organizationId, userId)
  }

  async listOrganizationMembers(organizationId: string): Promise<OrganizationMember[]> {
    return getOrgStore().listOrganizationMembers(organizationId)
  }

  async updateOrganizationMemberRole(organizationId: string, userId: string, role: string): Promise<OrganizationMember | undefined> {
    return getOrgStore().updateOrganizationMember(organizationId, userId, role)
  }

  async removeOrganizationMember(organizationId: string, userId: string): Promise<boolean> {
    return getOrgStore().deleteOrganizationMember(organizationId, userId)
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
    getOrgStore().insertTeamMember(member)
    return member
  }

  async getTeamMember(teamId: string, userId: string): Promise<TeamMember | undefined> {
    return getOrgStore().findTeamMember(teamId, userId)
  }

  async listTeamMembers(teamId: string): Promise<TeamMember[]> {
    return getOrgStore().listTeamMembers(teamId)
  }

  async updateTeamMemberRole(teamId: string, userId: string, role: string): Promise<TeamMember | undefined> {
    return getOrgStore().updateTeamMember(teamId, userId, role)
  }

  async removeTeamMember(teamId: string, userId: string): Promise<boolean> {
    return getOrgStore().deleteTeamMember(teamId, userId)
  }

  // --- Registries ---

  async createRegistry(orgId: string, registry: Partial<ArtifactRegistry>): Promise<ArtifactRegistry> {
    const now = new Date().toISOString()
    const newRegistry: ArtifactRegistry = {
      id: `reg_${nanoid()}`,
      name: registry.name || '',
      description: registry.description || null,
      organizationId: orgId,
      visibility: registry.visibility || 'private',
      allowedRoles: registry.allowedRoles || null,
      registryType: registry.registryType || 'generic',
      url: registry.url || null,
      enabled: registry.enabled ?? true,
      createdBy: registry.createdBy || '',
      createdAt: now,
      updatedAt: now,
    }
    getOrgStore().insertRegistry(newRegistry)
    return newRegistry
  }

  async getRegistry(id: string): Promise<ArtifactRegistry | undefined> {
    return getOrgStore().findRegistryById(id)
  }

  async listRegistriesByOrganization(organizationId: string): Promise<ArtifactRegistry[]> {
    return getOrgStore().listRegistriesByOrganization(organizationId)
  }

  async updateRegistry(id: string, updates: Partial<ArtifactRegistry>): Promise<ArtifactRegistry | undefined> {
    return getOrgStore().updateRegistry(id, updates)
  }

  async deleteRegistry(id: string): Promise<boolean> {
    return getOrgStore().deleteRegistry(id)
  }

  // --- Registry Artifacts ---

  async addArtifactToRegistry(registryId: string, artifactId: string, addedBy: string, metadata?: Record<string, unknown>): Promise<RegistryArtifact> {
    const now = new Date().toISOString()
    const ra: RegistryArtifact = {
      id: `ra_${nanoid()}`,
      registryId,
      artifactId,
      addedBy,
      addedAt: now,
      metadata,
    }
    getOrgStore().insertRegistryArtifact(ra)
    return ra
  }

  async getRegistryArtifact(registryId: string, artifactId: string): Promise<RegistryArtifact | undefined> {
    return getOrgStore().findRegistryArtifact(registryId, artifactId)
  }

  async listRegistryArtifacts(registryId: string): Promise<RegistryArtifact[]> {
    return getOrgStore().listRegistryArtifacts(registryId)
  }

  async removeArtifactFromRegistry(registryId: string, artifactId: string): Promise<boolean> {
    return getOrgStore().deleteRegistryArtifact(registryId, artifactId)
  }

  // --- Registry Credentials ---

  async upsertRegistryCredentials(registryId: string, creds: Partial<RegistryCredentials>): Promise<RegistryCredentials> {
    const now = new Date().toISOString()
    const existing = getOrgStore().findRegistryCredentials(registryId)
    const merged: RegistryCredentials = {
      id: existing?.id || `cred_${nanoid()}`,
      registryId,
      authType: creds.authType || existing?.authType || 'none',
      username: creds.username !== undefined ? creds.username : (existing?.username ?? null),
      secretValue: creds.secretValue !== undefined ? creds.secretValue : (existing?.secretValue ?? null),
      envVar: creds.envVar !== undefined ? creds.envVar : (existing?.envVar ?? null),
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    }
    getOrgStore().upsertRegistryCredentials(merged)
    return merged
  }

  async getRegistryCredentials(registryId: string): Promise<RegistryCredentials | undefined> {
    return getOrgStore().findRegistryCredentials(registryId)
  }

  async deleteRegistryCredentials(registryId: string): Promise<boolean> {
    return getOrgStore().deleteRegistryCredentials(registryId)
  }
}

export const orgRepository = new OrgRepository()
