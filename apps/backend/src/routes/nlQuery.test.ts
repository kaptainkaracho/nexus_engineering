import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import fastify from 'fastify'
import { nlQueryRoutes } from './nlQuery'
import { getGraphDatabase } from '../graphBuilder/graphDatabase'

describe('NL Query API (THE-293)', () => {
  let app: ReturnType<typeof fastify>

  beforeAll(async () => {
    const db = getGraphDatabase()
    db.clear()
    db.upsertNodes([
      { id: 'auth-req-1', type: 'requirement', title: 'Auth login requirement' },
      { id: 'auth-req-2', type: 'requirement', title: 'Auth logout requirement (no downstream link)' },
      { id: 'auth-feat-1', type: 'feature', title: 'Auth feature' },
      { id: 'auth-feat-2', type: 'feature', title: 'Auth feature without tests' },
      { id: 'auth-test-1', type: 'testCase', title: 'Auth test' },
      { id: 'auth-test-2', type: 'testCase', title: 'Orphan test' },
      { id: 'auth-adr-1', type: 'architectureModel', title: 'Auth ADR' },
      { id: 'pay-adr-1', type: 'architectureModel', title: 'Payments ADR (orphan)' },
      { id: 'login.ts', type: 'softwareComponent', title: 'Login component' },
    ])
    db.upsertEdge({ sourceId: 'auth-req-1', targetId: 'auth-feat-1', relationshipType: 'satisfies', confidence: 'high' })
    db.upsertEdge({ sourceId: 'auth-feat-1', targetId: 'auth-test-1', relationshipType: 'verifies', confidence: 'medium' })
    db.upsertEdge({ sourceId: 'auth-adr-1', targetId: 'auth-test-1', relationshipType: 'tracesTo', confidence: 'high' })
    db.upsertEdge({ sourceId: 'login.ts', targetId: 'auth-feat-1', relationshipType: 'implements', confidence: 'high' })

    app = fastify()
    nlQueryRoutes(app)
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  const postQuery = (query: unknown) =>
    app.inject({ method: 'POST', url: '/api/traceability/query', payload: { query } })

  it('rejects an empty query with 400', async () => {
    const res = await postQuery('   ')
    expect(res.statusCode).toBe(400)
    expect(res.json().success).toBe(false)
    expect(res.json().error).toMatch(/required/i)
  })

  it('rejects a missing/non-string query body', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/traceability/query', payload: {} })
    expect(res.statusCode).toBe(400)
    expect(res.json().success).toBe(false)
  })

  it('returns untested requirements in a module', async () => {
    const res = await postQuery('Show me all untested requirements in the auth module')
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.success).toBe(true)
    expect(body.data.query.intent).toBe('requirement_query')
    expect(body.data.query.entityFilters.module).toBe('auth')
    expect(body.data.query.entityFilters.status).toBe('untested')
    const ids = body.data.results.map((r: any) => r.id)
    expect(ids).toContain('auth-req-2')
    expect(ids).not.toContain('auth-req-1')
    expect(body.data.metadata.executionTimeMs).toBeGreaterThanOrEqual(0)
  })

  it('returns untested features in a module', async () => {
    const res = await postQuery('untested features in the auth module')
    expect(res.statusCode).toBe(200)
    const ids = res.json().data.results.map((r: any) => r.id)
    expect(ids).toContain('auth-feat-2')
    expect(ids).not.toContain('auth-feat-1')
  })

  it('returns orphan ADRs', async () => {
    const res = await postQuery('Which orphan ADRs exist?')
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data.query.intent).toBe('adr_query')
    const ids = body.data.results.map((r: any) => r.id)
    expect(ids).toContain('pay-adr-1')
    expect(ids).not.toContain('auth-adr-1')
  })

  it('returns ADRs linked to an implementation (module extraction)', async () => {
    const res = await postQuery('Which ADRs are linked to the auth implementation?')
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data.query.entityFilters.module).toBe('auth')
    const ids = body.data.results.map((r: any) => r.id)
    expect(ids).toContain('auth-adr-1')
  })

  it('runs an impact query from a changed file', async () => {
    const res = await postQuery('What features are affected by changes to login.ts?')
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data.query.intent).toBe('impact_query')
    expect(body.data.query.entityFilters.file).toBe('login.ts')
    const ids = body.data.results.map((r: any) => r.id)
    expect(ids).toContain('auth-feat-1')
  })

  it('returns empty results for an unresolvable impact target', async () => {
    const res = await postQuery('impact of nonexistent-file.ts')
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.success).toBe(true)
    expect(body.data.results).toHaveLength(0)
    expect(body.data.totalResults).toBe(0)
  })

  it('includes trace links on result items when present', async () => {
    const res = await postQuery('linked features')
    expect(res.statusCode).toBe(200)
    const body = res.json()
    const feat = body.data.results.find((r: any) => r.id === 'auth-feat-1')
    expect(feat).toBeDefined()
    expect(feat.traceLinks?.length).toBeGreaterThan(0)
    expect(feat.traceLinks[0]).toHaveProperty('targetId')
    expect(feat.traceLinks[0]).toHaveProperty('relationshipType')
    expect(feat.traceLinks[0]).toHaveProperty('confidence')
  })
})
