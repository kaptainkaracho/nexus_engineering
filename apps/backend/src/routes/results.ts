import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import * as path from 'path'
import * as fs from 'fs'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'
import * as yaml from 'js-yaml'
import { validatedResultsLoader } from '@nexus-engineering/shared/results'
import type { ResultsDocument, TestExecution, ExecutionStatus } from '@nexus-engineering/shared/results'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * Walk up from __dirname to locate the monorepo root (marker: pnpm-workspace.yaml).
 */
function findRepoRoot(start: string): string {
  let current = start
  for (let i = 0; i < 8; i++) {
    if (fs.existsSync(path.join(current, 'pnpm-workspace.yaml'))) return current
    const parent = path.dirname(current)
    if (parent === current) break
    current = parent
  }
  return start
}

/**
 * Resolve the directory that holds TER (.ter.yaml) documents.
 * Defaults to the bundled examples; override with TER_DIR env.
 */
function getResultsDir(): string {
  if (process.env.TER_DIR) return process.env.TER_DIR
  const repoRoot = findRepoRoot(__dirname)
  return path.join(repoRoot, 'packages/shared/src/results/examples')
}

/**
 * GET /api/results
 * List all test execution results. Supports optional ?status= filter and ?suiteId= filter.
 */
export async function listResults(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { status, suiteId } = request.query as { status?: string; suiteId?: string }
    const resultsDir = getResultsDir()

    let filePaths: string[]
    try {
      filePaths = await validatedResultsLoader.findResultsFiles(resultsDir)
    } catch {
      return reply.send({ executions: [], documents: 0, total: 0 })
    }

    if (!filePaths.length) return reply.send({ executions: [], documents: 0, total: 0 })

    const flattened: (TestExecution & { source: string; documentId: string })[] = []
    for (const fp of filePaths) {
      try {
        const doc = await validatedResultsLoader.loadResultsFile(fp)
        const docId = doc.nexus?.metadata?.domain || path.basename(fp)
        for (const exec of doc.executions) {
          flattened.push({ ...exec, source: fp, documentId: docId })
        }
      } catch {
        /* skip invalid docs */
      }
    }

    const filtered = flattened.filter((e) => {
      if (status && e.status !== status) return false
      if (suiteId && e.suiteId !== suiteId) return false
      return true
    })

    return reply.send({
      executions: filtered,
      documents: filePaths.length,
      total: filtered.length,
      ...(status && { status }),
      ...(suiteId && { suiteId }),
    })
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to list results' })
  }
}

/**
 * GET /api/results/:id
 * Get a single execution by its id.
 */
export async function getResult(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }
    if (!id) return reply.status(400).send({ error: 'Execution id is required' })

    const resultsDir = getResultsDir()
    const filePaths = await validatedResultsLoader.findResultsFiles(resultsDir)

    for (const fp of filePaths) {
      try {
        const doc = await validatedResultsLoader.loadResultsFile(fp)
        const match = doc.executions.find((e) => e.id === id)
        if (match) {
          return reply.send({ execution: { ...match, documentId: doc.nexus?.metadata?.domain || path.basename(fp) } })
        }
      } catch {
        /* skip */
      }
    }

    return reply.status(404).send({ error: 'Execution not found' })
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to get result' })
  }
}

/**
 * GET /api/results/status/:status
 * Filter executions by status (passed|failed|skipped|error|flaky).
 */
export async function getResultsByStatus(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { status } = request.params as { status: ExecutionStatus }
    const allowed: ExecutionStatus[] = ['passed', 'failed', 'skipped', 'error', 'flaky']
    if (!allowed.includes(status)) {
      return reply.status(400).send({ error: `Invalid status '${status}'`, allowed })
    }

    const resultsDir = getResultsDir()
    const filePaths = await validatedResultsLoader.findResultsFiles(resultsDir)
    const matched: (TestExecution & { source: string })[] = []

    for (const fp of filePaths) {
      try {
        const doc = await validatedResultsLoader.loadResultsFile(fp)
        for (const exec of doc.executions) {
          if (exec.status === status) matched.push({ ...exec, source: fp })
        }
      } catch {
        /* skip */
      }
    }

    return reply.send({ executions: matched, status, total: matched.length })
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to filter results by status' })
  }
}

/**
 * POST /api/results/ingest
 * CI integration hook: accept a raw execution payload (e.g. from a Vitest or
 * Playwright reporter) and emit a TER YAML document string.
 */
export async function ingestResults(request: FastifyRequest, reply: FastifyReply) {
  try {
    const payload = request.body as Partial<ResultsDocument> & {
      executions?: TestExecution[]
      domain?: string
      runId?: string
    }
    if (!payload?.executions || !Array.isArray(payload.executions)) {
      return reply.status(400).send({ error: 'executions array is required' })
    }

    const doc: ResultsDocument = {
      nexus: {
        schema: 'results-doc/v1',
        metadata: {
          domain: payload.nexus?.metadata?.domain || payload.domain || 'ci',
          version: payload.nexus?.metadata?.version || '1.0.0',
          source: payload.nexus?.metadata?.source || 'ci-ingest',
          ...(payload.nexus?.metadata?.runId || payload.runId
            ? { runId: payload.nexus?.metadata?.runId || payload.runId }
            : {}),
          ...(payload.nexus?.metadata?.ci ? { ci: payload.nexus.metadata.ci } : {}),
        },
      },
      executions: payload.executions,
    }

    const yamlStr = yaml.dump(doc, { lineWidth: 120 })
    return reply.send({ yaml: yamlStr, document: doc })
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to ingest results' })
  }
}

/**
 * Register all TER routes with Fastify
 */
export function resultsRoutes(server: FastifyInstance) {
  server.get('/api/results', listResults)
  server.get('/api/results/:id', getResult)
  server.get('/api/results/status/:status', getResultsByStatus)
  server.post('/api/results/ingest', ingestResults)
}
