import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import fastify from 'fastify'
import { traceabilityRoutes } from './traceability'
import { getGraphDatabase } from '../graphBuilder/graphDatabase'

describe('Traceability Graph Query API', () => {
  let app: ReturnType<typeof fastify>

  beforeAll(async () => {
    const db = getGraphDatabase()
    db.upsertNodes([
      { id: 'auth-R1', type: 'requirement', title: 'Auth requirement' },
      { id: 'auth-F1', type: 'feature', title: 'Auth feature' },
      { id: 'auth-T1', type: 'testCase', title: 'Auth test' },
      { id: 'auth-Res1', type: 'result', title: 'Auth result' },
      { id: 'pay-R2', type: 'requirement', title: 'Pay requirement' },
      { id: 'pay-R3', type: 'requirement', title: 'Pay requirement with no downstream link' },
    ])
    db.upsertEdge({ sourceId: 'auth-R1', targetId: 'auth-F1', relationshipType: 'satisfies', confidence: 'high' })
    db.upsertEdge({ sourceId: 'auth-F1', targetId: 'auth-T1', relationshipType: 'verifies', confidence: 'medium' })
    db.upsertEdge({ sourceId: 'auth-T1', targetId: 'auth-Res1', relationshipType: 'produces', confidence: 'high' })
    db.upsertEdge({ sourceId: 'pay-R2', targetId: 'auth-F1', relationshipType: 'satisfies', confidence: 'low' })

    app = fastify()
    traceabilityRoutes(app)
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  it('GET /api/traceability/graph?depth=&filter= returns a filtered subgraph', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/traceability/graph?depth=2&filter=requirement,feature' })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.filters.nodeTypes).toEqual(['requirement', 'feature'])
    expect(body.nodes.every((n: any) => ['requirement', 'feature'].includes(n.type))).toBe(true)
    expect(body.totalNodes).toBeGreaterThan(0)
  })

  it('GET /api/traceability/impact/:artifactId returns a confidence-scored chain', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/traceability/impact/auth-R1?confidenceThreshold=0' })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.artifactId).toBe('auth-R1')
    expect(Array.isArray(body.artifacts)).toBe(true)
    expect(body.summary).toBeDefined()
    expect(body.impactGraph.nodes.length).toBeGreaterThan(0)
    if (body.artifacts.length) {
      expect(body.artifacts[0].confidenceScore).toBeGreaterThanOrEqual(0)
    }
  })

  it('GET /api/traceability/impact filters by confidenceThreshold', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/traceability/impact/auth-R1?confidenceThreshold=99' })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.artifacts.every((a: any) => a.confidenceScore >= 99)).toBe(true)
  })

  it('GET /api/traceability/coverage returns a full multi-dimensional report', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/traceability/coverage' })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.axes).toHaveLength(4)
    expect(body.crossArtifactGaps.length).toBeGreaterThan(0)
    expect(body.domainCoverage.length).toBeGreaterThan(0)
    expect(body.summary.totalArtifacts).toBeGreaterThan(0)
  })

  it('GET /api/traceability/coverage?domain= filters by domain', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/traceability/coverage?domain=auth' })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.domain).toBe('auth')
    expect(body.coverage).toBeDefined()
  })

  it('GET /api/traceability/coverage?domain=unknown returns 404', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/traceability/coverage?domain=nope' })
    expect(res.statusCode).toBe(404)
  })

  it('GET /api/traceability/report?format=markdown returns markdown', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/traceability/report?format=markdown' })
    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toContain('text/markdown')
    expect(res.body).toContain('# Traceability Status Report')
  })

  it('GET /api/traceability/report?format=json returns structured report', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/traceability/report?format=json' })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.format).toBe('json')
    expect(body.coverage).toBeDefined()
  })
})
