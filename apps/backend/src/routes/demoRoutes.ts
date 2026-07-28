import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { AppError } from '../lib/errorHandler'
import { getDemoSeedData as fetchDemoSeedData } from '../services/demoSeedService'

/**
 * GET /api/demo/sample-data
 * Returns pre-loaded demo seed data (ADR samples, requirement trees, trace graphs).
 * No authentication required — designed for demo mode.
 */
export async function getDemoSampleData(request: FastifyRequest, reply: FastifyReply) {
  const data = fetchDemoSeedData()
  return reply.send(data)
}

/**
 * GET /api/demo/sample-data/:type
 * Returns a specific category of demo seed data.
 * Valid types: requirements, adrs, traceGraph
 * No authentication required — designed for demo mode.
 */
export async function getDemoSeedDataByType(request: FastifyRequest, reply: FastifyReply) {
  const { type } = request.params as { type: string }
  const data = fetchDemoSeedData()

  switch (type) {
    case 'requirements':
      return reply.send({ data: data.requirements, total: data.requirements.length })
    case 'adrs':
      return reply.send({ data: data.adrs, total: data.adrs.length })
    case 'traceGraph':
      return reply.send(data.traceGraph)
    default:
      throw new AppError(400, `Invalid demo data type '${type}'`, {
        param: 'type',
        allowed: ['requirements', 'adrs', 'traceGraph'],
      })
  }
}

/**
 * GET /api/demo/status
 * Returns demo mode status: read-only, no signup required, with seed data summary.
 * No authentication required.
 */
export async function getDemoStatus(request: FastifyRequest, reply: FastifyReply) {
  const data = fetchDemoSeedData()
  return reply.send({
    demoMode: {
      active: true,
      readOnly: true,
      noSignupRequired: true,
      description: 'Read-only demo sandbox with pre-loaded traceability data',
      seedData: {
        requirements: data.requirements.length,
        adrs: data.adrs.length,
        traceNodes: data.traceGraph.nodes.length,
        traceEdges: data.traceGraph.edges.length,
      },
    },
  })
}

/**
 * GET /api/demo/deploy
 * Returns the one-click Railway deploy flow documentation.
 * No authentication required.
 */
export async function getDeployFlow(request: FastifyRequest, reply: FastifyReply) {
  return reply.send({
    deploy: {
      platform: 'Railway',
      oneClickFlow: {
        steps: [
          {
            number: 1,
            title: 'Clone Repository',
            command: 'git clone <repo-url>',
            description: 'Clone the Nexus Engineering platform repository',
          },
          {
            number: 2,
            title: 'Set Environment Variables',
            envVars: [
              { key: 'DATABASE_PATH', value: '/app/data/nexus.db', description: 'Path for SQLite database file' },
              { key: 'JWT_SECRET', value: '<production-secret>', description: 'Secret for signing JWT tokens' },
              { key: 'CORS_ORIGIN', value: '<frontend-origin>', description: 'Allowlisted frontend origin' },
              { key: 'NODE_ENV', value: 'production', description: 'Set to production for optimized mode' },
            ],
            description: 'Configure required environment variables in Railway',
          },
          {
            number: 3,
            title: 'Deploy to Railway',
            command: 'railway up',
            description: 'Deploy the backend service to Railway with one command',
          },
          {
            number: 4,
            title: 'Verify Deployment',
            endpoint: 'GET /health',
            expectedResponse: { status: 'ok' },
            description: 'Verify the backend is healthy after deploy',
          },
          {
            number: 5,
            title: 'Load Demo Seed Data',
            endpoint: 'GET /api/demo/sample-data',
            description: 'Fetch pre-loaded ADR samples, requirement trees, and trace graphs',
          },
          {
            number: 6,
            title: 'Access Demo Mode',
            endpoint: 'GET /api/demo/status',
            description: 'Confirm read-only demo mode is active — no signup required',
          },
        ],
      },
      oneClickCommand: 'railway up',
      prerequisites: [
        'Railway CLI installed (npm install -g @railway/cli)',
        'Railway account authenticated (railway login)',
        'Repository linked to a Railway project',
        'Node.js 22+ runtime configured in Railway',
      ],
      backendHealthCheck: '/health',
      demoDataEndpoint: '/api/demo/sample-data',
      demoStatusEndpoint: '/api/demo/status',
    },
  })
}

/**
 * Register all demo mode routes with Fastify
 */
export function demoRoutes(server: FastifyInstance) {
  server.get('/api/demo/sample-data', getDemoSampleData)
  server.get('/api/demo/sample-data/:type', getDemoSeedDataByType)
  server.get('/api/demo/status', getDemoStatus)
  server.get('/api/demo/deploy', getDeployFlow)
}