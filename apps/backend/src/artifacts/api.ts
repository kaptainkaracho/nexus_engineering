import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { DocumentOperation, RepositoryDocumentOperation } from '@nexus-engineering/shared'
import { artifactsRepository } from './repository'

export async function artifactApiRoutes(server: FastifyInstance) {
  // Get all repositories
  server.get('/api/v1/artifacts/repositories', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const repositories = artifactsRepository.listRepositories()
      return { success: true, data: repositories }
    } catch (error) {
      server.log.error(error as Error)
      return reply.status(500).send({ error: 'Failed to list repositories' })
    }
  })

  // Get artifacts for a specific repository
  server.get('/api/v1/artifacts/repositories/:repositoryPath', async (request: FastifyRequest, reply: FastifyReply) => {
    const { repositoryPath } = request.params as { repositoryPath: string }
    
    if (!repositoryPath) {
      return reply.status(400).send({ error: 'repositoryPath is required' })
    }

    try {
      const artifacts = artifactsRepository.getArtifacts(repositoryPath)
      
      if (!artifacts || artifacts.length === 0) {
        return { success: true, data: [], message: 'No artifacts found for this repository' }
      }

      return { success: true, data: artifacts }
    } catch (error) {
      server.log.error(error as Error)
      return reply.status(500).send({ error: 'Failed to get artifacts' })
    }
  })

  // Get a specific artifact by ID
  server.get('/api/v1/artifacts/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string }
    
    if (!id) {
      return reply.status(400).send({ error: 'ID is required' })
    }

    try {
      const repositories = artifactsRepository.listRepositories()
      let foundArtifact = null
      
      for (const repo of repositories) {
        const artifacts = artifactsRepository.getArtifacts(repo)
        if (artifacts) {
          const artifact = artifacts.find(a => a.id === id || a.documents?.some(d => d.id === id))
          if (artifact) {
            foundArtifact = artifact
            break
          }
        }
      }
      
      if (!foundArtifact) {
        return reply.status(404).send({ error: 'Artifact not found' })
      }

      return { success: true, data: foundArtifact }
    } catch (error) {
      server.log.error(error as Error)
      return reply.status(500).send({ error: 'Failed to get artifact' })
    }
  })

  // Add artifacts (for manual upload or additional documents)
  server.post('/api/v1/artifacts', async (request: FastifyRequest, reply: FastifyReply) => {
    const operation = request.body as DocumentOperation
    
    if (!operation.repositoryPath || !operation.documents) {
      return reply.status(400).send({ error: 'repositoryPath and documents are required' })
    }

    try {
      const existingArtifacts = artifactsRepository.getArtifacts(operation.repositoryPath) || []
      
      // Add new documents to existing ones
      const updatedDocuments = [...existingArtifacts, ...operation.documents.map(doc => ({
        id: doc.id,
        documents: [{ ...doc }],
        repositoryPath: operation.repositoryPath,
      }))]
      
      artifactsRepository.setArtifacts(operation.repositoryPath, updatedDocuments)
      
      return reply.status(201).send({
        success: true,
        data: { repositoryPath: operation.repositoryPath, documentCount: operation.documents.length }
      })
    } catch (error) {
      server.log.error(error as Error)
      return reply.status(500).send({ error: 'Failed to add artifacts' })
    }
  })

  // Update an existing artifact document
  server.put('/api/v1/artifacts/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string }
    const operation = request.body as DocumentOperation
    
    if (!id || !operation.documents || operation.documents.length === 0) {
      return reply.status(400).send({ error: 'ID and documents are required' })
    }
    
    if (operation.repositoryPath && !operation.documents[0].repositoryPath) {
      return reply.status(400).send({ error: 'Repository path must match document repository path' })
    }

    try {
      const repositories = artifactsRepository.listRepositories()
      let updated = false
      let updateCount = 0
      
      for (const repo of repositories) {
        const existingArtifacts = artifactsRepository.getArtifacts(repo)
        if (!existingArtifacts) continue
        
        const artifactsToKeep: DocumentOperation[] = []
        let foundAndUpdated = false
        
        for (const artifact of existingArtifacts) {
          // Check if this artifact contains the document we want to update
          if (artifact.documents?.some(d => d.id === id)) {
            // Update the document
            const updatedDocuments = artifact.documents.map(doc =>
              doc.id === id ? operation.documents[0] : doc
            )
            artifactsToKeep.push({
              ...artifact,
              documents: updatedDocuments
            })
            foundAndUpdated = true
            updateCount++
          } else {
            artifactsToKeep.push(artifact)
          }
        }
        
        if (foundAndUpdated || existingArtifacts.length > 0) {
          updated = true
          artifactsRepository.setArtifacts(repo, artifactsToKeep)
        }
      }
      
      if (!updated) {
        return reply.status(404).send({ error: 'Document not found' })
      }

      return { success: true, data: { updatedCount: updateCount } }
    } catch (error) {
      server.log.error(error as Error)
      return reply.status(500).send({ error: 'Failed to update artifact' })
    }
  })

  // Delete artifacts
  server.delete('/api/v1/artifacts', async (request: FastifyRequest, reply: FastifyReply) => {
    const { repositoryPath } = request.query as { repositoryPath?: string }
    
    if (!repositoryPath) {
      return reply.status(400).send({ error: 'repositoryPath query parameter is required' })
    }

    try {
      const existingArtifacts = artifactsRepository.getArtifacts(repositoryPath)
      
      if (existingArtifacts) {
        artifactsRepository.clearAll()
      }
      
      return { success: true, data: { cleared: repositoryPath } }
    } catch (error) {
      server.log.error(error as Error)
      return reply.status(500).send({ error: 'Failed to delete artifacts' })
    }
  })

  // Delete a specific artifact by ID
  server.delete('/api/v1/artifacts/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string }
    
    if (!id) {
      return reply.status(400).send({ error: 'ID is required' })
    }

    try {
      const repositories = artifactsRepository.listRepositories()
      let deletedCount = 0
      
      for (const repo of repositories) {
        const existingArtifacts = artifactsRepository.getArtifacts(repo)
        if (!existingArtifacts) continue
        
        const filteredArtifacts = existingArtifacts.filter(artifact =>
          !artifact.documents?.some(d => d.id === id)
        )
        
        if (filteredArtifacts.length !== existingArtifacts.length) {
          deletedCount++
          artifactsRepository.setArtifacts(repo, filteredArtifacts)
        }
      }
      
      return { success: true, data: { deletedCount: deletedCount } }
    } catch (error) {
      server.log.error(error as Error)
      return reply.status(500).send({ error: 'Failed to delete artifact' })
    }
  })
}