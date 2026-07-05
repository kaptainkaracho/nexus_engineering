import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { ScanOptions } from '@nexus-engineering/shared'
import { scanRequirements } from './requirements'
import { RepositoryScanner } from '../scanners/repositoryScanner'

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
      fileMetadata: result.fileMetadata,
      scanReport: result.scanReport,
      tree: buildRepositoryTree(result.fileMetadata)
    })
  } catch (error) {
    reply.log.error(error as Error)
    return reply.status(500).send({ error: 'Failed to scan repository' })
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
}