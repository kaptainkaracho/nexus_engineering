// Unit tests for artifact detection, scan metadata, and scanner integration.
// Run with: pnpm exec vitest run apps/backend/src/scanners/repositoryScanner.test.ts

import { describe, it, expect, beforeEach } from 'vitest'
import { ArtifactDetector } from './artifactDetector'
import { ScanMetadataStore } from './scanMetadata'
import type { FileMetadata } from '@nexus-engineering/shared'

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeFile(filePath: string): FileMetadata {
  const fileName = filePath.split('/').pop() ?? filePath
  return {
    filePath,
    relativePath: filePath,
    size: 100,
    contentHash: 'abc123',
    contentType: 'text',
  }
}

// ─── ArtifactDetector ───────────────────────────────────────────────────────

describe('ArtifactDetector', () => {
  let detector: ArtifactDetector

  beforeEach(() => {
    detector = new ArtifactDetector()
  })

  it('detects .req.yaml files as requirement', () => {
    const files = [makeFile('specs/system.req.yaml')]
    const artifacts = detector.detect(files)

    expect(artifacts).toHaveLength(1)
    expect(artifacts[0].artifactType).toBe('requirement')
    expect(artifacts[0].fileName).toBe('system.req.yaml')
  })

  it('detects .arch.yaml files as architecture', () => {
    const files = [makeFile('docs/service.arch.yaml')]
    const artifacts = detector.detect(files)

    expect(artifacts).toHaveLength(1)
    expect(artifacts[0].artifactType).toBe('architecture')
  })

  it('detects ADR-*.md files as adr (case-insensitive prefix)', () => {
    const files = [
      makeFile('decisions/ADR-001-use-postgres.md'),
      makeFile('decisions/ADR-042-split-monolith.md'),
    ]
    const artifacts = detector.detect(files)

    expect(artifacts).toHaveLength(2)
    artifacts.forEach((a) => expect(a.artifactType).toBe('adr'))
  })

  it('detects .spec.yaml files as spec', () => {
    const files = [makeFile('api/auth.spec.yaml')]
    const artifacts = detector.detect(files)

    expect(artifacts).toHaveLength(1)
    expect(artifacts[0].artifactType).toBe('spec')
  })

  it('does NOT detect regular files', () => {
    const files = [
      makeFile('src/index.ts'),
      makeFile('README.md'),
      makeFile('package.json'),
    ]
    expect(detector.detect(files)).toHaveLength(0)
  })

  it('detects all 4 artifact types from a mixed list', () => {
    const files = [
      makeFile('a/system.req.yaml'),
      makeFile('b/service.arch.yaml'),
      makeFile('c/ADR-001-decision.md'),
      makeFile('d/api.spec.yaml'),
      makeFile('e/index.ts'),
    ]
    const artifacts = detector.detect(files)

    expect(artifacts).toHaveLength(4)
    const types = artifacts.map((a) => a.artifactType).sort()
    expect(types).toEqual(['adr', 'architecture', 'requirement', 'spec'])
  })

  it('ADR files take priority over any hypothetical .md overlap', () => {
    const files = [makeFile('docs/ADR-010-caching.md')]
    const [artifact] = detector.detect(files)
    expect(artifact.artifactType).toBe('adr')
  })

  it('detectSingle returns null for a non-artifact file', () => {
    expect(detector.detectSingle('/src/app.ts', 'src/app.ts')).toBeNull()
  })

  it('detectSingle returns the correct type for a matching file', () => {
    const result = detector.detectSingle('/docs/ADR-005-auth.md', 'docs/ADR-005-auth.md')
    expect(result).not.toBeNull()
    expect(result!.artifactType).toBe('adr')
    expect(result!.fileName).toBe('ADR-005-auth.md')
  })
})

// ─── ScanMetadataStore ──────────────────────────────────────────────────────

describe('ScanMetadataStore', () => {
  let store: ScanMetadataStore

  beforeEach(() => {
    store = new ScanMetadataStore()
  })

  it('creates a session in running state', () => {
    const id = store.createSession('/repo/path')
    const session = store.getSession(id)

    expect(session).not.toBeNull()
    expect(session!.status).toBe('running')
    expect(session!.repositoryPath).toBe('/repo/path')
    expect(session!.startedAt).toBeTruthy()
  })

  it('completes a session with artifacts', () => {
    const id = store.createSession('/repo/path')
    const artifacts = [
      {
        artifactType: 'requirement' as const,
        filePath: '/repo/spec.req.yaml',
        relativePath: 'spec.req.yaml',
        fileName: 'spec.req.yaml',
        detectedAt: new Date().toISOString(),
      },
    ]

    store.completeSession(id, 10, 2, artifacts, [])

    const session = store.getSession(id)
    expect(session!.status).toBe('completed')
    expect(session!.filesFound).toBe(10)
    expect(session!.filesSkipped).toBe(2)
    expect(session!.artifactsDetected).toHaveLength(1)
    expect(session!.completedAt).toBeTruthy()
  })

  it('fails a session with an error message', () => {
    const id = store.createSession('/bad/path')
    store.failSession(id, 'ENOENT: no such file')

    const session = store.getSession(id)
    expect(session!.status).toBe('failed')
    expect(session!.errors[0].message).toContain('ENOENT')
  })

  it('returns null for unknown scan ID', () => {
    expect(store.getSession('non-existent-id')).toBeNull()
  })

  it('throws when completing a non-existent session', () => {
    expect(() => store.completeSession('bad-id', 0, 0, [], [])).toThrow()
  })

  it('getAllSessions returns all sessions sorted newest-first', async () => {
    const id1 = store.createSession('/repo/1')
    // Small delay to ensure different startedAt timestamps
    await new Promise((r) => setTimeout(r, 5))
    const id2 = store.createSession('/repo/2')

    const sessions = store.getAllSessions()
    expect(sessions).toHaveLength(2)
    // newest (id2) should come first
    expect(sessions[0].id).toBe(id2)
    expect(sessions[1].id).toBe(id1)
  })

  it('getAllArtifacts aggregates across multiple sessions', () => {
    const id1 = store.createSession('/repo/1')
    const id2 = store.createSession('/repo/2')

    const makeArtifact = (name: string) => ({
      artifactType: 'spec' as const,
      filePath: `/repo/${name}`,
      relativePath: name,
      fileName: name,
      detectedAt: new Date().toISOString(),
    })

    store.completeSession(id1, 5, 0, [makeArtifact('a.spec.yaml')], [])
    store.completeSession(id2, 3, 0, [makeArtifact('b.spec.yaml'), makeArtifact('c.spec.yaml')], [])

    expect(store.getAllArtifacts()).toHaveLength(3)
  })

  it('clear() removes all sessions', () => {
    store.createSession('/repo/1')
    store.createSession('/repo/2')
    store.clear()
    expect(store.getAllSessions()).toHaveLength(0)
  })
})
