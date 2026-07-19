import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import fastify from 'fastify'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { featuresRoutes } from './features'

const SAMPLE = `nexus:
  schema: feature-doc/v1
  metadata:
    domain: checkout
    version: "1.0.0"
    source: product
features:
  - id: feat-a
    name: Feature A
    description: Desc A
    status: approved
    userStories:
      - id: us-a1
        role: user
        want: do A
        acceptanceCriteria:
          - id: ac-a1
            then: A happens
  - id: feat-b
    name: Feature B
    description: Desc B
    status: draft
    userStories:
      - id: us-b1
        role: user
        want: do B
        acceptanceCriteria:
          - id: ac-b1
            then: B happens
`

describe('features API', () => {
  let app: ReturnType<typeof fastify>
  let dir: string

  beforeAll(async () => {
    dir = mkdtempSync(join(tmpdir(), 'nexus-fac-'))
    process.env.FAC_DIR = dir
    writeFileSync(join(dir, 'checkout.feature.yaml'), SAMPLE)
    app = fastify()
    featuresRoutes(app)
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
    rmSync(dir, { recursive: true, force: true })
    delete process.env.FAC_DIR
  })

  it('GET /api/fac lists all features', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/fac' })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.total).toBe(2)
    expect(body.features.map((f: any) => f.id).sort()).toEqual(['feat-a', 'feat-b'])
  })

  it('GET /api/fac?status=approved filters by status', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/fac?status=approved' })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.total).toBe(1)
    expect(body.features[0].id).toBe('feat-a')
  })

  it('GET /api/fac?domain=checkout filters by domain', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/fac?domain=checkout' })
    expect(res.statusCode).toBe(200)
    expect(res.json().total).toBe(2)
  })

  it('GET /api/fac/:id returns a single feature', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/fac/feat-a' })
    expect(res.statusCode).toBe(200)
    expect(res.json().feature.id).toBe('feat-a')
  })

  it('GET /api/fac/:id returns 404 when missing', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/fac/nope' })
    expect(res.statusCode).toBe(404)
  })

  it('GET /api/fac/status/:status filters by path param', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/fac/status/draft' })
    expect(res.statusCode).toBe(200)
    expect(res.json().total).toBe(1)
  })

  it('GET /api/fac/status/:status 400 on invalid status', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/fac/status/bogus' })
    expect(res.statusCode).toBe(400)
  })

  it('POST /api/fac/validate returns valid:true for a clean document', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/fac/validate',
      payload: {
        nexus: { schema: 'feature-doc/v1', metadata: { domain: 'd', version: '1', source: 's' } },
        features: [
          {
            id: 'f1',
            name: 'n',
            description: 'd',
            userStories: [{ id: 'us1', role: 'r', want: 'w', acceptanceCriteria: [{ id: 'ac1', then: 't' }] }],
          },
        ],
      },
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.valid).toBe(true)
    expect(body.schema).toBe('feature-doc/v1')
  })

  it('POST /api/fac/validate returns valid:false for a broken document', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/fac/validate',
      payload: {
        nexus: { schema: 'feature-doc/v1', metadata: { domain: 'd', version: '1', source: 's' } },
        features: [{ id: 'f1', name: 'n', description: 'd', userStories: [] }],
      },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().valid).toBe(false)
  })

  it('POST /api/fac/validate accepts a raw YAML string', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/fac/validate',
      payload: SAMPLE,
      headers: { 'content-type': 'application/x-yaml' },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().valid).toBe(true)
  })

  it('POST /api/fac/validate 400 without payload', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/fac/validate', payload: {} })
    expect(res.statusCode).toBe(400)
  })
})
