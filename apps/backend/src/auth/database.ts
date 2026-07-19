import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import Database from 'better-sqlite3'

export const DEFAULT_AUTH_DB_PATH = process.env.DATABASE_PATH
  ? `${process.env.DATABASE_PATH}.auth`
  : ':memory:'

const SEED_ROLES = [
  { id: 'role_admin', name: 'admin', description: 'Full system access' },
  { id: 'role_developer', name: 'developer', description: 'Read/write access to most resources' },
  { id: 'role_viewer', name: 'viewer', description: 'Read-only access' },
  { id: 'role_analyst', name: 'analyst', description: 'Analytics and reporting access' },
]

const SEED_PERMISSIONS = [
  { id: 'perm_users_read', name: 'users:read', description: 'List and view users', resource: 'users', action: 'read' },
  { id: 'perm_users_write', name: 'users:write', description: 'Create, update, delete users', resource: 'users', action: 'write' },
  { id: 'perm_requirements_read', name: 'requirements:read', description: 'List and view requirements', resource: 'requirements', action: 'read' },
  { id: 'perm_requirements_write', name: 'requirements:write', description: 'Create, update, delete requirements', resource: 'requirements', action: 'write' },
  { id: 'perm_artifacts_read', name: 'artifacts:read', description: 'List and view artifacts', resource: 'artifacts', action: 'read' },
  { id: 'perm_artifacts_write', name: 'artifacts:write', description: 'Create, update, delete artifacts', resource: 'artifacts', action: 'write' },
  { id: 'perm_trace_links_read', name: 'trace-links:read', description: 'List and view trace links', resource: 'trace-links', action: 'read' },
  { id: 'perm_trace_links_write', name: 'trace-links:write', description: 'Create, update, delete trace links', resource: 'trace-links', action: 'write' },
  { id: 'perm_graph_read', name: 'graph:read', description: 'View graph data', resource: 'graph', action: 'read' },
  { id: 'perm_settings_read', name: 'settings:read', description: 'View system settings', resource: 'settings', action: 'read' },
  { id: 'perm_settings_write', name: 'settings:write', description: 'Update system settings', resource: 'settings', action: 'write' },
  { id: 'perm_admin_all', name: 'admin:all', description: 'Full administrative access', resource: 'admin', action: 'all' },
]

const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ['perm_admin_all', 'perm_users_read', 'perm_users_write', 'perm_requirements_read', 'perm_requirements_write', 'perm_artifacts_read', 'perm_artifacts_write', 'perm_trace_links_read', 'perm_trace_links_write', 'perm_graph_read', 'perm_settings_read', 'perm_settings_write'],
  developer: ['perm_requirements_read', 'perm_requirements_write', 'perm_artifacts_read', 'perm_artifacts_write', 'perm_trace_links_read', 'perm_trace_links_write', 'perm_graph_read', 'perm_users_read'],
  viewer: ['perm_requirements_read', 'perm_artifacts_read', 'perm_trace_links_read', 'perm_graph_read'],
  analyst: ['perm_requirements_read', 'perm_artifacts_read', 'perm_trace_links_read', 'perm_graph_read', 'perm_settings_read'],
}

export interface AuthUserRow {
  id: string
  email: string
  password_hash: string
  display_name: string | null
  role_id: string
  is_active: number
  email_verified: number
  created_at: string
  updated_at: string
}

export interface RoleRow {
  id: string
  name: string
  description: string | null
  created_at: string
}

export interface PermissionRow {
  id: string
  name: string
  description: string | null
  resource: string
  action: string
}

export interface RefreshTokenRow {
  id: string
  user_id: string
  token_hash: string
  expires_at: string
  created_at: string
  revoked: number
}

export interface OAuthAccountRow {
  id: string
  provider: string
  provider_user_id: string
  user_id: string
  email: string
  display_name: string | null
  avatar_url: string | null
  created_at: string
}

export class AuthDatabase {
  private db: Database.Database
  private initialized = false

  constructor(databasePath: string = DEFAULT_AUTH_DB_PATH) {
    if (databasePath !== ':memory:') mkdirSync(dirname(databasePath), { recursive: true })
    this.db = new Database(databasePath)
    this.db.pragma('journal_mode = WAL')
    this.db.pragma('foreign_keys = ON')
  }

  initialize() {
    if (this.initialized) return

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS roles (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        created_at TEXT NOT NULL
      )
    `)

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS permissions (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        resource TEXT NOT NULL,
        action TEXT NOT NULL
      )
    `)

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        role_id TEXT NOT NULL,
        permission_id TEXT NOT NULL,
        PRIMARY KEY (role_id, permission_id),
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
        FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
      )
    `)

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        display_name TEXT,
        role_id TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1,
        email_verified INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (role_id) REFERENCES roles(id)
      )
    `)

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users (email)
    `)

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token_hash TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        revoked INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `)

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens (user_id)
    `)

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens (token_hash)
    `)

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS oauth_accounts (
        id TEXT PRIMARY KEY,
        provider TEXT NOT NULL,
        provider_user_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        email TEXT NOT NULL,
        display_name TEXT,
        avatar_url TEXT,
        created_at TEXT NOT NULL,
        UNIQUE(provider, provider_user_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `)

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_oauth_accounts_user ON oauth_accounts (user_id)
    `)
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_oauth_accounts_provider ON oauth_accounts (provider, provider_user_id)
    `)

    this.seedDefaults()
    this.initialized = true
  }

  private seedDefaults() {
    const roleCount = this.db.prepare('SELECT COUNT(*) AS c FROM roles').get() as any
    if (roleCount.c > 0) return

    const now = new Date().toISOString()
    const insertRole = this.db.prepare('INSERT INTO roles (id, name, description, created_at) VALUES (?, ?, ?, ?)')
    const insertPermission = this.db.prepare('INSERT INTO permissions (id, name, description, resource, action) VALUES (?, ?, ?, ?, ?)')
    const insertRolePerm = this.db.prepare('INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)')

    const tx = this.db.transaction(() => {
      for (const role of SEED_ROLES) {
        insertRole.run(role.id, role.name, role.description, now)
      }
      for (const perm of SEED_PERMISSIONS) {
        insertPermission.run(perm.id, perm.name, perm.description, perm.resource, perm.action)
      }
      for (const [roleName, permIds] of Object.entries(ROLE_PERMISSIONS)) {
        const role = SEED_ROLES.find(r => r.name === roleName)
        if (!role) continue
        for (const permId of permIds) {
          insertRolePerm.run(role.id, permId)
        }
      }
    })
    tx()
  }

  createUser(user: {
    id: string
    email: string
    passwordHash: string
    displayName: string | null
    roleId: string
  }): AuthUserRow {
    const now = new Date().toISOString()
    const stmt = this.db.prepare(`
      INSERT INTO users (id, email, password_hash, display_name, role_id, is_active, email_verified, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 1, 0, ?, ?)
    `)
    stmt.run(user.id, user.email, user.passwordHash, user.displayName, user.roleId, now, now)
    return this.findUserById(user.id)!
  }

  findUserById(id: string): AuthUserRow | undefined {
    const row = this.db.prepare('SELECT * FROM users WHERE id = ?').get(id) as AuthUserRow | undefined
    return row
  }

  findUserByEmail(email: string): AuthUserRow | undefined {
    const row = this.db.prepare('SELECT * FROM users WHERE email = ?').get(email) as AuthUserRow | undefined
    return row
  }

  listUsers(): AuthUserRow[] {
    return this.db.prepare('SELECT * FROM users ORDER BY created_at DESC').all() as AuthUserRow[]
  }

  findRoleById(id: string): RoleRow | undefined {
    return this.db.prepare('SELECT * FROM roles WHERE id = ?').get(id) as RoleRow | undefined
  }

  findRoleByName(name: string): RoleRow | undefined {
    return this.db.prepare('SELECT * FROM roles WHERE name = ?').get(name) as RoleRow | undefined
  }

  listRoles(): RoleRow[] {
    return this.db.prepare('SELECT * FROM roles ORDER BY name').all() as RoleRow[]
  }

  getPermissionsForRole(roleId: string): PermissionRow[] {
    return this.db.prepare(`
      SELECT p.* FROM permissions p
      JOIN role_permissions rp ON rp.permission_id = p.id
      WHERE rp.role_id = ?
      ORDER BY p.resource, p.action
    `).all(roleId) as PermissionRow[]
  }

  getPermissionsForUser(userId: string): PermissionRow[] {
    return this.db.prepare(`
      SELECT p.* FROM permissions p
      JOIN role_permissions rp ON rp.permission_id = p.id
      JOIN users u ON u.role_id = rp.role_id
      WHERE u.id = ?
      ORDER BY p.resource, p.action
    `).all(userId) as PermissionRow[]
  }

  storeRefreshToken(token: { id: string; userId: string; tokenHash: string; expiresAt: string }): void {
    const now = new Date().toISOString()
    this.db.prepare(`
      INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, created_at, revoked)
      VALUES (?, ?, ?, ?, ?, 0)
    `).run(token.id, token.userId, token.tokenHash, token.expiresAt, now)
  }

  findRefreshTokenByHash(tokenHash: string): RefreshTokenRow | undefined {
    return this.db.prepare('SELECT * FROM refresh_tokens WHERE token_hash = ? AND revoked = 0').get(tokenHash) as RefreshTokenRow | undefined
  }

  revokeRefreshToken(id: string): void {
    this.db.prepare('UPDATE refresh_tokens SET revoked = 1 WHERE id = ?').run(id)
  }

  revokeAllUserRefreshTokens(userId: string): void {
    this.db.prepare('UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ?').run(userId)
  }

  createOAuthAccount(account: {
    id: string
    provider: string
    providerUserId: string
    userId: string
    email: string
    displayName: string | null
    avatarUrl: string | null
  }): OAuthAccountRow {
    const now = new Date().toISOString()
    this.db.prepare(`
      INSERT INTO oauth_accounts (id, provider, provider_user_id, user_id, email, display_name, avatar_url, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(account.id, account.provider, account.providerUserId, account.userId, account.email, account.displayName, account.avatarUrl, now)
    return this.findOAuthAccount(account.provider, account.providerUserId)!
  }

  findOAuthAccount(provider: string, providerUserId: string): OAuthAccountRow | undefined {
    return this.db.prepare('SELECT * FROM oauth_accounts WHERE provider = ? AND provider_user_id = ?').get(provider, providerUserId) as OAuthAccountRow | undefined
  }

  findOAuthAccountByUserId(provider: string, userId: string): OAuthAccountRow | undefined {
    return this.db.prepare('SELECT * FROM oauth_accounts WHERE provider = ? AND user_id = ?').get(provider, userId) as OAuthAccountRow | undefined
  }

  deleteOAuthAccount(id: string): void {
    this.db.prepare('DELETE FROM oauth_accounts WHERE id = ?').run(id)
  }

  updateUser(id: string, updates: { displayName?: string; roleId?: string; isActive?: boolean }): boolean {
    const parts: string[] = ['updated_at = ?']
    const values: unknown[] = [new Date().toISOString()]

    if (updates.displayName !== undefined) {
      parts.push('display_name = ?')
      values.push(updates.displayName)
    }
    if (updates.roleId !== undefined) {
      parts.push('role_id = ?')
      values.push(updates.roleId)
    }
    if (updates.isActive !== undefined) {
      parts.push('is_active = ?')
      values.push(updates.isActive ? 1 : 0)
    }

    if (parts.length === 1) return false
    const sql = `UPDATE users SET ${parts.join(', ')} WHERE id = ?`
    values.push(id)
    const result = this.db.prepare(sql).run(...values)
    return result.changes > 0
  }

  close() {
    try { this.db.close() } catch {}
  }
}

let databaseInstance: AuthDatabase | null = null

export function getAuthDatabase(databasePath?: string): AuthDatabase {
  if (!databaseInstance) {
    databaseInstance = new AuthDatabase(databasePath)
    databaseInstance.initialize()
  }
  return databaseInstance
}
