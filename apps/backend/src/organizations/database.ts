import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import Database from 'better-sqlite3'
import type { Organization, Team, OrganizationMember, TeamMember } from '@nexus-engineering/shared'

export const DEFAULT_ORG_DB_PATH = process.env.DATABASE_PATH
  ? `${process.env.DATABASE_PATH}.org`
  : ':memory:'

export interface OrganizationRow {
  id: string
  name: string
  slug: string
  description: string | null
  owner_id: string
  settings: string | null
  created_at: string
  updated_at: string
}

export interface TeamRow {
  id: string
  name: string
  description: string | null
  organization_id: string
  created_at: string
  updated_at: string
}

export interface OrganizationMemberRow {
  id: string
  organization_id: string
  user_id: string
  role: string
  joined_at: string
}

export interface TeamMemberRow {
  id: string
  team_id: string
  user_id: string
  role: string
  joined_at: string
}

export class OrgDatabase {
  private db: Database.Database
  private initialized = false

  constructor(databasePath: string = DEFAULT_ORG_DB_PATH) {
    if (databasePath !== ':memory:') mkdirSync(dirname(databasePath), { recursive: true })
    this.db = new Database(databasePath)
    this.db.pragma('journal_mode = WAL')
    this.db.pragma('foreign_keys = ON')
  }

  initialize() {
    if (this.initialized) return

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS organizations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        description TEXT,
        owner_id TEXT NOT NULL,
        settings TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `)

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations (slug)
    `)

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_organizations_owner ON organizations (owner_id)
    `)

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS teams (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        organization_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
      )
    `)

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_teams_organization ON teams (organization_id)
    `)

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS organization_members (
        id TEXT PRIMARY KEY,
        organization_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'member',
        joined_at TEXT NOT NULL,
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
        UNIQUE(organization_id, user_id)
      )
    `)

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_org_members_org ON organization_members (organization_id)
    `)

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members (user_id)
    `)

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS team_members (
        id TEXT PRIMARY KEY,
        team_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'member',
        joined_at TEXT NOT NULL,
        FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
        UNIQUE(team_id, user_id)
      )
    `)

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members (team_id)
    `)

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members (user_id)
    `)

    this.initialized = true
  }

  // --- Organizations ---

  insertOrganization(org: Organization): Organization {
    const stmt = this.db.prepare(`
      INSERT INTO organizations (id, name, slug, description, owner_id, settings, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    stmt.run(org.id, org.name, org.slug, org.description, org.ownerId, org.settings, org.createdAt, org.updatedAt)
    return org
  }

  findOrganizationById(id: string): Organization | undefined {
    const row = this.db.prepare('SELECT * FROM organizations WHERE id = ?').get(id) as OrganizationRow | undefined
    if (!row) return undefined
    return this.mapRowToOrganization(row)
  }

  findOrganizationBySlug(slug: string): Organization | undefined {
    const row = this.db.prepare('SELECT * FROM organizations WHERE slug = ?').get(slug) as OrganizationRow | undefined
    if (!row) return undefined
    return this.mapRowToOrganization(row)
  }

  listOrganizations(): Organization[] {
    const rows = this.db.prepare('SELECT * FROM organizations ORDER BY created_at DESC').all() as OrganizationRow[]
    return rows.map(row => this.mapRowToOrganization(row))
  }

  listOrganizationsForUser(userId: string): Organization[] {
    const rows = this.db.prepare(`
      SELECT o.* FROM organizations o
      JOIN organization_members om ON om.organization_id = o.id
      WHERE om.user_id = ?
      ORDER BY o.name
    `).all(userId) as OrganizationRow[]
    return rows.map(row => this.mapRowToOrganization(row))
  }

  updateOrganization(id: string, updates: Partial<Organization>): Organization | undefined {
    const existing = this.findOrganizationById(id)
    if (!existing) return undefined

    const merged = { ...existing, ...updates, updatedAt: new Date().toISOString() }
    const stmt = this.db.prepare(`
      UPDATE organizations SET name = ?, slug = ?, description = ?, owner_id = ?, settings = ?, updated_at = ?
      WHERE id = ?
    `)
    stmt.run(merged.name, merged.slug, merged.description, merged.ownerId, merged.settings, merged.updatedAt, id)
    return merged
  }

  deleteOrganization(id: string): boolean {
    const result = this.db.prepare('DELETE FROM organizations WHERE id = ?').run(id)
    return result.changes > 0
  }

  // --- Teams ---

  insertTeam(team: Team): Team {
    const stmt = this.db.prepare(`
      INSERT INTO teams (id, name, description, organization_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    stmt.run(team.id, team.name, team.description, team.organizationId, team.createdAt, team.updatedAt)
    return team
  }

  findTeamById(id: string): Team | undefined {
    const row = this.db.prepare('SELECT * FROM teams WHERE id = ?').get(id) as TeamRow | undefined
    if (!row) return undefined
    return this.mapRowToTeam(row)
  }

  listTeamsByOrganization(organizationId: string): Team[] {
    const rows = this.db.prepare('SELECT * FROM teams WHERE organization_id = ? ORDER BY name').all(organizationId) as TeamRow[]
    return rows.map(row => this.mapRowToTeam(row))
  }

  updateTeam(id: string, updates: Partial<Team>): Team | undefined {
    const existing = this.findTeamById(id)
    if (!existing) return undefined

    const merged = { ...existing, ...updates, updatedAt: new Date().toISOString() }
    const stmt = this.db.prepare(`
      UPDATE teams SET name = ?, description = ?, updated_at = ?
      WHERE id = ?
    `)
    stmt.run(merged.name, merged.description, merged.updatedAt, id)
    return merged
  }

  deleteTeam(id: string): boolean {
    const result = this.db.prepare('DELETE FROM teams WHERE id = ?').run(id)
    return result.changes > 0
  }

  // --- Organization Members ---

  insertOrganizationMember(member: OrganizationMember): OrganizationMember {
    const stmt = this.db.prepare(`
      INSERT INTO organization_members (id, organization_id, user_id, role, joined_at)
      VALUES (?, ?, ?, ?, ?)
    `)
    stmt.run(member.id, member.organizationId, member.userId, member.role, member.joinedAt)
    return member
  }

  findOrganizationMember(organizationId: string, userId: string): OrganizationMember | undefined {
    const row = this.db.prepare(
      'SELECT * FROM organization_members WHERE organization_id = ? AND user_id = ?'
    ).get(organizationId, userId) as OrganizationMemberRow | undefined
    if (!row) return undefined
    return this.mapRowToOrganizationMember(row)
  }

  listOrganizationMembers(organizationId: string): OrganizationMember[] {
    const rows = this.db.prepare(
      'SELECT * FROM organization_members WHERE organization_id = ? ORDER BY joined_at'
    ).all(organizationId) as OrganizationMemberRow[]
    return rows.map(row => this.mapRowToOrganizationMember(row))
  }

  updateOrganizationMember(organizationId: string, userId: string, role: string): OrganizationMember | undefined {
    const existing = this.findOrganizationMember(organizationId, userId)
    if (!existing) return undefined
    this.db.prepare('UPDATE organization_members SET role = ? WHERE organization_id = ? AND user_id = ?').run(role, organizationId, userId)
    return { ...existing, role: role as 'admin' | 'member' }
  }

  deleteOrganizationMember(organizationId: string, userId: string): boolean {
    const result = this.db.prepare(
      'DELETE FROM organization_members WHERE organization_id = ? AND user_id = ?'
    ).run(organizationId, userId)
    return result.changes > 0
  }

  // --- Team Members ---

  insertTeamMember(member: TeamMember): TeamMember {
    const stmt = this.db.prepare(`
      INSERT INTO team_members (id, team_id, user_id, role, joined_at)
      VALUES (?, ?, ?, ?, ?)
    `)
    stmt.run(member.id, member.teamId, member.userId, member.role, member.joinedAt)
    return member
  }

  findTeamMember(teamId: string, userId: string): TeamMember | undefined {
    const row = this.db.prepare(
      'SELECT * FROM team_members WHERE team_id = ? AND user_id = ?'
    ).get(teamId, userId) as TeamMemberRow | undefined
    if (!row) return undefined
    return this.mapRowToTeamMember(row)
  }

  listTeamMembers(teamId: string): TeamMember[] {
    const rows = this.db.prepare(
      'SELECT * FROM team_members WHERE team_id = ? ORDER BY joined_at'
    ).all(teamId) as TeamMemberRow[]
    return rows.map(row => this.mapRowToTeamMember(row))
  }

  updateTeamMember(teamId: string, userId: string, role: string): TeamMember | undefined {
    const existing = this.findTeamMember(teamId, userId)
    if (!existing) return undefined
    this.db.prepare('UPDATE team_members SET role = ? WHERE team_id = ? AND user_id = ?').run(role, teamId, userId)
    return { ...existing, role: role as 'lead' | 'member' }
  }

  deleteTeamMember(teamId: string, userId: string): boolean {
    const result = this.db.prepare(
      'DELETE FROM team_members WHERE team_id = ? AND user_id = ?'
    ).run(teamId, userId)
    return result.changes > 0
  }

  // --- Mappers ---

  private mapRowToOrganization(row: OrganizationRow): Organization {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      ownerId: row.owner_id,
      settings: row.settings,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }

  private mapRowToTeam(row: TeamRow): Team {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      organizationId: row.organization_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }

  private mapRowToOrganizationMember(row: OrganizationMemberRow): OrganizationMember {
    return {
      id: row.id,
      organizationId: row.organization_id,
      userId: row.user_id,
      role: row.role as 'admin' | 'member',
      joinedAt: row.joined_at,
    }
  }

  private mapRowToTeamMember(row: TeamMemberRow): TeamMember {
    return {
      id: row.id,
      teamId: row.team_id,
      userId: row.user_id,
      role: row.role as 'lead' | 'member',
      joinedAt: row.joined_at,
    }
  }

  close() {
    try { this.db.close() } catch {}
  }
}

let databaseInstance: OrgDatabase | null = null

export function getOrgDatabase(databasePath?: string): OrgDatabase {
  if (!databaseInstance) {
    databaseInstance = new OrgDatabase(databasePath)
    databaseInstance.initialize()
  }
  return databaseInstance
}

export function resetOrgDatabase(): void {
  if (databaseInstance) {
    databaseInstance.close()
    databaseInstance = null
  }
}
