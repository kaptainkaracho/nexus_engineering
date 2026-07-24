import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import fastify from 'fastify'

import { registerErrorHandler } from '../lib/errorHandler'
import { recoveryReworkRoutes } from './recoveryRework'

describe('Recovery Rework Ingestion API', () => {
  let app: ReturnType<typeof fastify>

  beforeAll(async () => {
    app = fastify()
    registerErrorHandler(app)
    recoveryReworkRoutes(app)
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  it('POST /api/recovery-rework/ingest triggers the full pipeline with limit', async () => {
    const dir = mkdtempSync(join('/tmp', 'integration-ingest-'))
    const originalEnv = process.env.MINERVA_URL
    const originalDbPath = process.env.BPMN_DB_PATH

    try {
      // Set test-specific env for deterministic behavior
      process.env.MINERVA_URL = 'http://localhost:8002'
      process.env.MINERVA_API_KEY = 'test-key'
      process.env.MINERVA_TENANT = 'test-company'
      process.env.PAPERCLIP_API_URL = 'http://localhost:3100'
      process.env.PAPERCLIP_API_KEY = 'test-paperclip-key'
      process.env.BPMN_DB_PATH = dir

      // Trigger ingestion pipeline
      const res = await app.inject({
        method: 'POST',
        url: '/api/recovery-rework/ingest',
        payload: { limit: 10 },
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()

      expect(body).toHaveProperty('runId')
      expect(body).toHaveProperty('status')
      expect(body).toHaveProperty('runsFetched')
      expect(body).toHaveProperty('runsClassified')
      expect(body).toHaveProperty('recoveryEvents')
      expect(body).toHaveProperty('reworkEvents')
      expect(body).toHaveProperty('interventionEvents')
      expect(body).toHaveProperty('unclassified')
      expect(body).toHaveProperty('eventsPushed')
      expect(body).toHaveProperty('eventsPersisted')
      expect(body).toHaveProperty('minervaRunId')
      expect(body).toHaveProperty('errorMessage')
      expect(['completed', 'failed']).toContain(body.status)

      expect(typeof body.runsFetched).toBe('number')
      expect(typeof body.runsClassified).toBe('number')
      expect(typeof body.recoveryEvents).toBe('number')
      expect(typeof body.reworkEvents).toBe('number')
      expect(typeof body.interventionEvents).toBe('number')
      expect(typeof body.unclassified).toBe('number')
      expect(typeof body.eventsPushed).toBe('number')
      expect(typeof body.eventsPersisted).toBe('number')
      expect(body.minervaRunId === null || typeof body.minervaRunId === 'string').toBe(true)

    } finally {
      // Restore original environment
      if (originalEnv !== undefined) process.env.MINERVA_URL = originalEnv
      if (originalDbPath !== undefined) process.env.BPMN_DB_PATH = originalDbPath
      process.env.MINERVA_API_KEY = ''
      process.env.MINERVA_TENANT = 'paperclip_company'
      process.env.PAPERCLIP_API_URL = 'http://127.0.0.1:3100'
      process.env.PAPERCLIP_API_KEY = ''
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('POST /api/recovery-rework/ingest works without explicit limit (default 200)', async () => {
    const dir = mkdtempSync(join('/tmp', 'integration-ingest-default-'))
    const originalEnv = process.env.MINERVA_URL
    const originalDbPath = process.env.BPMN_DB_PATH

    try {
      process.env.MINERVA_URL = 'http://localhost:8002'
      process.env.MINERVA_API_KEY = 'test-key'
      process.env.MINERVA_TENANT = 'test-company'
      process.env.PAPERCLIP_API_URL = 'http://localhost:3100'
      process.env.PAPERCLIP_API_KEY = 'test-paperclip-key'
      process.env.BPMN_DB_PATH = dir

      const res = await app.inject({
        method: 'POST',
        url: '/api/recovery-rework/ingest',
        payload: {},
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body).toHaveProperty('runId')
      expect(body).toHaveProperty('status')
      expect(body.runsFetched).toBeDefined()

    } finally {
      if (originalEnv !== undefined) process.env.MINERVA_URL = originalEnv
      if (originalDbPath !== undefined) process.env.BPMN_DB_PATH = originalDbPath
      process.env.MINERVA_API_KEY = ''
      process.env.MINERVA_TENANT = 'paperclip_company'
      process.env.PAPERCLIP_API_URL = 'http://127.0.0.1:3100'
      process.env.PAPERCLIP_API_KEY = ''
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('GET /api/recovery-rework/ingestion/history returns recent runs', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/recovery-rework/ingestion/history?limit=5',
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body).toHaveProperty('runs')
    expect(body).toHaveProperty('total')
    expect(Array.isArray(body.runs)).toBe(true)
    expect(typeof body.total).toBe('number')
  })

  it('GET /api/recovery-rework/ingestion/:runId returns a specific run', async () => {
    const historyRes = await app.inject({
      method: 'GET',
      url: '/api/recovery-rework/ingestion/history?limit=1',
    })

    if (historyRes.statusCode === 200) {
      const body = historyRes.json()
      if (body.runs.length > 0) {
        const runId = body.runs[0].id

        const res = await app.inject({
          method: 'GET',
          url: `/api/recovery-rework/ingestion/${runId}`,
        })

        expect(res.statusCode).toBe(200)
        const runBody = res.json()
        expect(runBody.id).toBe(runId)
        expect(runBody).toHaveProperty('status')
      }
    }
  })

  it('GET /api/recovery-rework/ingestion/:runId/events returns run events', async () => {
    const historyRes = await app.inject({
      method: 'GET',
      url: '/api/recovery-rework/ingestion/history?limit=1',
    })

    if (historyRes.statusCode === 200) {
      const body = historyRes.json()
      if (body.runs.length > 0) {
        const runId = body.runs[0].id

        const res = await app.inject({
          method: 'GET',
          url: `/api/recovery-rework/ingestion/${runId}/events`,
        })

        expect(res.statusCode).toBe(200)
        const eventsBody = res.json()
        expect(eventsBody.runId).toBe(runId)
        expect(eventsBody).toHaveProperty('events')
        expect(eventsBody).toHaveProperty('total')
        expect(Array.isArray(eventsBody.events)).toBe(true)
        expect(typeof eventsBody.total).toBe('number')
      }
    }
  })
})