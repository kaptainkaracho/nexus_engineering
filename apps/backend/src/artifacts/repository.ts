import type { DocumentOperation } from '@nexus-engineering/shared'

export class ArtifactRepository {
  private artifactsMap = new Map<string, DocumentOperation[]>() // key: repository path

  getArtifacts(repositoryPath: string): DocumentOperation[] | undefined {
    return this.artifactsMap.get(repositoryPath)
  }

  setArtifacts(repositoryPath: string, documents: DocumentOperation[]): void {
    this.artifactsMap.set(repositoryPath, documents)
  }

  listRepositories(): string[] {
    return Array.from(this.artifactsMap.keys())
  }

  clearAll(): void {
    this.artifactsMap.clear()
  }
}

// Singleton for easy access
export const artifactsRepository = new ArtifactRepository()