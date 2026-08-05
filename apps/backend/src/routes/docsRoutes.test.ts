import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import fastify from 'fastify'
import { registerErrorHandler } from '../lib/errorHandler'
import { docsRoutes } from './docsRoutes'

describe('docs routes API', () => {
  let app: ReturnType<typeof fastify>

  beforeAll(async () => {
    app = fastify()
    registerErrorHandler(app)
    await docsRoutes(app)
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  it('GET /api/docs returns Swagger UI HTML', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/docs' })
    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toContain('text/html')
    expect(response.body).toContain('swagger-ui')
    expect(response.body).toContain('Nexus Engineering API Documentation')
  })

  it('GET /api/docs/openapi.json returns OpenAPI spec', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/docs/openapi.json' })
    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toContain('application/json')
    const body = JSON.parse(response.body)
    expect(body.openapi).toBe('3.1.0')
    expect(body.info.title).toBe('Nexus Engineering API')
    expect(body.info.version).toBe('1.0.0')
    expect(body.paths).toBeDefined()
  })

  it('GET /api/docs/openapi.json includes all major endpoint groups', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/docs/openapi.json' })
    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    const paths = Object.keys(body.paths)
    expect(paths).toContain('/health')
    expect(paths).toContain('/api/auth/register')
    expect(paths).toContain('/api/requirements')
    expect(paths).toContain('/api/artifacts/registry')
    expect(paths).toContain('/api/demo/sample-data')
    expect(paths).toContain('/api/liveness/reclassify')
  })

  it('GET /api/docs/openapi.json includes example requests and responses', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/docs/openapi.json' })
    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    const registerPath = body.paths['/api/auth/register']
    expect(registerPath).toBeDefined()
    expect(registerPath.post.requestBody).toBeDefined()
    expect(registerPath.post.responses['201']).toBeDefined()
    expect(registerPath.post.responses['201'].content['application/json'].example).toBeDefined()
  })
})