import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import fastify from 'fastify'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { resultsRoutes } from './results'

const SAMPLE = `nexus:
  schema: results-doc/v1
  metadata:
    domain: ci
    version: "1.0.0"
    source: vitest
executions:
  - id: e-pass
    suiteId: s1
    caseId: c1
    status: passed
    durationMs: 10
  - id: e-fail
    suiteId: s1
    caseId: c2
    status: failed
    durationMs: 20
    error:
      message: boom
`

describe('results API', () => {
  let app: ReturnType<typeof fastify>
  let dir: string

  beforeAll(async () => {
    dir = mkdtempSync(join(tmpdir(), 'nexus-ter-'))
    process.env.TER_DIR = dir
    writeFileSync(join(dir, 'run.ter.yaml'), SAMPLE)
    app = fastify()
    resultsRoutes(app)
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
    rmSync(dir, { recursive: true, force: true })
    delete process.env.TER_DIR
  })

  it('GET /api/results lists all executions', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/results' })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.total).toBe(2)
    expect(body.executions.map((e: any) => e.id).sort()).toEqual(['e-fail', 'e-pass'])
  })

  it('GET /api/results?status=failed filters by status', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/results?status=failed' })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.total).toBe(1)
    expect(body.executions[0].id).toBe('e-fail')
  })

  it('GET /api/results/:id returns a single execution', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/results/e-pass' })
    expect(res.statusCode).toBe(200)
    expect(res.json().execution.id).toBe('e-pass')
  })

  it('GET /api/results/:id returns 404 when missing', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/results/nope' })
    expect(res.statusCode).toBe(404)
  })

  it('GET /api/results/status/:status filters by path param', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/results/status/passed' })
    expect(res.statusCode).toBe(200)
    expect(res.json().total).toBe(1)
  })

  it('GET /api/results/status/:status 400 on invalid status', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/results/status/bogus' })
    expect(res.statusCode).toBe(400)
  })

  it('POST /api/results/ingest emits TER YAML', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/results/ingest',
      payload: {
        domain: 'ci',
        executions: [{ id: 'x', suiteId: 's', caseId: 'c', status: 'passed' }],
      },
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.document.nexus.schema).toBe('results-doc/v1')
    expect(body.yaml).toContain('results-doc/v1')
  })

  it('POST /api/results/ingest 400 without executions', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/results/ingest', payload: {} })
    expect(res.statusCode).toBe(400)
  })
})
