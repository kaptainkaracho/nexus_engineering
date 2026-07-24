import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import fastify from 'fastify'
import { traceabilityRoutes } from './traceability'
import { getGraphDatabase } from '../graphBuilder/graphDatabase'

describe('Trace Gate API', () => {
  let app: ReturnType<typeof fastify>

  beforeAll(async () => {
    const db = getGraphDatabase()
    db.upsertNodes([
      { id: 'gate-r1', type: 'requirement', title: 'R' },
      { id: 'gate-f1', type: 'feature', title: 'F' },
      { id: 'gate-t1', type: 'testCase', title: 'T' },
    ])
    db.upsertEdge({ sourceId: 'gate-r1', targetId: 'gate-f1', relationshipType: 'satisfies', confidence: 'high' })
    db.upsertEdge({ sourceId: 'gate-f1', targetId: 'gate-t1', relationshipType: 'verifies', confidence: 'high' })

    app = fastify()
    traceabilityRoutes(app)
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  it('GET /api/traceability/gate returns a shaped verdict', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/traceability/gate' })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(typeof body.pass).toBe('boolean')
    expect(body).toHaveProperty('metrics')
    expect(body).toHaveProperty('violations')
    expect(body).toHaveProperty('mode')
    expect(['warn', 'block']).toContain(body.mode)
  })

  it('GET /api/traceability/gate honors query overrides (block + fail)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/traceability/gate?coverageThreshold=100&mode=block',
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.pass).toBe(false)
    expect(body.mode).toBe('block')
    expect(body.violations.some((v: { rule: string }) => v.rule === 'coverageThreshold')).toBe(true)
  })

  it('GET /api/traceability/gate returns 400 on a non-numeric threshold', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/traceability/gate?coverageThreshold=abc',
    })
    expect(res.statusCode).toBe(400)
  })

  it('GET /api/traceability/gate-config returns the stored config shape', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/traceability/gate-config' })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(typeof body.coverageThreshold).toBe('number')
    expect(Array.isArray(body.requireTypes)).toBe(true)
    expect(['warn', 'block']).toContain(body.mode)
  })

  it('PUT /api/traceability/gate-config persists and echoes the config', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/traceability/gate-config',
      payload: { coverageThreshold: 75, maxGaps: 2, requireTypes: ['requirement'], mode: 'warn' },
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.coverageThreshold).toBe(75)
    expect(body.maxGaps).toBe(2)
    expect(body.requireTypes).toEqual(['requirement'])
  })

  it('PUT /api/traceability/gate-config rejects out-of-range values with 400', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/traceability/gate-config',
      payload: { coverageThreshold: 500 },
    })
    expect(res.statusCode).toBe(400)
    const body = res.json()
    expect(Array.isArray(body.errors)).toBe(true)
    expect(body.errors.length).toBeGreaterThan(0)
  })

  it('PUT /api/traceability/gate-config rejects a bad mode with 400', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/traceability/gate-config',
      payload: { mode: 'explode' },
    })
    expect(res.statusCode).toBe(400)
  })
})
