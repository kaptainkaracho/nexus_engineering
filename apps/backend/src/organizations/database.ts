import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import Database from 'better-sqlite3'
import type { Organization, Team, OrganizationMember, TeamMember, ArtifactRegistry, RegistryArtifact, RegistryCredentials, RegistryProviderType } from '@nexus-engineering/shared'

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

export interface ArtifactRegistryRow {
  id: string
  name: string
  description: string | null
  organization_id: string
  visibility: string
  allowed_roles: string | null
  registry_type: string
  url: string | null
  enabled: number
  created_by: string
  created_at: string
  updated_at: string
}

export interface RegistryCredentialsRow {
  id: string
  registry_id: string
  auth_type: string
  username: string | null
  secret_value: string | null
  env_var: string | null
  created_at: string
  updated_at: string
}

export interface RegistryArtifactRow {
  id: string
  registry_id: string
  artifact_id: string
  added_by: string
  added_at: string
  metadata: string | null
}

export class OrgDatabase {
  private db: Database.Database
  private initialized = false

  constructor(databasePath: string = DEFAULT_ORG_DB_PATH) {
    let dbPath = databasePath
    if (dbPath !== ':memory:') {
      try {
        mkdirSync(dirname(dbPath), { recursive: true })
      } catch {
        dbPath = ':memory:'
      }
    }
    this.db = new Database(dbPath)
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

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS registries (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        organization_id TEXT NOT NULL,
        visibility TEXT NOT NULL DEFAULT 'private' CHECK(visibility IN ('private', 'team', 'organization')),
        allowed_roles TEXT,
        registry_type TEXT NOT NULL DEFAULT 'generic' CHECK(registry_type IN ('npm', 'pypi', 'maven', 'generic')),
        url TEXT,
        enabled INTEGER NOT NULL DEFAULT 1,
        created_by TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
      )
    `)

    // Migration: add columns if missing (for databases created before schema extension)
    try { this.db.exec(`ALTER TABLE registries ADD COLUMN registry_type TEXT NOT NULL DEFAULT 'generic' CHECK(registry_type IN ('npm', 'pypi', 'maven', 'generic'))`) } catch {}
    try { this.db.exec(`ALTER TABLE registries ADD COLUMN url TEXT`) } catch {}
    try { this.db.exec(`ALTER TABLE registries ADD COLUMN enabled INTEGER NOT NULL DEFAULT 1`) } catch {}

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_registries_organization ON registries (organization_id)
    `)

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS registry_credentials (
        id TEXT PRIMARY KEY,
        registry_id TEXT NOT NULL,
        auth_type TEXT NOT NULL DEFAULT 'none' CHECK(auth_type IN ('none', 'basic', 'token', 'env')),
        username TEXT,
        secret_value TEXT,
        env_var TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (registry_id) REFERENCES registries(id) ON DELETE CASCADE,
        UNIQUE(registry_id)
      )
    `)

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_registry_credentials_registry ON registry_credentials (registry_id)
    `)

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS registry_artifacts (
        id TEXT PRIMARY KEY,
        registry_id TEXT NOT NULL,
        artifact_id TEXT NOT NULL,
        added_by TEXT NOT NULL,
        added_at TEXT NOT NULL,
        metadata TEXT,
        FOREIGN KEY (registry_id) REFERENCES registries(id) ON DELETE CASCADE,
        UNIQUE(registry_id, artifact_id)
      )
    `)

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_registry_artifacts_registry ON registry_artifacts (registry_id)
    `)

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_registry_artifacts_artifact ON registry_artifacts (artifact_id)
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

  listOrganizationMembersByUser(userId: string): OrganizationMember[] {
    const rows = this.db.prepare(
      'SELECT * FROM organization_members WHERE user_id = ? ORDER BY joined_at'
    ).all(userId) as OrganizationMemberRow[]
    return rows.map(row => this.mapRowToOrganizationMember(row))
  }

  findOrganizationInvite(organizationId: string, userId: string): OrganizationMember | undefined {
    return this.findOrganizationMember(organizationId, userId)
  }

  updateOrganizationMember(organizationId: string, userId: string, role: string): OrganizationMember | undefined {
    const existing = this.findOrganizationMember(organizationId, userId)
    if (!existing) return undefined
    this.db.prepare('UPDATE organization_members SET role = ? WHERE organization_id = ? AND user_id = ?').run(role, organizationId, userId)
    return { ...existing, role: role as 'org:admin' | 'org:member' | 'org:viewer' }
  }

  deleteOrganizationMember(organizationId: string, userId: string): boolean {
    const result = this.db.prepare(
      'DELETE FROM organization_members WHERE organization_id = ? AND user_id = ?'
    ).run(organizationId, userId)
    return result.changes > 0
  }

  countOrganizationMembers(organizationId: string): number {
    const row = this.db.prepare(
      'SELECT COUNT(*) as count FROM organization_members WHERE organization_id = ?'
    ).get(organizationId) as any
    return row.count
  }

  isOrganizationOwner(userId: string, organizationId: string): boolean {
    const row = this.db.prepare(
      'SELECT owner_id FROM organizations WHERE id = ?'
    ).get(organizationId) as any
    return row?.owner_id === userId
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

  // --- Registries ---

  insertRegistry(registry: ArtifactRegistry): ArtifactRegistry {
    const stmt = this.db.prepare(`
      INSERT INTO registries (id, name, description, organization_id, visibility, allowed_roles, registry_type, url, enabled, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    stmt.run(
      registry.id,
      registry.name,
      registry.description,
      registry.organizationId,
      registry.visibility,
      registry.allowedRoles ? JSON.stringify(registry.allowedRoles) : null,
      registry.registryType,
      registry.url ?? null,
      registry.enabled ? 1 : 0,
      registry.createdBy,
      registry.createdAt,
      registry.updatedAt,
    )
    return registry
  }

  findRegistryById(id: string): ArtifactRegistry | undefined {
    const row = this.db.prepare('SELECT * FROM registries WHERE id = ?').get(id) as ArtifactRegistryRow | undefined
    if (!row) return undefined
    return this.mapRowToArtifactRegistry(row)
  }

  listRegistriesByOrganization(organizationId: string): ArtifactRegistry[] {
    const rows = this.db.prepare(
      'SELECT * FROM registries WHERE organization_id = ? ORDER BY name'
    ).all(organizationId) as ArtifactRegistryRow[]
    return rows.map(row => this.mapRowToArtifactRegistry(row))
  }

  updateRegistry(id: string, updates: Partial<ArtifactRegistry>): ArtifactRegistry | undefined {
    const existing = this.findRegistryById(id)
    if (!existing) return undefined

    const merged = { ...existing, ...updates, updatedAt: new Date().toISOString() }
    const stmt = this.db.prepare(`
      UPDATE registries SET name = ?, description = ?, visibility = ?, allowed_roles = ?, registry_type = ?, url = ?, enabled = ?, updated_at = ?
      WHERE id = ?
    `)
    stmt.run(
      merged.name,
      merged.description ?? null,
      merged.visibility,
      merged.allowedRoles ? JSON.stringify(merged.allowedRoles) : null,
      merged.registryType,
      merged.url ?? null,
      merged.enabled ? 1 : 0,
      merged.updatedAt,
      id,
    )
    return merged
  }

  deleteRegistry(id: string): boolean {
    const result = this.db.prepare('DELETE FROM registries WHERE id = ?').run(id)
    return result.changes > 0
  }

  // --- Registry Artifacts ---

  insertRegistryArtifact(ra: RegistryArtifact): RegistryArtifact {
    const stmt = this.db.prepare(`
      INSERT INTO registry_artifacts (id, registry_id, artifact_id, added_by, added_at, metadata)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    stmt.run(
      ra.id,
      ra.registryId,
      ra.artifactId,
      ra.addedBy,
      ra.addedAt,
      ra.metadata ? JSON.stringify(ra.metadata) : null,
    )
    return ra
  }

  findRegistryArtifact(registryId: string, artifactId: string): RegistryArtifact | undefined {
    const row = this.db.prepare(
      'SELECT * FROM registry_artifacts WHERE registry_id = ? AND artifact_id = ?'
    ).get(registryId, artifactId) as RegistryArtifactRow | undefined
    if (!row) return undefined
    return this.mapRowToRegistryArtifact(row)
  }

  listRegistryArtifacts(registryId: string): RegistryArtifact[] {
    const rows = this.db.prepare(
      'SELECT * FROM registry_artifacts WHERE registry_id = ? ORDER BY added_at DESC'
    ).all(registryId) as RegistryArtifactRow[]
    return rows.map(row => this.mapRowToRegistryArtifact(row))
  }

  deleteRegistryArtifact(registryId: string, artifactId: string): boolean {
    const result = this.db.prepare(
      'DELETE FROM registry_artifacts WHERE registry_id = ? AND artifact_id = ?'
    ).run(registryId, artifactId)
    return result.changes > 0
  }

  // --- Registry Credentials ---

  upsertRegistryCredentials(creds: RegistryCredentials): RegistryCredentials {
    const stmt = this.db.prepare(`
      INSERT INTO registry_credentials (id, registry_id, auth_type, username, secret_value, env_var, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(registry_id) DO UPDATE SET
        auth_type = excluded.auth_type,
        username = excluded.username,
        secret_value = excluded.secret_value,
        env_var = excluded.env_var,
        updated_at = excluded.updated_at
    `)
    stmt.run(
      creds.id,
      creds.registryId,
      creds.authType,
      creds.username ?? null,
      creds.secretValue ?? null,
      creds.envVar ?? null,
      creds.createdAt,
      creds.updatedAt,
    )
    return creds
  }

  findRegistryCredentials(registryId: string): RegistryCredentials | undefined {
    const row = this.db.prepare(
      'SELECT * FROM registry_credentials WHERE registry_id = ?'
    ).get(registryId) as RegistryCredentialsRow | undefined
    if (!row) return undefined
    return this.mapRowToRegistryCredentials(row)
  }

  deleteRegistryCredentials(registryId: string): boolean {
    const result = this.db.prepare('DELETE FROM registry_credentials WHERE registry_id = ?').run(registryId)
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
      role: row.role as 'org:admin' | 'org:member' | 'org:viewer',
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

  private mapRowToArtifactRegistry(row: ArtifactRegistryRow): ArtifactRegistry {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      organizationId: row.organization_id,
      visibility: row.visibility as 'private' | 'team' | 'organization',
      allowedRoles: row.allowed_roles ? JSON.parse(row.allowed_roles) as string[] : null,
      registryType: row.registry_type as RegistryProviderType,
      url: row.url ?? null,
      enabled: row.enabled === 1,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }

  private mapRowToRegistryCredentials(row: RegistryCredentialsRow): RegistryCredentials {
    return {
      id: row.id,
      registryId: row.registry_id,
      authType: row.auth_type as 'none' | 'basic' | 'token' | 'env',
      username: row.username ?? null,
      secretValue: row.secret_value ?? null,
      envVar: row.env_var ?? null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }

  private mapRowToRegistryArtifact(row: RegistryArtifactRow): RegistryArtifact {
    return {
      id: row.id,
      registryId: row.registry_id,
      artifactId: row.artifact_id,
      addedBy: row.added_by,
      addedAt: row.added_at,
      metadata: row.metadata ? JSON.parse(row.metadata) as Record<string, unknown> : undefined,
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
