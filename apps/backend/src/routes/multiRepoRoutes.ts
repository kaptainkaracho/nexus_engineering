import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { MultiRepoScanner } from '../scanners/multiRepoScanner'
import { multiScanMetadataStore } from '../scanners/multiScanMetadata'
import { artifactRegistry } from '../artifacts/repository'
import { AppError } from '../lib/errorHandler'

/**
 * POST /api/scan/multi
 * Trigger a multi-repository scan.
 *
 * Body:
 *   repositoryPaths (required) array of paths to scan
 *   scanMode ("parallel" | "sequential", default "parallel")
 *   scanOptions (optional) per-repo scan options
 */
export async function triggerMultiScan(request: FastifyRequest, reply: FastifyReply) {
  const { repositoryPaths, scanMode, scanOptions } = request.body as {
    repositoryPaths: string[]
    scanMode?: 'parallel' | 'sequential'
    scanOptions?: Record<string, unknown>
  }

  if (!repositoryPaths || !Array.isArray(repositoryPaths) || repositoryPaths.length === 0) {
    throw new AppError(400, 'repositoryPaths must be a non-empty array', { param: 'repositoryPaths' })
  }

  if (repositoryPaths.length > 100) {
    throw new AppError(400, 'repositoryPaths cannot exceed 100 entries', { param: 'repositoryPaths', max: 100 })
  }

  if (scanMode && !['parallel', 'sequential'].includes(scanMode)) {
    throw new AppError(400, "scanMode must be 'parallel' or 'sequential'", { param: 'scanMode', allowed: ['parallel', 'sequential'] })
  }

  const scanner = new MultiRepoScanner()
  const { sessionId, result } = await scanner.scanMultiple(repositoryPaths, {
    scanMode,
    scanOptions: scanOptions as any,
  })

  return reply.status(202).send({
    sessionId,
    scans: result.scans.map((s) => ({
      repositoryPath: s.repositoryPath,
      scanId: s.scanId,
      status: s.status,
      filesFound: s.filesFound,
      artifactsDetected: s.artifactsDetected,
      error: s.error ?? undefined,
    })),
    totalFilesFound: result.totalFilesFound,
    totalArtifactsDetected: result.totalArtifactsDetected,
    scanTimeMs: result.scanTimeMs,
    errors: result.errors,
  })
}

/**
 * GET /api/scan/multi/:id
 * Return multi-repo scan session status and per-repo breakdown.
 */
export async function getMultiScanById(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }

  if (!id) {
    throw new AppError(400, 'Session ID is required', { param: 'id' })
  }

  const session = multiScanMetadataStore.getSession(id)
  if (!session) {
    throw new AppError(404, `Multi-scan session ${id} not found`, { resourceId: id })
  }

  return reply.send(session)
}

/**
 * GET /api/artifacts/by-repository
 * Get artifacts filtered by repository path.
 *
 * Query params:
 *   path (required) repository path to filter by
 */
export async function listArtifactsByRepository(request: FastifyRequest, reply: FastifyReply) {
  const { path: repoPath } = request.query as { path: string }

  if (!repoPath) {
    throw new AppError(400, 'path query parameter is required', { param: 'path' })
  }

  const artifacts = artifactRegistry.getByRepository(repoPath)
  return reply.send({ data: artifacts, total: artifacts.length, repositoryPath: repoPath })
}

/**
 * Register multi-repo routes with Fastify
 */
export function multiRepoRoutes(server: FastifyInstance) {
  server.post('/api/scan/multi', triggerMultiScan)
  server.get('/api/scan/multi/:id', getMultiScanById)
  server.get('/api/artifacts/by-repository', listArtifactsByRepository)
}
