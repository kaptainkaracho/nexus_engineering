import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import * as path from 'path'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'
import { TestLoader, testDocSchema, validateTestDocument } from '@nexus-engineering/shared'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const TESTS_DIR = path.resolve(__dirname, '../../../../docs/tests')

function filePathToId(filePath: string): string {
  return path.relative(TESTS_DIR, filePath).replace(/\.test\.yaml$/, '').replace(/\\/g, '/')
}

export async function listTacDocuments(request: FastifyRequest, reply: FastifyReply) {
  try {
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
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to list TAC documents' })
  }
}

export async function getTacDocument(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }
    if (!id) {
      return reply.status(400).send({ error: 'Document ID is required' })
    }

    const loader = new TestLoader()
    let files: string[]
    try {
      files = await loader.findTestFiles(TESTS_DIR)
    } catch {
      return reply.status(404).send({ error: `TAC document '${id}' not found` })
    }

    for (const fp of files) {
      if (filePathToId(fp) === id) {
        const doc = await loader.loadTestFile(fp)
        return reply.send({ data: doc })
      }
    }

    return reply.status(404).send({ error: `TAC document '${id}' not found` })
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to get TAC document' })
  }
}

export async function validateTacDocument(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { document } = request.body as { document: Record<string, unknown> }
    if (!document) {
      return reply.status(400).send({ error: 'document is required in request body' })
    }

    const result = await validateTestDocument(document as any)
    return reply.send({
      valid: result.valid,
      errors: result.errors ? Object.fromEntries(result.errors) : [],
    })
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to validate TAC document' })
  }
}

export async function getTacSchema(_: FastifyRequest, reply: FastifyReply) {
  try {
    return reply.send({ data: testDocSchema })
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to get TAC schema' })
  }
}

export async function tacRoutes(server: FastifyInstance) {
  server.get('/api/tac', listTacDocuments)
  server.get('/api/tac/schema', getTacSchema)
  server.post('/api/tac/validate', validateTacDocument)
  server.get('/api/tac/:id', getTacDocument)
}
