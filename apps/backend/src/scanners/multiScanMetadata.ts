import { randomUUID } from 'node:crypto'
import type { MultiScanSession } from '@nexus-engineering/shared'

export class MultiScanMetadataStore {
  private sessions = new Map<string, MultiScanSession>()

  createSession(repositoryPaths: string[], scanMode: 'parallel' | 'sequential' = 'parallel'): string {
    const id = randomUUID()
    const session: MultiScanSession = {
      id,
      startedAt: new Date().toISOString(),
      repositoryPaths,
      scanIds: [],
      filesFound: 0,
      filesSkipped: 0,
      artifactsDetected: 0,
      perRepoResults: repositoryPaths.map((path) => ({
        repositoryPath: path,
        scanId: '',
        status: 'running',
        filesFound: 0,
        artifactsDetected: 0,
      })),
      errors: [],
      status: 'running',
      scanMode,
    }
    this.sessions.set(id, session)
    return id
  }

  registerScanId(sessionId: string, repoIndex: number, scanId: string): void {
    const session = this.sessions.get(sessionId)
    if (!session) return
    session.scanIds.push(scanId)
    session.perRepoResults[repoIndex].scanId = scanId
  }

  markRepoCompleted(
    sessionId: string,
    repoIndex: number,
    filesFound: number,
    artifactsDetected: number,
  ): void {
    const session = this.sessions.get(sessionId)
    if (!session) return
    const result = session.perRepoResults[repoIndex]
    result.status = 'completed'
    result.filesFound = filesFound
    result.artifactsDetected = artifactsDetected
    session.filesFound += filesFound
    session.artifactsDetected += artifactsDetected
  }

  markRepoFailed(sessionId: string, repoIndex: number, error: string): void {
    const session = this.sessions.get(sessionId)
    if (!session) return
    const result = session.perRepoResults[repoIndex]
    result.status = 'failed'
    result.error = error
    session.errors.push({ path: session.repositoryPaths[repoIndex], message: error })
  }

  completeSession(sessionId: string): void {
    const session = this.sessions.get(sessionId)
    if (!session) return
    session.completedAt = new Date().toISOString()
    session.status = 'completed'
  }

  failSession(sessionId: string, error: string): void {
    const session = this.sessions.get(sessionId)
    if (!session) return
    session.errors.push({ path: '', message: error })
    session.completedAt = new Date().toISOString()
    session.status = 'failed'
  }

  getSession(sessionId: string): MultiScanSession | null {
    return this.sessions.get(sessionId) ?? null
  }

  getAllSessions(): MultiScanSession[] {
    return Array.from(this.sessions.values()).sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
    )
  }

  clear(): void {
    this.sessions.clear()
  }
}

export const multiScanMetadataStore = new MultiScanMetadataStore()
