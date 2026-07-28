import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import fastify from 'fastify'
import { registerErrorHandler } from '../lib/errorHandler'
import { demoRoutes } from './demoRoutes'

describe('demo routes API', () => {
  let app: ReturnType<typeof fastify>

  beforeAll(async () => {
    app = fastify()
    registerErrorHandler(app)
    demoRoutes(app)
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  it('GET /api/demo/status returns demo mode status', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/demo/status' })
    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.demoMode.active).toBe(true)
    expect(body.demoMode.readOnly).toBe(true)
    expect(body.demoMode.noSignupRequired).toBe(true)
    expect(body.demoMode.seedData).toBeDefined()
    expect(typeof body.demoMode.seedData.requirements).toBe('number')
    expect(typeof body.demoMode.seedData.adrs).toBe('number')
    expect(typeof body.demoMode.seedData.traceNodes).toBe('number')
    expect(typeof body.demoMode.seedData.traceEdges).toBe('number')
  })

  it('GET /api/demo/sample-data returns all seed data', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/demo/sample-data' })
    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.requirements).toBeInstanceOf(Array)
    expect(body.requirements.length).toBeGreaterThan(0)
    expect(body.adrs).toBeInstanceOf(Array)
    expect(body.adrs.length).toBeGreaterThan(0)
    expect(body.traceGraph).toBeDefined()
    expect(body.traceGraph.nodes).toBeInstanceOf(Array)
    expect(body.traceGraph.edges).toBeInstanceOf(Array)
  })

  it('GET /api/demo/sample-data/requirements returns requirement data', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/demo/sample-data/requirements' })
    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.data).toBeInstanceOf(Array)
    expect(body.total).toBe(body.data.length)
    for (const req of body.data) {
      expect(req).toHaveProperty('id')
      expect(req).toHaveProperty('type')
      expect(req).toHaveProperty('title')
      expect(req).toHaveProperty('priority')
      expect(req).toHaveProperty('status')
      expect(req).toHaveProperty('traceLinks')
    }
  })

  it('GET /api/demo/sample-data/adrs returns ADR data', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/demo/sample-data/adrs' })
    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.data).toBeInstanceOf(Array)
    expect(body.total).toBe(body.data.length)
    for (const adr of body.data) {
      expect(adr).toHaveProperty('id')
      expect(adr).toHaveProperty('title')
      expect(adr).toHaveProperty('status')
      expect(adr).toHaveProperty('decision')
      expect(adr).toHaveProperty('consequences')
      expect(adr).toHaveProperty('traceLinks')
    }
  })

  it('GET /api/demo/sample-data/traceGraph returns trace graph', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/demo/sample-data/traceGraph' })
    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.nodes).toBeInstanceOf(Array)
    expect(body.edges).toBeInstanceOf(Array)
    expect(body.nodes.length).toBeGreaterThan(0)
    expect(body.edges.length).toBeGreaterThan(0)
  })

  it('GET /api/demo/sample-data/:type returns 400 for invalid type', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/demo/sample-data/invalid' })
    expect(response.statusCode).toBe(400)
    const body = JSON.parse(response.body)
    expect(body.error).toBeDefined()
    expect(body.code).toBe('BAD_REQUEST')
  })

  it('GET /api/demo/deploy returns Railway deploy flow documentation', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/demo/deploy' })
    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.deploy).toBeDefined()
    expect(body.deploy.platform).toBe('Railway')
    expect(body.deploy.oneClickFlow).toBeDefined()
    expect(body.deploy.oneClickFlow.steps).toBeInstanceOf(Array)
    expect(body.deploy.oneClickFlow.steps.length).toBe(6)
    expect(body.deploy.prerequisites).toBeInstanceOf(Array)
    expect(body.deploy.backendHealthCheck).toBe('/health')
    expect(body.deploy.demoDataEndpoint).toBe('/api/demo/sample-data')
    expect(body.deploy.demoStatusEndpoint).toBe('/api/demo/status')
  })
})