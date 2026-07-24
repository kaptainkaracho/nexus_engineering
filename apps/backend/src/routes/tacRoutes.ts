import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import * as path from 'path'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'
import { TestLoader, testDocSchema, validateTestDocument } from '@nexus-engineering/shared/test-utils'
import { AppError } from '../lib/errorHandler'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const TESTS_DIR = path.resolve(__dirname, '../../../../docs/tests')

function filePathToId(filePath: string): string {
  return path.relative(TESTS_DIR, filePath).replace(/\.test\.yaml$/, '').replace(/\\/g, '/')
}

export async function listTacDocuments(request: FastifyRequest, reply: FastifyReply) {
  const query = request.query as { q?: string }
  const loader = new TestLoader()
  let files: string[]
  try {
    files = await loader.findTestFiles(TESTS_DIR)
  } catch {
    return reply.send({ data: [], total: 0 })
  }

  files.sort()
  const documents = []
  for (const fp of files) {
    try {
      const doc = await loader.loadTestFile(fp)
      const docId = filePathToId(fp)
      const entry = {
        id: docId,
        filePath: fp,
        domain: doc.nexus.metadata.domain,
        version: doc.nexus.metadata.version,
        source: doc.nexus.metadata.source,
        suiteCount: doc.suites.length,
        caseCount: doc.suites.reduce((sum: number, s: { cases: unknown[] }) => sum + s.cases.length, 0),
      }

      if (query.q) {
        const q = query.q.toLowerCase()
        const matches =
          docId.toLowerCase().includes(q) ||
          doc.nexus.metadata.domain.toLowerCase().includes(q) ||
          doc.suites.some((s: { name: string }) => s.name.toLowerCase().includes(q)) ||
          doc.suites.some((s: { cases: Array<{ id: string; title: string }> }) =>
            s.cases.some(c => c.id.toLowerCase().includes(q) || c.title.toLowerCase().includes(q)))
        if (!matches) continue
      }

      documents.push(entry)
    } catch {
      // skip unreadable/invalid files
    }
  }

  return reply.send({ data: documents, total: documents.length })
}

export async function getTacDocument(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }

  if (!id) {
    throw new AppError(400, 'Document ID is required', { param: 'id' })
  }

  const loader = new TestLoader()
  let files: string[]
  try {
    files = await loader.findTestFiles(TESTS_DIR)
  } catch {
    throw new AppError(404, `TAC document '${id}' not found`, { resourceId: id })
  }

  for (const fp of files) {
    if (filePathToId(fp) === id) {
      const doc = await loader.loadTestFile(fp)
      return reply.send({ data: doc })
    }
  }

  throw new AppError(404, `TAC document '${id}' not found`, { resourceId: id })
}

export async function validateTacDocument(request: FastifyRequest, reply: FastifyReply) {
  const { document } = request.body as { document: Record<string, unknown> }

  if (!document) {
    throw new AppError(400, 'document is required in request body', { param: 'document' })
  }

  const result = await validateTestDocument(document as any)
  return reply.send({
    valid: result.valid,
    errors: result.errors ? Object.fromEntries(result.errors) : [],
  })
}

export async function getTacSchema(_: FastifyRequest, reply: FastifyReply) {
  return reply.send({ data: testDocSchema })
}

export async function tacRoutes(server: FastifyInstance) {
  server.get('/api/tac', listTacDocuments)
  server.get('/api/tac/schema', getTacSchema)
  server.post('/api/tac/validate', validateTacDocument)
  server.get('/api/tac/:id', getTacDocument)
}
