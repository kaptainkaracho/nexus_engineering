import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import * as path from 'path'
import * as fs from 'fs'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'
import * as yaml from 'js-yaml'
import { validatedFeatureLoader } from '@nexus-engineering/shared/features'
import type { FeatureDocument, Feature } from '@nexus-engineering/shared/features'

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
 * Resolve the directory that holds FAC (.feature.yaml) documents.
 * Defaults to the bundled examples; override with FAC_DIR env.
 */
function getFeaturesDir(): string {
  if (process.env.FAC_DIR) return process.env.FAC_DIR
  const repoRoot = findRepoRoot(__dirname)
  return path.join(repoRoot, 'packages/shared/src/features/examples')
}

type FlatFeature = Feature & { source: string; documentId: string }

/**
 * GET /api/fac
 * List all features. Supports optional ?status= filter and ?domain= filter.
 */
export async function listFeatures(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { status, domain } = request.query as { status?: string; domain?: string }
    const featuresDir = getFeaturesDir()

    let filePaths: string[]
    try {
      filePaths = await validatedFeatureLoader.findFeatureFiles(featuresDir)
    } catch {
      return reply.send({ features: [], documents: 0, total: 0 })
    }

    if (!filePaths.length) return reply.send({ features: [], documents: 0, total: 0 })

    const flattened: FlatFeature[] = []
    for (const fp of filePaths) {
      try {
        const doc = await validatedFeatureLoader.loadFeatureFile(fp)
        const docId = doc.nexus?.metadata?.domain || path.basename(fp)
        for (const feature of doc.features) {
          flattened.push({ ...feature, source: fp, documentId: docId })
        }
      } catch {
        /* skip invalid docs */
      }
    }

    const filtered = flattened.filter((f) => {
      if (status && f.status !== status) return false
      if (domain && f.documentId !== domain) return false
      return true
    })

    return reply.send({
      features: filtered,
      documents: filePaths.length,
      total: filtered.length,
      ...(status && { status }),
      ...(domain && { domain }),
    })
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to list features' })
  }
}

/**
 * GET /api/fac/:id
 * Get a single feature by its id (across all documents).
 */
export async function getFeature(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }
    if (!id) return reply.status(400).send({ error: 'Feature id is required' })

    const featuresDir = getFeaturesDir()
    const filePaths = await validatedFeatureLoader.findFeatureFiles(featuresDir)

    for (const fp of filePaths) {
      try {
        const doc = await validatedFeatureLoader.loadFeatureFile(fp)
        const match = doc.features.find((f) => f.id === id)
        if (match) {
          return reply.send({
            feature: { ...match, documentId: doc.nexus?.metadata?.domain || path.basename(fp) },
          })
        }
      } catch {
        /* skip */
      }
    }

    return reply.status(404).send({ error: 'Feature not found' })
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to get feature' })
  }
}

/**
 * GET /api/fac/status/:status
 * Filter features by status (draft|approved|implemented|deprecated).
 */
export async function getFeaturesByStatus(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { status } = request.params as { status: string }
    const allowed = ['draft', 'approved', 'implemented', 'deprecated']
    if (!allowed.includes(status)) {
      return reply.status(400).send({ error: `Invalid status '${status}'`, allowed })
    }

    const featuresDir = getFeaturesDir()
    const filePaths = await validatedFeatureLoader.findFeatureFiles(featuresDir)
    const matched: FlatFeature[] = []

    for (const fp of filePaths) {
      try {
        const doc = await validatedFeatureLoader.loadFeatureFile(fp)
        const docId = doc.nexus?.metadata?.domain || path.basename(fp)
        for (const feature of doc.features) {
          if (feature.status === status) matched.push({ ...feature, source: fp, documentId: docId })
        }
      } catch {
        /* skip */
      }
    }

    return reply.send({ features: matched, status, total: matched.length })
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to filter features by status' })
  }
}

/**
 * POST /api/fac/validate
 * CI integration / PR gate: accept a raw FAC YAML or document object and
 * return a structural + logical validation result.
 */
export async function validateFeature(request: FastifyRequest, reply: FastifyReply) {
  try {
    const payload = request.body as
      | string
      | (Partial<FeatureDocument> & { features?: Feature[]; domain?: string })

    if (!payload) {
      return reply.status(400).send({ error: 'A feature document or YAML string is required' })
    }

    // Accept either a raw YAML string or a structured document object.
    let doc: FeatureDocument
    if (typeof payload === 'string') {
      doc = yaml.load(payload) as FeatureDocument
    } else if (payload.nexus && payload.features) {
      doc = payload as FeatureDocument
    } else if (payload.features) {
      doc = {
        nexus: {
          schema: 'feature-doc/v1',
          metadata: {
            domain: (payload as any).domain || 'ci',
            version: '1.0.0',
            source: 'fac-validate',
          },
        },
        features: payload.features,
      }
    } else {
      return reply.status(400).send({ error: 'Payload must include a nexus + features document or a features array' })
    }

    const { validateFeatureDocument } = await import('@nexus-engineering/shared/features')
    const result = await validateFeatureDocument(doc)

    return reply.send({
      valid: result.valid,
      schema: 'feature-doc/v1',
      errors: result.errors ? Object.fromEntries(result.errors) : {},
    })
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to validate feature document' })
  }
}

/**
 * Pass raw request bodies through unchanged for these content types so that a
 * raw .feature.yaml string can be POSTed to /api/fac/validate without Fastify
 * attempting (and failing) to JSON-parse it.
 */
function registerRawBodyParsers(server: FastifyInstance) {
  const passThrough = (_req: FastifyRequest, payload: unknown, done: (err: Error | null, body?: unknown) => void) => {
    done(null, typeof payload === 'string' ? payload : String(payload))
  }
  for (const type of ['application/x-yaml', 'text/yaml', 'text/plain']) {
    server.addContentTypeParser(type, { parseAs: 'string' }, passThrough)
  }
}

/**
 * Register all FAC routes with Fastify
 */
export function featuresRoutes(server: FastifyInstance) {
  registerRawBodyParsers(server)
  server.get('/api/fac', listFeatures)
  server.get('/api/fac/:id', getFeature)
  server.get('/api/fac/status/:status', getFeaturesByStatus)
  server.post('/api/fac/validate', validateFeature)
}
