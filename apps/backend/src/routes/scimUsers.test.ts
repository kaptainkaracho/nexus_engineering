import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import fastify from 'fastify'
import { randomUUID } from 'node:crypto'
import { scimRoutes } from './scim'
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

describe('SCIM 2.0 User Endpoints', () => {
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
    scimRoutes(app)
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
    db.close()
  })

  const authHeaders = () => ({ authorization: `Bearer ${token}` })
  const SCIM_USER_SCHEMA = 'urn:ietf:params:scim:schemas:core:2.0:User'
  const SCIM_LIST_SCHEMA = 'urn:ietf:params:scim:api:messages:2.0:ListResponse'

  describe('POST /api/scim/Users', () => {
    it('creates a user with required fields', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/scim/Users',
        headers: authHeaders(),
        payload: {
          schemas: [SCIM_USER_SCHEMA],
          userName: 'newuser@test.com',
          displayName: 'New User',
        },
      })
      expect(res.statusCode).toBe(201)
      const body = res.json()
      expect(body.schemas).toContain(SCIM_USER_SCHEMA)
      expect(body.userName).toBe('newuser@test.com')
      expect(body.displayName).toBe('New User')
      expect(body.active).toBe(true)
      expect(body.meta.resourceType).toBe('User')
      expect(body.id).toBeDefined()
      expect(body.emails).toEqual([{ value: 'newuser@test.com', type: 'work', primary: true }])
    })

    it('returns 409 for duplicate email', async () => {
      const email = `dup-${randomUUID().slice(0, 8)}@test.com`
      await app.inject({
        method: 'POST',
        url: '/api/scim/Users',
        headers: authHeaders(),
        payload: { schemas: [SCIM_USER_SCHEMA], userName: email },
      })
      const res = await app.inject({
        method: 'POST',
        url: '/api/scim/Users',
        headers: authHeaders(),
        payload: { schemas: [SCIM_USER_SCHEMA], userName: email },
      })
      expect(res.statusCode).toBe(409)
      const body = res.json()
      expect(body).toHaveProperty('error')
    })

    it('returns 400 for missing required schema', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/scim/Users',
        headers: authHeaders(),
        payload: {
          schemas: ['urn:ietf:params:scim:schemas:core:2.0:Group'],
          userName: 'noschema@test.com',
        },
      })
      expect(res.statusCode).toBe(400)
    })

    it('returns 400 for invalid email userName', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/scim/Users',
        headers: authHeaders(),
        payload: {
          schemas: [SCIM_USER_SCHEMA],
          userName: 'not-an-email',
        },
      })
      expect(res.statusCode).toBe(400)
    })
  })

  describe('GET /api/scim/Users', () => {
    it('returns paginated list', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/scim/Users',
        headers: authHeaders(),
      })
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.schemas).toContain(SCIM_LIST_SCHEMA)
      expect(body.totalResults).toBeGreaterThanOrEqual(1)
      expect(body.itemsPerPage).toBeGreaterThan(0)
      expect(body.startIndex).toBe(1)
      expect(Array.isArray(body.Resources)).toBe(true)
    })

    it('supports startIndex and count parameters', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/scim/Users?startIndex=1&count=2',
        headers: authHeaders(),
      })
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.startIndex).toBe(1)
      expect(body.itemsPerPage).toBe(2)
    })

    it('supports filter by userName eq', async () => {
      const email = `filter-${randomUUID().slice(0, 8)}@test.com`
      await app.inject({
        method: 'POST',
        url: '/api/scim/Users',
        headers: authHeaders(),
        payload: { schemas: [SCIM_USER_SCHEMA], userName: email },
      })
      const filter = `userName eq "${email}"`
      const res = await app.inject({
        method: 'GET',
        url: `/api/scim/Users?filter=${encodeURIComponent(filter)}`,
        headers: authHeaders(),
      })
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.totalResults).toBe(1)
      expect(body.Resources[0].userName).toBe(email)
    })
  })

  describe('GET /api/scim/Users/:id', () => {
    it('returns a user by UUID', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/scim/Users/${adminId}`,
        headers: authHeaders(),
      })
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.id).toBe(adminId)
      expect(body.userName).toBe('admin@test.com')
    })

    it('returns 404 for non-existent user', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/scim/Users/${randomUUID()}`,
        headers: authHeaders(),
      })
      expect(res.statusCode).toBe(404)
    })

    it('returns 400 for invalid UUID format', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/scim/Users/invalid-uuid',
        headers: authHeaders(),
      })
      expect(res.statusCode).toBe(400)
    })
  })

  describe('PUT /api/scim/Users/:id', () => {
    let testUserId: string

    beforeAll(() => {
      testUserId = randomUUID()
      db.createUser({
        id: testUserId,
        email: 'puttest@test.com',
        passwordHash: 'hash',
        displayName: 'Before Update',
        roleId: 'role_viewer',
      })
    })

    it('updates user fields', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: `/api/scim/Users/${testUserId}`,
        headers: authHeaders(),
        payload: {
          schemas: [SCIM_USER_SCHEMA],
          userName: 'puttest@test.com',
          displayName: 'After Update',
          active: true,
        },
      })
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.displayName).toBe('After Update')
      expect(body.id).toBe(testUserId)
    })

    it('returns 404 for non-existent user', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: `/api/scim/Users/${randomUUID()}`,
        headers: authHeaders(),
        payload: {
          schemas: [SCIM_USER_SCHEMA],
          userName: 'nobody@test.com',
          displayName: 'Nobody',
        },
      })
      expect(res.statusCode).toBe(404)
    })
  })

  describe('PATCH /api/scim/Users/:id', () => {
    let testUserId: string

    beforeAll(() => {
      testUserId = randomUUID()
      db.createUser({
        id: testUserId,
        email: 'patchtest@test.com',
        passwordHash: 'hash',
        displayName: 'Original',
        roleId: 'role_viewer',
      })
    })

    it('replaces displayName via Operations', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/api/scim/Users/${testUserId}`,
        headers: authHeaders(),
        payload: {
          schemas: ['urn:ietf:params:scim:api:messages:2.0:PatchOp'],
          Operations: [{ op: 'replace', value: { displayName: 'Patched Name' } }],
        },
      })
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.displayName).toBe('Patched Name')
    })

    it('deactivates user with active=false', async () => {
      const deactivateId = randomUUID()
      db.createUser({
        id: deactivateId,
        email: 'deactivate@test.com',
        passwordHash: 'hash',
        displayName: 'To Deactivate',
        roleId: 'role_viewer',
      })
      const res = await app.inject({
        method: 'PATCH',
        url: `/api/scim/Users/${deactivateId}`,
        headers: authHeaders(),
        payload: {
          schemas: ['urn:ietf:params:scim:api:messages:2.0:PatchOp'],
          Operations: [{ op: 'replace', value: { active: false } }],
        },
      })
      expect(res.statusCode).toBe(200)
      expect(res.json().active).toBe(false)
    })

    it('returns 404 for non-existent user', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/api/scim/Users/${randomUUID()}`,
        headers: authHeaders(),
        payload: {
          schemas: ['urn:ietf:params:scim:api:messages:2.0:PatchOp'],
          Operations: [{ op: 'replace', value: { displayName: 'No One' } }],
        },
      })
      expect(res.statusCode).toBe(404)
    })
  })

  describe('DELETE /api/scim/Users/:id', () => {
    let testUserId: string

    beforeAll(() => {
      testUserId = randomUUID()
      db.createUser({
        id: testUserId,
        email: 'deletetest@test.com',
        passwordHash: 'hash',
        displayName: 'To Delete',
        roleId: 'role_viewer',
      })
    })

    it('deactivates user (soft delete)', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: `/api/scim/Users/${testUserId}`,
        headers: authHeaders(),
      })
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.message).toBe('User deactivated successfully')
      expect(body.id).toBe(testUserId)
      const user = db.findUserById(testUserId)
      expect(user.is_active).toBe(0)
    })

    it('returns 404 for non-existent user', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: `/api/scim/Users/${randomUUID()}`,
        headers: authHeaders(),
      })
      expect(res.statusCode).toBe(404)
    })
  })
})
