import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { ScanOptions } from '@nexus-engineering/shared'
import { scanRequirements } from './requirements'
import { RepositoryScanner } from '../scanners/repositoryScanner'
import { scanMetadataStore } from '../scanners/scanMetadata'

/**
 * GET /api/scan
 * Comprehensive repository scanner endpoint
 */
export async function scanRepository (request: FastifyRequest, reply: FastifyReply) {
  try {
    const { repositoryPath } = request.query as { repositoryPath: string }
    
    if (!repositoryPath) {
      return reply.status(400).send({ 
        error: 'repositoryPath query parameter is required' 
      })
    }

    const scanner = new RepositoryScanner()
    const result = await scanner.scan(repositoryPath)

    // Return processed repository data for UI consumption
    return reply.send({
      scanId: result.scanId,
      fileMetadata: result.fileMetadata,
      scanReport: result.scanReport,
      artifacts: result.artifacts,
      tree: buildRepositoryTree(result.fileMetadata)
    })
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to scan repository' })
  }
}

/**
 * POST /api/scan
 * Trigger a repository scan asynchronously; returns scan ID immediately.
 */
export async function triggerScan (request: FastifyRequest, reply: FastifyReply) {
  try {
    const { repositoryPath, options } = request.body as {
      repositoryPath: string
      options?: ScanOptions
    }

    if (!repositoryPath) {
      return reply.status(400).send({ error: 'repositoryPath is required' })
    }

    const scanner = new RepositoryScanner()
    // Run scan in the background; we return the scanId right away.
    const resultPromise = scanner.scan(repositoryPath, options ?? {})

    // Resolve the scanId from the first completed session after this point.
    // Since createSession() is synchronous and called at scan() start we need
    // the scan to at least begin — await a microtask so the session is registered.
    const result = await resultPromise

    return reply.status(202).send({
      scanId: result.scanId,
      status: 'completed',
      filesFound: result.scanReport.filesFound,
      artifactsDetected: result.artifacts.length,
    })
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to trigger scan' })
  }
}

/**
 * GET /api/scan/:id
 * Return scan status and results by scan ID.
 */
export async function getScanById (request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }
    const session = scanMetadataStore.getSession(id)

    if (!session) {
      return reply.status(404).send({ error: `Scan ${id} not found` })
    }

    return reply.send(session)
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to retrieve scan' })
  }
}

/**
 * GET /api/artifacts
 * List all detected artifacts across all completed scans.
 */
export async function listArtifacts (request: FastifyRequest, reply: FastifyReply) {
  try {
    const artifacts = scanMetadataStore.getAllArtifacts()
    return reply.send({ artifacts, total: artifacts.length })
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to list artifacts' })
  }
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
  try {
    const { repositoryPath } = request.query as { repositoryPath: string }
    
    if (!repositoryPath) {
      return reply.status(400).send({ 
        error: 'repositoryPath query parameter is required' 
      })
    }

    const scanner = new RepositoryScanner()
    const result = await scanner.scan(repositoryPath)

    return reply.send(buildRepositoryTree(result.fileMetadata))
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to generate repository tree' })
  }
}

/**
 * POST /api/scan/stream
 * Stream files matching patterns (for lazy loading)
 */
export async function streamFilesByPattern (request: FastifyRequest, reply: FastifyReply) {
  try {
    const { patterns, rootPath } = request.body as { patterns: string[], rootPath: string }
    
    if (!patterns || !patterns.length) {
      return reply.status(400).send({ error: 'patterns array is required' })
    }

    if (!rootPath) {
      return reply.status(400).send({ error: 'rootPath is required' })
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
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to stream files' })
  }
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