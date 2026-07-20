import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { MultiScanMetadataStore } from './multiScanMetadata'
import { MultiRepoScanner } from './multiRepoScanner'
import { ArtifactRegistry } from '../artifacts/repository'

// ─── MultiScanMetadataStore ──────────────────────────────────────────────

describe('MultiScanMetadataStore', () => {
  let store: MultiScanMetadataStore

  beforeEach(() => {
    store = new MultiScanMetadataStore()
  })

  it('creates a session in running state', () => {
    const id = store.createSession(['/repo/1', '/repo/2'])
    const session = store.getSession(id)

    expect(session).not.toBeNull()
    expect(session!.status).toBe('running')
    expect(session!.repositoryPaths).toEqual(['/repo/1', '/repo/2'])
    expect(session!.scanMode).toBe('parallel')
    expect(session!.perRepoResults).toHaveLength(2)
    expect(session!.perRepoResults[0].status).toBe('running')
    expect(session!.perRepoResults[1].status).toBe('running')
  })

  it('creates sequential session', () => {
    const id = store.createSession(['/repo/1'], 'sequential')
    const session = store.getSession(id)
    expect(session!.scanMode).toBe('sequential')
  })

  it('registers scan IDs per repo', () => {
    const id = store.createSession(['/repo/1', '/repo/2'])
    store.registerScanId(id, 0, 'scan-uuid-1')
    store.registerScanId(id, 1, 'scan-uuid-2')

    const session = store.getSession(id)!
    expect(session.scanIds).toContain('scan-uuid-1')
    expect(session.scanIds).toContain('scan-uuid-2')
    expect(session.perRepoResults[0].scanId).toBe('scan-uuid-1')
    expect(session.perRepoResults[1].scanId).toBe('scan-uuid-2')
  })

  it('marks repos completed and aggregates counts', () => {
    const id = store.createSession(['/repo/1', '/repo/2'])
    store.markRepoCompleted(id, 0, 10, 2)
    store.markRepoCompleted(id, 1, 20, 3)

    const session = store.getSession(id)!
    expect(session.perRepoResults[0].status).toBe('completed')
    expect(session.perRepoResults[1].status).toBe('completed')
    expect(session.filesFound).toBe(30)
    expect(session.artifactsDetected).toBe(5)
  })

  it('marks repos failed and records errors', () => {
    const id = store.createSession(['/repo/1', '/repo/2'])
    store.markRepoFailed(id, 0, 'ENOENT')

    const session = store.getSession(id)!
    expect(session.perRepoResults[0].status).toBe('failed')
    expect(session.perRepoResults[0].error).toBe('ENOENT')
    expect(session.errors).toHaveLength(1)
    expect(session.errors[0]).toEqual({ path: '/repo/1', message: 'ENOENT' })
  })

  it('completes a session', () => {
    const id = store.createSession(['/repo/1'])
    store.completeSession(id)
    const session = store.getSession(id)!
    expect(session.status).toBe('completed')
    expect(session.completedAt).toBeTruthy()
  })

  it('fails a session', () => {
    const id = store.createSession(['/repo/1'])
    store.failSession(id, 'Fatal error')
    const session = store.getSession(id)!
    expect(session.status).toBe('failed')
    expect(session.errors).toHaveLength(1)
  })

  it('returns null for unknown session', () => {
    expect(store.getSession('unknown')).toBeNull()
  })

  it('returns sessions sorted newest-first', async () => {
    const id1 = store.createSession(['/repo/1'])
    await new Promise((r) => setTimeout(r, 5))
    const id2 = store.createSession(['/repo/2'])

    const sessions = store.getAllSessions()
    expect(sessions).toHaveLength(2)
    expect(sessions[0].id).toBe(id2)
    expect(sessions[1].id).toBe(id1)
  })

  it('clear removes all sessions', () => {
    store.createSession(['/repo/1'])
    store.createSession(['/repo/2'])
    store.clear()
    expect(store.getAllSessions()).toHaveLength(0)
  })
})

// ─── MultiRepoScanner ────────────────────────────────────────────────────

describe('MultiRepoScanner', () => {
  let dirs: string[]

  beforeEach(() => {
    dirs = []
  })

  afterEach(() => {
    for (const d of dirs) {
      rmSync(d, { recursive: true, force: true })
    }
  })

  function createTestRepo(): string {
    const dir = mkdtempSync(join(tmpdir(), 'nexus-multirepo-'))
    dirs.push(dir)
    writeFileSync(join(dir, 'main.ts'), 'export const x = 1;\n')
    writeFileSync(join(dir, 'ADR-001-decision.md'), '# Decision\nUse Postgres.\n')
    writeFileSync(join(dir, 'system.req.yaml'), 'title: System\nversion: "1.0"\n')
    return dir
  }

  it('scans multiple repos in parallel mode', async () => {
    const repo1 = createTestRepo()
    const repo2 = createTestRepo()

    const scanner = new MultiRepoScanner()
    const { sessionId, result } = await scanner.scanMultiple([repo1, repo2])

    expect(sessionId).toBeTruthy()
    expect(result.scans).toHaveLength(2)
    expect(result.scans.every((s) => s.status === 'completed')).toBe(true)
    expect(result.totalFilesFound).toBeGreaterThanOrEqual(6)
    expect(result.totalArtifactsDetected).toBeGreaterThanOrEqual(4)
    expect(result.scanTimeMs).toBeGreaterThan(0)
  })

  it('scans repos sequentially when mode is sequential', async () => {
    const repo1 = createTestRepo()
    const repo2 = createTestRepo()

    const scanner = new MultiRepoScanner()
    const { result } = await scanner.scanMultiple([repo1, repo2], { scanMode: 'sequential' })

    expect(result.scans).toHaveLength(2)
    expect(result.scans.every((s) => s.status === 'completed')).toBe(true)
    expect(result.totalFilesFound).toBeGreaterThanOrEqual(6)
  })

  it('handles non-existent repo paths gracefully (scanner recovers)', async () => {
    const goodRepo = createTestRepo()

    const scanner = new MultiRepoScanner()
    const { result } = await scanner.scanMultiple([goodRepo, '/nonexistent/path'])

    expect(result.scans).toHaveLength(2)
    expect(result.scans[0].status).toBe('completed')
    // The scanner doesn't throw for bad paths — it returns an empty result with errors in the report
    expect(result.scans[1].filesFound).toBe(0)
    // Error is recorded in the scan report
    if (result.scans[1].scanReport.errors.length > 0) {
      expect(result.scans[1].scanReport.errors[0].path).toBe('/nonexistent/path')
    }
  })

  it('handles empty repo paths array without error', async () => {
    const scanner = new MultiRepoScanner()
    // This will still create a session, but run scans for zero repos
    const { sessionId, result } = await scanner.scanMultiple([])

    expect(sessionId).toBeTruthy()
    expect(result.scans).toHaveLength(0)
    expect(result.totalFilesFound).toBe(0)
    expect(result.totalArtifactsDetected).toBe(0)
  })
})

// ─── ArtifactRegistry getByRepository ────────────────────────────────────

describe('ArtifactRegistry.getByRepository', () => {
  it('filters artifacts by repository path', () => {
    const registry = new ArtifactRegistry()
    const now = new Date().toISOString()

    registry.create({
      type: 'requirement',
      filePath: '/repo1/spec.req.yaml',
      repositoryPath: '/repo1',
      lifecycle: 'discovered',
      metadata: {},
      errors: [],
      reparseCount: 0,
    })
    registry.create({
      type: 'adr',
      filePath: '/repo2/ADR-001.md',
      repositoryPath: '/repo2',
      lifecycle: 'discovered',
      metadata: {},
      errors: [],
      reparseCount: 0,
    })

    const repo1Artifacts = registry.getByRepository('/repo1')
    expect(repo1Artifacts).toHaveLength(1)
    expect(repo1Artifacts[0].type).toBe('requirement')

    const repo2Artifacts = registry.getByRepository('/repo2')
    expect(repo2Artifacts).toHaveLength(1)
    expect(repo2Artifacts[0].type).toBe('adr')
  })

  it('returns empty array for unknown repository', () => {
    const registry = new ArtifactRegistry()
    expect(registry.getByRepository('/unknown')).toEqual([])
  })
})
