import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { getAuthDatabase, AuthDatabase } from './database'
import { registerUser, loginUser, refreshUserTokens, logoutUser, getCurrentUser, AppError } from './service'

process.env.JWT_SECRET = 'test-secret-do-not-use'

function freshDb(): AuthDatabase {
  const db = new AuthDatabase(':memory:')
  db.initialize()
  return db
}

describe('AuthDatabase', () => {
  it('creates and finds a user', () => {
    const db = freshDb()
    const user = db.createUser({
      id: 'user-1',
      email: 'test@example.com',
      passwordHash: 'hash123',
      displayName: 'Test User',
      roleId: 'role_viewer',
    })
    expect(user.email).toBe('test@example.com')
    expect(user.display_name).toBe('Test User')

    const found = db.findUserByEmail('test@example.com')
    expect(found?.id).toBe('user-1')
    db.close()
  })

  it('seeds default roles and permissions', () => {
    const db = freshDb()
    const roles = db.listRoles()
    expect(roles.length).toBe(4)
    expect(roles.map(r => r.name)).toContain('admin')
    expect(roles.map(r => r.name)).toContain('viewer')

    const perms = db.getPermissionsForRole('role_admin')
    expect(perms.length).toBeGreaterThan(0)
    expect(perms.map(p => p.name)).toContain('admin:all')
    db.close()
  })

  it('prevents duplicate email', () => {
    const db = freshDb()
    db.createUser({
      id: 'user-1',
      email: 'dup@example.com',
      passwordHash: 'hash1',
      displayName: null,
      roleId: 'role_viewer',
    })
    expect(() => {
      db.createUser({
        id: 'user-2',
        email: 'dup@example.com',
        passwordHash: 'hash2',
        displayName: null,
        roleId: 'role_viewer',
      })
    }).toThrow()
    db.close()
  })

  it('stores and finds refresh tokens', () => {
    const db = freshDb()
    db.createUser({
      id: 'user-1',
      email: 'test@example.com',
      passwordHash: 'hash',
      displayName: null,
      roleId: 'role_viewer',
    })
    db.storeRefreshToken({
      id: 'rt-1',
      userId: 'user-1',
      tokenHash: 'tokenhash123',
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    })
    const found = db.findRefreshTokenByHash('tokenhash123')
    expect(found?.user_id).toBe('user-1')
    expect(found?.revoked).toBe(0)

    db.revokeRefreshToken('rt-1')
    const revoked = db.findRefreshTokenByHash('tokenhash123')
    expect(revoked).toBeUndefined()
    db.close()
  })

  it('updates user fields', () => {
    const db = freshDb()
    db.createUser({
      id: 'user-1',
      email: 'test@example.com',
      passwordHash: 'hash',
      displayName: 'Old Name',
      roleId: 'role_viewer',
    })
    const updated = db.updateUser('user-1', { displayName: 'New Name' })
    expect(updated).toBe(true)
    const user = db.findUserById('user-1')
    expect(user?.display_name).toBe('New Name')
    db.close()
  })
})

describe('AuthService', () => {
  it('registers a new user', async () => {
    const result = await registerUser('newuser@example.com', 'password123', 'New User')
    expect(result.user.email).toBe('newuser@example.com')
    expect(result.user.roleName).toBe('viewer')
    expect(result.accessToken).toBeTruthy()
    expect(result.refreshToken).toBeTruthy()
  })

  it('rejects duplicate registration', async () => {
    await registerUser('dup@example.com', 'password123')
    await expect(registerUser('dup@example.com', 'password123')).rejects.toThrow(AppError)
  })

  it('rejects short passwords', async () => {
    await expect(registerUser('short@example.com', '1234567')).rejects.toThrow('Password must be at least 8 characters')
  })

  it('rejects invalid emails', async () => {
    await expect(registerUser('notanemail', 'password123')).rejects.toThrow('Invalid email format')
  })

  it('logs in a registered user', async () => {
    await registerUser('login@example.com', 'password123')
    const result = await loginUser('login@example.com', 'password123')
    expect(result.user.email).toBe('login@example.com')
    expect(result.accessToken).toBeTruthy()
    expect(result.refreshToken).toBeTruthy()
  })

  it('rejects invalid password', async () => {
    await registerUser('badpw@example.com', 'password123')
    await expect(loginUser('badpw@example.com', 'wrongpassword')).rejects.toThrow(AppError)
  })

  it('rejects nonexistent email', async () => {
    await expect(loginUser('nobody@example.com', 'password123')).rejects.toThrow(AppError)
  })

  it('refreshes tokens', async () => {
    const registered = await registerUser('refresh@example.com', 'password123')
    const result = await refreshUserTokens(registered.refreshToken)
    expect(result.user.email).toBe('refresh@example.com')
    expect(result.accessToken).toBeTruthy()
    expect(result.refreshToken).toBeTruthy()
    expect(result.refreshToken).not.toBe(registered.refreshToken)
  })

  it('rejects invalid refresh token', async () => {
    await expect(refreshUserTokens('invalidtoken')).rejects.toThrow(AppError)
  })

  it('logs out a user (revokes refresh token)', async () => {
    const registered = await registerUser('logout@example.com', 'password123')
    await logoutUser(registered.refreshToken)
    await expect(refreshUserTokens(registered.refreshToken)).rejects.toThrow(AppError)
  })

  it('gets current user by id', async () => {
    const registered = await registerUser('me@example.com', 'password123')
    const user = getCurrentUser(registered.user.id)
    expect(user).not.toBeNull()
    expect(user!.email).toBe('me@example.com')
  })

  it('returns null for nonexistent user', () => {
    const user = getCurrentUser('nonexistent-id')
    expect(user).toBeNull()
  })
})
