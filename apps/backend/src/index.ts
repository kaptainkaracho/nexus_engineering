import fastify from 'fastify'
import cors from '@fastify/cors'
import fastifyStatic from '@fastify/static'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { requirementsRoutes } from './routes/requirements'
import { artifactRegistryRoutes } from './routes/artifactRegistryRoutes'
import { scanRoutes } from './routes/scanRoutes'
import { multiRepoRoutes } from './routes/multiRepoRoutes'
import { authRoutes } from './routes/auth'
import { registerAuthHooks } from './auth/middleware'
import { racRoutes } from './routes/racRoutes'
import { aacRoutes } from './routes/aacRoutes'
import { organizationsRoutes } from './routes/organizations'
import { registryRoutes } from './routes/registryRoutes'
import { auditLogRoutes } from './routes/auditLogRoutes'
import { tacRoutes } from './routes/tacRoutes'
import { resultsRoutes } from './routes/results'
import { featuresRoutes } from './routes/features'
import { traceabilityRoutes } from './routes/traceability'

const server = fastify({ logger: true })

// Allow cross-origin requests from the deployed frontend service.
// Configurable via CORS_ORIGIN (comma-separated). Defaults to reflecting the request origin.
const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
  : true

await server.register(cors, {
  origin: corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
})

// In production the backend also serves the built frontend (single-origin deploy).
// The frontend build output lives at apps/frontend/dist relative to the repo root.
const __dirname = dirname(fileURLToPath(import.meta.url))
const frontendDist = resolve(__dirname, '../../frontend/dist')
if (process.env.NODE_ENV === 'production' && existsSync(frontendDist)) {
  await server.register(fastifyStatic, {
    root: frontendDist,
    prefix: '/',
    wildcard: false,
  })
}

server.get('/health', async () => {
  return { status: 'ok' }
})

const start = async () => {
  try {
    // Register auth hooks
    registerAuthHooks(server)

    // Register API routes
    authRoutes(server)
    requirementsRoutes(server)
    await import('./routes/traceabilityLinks').then(module => module.traceabilityLinksRoutes(server))
    await import('./routes/graphRoutes').then(module => module.graphBuilderRoutes(server))
    await artifactRegistryRoutes(server)
    scanRoutes(server)
    await racRoutes(server)
    await aacRoutes(server)
    organizationsRoutes(server)
    registryRoutes(server)
    multiRepoRoutes(server)
    auditLogRoutes(server)
    tacRoutes(server)
    resultsRoutes(server)
    featuresRoutes(server)
    traceabilityRoutes(server)

    // SPA fallback: serve index.html for any non-API GET route in production.
    if (process.env.NODE_ENV === 'production' && existsSync(frontendDist)) {
      server.get('/*', async (request, reply) => {
        if ((request.url || '').startsWith('/api')) {
          return reply.callNotFound()
        }
        return reply.sendFile('index.html')
      })
    }

    const port = Number(process.env.PORT) || 3001
    const host = process.env.HOST || '0.0.0.0'
    await server.listen({ port, host })
    server.log.info(`Nexus Engineering backend running on http://${host}:${port}`)
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

start()
