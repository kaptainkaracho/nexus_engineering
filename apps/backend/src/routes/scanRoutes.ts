import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { ScanOptions } from '@nexus-engineering/shared'
import { scanRequirements } from './requirements'
import { RepositoryScanner } from '../scanners/repositoryScanner'
import { scanMetadataStore } from '../scanners/scanMetadata'
import { parsePagination, buildPaginationMeta, paginate } from '../lib/pagination'
import { AppError } from '../lib/errorHandler'

/**
 * GET /api/scan
 * Comprehensive repository scanner endpoint.
 *
 * Query params:
 *   repositoryPath  (required) path to scan
 *   limit / offset  pagination over fileMetadata + artifacts (default 100 / 0, capped at 1000)
 *   computeHashes   compute SHA-256 per file (expensive; default false)
 *   includeTree     build the full hierarchy tree in the response (default false)
 */
export async function scanRepository (request: FastifyRequest, reply: FastifyReply) {
  const q = request.query as Record<string, unknown>
  const repositoryPath = q.repositoryPath as string

  if (!repositoryPath) {
    throw new AppError(400, 'repositoryPath query parameter is required', { param: 'repositoryPath' })
  }

  let page
  try {
    page = parsePagination(q)
  } catch (err) {
    throw new AppError(400, (err as Error).message, { param: 'pagination' })
  }

  const computeHashes = q.computeHashes === 'true' || q.computeHashes === true
  const includeTree = q.includeTree === 'true' || q.includeTree === true

  const scanner = new RepositoryScanner()
  const result = await scanner.scan(repositoryPath, {
    computeHashes,
  } as ScanOptions)

  const totalFiles = result.fileMetadata.length
  const totalArtifacts = result.artifacts.length

  return reply.send({
    scanId: result.scanId,
    fileMetadata: paginate(result.fileMetadata, page),
    totalFiles,
    artifacts: paginate(result.artifacts, page),
    totalArtifacts,
    scanReport: result.scanReport,
    ...(includeTree ? { tree: buildRepositoryTree(result.fileMetadata) } : {}),
    pagination: buildPaginationMeta(page.limit, page.offset, Math.max(totalFiles, totalArtifacts)),
  })
}

/**
 * POST /api/scan
 * Trigger a repository scan asynchronously; returns scan ID immediately.
 */
export async function triggerScan (request: FastifyRequest, reply: FastifyReply) {
  const { repositoryPath, options } = request.body as {
    repositoryPath: string
    options?: ScanOptions
  }

  if (!repositoryPath) {
    throw new AppError(400, 'repositoryPath is required', { param: 'repositoryPath' })
  }

  const scanner = new RepositoryScanner()
  const result = await scanner.scan(repositoryPath, options ?? {})

  return reply.status(202).send({
    scanId: result.scanId,
    status: 'completed',
    filesFound: result.scanReport.filesFound,
    artifactsDetected: result.artifacts.length,
  })
}

/**
 * GET /api/scan/:id
 * Return scan status and results by scan ID.
 */
export async function getScanById (request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }

  if (!id) {
    throw new AppError(400, 'Scan ID is required', { param: 'id' })
  }

  const session = scanMetadataStore.getSession(id)
  if (!session) {
    throw new AppError(404, `Scan ${id} not found`, { resourceId: id })
  }

  return reply.send(session)
}

/**
 * GET /api/artifacts
 * List detected artifacts across all completed scans (paginated).
 *
 * Query params: limit / offset (default 100 / 0, capped at 1000)
 */
export async function listArtifacts (request: FastifyRequest, reply: FastifyReply) {
  let page
  try {
    page = parsePagination(request.query as Record<string, unknown>)
  } catch (err) {
    throw new AppError(400, (err as Error).message, { param: 'pagination' })
  }

  const { artifacts, total } = scanMetadataStore.getArtifactsPage(page.limit, page.offset)
  return reply.send({
    artifacts,
    total,
    pagination: buildPaginationMeta(page.limit, page.offset, total),
  })
}

/**
 * Build hierarchical tree structure from flat file metadata
 */
function buildRepositoryTree(fileMetadata: any[]): { root: any, nodesByPath: Record<string, any> } {
  const nodeMap = new Map<string, any>()
  const rootNode: any = {
    id: 'root',
    path: '',
    name: 'repository',
    type: 'directory' as const,
    children: []
  }

  nodeMap.set('', rootNode)

  for (const file of fileMetadata) {
    const pathParts = file.relativePath.split('/')
    let currentParent = rootNode

    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i]
      const fullPath = pathParts.slice(0, i + 1).join('/')

      if (!part) continue

      let node = nodeMap.get(fullPath)

      if (!node) {
        const isDir = i < pathParts.length - 1
        node = {
          id: `${file.filePath}-${part}`,
          path: fullPath,
          name: part,
          type: isDir ? 'directory' as const : 'file' as const,
          size: isDir ? undefined : file.size,
          extension: isDir ? undefined : file.filePath.split('.').pop(),
          isBinary: file.contentType === 'binary',
          children: isDir ? [] : undefined
        }

        nodeMap.set(fullPath, node)

        if (isDir) {
          currentParent.children.push(node)
        }
      }

      currentParent = node
    }
  }

  return {
    root: rootNode,
    nodesByPath: Object.fromEntries(nodeMap.entries())
  }
}

/**
 * GET /api/scan/tree
 * Lightweight tree-only response for initial UI mount
 */
export async function scanTree (request: FastifyRequest, reply: FastifyReply) {
  const { repositoryPath } = request.query as { repositoryPath: string }
  
  if (!repositoryPath) {
    throw new AppError(400, 'repositoryPath query parameter is required', { param: 'repositoryPath' })
  }

  const scanner = new RepositoryScanner()
  const result = await scanner.scan(repositoryPath)

  return reply.send(buildRepositoryTree(result.fileMetadata))
}

/**
 * POST /api/scan/stream
 * Stream files matching patterns (for lazy loading)
 */
export async function streamFilesByPattern (request: FastifyRequest, reply: FastifyReply) {
  const { patterns, rootPath } = request.body as { patterns: string[], rootPath: string }
  
  if (!patterns || !patterns.length) {
    throw new AppError(400, 'patterns array is required', { param: 'patterns' })
  }

  if (!rootPath) {
    throw new AppError(400, 'rootPath is required', { param: 'rootPath' })
  }

  const scanner = new RepositoryScanner()
  const fileStream = scanner.streamFiles(patterns, rootPath)

  // Set headers for streaming response
  reply.raw.writeHead(200, {
    'Content-Type': 'application/json',
    'Transfer-Encoding': 'chunked'
  })

  for await (const fileEntry of fileStream) {
    reply.raw.write(JSON.stringify(fileEntry))
    reply.raw.write('\\n')
  }

  reply.raw.end()
  return reply
}

/**
 * Register scan routes with Fastify
 */
export function scanRoutes (server: FastifyInstance) {
  server.get('/api/scan', scanRepository)
  server.get('/api/scan/tree', scanTree)
  server.post('/api/scan/stream', streamFilesByPattern)
  server.post('/api/scan', triggerScan)
  server.get('/api/scan/:id', getScanById)
  server.get('/api/artifacts', listArtifacts)
}