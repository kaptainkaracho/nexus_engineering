import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import fastify from 'fastify'

import { registerErrorHandler } from '../lib/errorHandler'
import { traceabilityRoutes } from './traceability'
import { getGraphDatabase } from '../graphBuilder/graphDatabase'

describe('GET /api/traceability/impact-report', () => {
  let app: ReturnType<typeof fastify>
  let dir: string
  let matchingFile: string

  beforeAll(async () => {
    dir = mkdtempSync(join(tmpdir(), 'impact-report-route-'))
    matchingFile = join(dir, 'auth-R1.md')
    writeFileSync(matchingFile, '# Auth requirement change\n')

    const db = getGraphDatabase()
    db.upsertNodes([
      { id: 'auth-R1', type: 'requirement', title: 'Auth requirement' },
      { id: 'auth-F1', type: 'feature', title: 'Auth feature' },
      { id: 'auth-T1', type: 'testCase', title: 'Auth test' },
    ])
    db.upsertEdge({ sourceId: 'auth-R1', targetId: 'auth-F1', relationshipType: 'satisfies', confidence: 'high' })
    db.upsertEdge({ sourceId: 'auth-F1', targetId: 'auth-T1', relationshipType: 'verifies', confidence: 'medium' })

    app = fastify()
    registerErrorHandler(app)
    traceabilityRoutes(app)
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
    rmSync(dir, { recursive: true, force: true })
  })

  it('returns 400 when file query param is missing', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/traceability/impact-report' })
    expect(res.statusCode).toBe(400)
    expect(res.json().error).toMatch(/file/i)
  })

  it('returns 404 for a non-existent file', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/traceability/impact-report?file=${encodeURIComponent(join(dir, 'ghost.md'))}`,
    })
    expect(res.statusCode).toBe(404)
    expect(res.json().error).toMatch(/not found/i)
  })

  it('returns a structured impact report with metadata for a changed file', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/traceability/impact-report?file=${encodeURIComponent(matchingFile)}&branch=main&base=HEAD~1`,
    })
    expect(res.statusCode).toBe(200)

    const body = res.json()
    expect(body.report).toBeDefined()
    expect(body.report.summary).toBeDefined()
    expect(['critical', 'high', 'medium', 'low']).toContain(body.report.riskLevel)
    expect(body.report.metadata.resolvedArtifactIds).toContain('auth-R1')
    expect(body.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(body.metadata).toMatchObject({
      file: matchingFile,
      branch: 'main',
      base: 'HEAD~1',
    })
    expect(typeof body.metadata.commitCount).toBe('number')
  })
})
