import fastify from 'fastify'
import { scanner } from './scanners/repositoryScanner'
import { artifactsRepository } from './artifacts/repository'
import { artifactApiRoutes } from './artifacts/api'
import { requirementsRoutes } from './routes/requirements'

const server = fastify({ logger: true })

server.get('/health', async () => {
  return { status: 'ok' }
})

server.post('/scan', async (request, reply) => {
  const { repositoryPath } = request.body as { repositoryPath: string }

  if (!repositoryPath) {
    return reply.status(400).send({ error: 'repositoryPath is required' })
  }

  try {
    const { documents, report } = await scanner.scan(repositoryPath)
    
    // Store the scan results in artifact repository
    artifactsRepository.setArtifacts(repositoryPath, documents.map(doc => ({
      repositoryPath,
      documents: [doc],
    })))

    return reply.send({ ...report, documentsStored: documents.length })
  } catch (error) {
    server.log.error(error as Error)
    return reply.status(500).send({ error: 'Scan failed' })
  }
})

server.get('/artifacts', async () => {
  const repositories = artifactsRepository.listRepositories()
  let totalDocuments = 0
  
  for (const repo of repositories) {
    const docs = artifactsRepository.getArtifacts(repo)
    if (docs) {
      totalDocuments += docs.reduce((sum, op) => sum + (op.documents?.length ?? 0), 0)
    }
  }
  
  return { repositories, totalDocuments }
})

const start = async () => {
  try {
     // Register API routes
     await artifactApiRoutes(server)
     requirementsRoutes(server)
      await import('./routes/traceabilityLinks').then(module => module.traceabilityLinksRoutes(server))
    
    await server.listen({ port: 3001 })
    server.log.info('Nexus Engineering backend running on http://localhost:3001')
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

start()
