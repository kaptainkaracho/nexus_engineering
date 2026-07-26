import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fastify from 'fastify'
import { randomUUID } from 'node:crypto'
import { complianceRoutes } from './complianceReports'
import { resetComplianceDatabase } from '../complianceReports/database'
import { registerErrorHandler } from '../lib/errorHandler'
import { resetRateLimiters } from '../lib/rateLimiter'
import { sign } from '../auth/jwt'
import type { FastifyInstance } from 'fastify'
import type { AuthDatabase } from '../auth/database'

const testDb = vi.hoisted(() => ({ db: null as any }))

vi.mock('../auth/database', async (importOriginal) => {
  const mod = await importOriginal()
  return {
    ...mod!,
    getAuthDatabase: () => testDb.db,
  }
})

describe('Compliance Reports Routes', () => {
  let server: FastifyInstance
  let token: string

  beforeEach(async () => {
    const { AuthDatabase } = await vi.importActual<typeof import('../auth/database')>('../auth/database')
    const db = new AuthDatabase(':memory:') as unknown as AuthDatabase
    db.initialize()
    testDb.db = db

    const userId = randomUUID()
    db.createUser({
      id: userId,
      email: 'compliance@test.com',
      passwordHash: 'hash',
      displayName: 'Compliance User',
      roleId: 'role_admin',
    })

    token = await sign({
      sub: userId,
      email: 'compliance@test.com',
      role: 'admin',
      permissions: ['compliance:read', 'compliance:write'],
    })

    server = fastify()
    registerErrorHandler(server)
    complianceRoutes(server)
    await server.ready()
  })

  afterEach(async () => {
    if (server) {
      await server.close()
    }
    resetComplianceDatabase()
    resetRateLimiters()
    testDb.db = null
  })

  function authHeaders(): Record<string, string> {
    return { authorization: `Bearer ${token}` }
  }

  it('GET /api/compliance/aggregations returns aggregation data', async () => {
    const res = await server.inject({ method: 'GET', url: '/api/compliance/aggregations', headers: authHeaders() })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body).toHaveProperty('summary')
    expect(body).toHaveProperty('coverage')
    expect(body).toHaveProperty('artifacts')
    expect(body).toHaveProperty('audit')
    expect(body).toHaveProperty('gaps')
    expect(body).toHaveProperty('generatedAt')
  })

  it('POST /api/compliance/reports creates a report', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/api/compliance/reports',
      headers: authHeaders(),
      body: { title: 'Test Report', reportType: 'coverage', format: 'json' },
    })
    expect(res.statusCode).toBe(201)
    const body = JSON.parse(res.body)
    expect(body).toHaveProperty('id')
    expect(body.title).toBe('Test Report')
    expect(body.reportType).toBe('coverage')
    expect(body.format).toBe('json')
    expect(body.status).toBe('completed')
  })

  it('POST /api/compliance/reports validates required fields', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/api/compliance/reports',
      headers: authHeaders(),
      body: { reportType: 'coverage', format: 'json' },
    })
    expect(res.statusCode).toBe(400)
  })

  it('POST /api/compliance/reports validates report type', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/api/compliance/reports',
      headers: authHeaders(),
      body: { title: 'Bad', reportType: 'invalid', format: 'json' },
    })
    expect(res.statusCode).toBe(400)
  })

  it('GET /api/compliance/reports lists reports', async () => {
    await server.inject({
      method: 'POST',
      url: '/api/compliance/reports',
      headers: authHeaders(),
      body: { title: 'Report A', reportType: 'coverage', format: 'json' },
    })
    await server.inject({
      method: 'POST',
      url: '/api/compliance/reports',
      headers: authHeaders(),
      body: { title: 'Report B', reportType: 'audit', format: 'csv' },
    })

    const res = await server.inject({ method: 'GET', url: '/api/compliance/reports', headers: authHeaders() })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body.items).toHaveLength(2)
    expect(body.total).toBe(2)
  })

  it('GET /api/compliance/reports/:id returns a report', async () => {
    const create = await server.inject({
      method: 'POST',
      url: '/api/compliance/reports',
      headers: authHeaders(),
      body: { title: 'My Report', reportType: 'full', format: 'json' },
    })
    const { id } = JSON.parse(create.body)

    const res = await server.inject({ method: 'GET', url: `/api/compliance/reports/${id}`, headers: authHeaders() })
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body).id).toBe(id)
  })

  it('GET /api/compliance/reports/:id/download returns a file', async () => {
    const create = await server.inject({
      method: 'POST',
      url: '/api/compliance/reports',
      headers: authHeaders(),
      body: { title: 'Download Test', reportType: 'coverage', format: 'csv' },
    })
    const { id } = JSON.parse(create.body)

    const res = await server.inject({ method: 'GET', url: `/api/compliance/reports/${id}/download`, headers: authHeaders() })
    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toBe('text/csv')
    expect(res.headers['content-disposition']).toContain('.csv')
  })

  it('DELETE /api/compliance/reports/:id deletes a report', async () => {
    const create = await server.inject({
      method: 'POST',
      url: '/api/compliance/reports',
      headers: authHeaders(),
      body: { title: 'Delete Me', reportType: 'full', format: 'json' },
    })
    const { id } = JSON.parse(create.body)

    const del = await server.inject({ method: 'DELETE', url: `/api/compliance/reports/${id}`, headers: authHeaders() })
    expect(del.statusCode).toBe(200)

    const get = await server.inject({ method: 'GET', url: `/api/compliance/reports/${id}`, headers: authHeaders() })
    expect(get.statusCode).toBe(404)
  })

  it('GET /api/compliance/reports/:id - 404 for unknown report', async () => {
    const res = await server.inject({ method: 'GET', url: '/api/compliance/reports/nonexistent', headers: authHeaders() })
    expect(res.statusCode).toBe(404)
  })

  it('POST /api/compliance/reports creates PDF report', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/api/compliance/reports',
      headers: authHeaders(),
      body: { title: 'PDF Report', reportType: 'full', format: 'pdf' },
    })
    expect(res.statusCode).toBe(201)
    const body = JSON.parse(res.body)
    expect(body.format).toBe('pdf')
    expect(body.status).toBe('completed')
    expect(body.filePath).toBeTruthy()
  })

  it('GET /api/compliance/reports filters by reportType', async () => {
    await server.inject({
      method: 'POST',
      url: '/api/compliance/reports',
      headers: authHeaders(),
      body: { title: 'Coverage', reportType: 'coverage', format: 'json' },
    })
    await server.inject({
      method: 'POST',
      url: '/api/compliance/reports',
      headers: authHeaders(),
      body: { title: 'Audit', reportType: 'audit', format: 'json' },
    })

    const res = await server.inject({ method: 'GET', url: '/api/compliance/reports?reportType=coverage', headers: authHeaders() })
    const body = JSON.parse(res.body)
    expect(body.items).toHaveLength(1)
    expect(body.items[0].reportType).toBe('coverage')
  })

  it('returns 401 without auth token', async () => {
    const res = await server.inject({ method: 'GET', url: '/api/compliance/reports' })
    expect(res.statusCode).toBe(401)
  })

  describe('SOC2 control mappings', () => {
    it('POST /api/compliance/soc2/mappings creates a mapping', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/api/compliance/soc2/mappings',
        headers: authHeaders(),
        body: { category: 'CC1', artifactId: 'req-001', artifactType: 'requirement' },
      })
      expect(res.statusCode).toBe(201)
      const body = JSON.parse(res.body)
      expect(body.category).toBe('CC1')
      expect(body.artifact_id).toBe('req-001')
      expect(body.status).toBe('not_assessed')
    })

    it('POST /api/compliance/soc2/mappings validates category', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/api/compliance/soc2/mappings',
        headers: authHeaders(),
        body: { category: 'INVALID', artifactId: 'req-001', artifactType: 'requirement' },
      })
      expect(res.statusCode).toBe(400)
    })

    it('GET /api/compliance/soc2/mappings lists mappings', async () => {
      await server.inject({
        method: 'POST',
        url: '/api/compliance/soc2/mappings',
        headers: authHeaders(),
        body: { category: 'CC1', artifactId: 'req-001', artifactType: 'requirement' },
      })
      await server.inject({
        method: 'POST',
        url: '/api/compliance/soc2/mappings',
        headers: authHeaders(),
        body: { category: 'CC6', artifactId: 'sec-001', artifactType: 'softwareComponent' },
      })

      const res = await server.inject({ method: 'GET', url: '/api/compliance/soc2/mappings', headers: authHeaders() })
      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.body)
      expect(body.items).toHaveLength(2)
      expect(body.total).toBe(2)
    })

    it('PUT /api/compliance/soc2/mappings/:id updates mapping status', async () => {
      const create = await server.inject({
        method: 'POST',
        url: '/api/compliance/soc2/mappings',
        headers: authHeaders(),
        body: { category: 'CC3', artifactId: 'risk-001', artifactType: 'requirement' },
      })
      const { id } = JSON.parse(create.body)

      const update = await server.inject({
        method: 'PUT',
        url: `/api/compliance/soc2/mappings/${id}`,
        headers: authHeaders(),
        body: { status: 'compliant', notes: 'Risk assessment documented' },
      })
      expect(update.statusCode).toBe(200)
      const body = JSON.parse(update.body)
      expect(body.status).toBe('compliant')
      expect(body.notes).toBe('Risk assessment documented')
    })

    it('DELETE /api/compliance/soc2/mappings/:id deletes a mapping', async () => {
      const create = await server.inject({
        method: 'POST',
        url: '/api/compliance/soc2/mappings',
        headers: authHeaders(),
        body: { category: 'CC9', artifactId: 'risk-mit-001', artifactType: 'requirement' },
      })
      const { id } = JSON.parse(create.body)

      const del = await server.inject({ method: 'DELETE', url: `/api/compliance/soc2/mappings/${id}`, headers: authHeaders() })
      expect(del.statusCode).toBe(200)

      const list = await server.inject({ method: 'GET', url: '/api/compliance/soc2/mappings', headers: authHeaders() })
      expect(JSON.parse(list.body).total).toBe(0)
    })

    it('GET /api/compliance/aggregations includes SOC2 data after mappings created', async () => {
      await server.inject({
        method: 'POST',
        url: '/api/compliance/soc2/mappings',
        headers: authHeaders(),
        body: { category: 'CC1', artifactId: 'req-001', artifactType: 'requirement' },
      })
      await server.inject({
        method: 'POST',
        url: '/api/compliance/soc2/mappings',
        headers: authHeaders(),
        body: { category: 'CC6', artifactId: 'sec-001', artifactType: 'softwareComponent' },
      })

      const res = await server.inject({ method: 'GET', url: '/api/compliance/aggregations', headers: authHeaders() })
      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.body)
      expect(body).toHaveProperty('soc2')
      expect(body.soc2.totalMappings).toBe(2)
      expect(body.soc2.byStatus.not_assessed).toBe(2)
    })

    it('POST /api/compliance/reports with soc2 type generates SOC2 report', async () => {
      await server.inject({
        method: 'POST',
        url: '/api/compliance/soc2/mappings',
        headers: authHeaders(),
        body: { category: 'CC1', artifactId: 'req-001', artifactType: 'requirement' },
      })

      const res = await server.inject({
        method: 'POST',
        url: '/api/compliance/reports',
        headers: authHeaders(),
        body: { title: 'SOC2 Report', reportType: 'soc2', format: 'json' },
      })
      expect(res.statusCode).toBe(201)
      const body = JSON.parse(res.body)
      expect(body.reportType).toBe('soc2')
      expect(body.status).toBe('completed')
      expect(body.summary.soc2.totalMappings).toBe(1)
    })
  })
})