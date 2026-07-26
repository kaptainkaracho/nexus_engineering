import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import fastify from 'fastify'
import { randomUUID } from 'node:crypto'
import { rbacRoutes } from './rbac'
import { registerErrorHandler } from '../lib/errorHandler'
import { sign } from '../auth/jwt'

const testDb = vi.hoisted(() => ({ db: null as any }))

vi.mock('../auth/database', async (importOriginal) => {
  const mod = await importOriginal()
  return {
    ...mod!,
    getAuthDatabase: () => testDb.db,
  }
})

describe('RBAC API', () => {
  let app: ReturnType<typeof fastify>
  let token: string
  let adminId: string
  let db: any

  beforeAll(async () => {
    const { AuthDatabase } = await vi.importActual<typeof import('../auth/database')>('../auth/database')
    db = new AuthDatabase(':memory:')
    db.initialize()
    testDb.db = db

    adminId = randomUUID()
    db.createUser({
      id: adminId,
      email: 'admin@test.com',
      passwordHash: 'hash',
      displayName: 'Admin',
      roleId: 'role_admin',
    })

    token = await sign({
      sub: adminId,
      email: 'admin@test.com',
      role: 'admin',
      permissions: ['admin:all'],
    })

    app = fastify()
    registerErrorHandler(app)
    rbacRoutes(app)
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
    db.close()
  })

  const authHeaders = () => ({ authorization: `Bearer ${token}` })

  describe('Custom Role CRUD', () => {
    let roleId: string

    it('GET /api/roles lists all roles including system roles', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/roles',
        headers: authHeaders(),
      })
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.total).toBeGreaterThanOrEqual(4)
      const names = body.roles.map((r: any) => r.name)
      expect(names).toContain('admin')
      expect(names).toContain('developer')
      expect(names).toContain('viewer')
      expect(names).toContain('analyst')
    })

    it('POST /api/roles creates a custom role', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/roles',
        headers: authHeaders(),
        payload: { name: 'qa-engineer', description: 'Quality assurance engineer' },
      })
      expect(res.statusCode).toBe(201)
      const body = res.json()
      expect(body.name).toBe('qa-engineer')
      expect(body.description).toBe('Quality assurance engineer')
      expect(body.isSystem).toBe(false)
      expect(body.id).toBeDefined()
      expect(body.id).toMatch(/^role_/)
      roleId = body.id
    })

    it('GET /api/roles/:id returns a single role with permissions', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/roles/${roleId}`,
        headers: authHeaders(),
      })
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.id).toBe(roleId)
      expect(body.name).toBe('qa-engineer')
      expect(body.permissions).toBeDefined()
      expect(Array.isArray(body.permissions)).toBe(true)
    })

    it('GET /api/roles/:id returns 404 for unknown role', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/roles/nonexistent',
        headers: authHeaders(),
      })
      expect(res.statusCode).toBe(404)
    })

    it('PUT /api/roles/:id updates a custom role', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: `/api/roles/${roleId}`,
        headers: authHeaders(),
        payload: { description: 'Updated QA engineer' },
      })
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.description).toBe('Updated QA engineer')
    })

    it('PUT /api/roles/:id returns 403 for system roles', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: '/api/roles/role_admin',
        headers: authHeaders(),
        payload: { description: 'trying to modify' },
      })
      expect(res.statusCode).toBe(403)
    })

    it('POST /api/roles returns 409 for duplicate name', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/roles',
        headers: authHeaders(),
        payload: { name: 'qa-engineer' },
      })
      expect(res.statusCode).toBe(409)
    })

    it('POST /api/roles validates name format', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/roles',
        headers: authHeaders(),
        payload: { name: 'Invalid Name!' },
      })
      expect(res.statusCode).toBe(400)
    })

    it('GET /api/roles/:id/permissions lists role permissions', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/roles/${roleId}/permissions`,
        headers: authHeaders(),
      })
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.permissions).toBeDefined()
      expect(Array.isArray(body.permissions)).toBe(true)
    })

    it('PUT /api/roles/:id/permissions sets role permissions', async () => {
      const allPerms = await app.inject({
        method: 'GET',
        url: '/api/permissions',
        headers: authHeaders(),
      })
      const permIds = allPerms.json().permissions.slice(0, 2).map((p: any) => p.id)

      const res = await app.inject({
        method: 'PUT',
        url: `/api/roles/${roleId}/permissions`,
        headers: authHeaders(),
        payload: { permissionIds: permIds },
      })
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.permissions).toHaveLength(2)
    })

    it('DELETE /api/roles/:id deletes a custom role', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: `/api/roles/${roleId}`,
        headers: authHeaders(),
      })
      expect(res.statusCode).toBe(200)
      expect(res.json().message).toBe('Role deleted successfully')

      const getRes = await app.inject({
        method: 'GET',
        url: `/api/roles/${roleId}`,
        headers: authHeaders(),
      })
      expect(getRes.statusCode).toBe(404)
    })

    it('DELETE /api/roles/:id returns 403 for system roles', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: '/api/roles/role_admin',
        headers: authHeaders(),
      })
      expect(res.statusCode).toBe(404)
    })

    it('rejects unauthenticated requests with 401', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/roles',
      })
      expect(res.statusCode).toBe(401)
    })
  })

  describe('Permission Sets', () => {
    let psetId: string

    it('GET /api/permission-sets lists permission sets', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/permission-sets',
        headers: authHeaders(),
      })
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(Array.isArray(body.permissionSets)).toBe(true)
    })

    it('POST /api/permission-sets creates a permission set', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/permission-sets',
        headers: authHeaders(),
        payload: { name: 'requirements-team', description: 'Requirements management team' },
      })
      expect(res.statusCode).toBe(201)
      const body = res.json()
      expect(body.name).toBe('requirements-team')
      expect(body.description).toBe('Requirements management team')
      expect(body.id).toBeDefined()
      expect(body.id).toMatch(/^pset_/)
      psetId = body.id
    })

    it('GET /api/permission-sets/:id returns a permission set with permissions', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/permission-sets/${psetId}`,
        headers: authHeaders(),
      })
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.id).toBe(psetId)
      expect(body.name).toBe('requirements-team')
      expect(body.permissions).toBeDefined()
    })

    it('PUT /api/permission-sets/:id updates a permission set', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: `/api/permission-sets/${psetId}`,
        headers: authHeaders(),
        payload: { description: 'Updated requirements team' },
      })
      expect(res.statusCode).toBe(200)
      expect(res.json().description).toBe('Updated requirements team')
    })

    it('PUT /api/permission-sets/:id/permissions sets permission set permissions', async () => {
      const allPerms = await app.inject({
        method: 'GET',
        url: '/api/permissions',
        headers: authHeaders(),
      })
      const permIds = allPerms.json().permissions.slice(0, 3).map((p: any) => p.id)

      const res = await app.inject({
        method: 'PUT',
        url: `/api/permission-sets/${psetId}/permissions`,
        headers: authHeaders(),
        payload: { permissionIds: permIds },
      })
      expect(res.statusCode).toBe(200)
      expect(res.json().permissions).toHaveLength(3)
    })

    it('DELETE /api/permission-sets/:id deletes a permission set', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: `/api/permission-sets/${psetId}`,
        headers: authHeaders(),
      })
      expect(res.statusCode).toBe(200)
      expect(res.json().message).toBe('Permission set deleted successfully')
    })
  })

  describe('Permissions listing', () => {
    it('GET /api/permissions lists all available permissions', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/permissions',
        headers: authHeaders(),
      })
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.total).toBeGreaterThan(0)
      expect(body.permissions.map((p: any) => p.name)).toContain('admin:all')
      expect(body.permissions.map((p: any) => p.name)).toContain('roles:read')
      expect(body.permissions.map((p: any) => p.name)).toContain('roles:write')
      expect(body.permissions.map((p: any) => p.name)).toContain('permission-sets:read')
      expect(body.permissions.map((p: any) => p.name)).toContain('permission-sets:write')
    })
  })

  describe('User Role Assignment', () => {
    let userId: string

    beforeAll(async () => {
      userId = randomUUID()
      db.createUser({
        id: userId,
        email: 'assign-test@test.com',
        passwordHash: 'hash',
        displayName: 'Assign Test',
        roleId: 'role_viewer',
      })
    })

    it('PUT /api/users/:userId/role updates user role', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: `/api/users/${userId}/role`,
        headers: authHeaders(),
        payload: { roleId: 'role_developer' },
      })
      expect(res.statusCode).toBe(200)
    })

    it('GET /api/users/roles lists users with role names', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/users/roles',
        headers: authHeaders(),
      })
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.total).toBeGreaterThanOrEqual(2)
      const found = body.users.find((u: any) => u.id === userId)
      expect(found).toBeDefined()
      expect(found.roleName).toBe('developer')
    })
  })

  describe('Permission middleware', () => {
    it('returns 403 without required permission', async () => {
      const userToken = await sign({
        sub: randomUUID(),
        email: 'restricted@test.com',
        role: 'viewer',
        permissions: ['requirements:read'],
      })
      const res = await app.inject({
        method: 'POST',
        url: '/api/roles',
        headers: { authorization: `Bearer ${userToken}` },
        payload: { name: 'should-fail' },
      })
      expect(res.statusCode).toBe(403)
      expect(res.json().error).toContain('Insufficient permissions')
    })
  })
})
