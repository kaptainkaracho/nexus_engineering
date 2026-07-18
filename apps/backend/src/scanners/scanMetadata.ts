// Scan Metadata Store
// In-memory persistence for scan sessions; can be swapped for SQLite later.

import { randomUUID } from 'node:crypto'
import { ScanSession, DetectedArtifact } from '@nexus-engineering/shared'

export class ScanMetadataStore {
  private sessions = new Map<string, ScanSession>()

  /** Create a new session in `running` state and return its ID. */
  createSession(repositoryPath: string): string {
    const id = randomUUID()
    const session: ScanSession = {
      id,
      startedAt: new Date().toISOString(),
      repositoryPath,
      filesFound: 0,
      filesSkipped: 0,
      artifactsDetected: [],
      errors: [],
      status: 'running',
    }
    this.sessions.set(id, session)
    return id
  }

  /** Mark a session as completed and record final counts. */
  completeSession(
    id: string,
    filesFound: number,
    filesSkipped: number,
    artifacts: DetectedArtifact[],
    errors: Array<{ path: string; message: string }>,
  ): void {
    const session = this.sessions.get(id)
    if (!session) throw new Error(`Session ${id} not found`)

    session.filesFound = filesFound
    session.filesSkipped = filesSkipped
    session.artifactsDetected = artifacts
    session.errors = errors
    session.completedAt = new Date().toISOString()
    session.status = 'completed'
  }

  /** Mark a session as failed. */
  failSession(id: string, error: string): void {
    const session = this.sessions.get(id)
    if (!session) return

    session.errors.push({ path: session.repositoryPath, message: error })
    session.completedAt = new Date().toISOString()
    session.status = 'failed'
  }

  /** Retrieve a session by ID, or null if not found. */
  getSession(id: string): ScanSession | null {
    return this.sessions.get(id) ?? null
  }

  /** Return all completed sessions sorted newest-first. */
  getAllSessions(): ScanSession[] {
    return Array.from(this.sessions.values()).sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
    )
  }

  /** Flatten artifacts across all completed sessions. */
  getAllArtifacts(): DetectedArtifact[] {
    const artifacts: DetectedArtifact[] = []
    for (const session of this.sessions.values()) {
      artifacts.push(...session.artifactsDetected)
    }
    return artifacts
  }

  /**
   * Paginated view over all detected artifacts (newest session first).
   * `total` reflects the full flattened count so callers can page correctly.
   */
  getArtifactsPage(limit: number, offset: number): {
    artifacts: DetectedArtifact[]
    total: number
  } {
    const all = this.getAllArtifacts()
    const artifacts = all.slice(offset, offset + limit)
    return { artifacts, total: all.length }
  }

  /** Remove all sessions (useful in tests). */
  clear(): void {
    this.sessions.clear()
  }
}

// Singleton shared across the application
export const scanMetadataStore = new ScanMetadataStore()
