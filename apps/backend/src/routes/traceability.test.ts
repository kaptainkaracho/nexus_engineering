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

  it('GET /api/traceability/recommendations returns confidence-scored recommendations', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/traceability/recommendations' })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(Array.isArray(body.recommendations)).toBe(true)
    expect(body.total).toBeGreaterThan(0)
    for (const r of body.recommendations) {
      expect(r.id).toBeDefined()
      expect(r.type).toBeDefined()
      expect(r.severity).toMatch(/high|medium|low/)
      expect(r.confidence).toBeGreaterThanOrEqual(0)
      expect(r.confidence).toBeLessThanOrEqual(1)
      expect(r.autoFix).toBeDefined()
      expect(r.autoFix.confidence).toBeGreaterThanOrEqual(0)
    }
  })

  it('GET /api/traceability/recommendations?severity=high filters by severity', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/traceability/recommendations?severity=high' })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.recommendations.every((r: any) => r.severity === 'high')).toBe(true)
  })

  it('GET /api/traceability/recommendations?type=addTestCoverage filters by type', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/traceability/recommendations?type=addTestCoverage' })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.recommendations.every((r: any) => r.type === 'addTestCoverage')).toBe(true)
  })

  it('GET /api/traceability/recommendations?limit=1 limits results', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/traceability/recommendations?limit=1' })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.recommendations.length).toBe(1)
  })

  it('GET /api/traceability/recommendations?limit=invalid returns 400', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/traceability/recommendations?limit=-1' })
    expect(res.statusCode).toBe(400)
  })

  it('GET /api/traceability/gaps returns pairwise cross-artifact gaps', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/traceability/gaps' })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.data.length).toBeGreaterThan(0)
    for (const g of body.data) {
      expect(g).toHaveProperty('sourceType')
      expect(g).toHaveProperty('targetType')
      expect(g).toHaveProperty('totalPairs')
      expect(g).toHaveProperty('coveredPairs')
      expect(g).toHaveProperty('gapPercent')
      expect(g).toHaveProperty('sampleGaps')
      expect(g.sourceType).not.toBe(g.targetType)
      expect(g.coveredPairs).toBeLessThanOrEqual(g.totalPairs)
      expect(g.gapPercent).toBeGreaterThanOrEqual(0)
      expect(g.gapPercent).toBeLessThanOrEqual(100)
    }
  })

  it('GET /api/traceability/gaps?types= filters by artifact types', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/traceability/gaps?types=requirement,feature' })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    for (const g of body.data) {
      expect(['requirement', 'feature']).toContain(g.sourceType)
      expect(['requirement', 'feature']).toContain(g.targetType)
    }
  })

  it('GET /api/traceability/gaps reports full coverage for feature->testCase', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/traceability/gaps' })
    const body = res.json()
    const g = body.data.find((x: any) => x.sourceType === 'feature' && x.targetType === 'testCase')
    expect(g).toBeDefined()
    expect(g.totalPairs).toBe(1)
    expect(g.coveredPairs).toBe(1)
    expect(g.gapPercent).toBe(0)
    expect(g.sampleGaps).toHaveLength(0)
  })
})
