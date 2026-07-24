import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import * as path from 'path'
import * as fs from 'fs'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'
import { validatedRequirementsLoader, type LoadResult } from '@nexus-engineering/shared/requirements/loader'
import { AppError } from '../lib/errorHandler'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * Map backend RequirementDocument to frontend artefact types
 */
function mapArtefacts(documents: LoadResult[]): {
  requirements: any[]
  architectures: any[]
  components: any[]
  testCases: any[]
  traces: any[]
} {
  const requirements: any[] = []
  const architectures: any[] = []
  const components: any[] = []
  const testCases: any[] = []
  const traces: any[] = []

  for (const result of documents) {
    if (!result.document?.requirements) continue
    for (const req of result.document.requirements) {
      requirements.push({
        id: req.id,
        version: req.version,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        source: req.source || 'requirements-yaml',
        type: req.type,
        title: req.title || req.nexus?.id || '',
        description: req.description || '',
        priority: (req as any).priority || 'medium',
        status: (req as any).status || 'draft',
        tags: (req as any).tags || [],
        traceLinks: (req as any).traceLinks || [],
      })

      // Extract architecture elements from block properties
      const blockDefs = (req as any).blockDefinitions || []
      for (const bd of blockDefs) {
        architectures.push({
          id: `arch-${result.document?.nexus?.metadata?.documentId || 'unknown'}-${bd.id}`,
          name: bd.name,
          type: 'blockDefinition',
          description: bd.description || `${bd.name} - Architecture block from requirement ${req.id}`,
          elements: (bd.ports || []).map((p: any, i: number) => ({
            id: `elem-${bd.id}-${i}`,
            name: p.name || p.label,
            type: 'port',
            properties: { ioDirection: p.ioDirection },
          })),
        })
      }

      // Extract components from requirements that reference implementations
      for (const impl of (req.implementations || [])) {
        components.push({
          id: `comp-${result.document?.nexus?.metadata?.documentId || 'unknown'}-${impl.id}`,
          name: impl.name,
          type: 'service',
          description: impl.description || '',
          path: impl.filePath || '',
          language: impl.language,
          technologies: impl.technologies || [],
        })
      }
    }

    // Collect trace links from each document
    for (const req of result.document.requirements) {
      for (const link of ((req as any).traceLinks || [])) {
        traces.push({
          id: `trace-${result.document?.nexus?.metadata?.documentId}-${req.id}-${link.target.id}`,
          sourceId: req.id,
          sourceType: 'requirement' as const,
          targetId: link.target.id,
          targetType: (link.target as any).artifactType || 'requirement',
          relationshipType: link.type,
          confidence: link.confidence || 'high',
          description: link.description || '',
        })
      }
    }

    // Extract test cases from requirements that have verification criteria
    for (const req of (result.document?.requirements || [])) {
      for (const tv of ((req as any).testVerification || [])) {
        testCases.push({
          id: `tc-${result.document?.nexus?.metadata?.documentId}-${tv.id}`,
          name: tv.name,
          type: 'system',
          description: tv.description,
          testSteps: (tv.steps || []).map((s: any) => ({ stepNumber: s.number, action: s.action, expected: s.expected })),
          expectedResult: tv.expectedResult || '',
          status: 'ready',
          automationStatus: (tv.automated ? 'automated' : 'manual'),
        })
      }
    }
  }

  return { requirements, architectures, components, testCases, traces }
}

/**
 * GET /api/requirements
 * List all loaded requirement documents mapped to frontend artefacts
 */
export async function listRequirements (_: FastifyRequest, reply: FastifyReply) {
  const reqDir = path.join(__dirname, '../../packages/shared/requirements')
  let filePaths: string[]
  try {
    filePaths = await validatedRequirementsLoader.findRequirementFiles(reqDir)
  } catch {
    return reply.send({ artefacts: [], errors: [] })
  }

  if (!filePaths.length) return reply.send({ artefacts: [], errors: [] })

  const allDocs: any[] = []
  for (const fp of filePaths) {
    try {
      const doc = await validatedRequirementsLoader.loadRequirementFile(fp)
      if ((doc as any)?.requirements) allDocs.push(doc)
    } catch { /* skip bad files */ }
  }

  // Wrap in LoadResult format expected by mapArtefacts
  const loadResults: LoadResult[] = allDocs.map((doc) => ({ document: doc, errors: new Map(), violations: [] }))
  const artefacts = mapArtefacts(loadResults)

  return reply.send({ ...artefacts, total: artefacts.requirements.length })
}

/**
 * GET /api/requirements/:id
 * Get single requirement by ID
 */
export async function getRequirement (request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }

  if (!id) {
    throw new AppError(400, 'Requirement ID is required', { param: 'id' })
  }

  const reqDir = path.join(__dirname, '../../packages/shared/requirements')
  const filePaths = await validatedRequirementsLoader.findRequirementFiles(reqDir)
  for (const fp of filePaths) {
    const doc = await validatedRequirementsLoader.loadRequirementFile(fp)
    if ((doc as any)?.requirements?.some((r: any) => r.id === id)) {
      return reply.send({ requirement: { ...(doc as any), id } })
    }
  }

  throw new AppError(404, 'Requirement not found', { resourceId: id })
}

/**
 * GET /api/requirements/domain/:domain
 * Filter requirements by domain
 */
export async function getRequirementsByDomain (request: FastifyRequest, reply: FastifyReply) {
  const { domain } = request.params as { domain: string }

  if (!domain) {
    throw new AppError(400, 'Domain is required', { param: 'domain' })
  }

  const reqDir = path.join(__dirname, '../../packages/shared/requirements')
  const filePaths = await validatedRequirementsLoader.findRequirementFiles(reqDir)
  const matchingDocs: LoadResult[] = []

  for (const fp of filePaths) {
    const doc = await validatedRequirementsLoader.loadRequirementFile(fp)
    if ((doc as any)?.nexus?.metadata?.domain === domain || (doc as any)?.nexus?.metadata?.documentId?.toLowerCase().includes(domain.toLowerCase())) {
      matchingDocs.push({ document: doc, errors: new Map() })
    }
  }

  const artefacts = mapArtefacts(matchingDocs)
  return reply.send({ ...artefacts, domain, total: artefacts.requirements.length })
}

/**
 * POST /api/requirements/scan
 * Trigger rescan of repository path (returns LoadResult)
 */
export async function scanRequirements (request: FastifyRequest, reply: FastifyReply) {
  const { repositoryPath } = request.body as { repositoryPath: string }

  if (!repositoryPath) {
    throw new AppError(400, 'repositoryPath is required', { param: 'repositoryPath' })
  }

  let results: LoadResult[]
  try {
    results = await validatedRequirementsLoader.loadAllWithTraceValidation(repositoryPath)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Scan failed'
    // Return partial results rather than failing entirely
    return reply.send({ documents: [], errors: new Map([['scan', [message]]]), message })
  }

  const artefacts = mapArtefacts(results)
  return reply.send({ 
    ...artefacts, 
    total: artefacts.requirements.length,
    scanned: results.length,
    message: `Scanned ${results.length} requirement files`
  })
}

/**
 * Register all requirements routes with Fastify
 */
export function requirementsRoutes (server: FastifyInstance) {
  server.get('/api/requirements', listRequirements)
  server.get('/api/requirements/:id', getRequirement)
  server.get('/api/requirements/domain/:domain', getRequirementsByDomain)
  server.post('/api/requirements/scan', scanRequirements)
}