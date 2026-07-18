import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import * as path from 'path'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'
import { validatedRequirementsLoader } from '@nexus-engineering/shared/requirements/loader'
import { reqDocSchema } from '@nexus-engineering/shared/requirements/schema'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const RAC_DIR = path.resolve(__dirname, '../../../docs/requirements')

function mapRacDocument(doc: any, filePath: string) {
  return {
    id: doc.nexus?.metadata?.domain?.toLowerCase().replace(/\s+/g, '-') || path.basename(filePath, '.req.yaml'),
    filePath,
    schema: doc.nexus?.schema,
    metadata: doc.nexus?.metadata,
    requirements: (doc.requirements || []).map((req: any) => ({
      id: req.id,
      type: req.type,
      title: req.title,
      description: req.description,
      priority: req.priority,
      status: req.status,
      tags: req.tags || [],
      acceptanceCriteria: req.acceptanceCriteria || [],
      dependencies: req.dependencies || [],
      relatedIssues: req.relatedIssues || [],
      notes: req.notes,
    })),
  }
}

export async function listRacDocuments(_: FastifyRequest, reply: FastifyReply) {
  try {
    const reqDir = RAC_DIR
    let filePaths: string[]
    try {
      filePaths = await validatedRequirementsLoader.findRequirementFiles(reqDir)
    } catch {
      return reply.send({ data: [], total: 0 })
    }

    const documents = []
    for (const fp of filePaths) {
      try {
        const doc: any = await validatedRequirementsLoader.loadRequirementFile(fp)
        if (doc?.requirements) documents.push(mapRacDocument(doc, fp))
      } catch {
        // skip invalid files
      }
    }

    return reply.send({ data: documents, total: documents.length })
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to list RAC documents' })
  }
}

export async function getRacDocument(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }
    if (!id) {
      return reply.status(400).send({ error: 'Document ID is required' })
    }

    const reqDir = RAC_DIR
    const filePaths = await validatedRequirementsLoader.findRequirementFiles(reqDir)
    for (const fp of filePaths) {
      const doc: any = await validatedRequirementsLoader.loadRequirementFile(fp)
      const docId = doc.nexus?.metadata?.domain?.toLowerCase().replace(/\s+/g, '-')
      if (docId === id || fp.includes(id) || (doc.requirements || []).some((r: any) => r.id === id)) {
        return reply.send({ data: mapRacDocument(doc, fp) })
      }
    }

    return reply.status(404).send({ error: `RAC document '${id}' not found` })
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to get RAC document' })
  }
}

export async function validateRacDocument(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { document } = request.body as { document: any }
    if (!document) {
      return reply.status(400).send({ error: 'document is required in request body' })
    }

    const Ajv = (await import('ajv')).default
    const ajv = new Ajv()
    const validate = ajv.compile(reqDocSchema)
    const valid = validate(document)

    if (!valid) {
      return reply.send({
        valid: false,
        errors: validate.errors?.map((e: any) => ({ path: e.instancePath, message: e.message })),
      })
    }

    return reply.send({ valid: true, errors: [] })
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to validate RAC document' })
  }
}

export async function getRacSchema(_: FastifyRequest, reply: FastifyReply) {
  try {
    return reply.send({ data: reqDocSchema })
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to get RAC schema' })
  }
}

export async function racRoutes(server: FastifyInstance) {
  server.get('/api/rac', listRacDocuments)
  server.get('/api/rac/:id', getRacDocument)
  server.post('/api/rac/validate', validateRacDocument)
  server.get('/api/rac/schema', getRacSchema)
}
