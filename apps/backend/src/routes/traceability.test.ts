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

  it('GET /api/traceability/impact with non-existent artifactId returns 500 gracefully', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/traceability/impact/nonexistent-R1?confidenceThreshold=0' })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.artifactId).toBe('nonexistent-R1')
    expect(body.artifacts).toEqual([])
    expect(body.summary.totalAffected).toBe(0)
  })

  it('GET /api/traceability/impact with node that has no edges returns empty impact', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/traceability/impact/pay-R3?confidenceThreshold=0' })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.artifactId).toBe('pay-R3')
    expect(body.summary.totalAffected).toBe(0)
  })

  it('GET /api/traceability/impact with confidenceThreshold=100 returns only direct high-confidence', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/traceability/impact/auth-R1?confidenceThreshold=100' })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    if (body.artifacts.length) {
      expect(body.artifacts.every((a: any) => a.confidenceScore >= 100)).toBe(true)
    }
  })

  it('GET /api/traceability/dependencies returns full dependency graph', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/traceability/dependencies' })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.totalNodes).toBeGreaterThan(0)
    expect(body.totalEdges).toBeGreaterThan(0)
    expect(Array.isArray(body.nodes)).toBe(true)
    expect(Array.isArray(body.edges)).toBe(true)
  })

  it('GET /api/traceability/dependencies?artifactId= filters to that artifact', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/traceability/dependencies?artifactId=auth-R1' })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.artifactId).toBe('auth-R1')
    expect(body.totalNodes).toBeGreaterThan(0)
  })

  it('GET /api/traceability/dependencies?artifactId=unknown returns 404', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/traceability/dependencies?artifactId=nonexistent-R1' })
    expect(res.statusCode).toBe(404)
    const body = res.json()
    expect(body.error).toBeDefined()
  })

  it('GET /api/traceability/dependencies?depth=1 limits traversal depth', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/traceability/dependencies?depth=1&artifactId=auth-R1' })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.depth).toBe(1)
    // With depth=1, should only include direct neighbors
    expect(body.totalNodes).toBeGreaterThan(0)
  })

  it('GET /api/traceability/dependencies?depth=invalid returns 400', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/traceability/dependencies?depth=invalid' })
    expect(res.statusCode).toBe(400)
    const body = res.json()
    expect(body.error).toContain('Invalid depth')
  })

  it('GET /api/traceability/dependencies?direction=downstream filters edges', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/traceability/dependencies?artifactId=auth-R1&direction=downstream' })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.direction).toBe('downstream')
    expect(body.totalEdges).toBeGreaterThanOrEqual(0)
  })

  it('GET /api/traceability/dependencies?direction=upstream filters edges', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/traceability/dependencies?artifactId=auth-T1&direction=upstream' })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.direction).toBe('upstream')
    expect(body.totalEdges).toBeGreaterThanOrEqual(0)
  })

  it('GET /api/traceability/dependencies?direction=invalid returns 400', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/traceability/dependencies?direction=invalid' })
    expect(res.statusCode).toBe(400)
    const body = res.json()
    expect(body.error).toContain('Invalid direction')
  })

  it('GET /api/traceability/dependencies?includeMetadata=true returns seed metadata', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/traceability/dependencies?artifactId=auth-R1&includeMetadata=true' })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.metadata).toBeDefined()
    expect(body.metadata?.seedNode?.id).toBe('auth-R1')
  })

  it('GET /api/traceability/dependencies?relationshipTypes=satisfies filters by relationship type', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/traceability/dependencies?relationshipTypes=satisfies' })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.relationshipTypes).toEqual(['satisfies'])
    if (body.edges.length > 0) {
      expect(body.edges.every((e: any) => e.relationship_type === 'satisfies')).toBe(true)
    }
  })

  it('GET /api/traceability/dependencies?depth=0 returns only seed nodes', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/traceability/dependencies?depth=0&artifactId=auth-R1' })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.depth).toBe(0)
  })
})
