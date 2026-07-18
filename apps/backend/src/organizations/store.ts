import type { Organization, Team, OrganizationMember, TeamMember } from '@nexus-engineering/shared'
import { getOrgDatabase } from './database'

let storeInstance: OrgStore | null = null

export interface OrgStore {
  // Organizations
  insertOrganization(org: Organization): Organization
  findOrganizationById(id: string): Organization | undefined
  findOrganizationBySlug(slug: string): Organization | undefined
  listOrganizations(): Organization[]
  listOrganizationsForUser(userId: string): Organization[]
  updateOrganization(id: string, updates: Partial<Organization>): Organization | undefined
  deleteOrganization(id: string): boolean

  // Teams
  insertTeam(team: Team): Team
  findTeamById(id: string): Team | undefined
  listTeamsByOrganization(organizationId: string): Team[]
  updateTeam(id: string, updates: Partial<Team>): Team | undefined
  deleteTeam(id: string): boolean

  // Organization Members
  insertOrganizationMember(member: OrganizationMember): OrganizationMember
  findOrganizationMember(organizationId: string, userId: string): OrganizationMember | undefined
  listOrganizationMembers(organizationId: string): OrganizationMember[]
  updateOrganizationMember(organizationId: string, userId: string, role: string): OrganizationMember | undefined
  deleteOrganizationMember(organizationId: string, userId: string): boolean

  // Team Members
  insertTeamMember(member: TeamMember): TeamMember
  findTeamMember(teamId: string, userId: string): TeamMember | undefined
  listTeamMembers(teamId: string): TeamMember[]
  updateTeamMember(teamId: string, userId: string, role: string): TeamMember | undefined
  deleteTeamMember(teamId: string, userId: string): boolean
}

class SQLiteOrgStore implements OrgStore {
  private database: ReturnType<typeof getOrgDatabase>

  constructor() {
    this.database = getOrgDatabase()
  }

  insertOrganization(org: Organization): Organization {
    return this.database.insertOrganization(org)
  }

  findOrganizationById(id: string): Organization | undefined {
    return this.database.findOrganizationById(id)
  }

  findOrganizationBySlug(slug: string): Organization | undefined {
    return this.database.findOrganizationBySlug(slug)
  }

  listOrganizations(): Organization[] {
    return this.database.listOrganizations()
  }

  listOrganizationsForUser(userId: string): Organization[] {
    return this.database.listOrganizationsForUser(userId)
  }

  updateOrganization(id: string, updates: Partial<Organization>): Organization | undefined {
    return this.database.updateOrganization(id, updates)
  }

  deleteOrganization(id: string): boolean {
    return this.database.deleteOrganization(id)
  }

  insertTeam(team: Team): Team {
    return this.database.insertTeam(team)
  }

  findTeamById(id: string): Team | undefined {
    return this.database.findTeamById(id)
  }

  listTeamsByOrganization(organizationId: string): Team[] {
    return this.database.listTeamsByOrganization(organizationId)
  }

  updateTeam(id: string, updates: Partial<Team>): Team | undefined {
    return this.database.updateTeam(id, updates)
  }

  deleteTeam(id: string): boolean {
    return this.database.deleteTeam(id)
  }

  insertOrganizationMember(member: OrganizationMember): OrganizationMember {
    return this.database.insertOrganizationMember(member)
  }

  findOrganizationMember(organizationId: string, userId: string): OrganizationMember | undefined {
    return this.database.findOrganizationMember(organizationId, userId)
  }

  listOrganizationMembers(organizationId: string): OrganizationMember[] {
    return this.database.listOrganizationMembers(organizationId)
  }

  updateOrganizationMember(organizationId: string, userId: string, role: string): OrganizationMember | undefined {
    return this.database.updateOrganizationMember(organizationId, userId, role)
  }

  deleteOrganizationMember(organizationId: string, userId: string): boolean {
    return this.database.deleteOrganizationMember(organizationId, userId)
  }

  insertTeamMember(member: TeamMember): TeamMember {
    return this.database.insertTeamMember(member)
  }

  findTeamMember(teamId: string, userId: string): TeamMember | undefined {
    return this.database.findTeamMember(teamId, userId)
  }

  listTeamMembers(teamId: string): TeamMember[] {
    return this.database.listTeamMembers(teamId)
  }

  updateTeamMember(teamId: string, userId: string, role: string): TeamMember | undefined {
    return this.database.updateTeamMember(teamId, userId, role)
  }

  deleteTeamMember(teamId: string, userId: string): boolean {
    return this.database.deleteTeamMember(teamId, userId)
  }
}

export function getOrgStore(): OrgStore {
  if (!storeInstance) {
    storeInstance = new SQLiteOrgStore()
  }
  return storeInstance
}
