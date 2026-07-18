import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { MultiRepoScanner } from '../scanners/multiRepoScanner'
import { multiScanMetadataStore } from '../scanners/multiScanMetadata'
import { artifactRegistry } from '../artifacts/repository'

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
  try {
    const { repositoryPaths, scanMode, scanOptions } = request.body as {
      repositoryPaths: string[]
      scanMode?: 'parallel' | 'sequential'
      scanOptions?: Record<string, unknown>
    }

    if (!repositoryPaths || !Array.isArray(repositoryPaths) || repositoryPaths.length === 0) {
      return reply.status(400).send({ error: 'repositoryPaths must be a non-empty array' })
    }

    if (repositoryPaths.length > 100) {
      return reply.status(400).send({ error: 'repositoryPaths cannot exceed 100 entries' })
    }

    if (scanMode && !['parallel', 'sequential'].includes(scanMode)) {
      return reply.status(400).send({ error: "scanMode must be 'parallel' or 'sequential'" })
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
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to execute multi-repo scan' })
  }
}

/**
 * GET /api/scan/multi/:id
 * Return multi-repo scan session status and per-repo breakdown.
 */
export async function getMultiScanById(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }
    const session = multiScanMetadataStore.getSession(id)

    if (!session) {
      return reply.status(404).send({ error: `Multi-scan session ${id} not found` })
    }

    return reply.send(session)
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to retrieve multi-scan session' })
  }
}

/**
 * GET /api/artifacts/by-repository
 * Get artifacts filtered by repository path.
 *
 * Query params:
 *   path (required) repository path to filter by
 */
export async function listArtifactsByRepository(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { path: repoPath } = request.query as { path: string }

    if (!repoPath) {
      return reply.status(400).send({ error: 'path query parameter is required' })
    }

    const artifacts = artifactRegistry.getByRepository(repoPath)
    return reply.send({ data: artifacts, total: artifacts.length, repositoryPath: repoPath })
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to list artifacts by repository' })
  }
}

/**
 * Register multi-repo routes with Fastify
 */
export function multiRepoRoutes(server: FastifyInstance) {
  server.post('/api/scan/multi', triggerMultiScan)
  server.get('/api/scan/multi/:id', getMultiScanById)
  server.get('/api/artifacts/by-repository', listArtifactsByRepository)
}
