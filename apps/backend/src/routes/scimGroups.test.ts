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

describe('SCIM 2.0 Group Endpoints', () => {
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
  const SCIM_GROUP_SCHEMA = 'urn:ietf:params:scim:schemas:core:2.0:Group'
  const SCIM_LIST_SCHEMA = 'urn:ietf:params:scim:api:messages:2.0:ListResponse'

  describe('POST /api/scim/Groups', () => {
    it('creates a group with required fields', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/scim/Groups',
        headers: authHeaders(),
        payload: {
          schemas: [SCIM_GROUP_SCHEMA],
          displayName: 'Developers',
        },
      })
      expect(res.statusCode).toBe(201)
      const body = res.json()
      expect(body.schemas).toContain(SCIM_GROUP_SCHEMA)
      expect(body.displayName).toBe('Developers')
      expect(body.members).toEqual([])
      expect(body.meta.resourceType).toBe('Group')
      expect(body.id).toBeDefined()
    })

    it('creates a group with members', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/scim/Groups',
        headers: authHeaders(),
        payload: {
          schemas: [SCIM_GROUP_SCHEMA],
          displayName: 'Team Alpha',
          members: [adminId],
        },
      })
      expect(res.statusCode).toBe(201)
      const body = res.json()
      expect(body.displayName).toBe('Team Alpha')
      expect(body.members).toHaveLength(1)
      expect(body.members[0].value).toBe(adminId)
    })

    it('returns 409 for duplicate displayName', async () => {
      const name = `dup-group-${randomUUID().slice(0, 8)}`
      await app.inject({
        method: 'POST',
        url: '/api/scim/Groups',
        headers: authHeaders(),
        payload: { schemas: [SCIM_GROUP_SCHEMA], displayName: name },
      })
      const res = await app.inject({
        method: 'POST',
        url: '/api/scim/Groups',
        headers: authHeaders(),
        payload: { schemas: [SCIM_GROUP_SCHEMA], displayName: name },
      })
      expect(res.statusCode).toBe(409)
      const body = res.json()
      expect(body).toHaveProperty('error')
    })

    it('returns 400 for missing required schema', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/scim/Groups',
        headers: authHeaders(),
        payload: {
          schemas: ['urn:ietf:params:scim:schemas:core:2.0:User'],
          displayName: 'NoSchemaGroup',
        },
      })
      expect(res.statusCode).toBe(400)
    })

    it('returns 400 for missing displayName', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/scim/Groups',
        headers: authHeaders(),
        payload: {
          schemas: [SCIM_GROUP_SCHEMA],
        },
      })
      expect(res.statusCode).toBe(400)
    })
  })

  describe('GET /api/scim/Groups', () => {
    it('returns paginated list', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/scim/Groups',
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
        url: '/api/scim/Groups?startIndex=1&count=2',
        headers: authHeaders(),
      })
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.startIndex).toBe(1)
      expect(body.itemsPerPage).toBe(2)
    })

    it('supports filter by displayName eq', async () => {
      const name = `filter-group-${randomUUID().slice(0, 8)}`
      await app.inject({
        method: 'POST',
        url: '/api/scim/Groups',
        headers: authHeaders(),
        payload: { schemas: [SCIM_GROUP_SCHEMA], displayName: name },
      })
      const filter = `displayName eq "${name}"`
      const res = await app.inject({
        method: 'GET',
        url: `/api/scim/Groups?filter=${encodeURIComponent(filter)}`,
        headers: authHeaders(),
      })
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.totalResults).toBe(1)
      expect(body.Resources[0].displayName).toBe(name)
    })
  })

  describe('GET /api/scim/Groups/:id', () => {
    let groupId: string

    beforeAll(async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/scim/Groups',
        headers: authHeaders(),
        payload: { schemas: [SCIM_GROUP_SCHEMA], displayName: 'GetTestGroup' },
      })
      groupId = res.json().id
    })

    it('returns a group by UUID', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/scim/Groups/${groupId}`,
        headers: authHeaders(),
      })
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.id).toBe(groupId)
      expect(body.displayName).toBe('GetTestGroup')
    })

    it('returns 404 for non-existent group', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/scim/Groups/${randomUUID()}`,
        headers: authHeaders(),
      })
      expect(res.statusCode).toBe(404)
    })

    it('returns 400 for invalid UUID format', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/scim/Groups/invalid-uuid',
        headers: authHeaders(),
      })
      expect(res.statusCode).toBe(400)
    })
  })

  describe('PUT /api/scim/Groups/:id', () => {
    let groupId: string

    beforeAll(async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/scim/Groups',
        headers: authHeaders(),
        payload: {
          schemas: [SCIM_GROUP_SCHEMA],
          displayName: 'Before Update',
          members: [],
        },
      })
      groupId = res.json().id
    })

    it('updates displayName', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: `/api/scim/Groups/${groupId}`,
        headers: authHeaders(),
        payload: {
          schemas: [SCIM_GROUP_SCHEMA],
          displayName: 'After Update',
        },
      })
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.displayName).toBe('After Update')
      expect(body.id).toBe(groupId)
    })

    it('syncs members on update', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: `/api/scim/Groups/${groupId}`,
        headers: authHeaders(),
        payload: {
          schemas: [SCIM_GROUP_SCHEMA],
          displayName: 'With Members',
          members: [adminId],
        },
      })
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.members).toHaveLength(1)
      expect(body.members[0].value).toBe(adminId)
    })

    it('removes members when empty array sent', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: `/api/scim/Groups/${groupId}`,
        headers: authHeaders(),
        payload: {
          schemas: [SCIM_GROUP_SCHEMA],
          displayName: 'No Members',
          members: [],
        },
      })
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.members).toHaveLength(0)
    })

    it('returns 404 for non-existent group', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: `/api/scim/Groups/${randomUUID()}`,
        headers: authHeaders(),
        payload: {
          schemas: [SCIM_GROUP_SCHEMA],
          displayName: 'Nobody',
        },
      })
      expect(res.statusCode).toBe(404)
    })

    it('returns 400 for invalid UUID', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: '/api/scim/Groups/invalid-uuid',
        headers: authHeaders(),
        payload: {
          schemas: [SCIM_GROUP_SCHEMA],
          displayName: 'Bad Id',
        },
      })
      expect(res.statusCode).toBe(400)
    })
  })

  describe('DELETE /api/scim/Groups/:id', () => {
    let groupId: string

    beforeAll(async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/scim/Groups',
        headers: authHeaders(),
        payload: { schemas: [SCIM_GROUP_SCHEMA], displayName: 'ToDelete' },
      })
      groupId = res.json().id
    })

    it('deletes a group', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: `/api/scim/Groups/${groupId}`,
        headers: authHeaders(),
      })
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.message).toBe('Group deleted successfully')
      expect(body.id).toBe(groupId)
      const group = db.findGroupById(groupId)
      expect(group).toBeUndefined()
    })

    it('returns 404 for non-existent group', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: `/api/scim/Groups/${randomUUID()}`,
        headers: authHeaders(),
      })
      expect(res.statusCode).toBe(404)
    })

    it('returns 400 for invalid UUID', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: '/api/scim/Groups/invalid-uuid',
        headers: authHeaders(),
      })
      expect(res.statusCode).toBe(400)
    })
  })
})
