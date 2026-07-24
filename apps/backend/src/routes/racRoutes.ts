import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import * as path from 'path'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'
import { validatedRequirementsLoader } from '@nexus-engineering/shared/requirements/loader'
import { reqDocSchema } from '@nexus-engineering/shared/requirements/schema'
import { AppError } from '../lib/errorHandler'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const RAC_DIR = path.resolve(__dirname, '../../../../docs/requirements')

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
}

export async function getRacDocument(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }

  if (!id) {
    throw new AppError(400, 'Document ID is required', { param: 'id' })
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

  throw new AppError(404, `RAC document '${id}' not found`, { resourceId: id })
}

export async function validateRacDocument(request: FastifyRequest, reply: FastifyReply) {
  const { document } = request.body as { document: any }

  if (!document) {
    throw new AppError(400, 'document is required in request body', { param: 'document' })
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
}

export async function getRacSchema(_: FastifyRequest, reply: FastifyReply) {
  return reply.send({ data: reqDocSchema })
}

export async function racRoutes(server: FastifyInstance) {
  server.get('/api/rac', listRacDocuments)
  server.get('/api/rac/:id', getRacDocument)
  server.post('/api/rac/validate', validateRacDocument)
  server.get('/api/rac/schema', getRacSchema)
}
