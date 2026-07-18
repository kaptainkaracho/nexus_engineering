// Tests for scanner pagination + large-dataset optimizations (THE-177).
// Run with: pnpm exec vitest run apps/backend/src/routes/scanRoutes.test.ts

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  parsePagination,
  buildPaginationMeta,
  paginate,
  MAX_PAGE_SIZE,
} from '../lib/pagination'
import { ScanMetadataStore } from '../scanners/scanMetadata'
import { RepositoryScanner } from '../scanners/repositoryScanner'
import { DetectedArtifact } from '@nexus-engineering/shared'

// ─── Pagination helper ──────────────────────────────────────────────────────

describe('pagination helper', () => {
  it('applies defaults when no params given', () => {
    expect(parsePagination({})).toEqual({ limit: 100, offset: 0 })
  })

  it('clamps limit to [1, MAX_PAGE_SIZE] and offset to >= 0', () => {
    expect(parsePagination({ limit: '0', offset: '-5' })).toEqual({ limit: 1, offset: 0 })
    expect(parsePagination({ limit: String(MAX_PAGE_SIZE + 500), offset: '10' })).toEqual({
      limit: MAX_PAGE_SIZE,
      offset: 10,
    })
  })

  it('parses string and number values', () => {
    expect(parsePagination({ limit: '50', offset: '20' })).toEqual({ limit: 50, offset: 20 })
    expect(parsePagination({ limit: 25, offset: 5 })).toEqual({ limit: 25, offset: 5 })
  })

  it('rejects non-numeric values', () => {
    expect(() => parsePagination({ limit: 'abc' })).toThrow(/limit/)
    expect(() => parsePagination({ offset: 'xyz' })).toThrow(/offset/)
  })

  it('builds a hasMore envelope', () => {
    expect(buildPaginationMeta(10, 0, 25)).toMatchObject({ limit: 10, offset: 0, total: 25, hasMore: true })
    expect(buildPaginationMeta(10, 20, 25)).toMatchObject({ hasMore: false })
  })

  it('slices arrays in a single pass (no N+1)', () => {
    const items = Array.from({ length: 50 }, (_, i) => i)
    expect(paginate(items, { limit: 10, offset: 20 })).toEqual([20, 21, 22, 23, 24, 25, 26, 27, 28, 29])
  })
})

// ─── ScanMetadataStore paging ───────────────────────────────────────────────

describe('ScanMetadataStore.getArtifactsPage', () => {
  let store: ScanMetadataStore
  beforeEach(() => { store = new ScanMetadataStore() })

  function seed(names: string[]): void {
    const id = store.createSession('/repo')
    const artifacts: DetectedArtifact[] = names.map((n) => ({
      artifactType: 'spec',
      filePath: `/repo/${n}`,
      relativePath: n,
      fileName: n,
      detectedAt: new Date().toISOString(),
    }))
    store.completeSession(id, names.length, 0, artifacts, [])
  }

  it('returns a page and the full total', () => {
    seed(['a.spec.yaml', 'b.spec.yaml', 'c.spec.yaml'])
    const { artifacts, total } = store.getArtifactsPage(2, 0)
    expect(total).toBe(3)
    expect(artifacts.map((a) => a.fileName)).toEqual(['a.spec.yaml', 'b.spec.yaml'])
  })

  it('pages past the first window', () => {
    seed(['a', 'b', 'c', 'd', 'e'])
    const { artifacts, total } = store.getArtifactsPage(2, 3)
    expect(total).toBe(5)
    expect(artifacts.map((a) => a.fileName)).toEqual(['d', 'e'])
  })
})

// ─── Scanner large-dataset optimization ─────────────────────────────────────

describe('RepositoryScanner hash optimization', () => {
  let dir: string
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'nexus-scan-'))
    for (let i = 0; i < 20; i++) {
      writeFileSync(join(dir, `file-${i}.ts`), `export const n = ${i};\n`)
    }
  })
  afterEach(() => rmSync(dir, { recursive: true, force: true }))

  it('skips hashing by default (cheap for large repos)', async () => {
    const scanner = new RepositoryScanner()
    const result = await scanner.scan(dir)
    expect(result.fileMetadata.length).toBe(20)
    expect(result.fileMetadata.every((f) => f.contentHash === '')).toBe(true)
  })

  it('computes hashes only when explicitly requested', async () => {
    const scanner = new RepositoryScanner()
    const result = await scanner.scan(dir, { computeHashes: true })
    expect(result.fileMetadata.length).toBe(20)
    expect(result.fileMetadata.every((f) => f.contentHash.length > 0)).toBe(true)
  })
})
