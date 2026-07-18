import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { promises as fs } from 'fs'
import os from 'os'
import path from 'path'
import { validateRequirements, findRequirementFiles } from './validate-requirements.js'

let tmpDir: string

const VALID_DOC = `nexus:
  schema: req-doc/v1
  metadata:
    domain: Test
    version: 1.0.0
    source: valid.req.yaml
requirements:
  - id: REQ-TEST-001
    type: functional
    title: Valid requirement
    description: Must work correctly
    priority: high
    status: approved
`

const INVALID_DOC = `nexus:
  schema: req-doc/v1
  metadata:
    domain: Test
    version: 1.0.0
    source: invalid.req.yaml
requirements:
  - id: REQ-TEST-002
    type: not-a-real-type
    title: Bad requirement
    description: Missing priority and status
`

const ORPHAN_DOC = `nexus:
  schema: req-doc/v1
  metadata:
    domain: Orphan
    version: 1.0.0
    source: orphan.req.yaml
    documentId: ORPHAN-DOC-001
requirements:
  - id: REQ-ORPHAN-001
    type: functional
    title: Links to a ghost
    description: References a requirement that does not exist on disk
    priority: high
    status: approved
    traceLinks:
      - type: tracesTo
        target:
          id: REQ-GHOST-999
          documentId: ORPHAN-DOC-999
`

beforeAll(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'req-validate-'))
  await fs.writeFile(path.join(tmpDir, 'valid.req.yaml'), VALID_DOC)
  await fs.writeFile(path.join(tmpDir, 'invalid.req.yaml'), INVALID_DOC)
  await fs.mkdir(path.join(tmpDir, 'nested'))
  await fs.writeFile(path.join(tmpDir, 'nested', 'deep.req.yaml'), VALID_DOC)
})

afterAll(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true })
})

describe('findRequirementFiles', () => {
  it('recursively finds .req.yaml files', async () => {
    const files = await findRequirementFiles(tmpDir)
    expect(files.length).toBe(3)
    expect(files.every((f) => f.endsWith('.req.yaml'))).toBe(true)
  })

  it('returns a single file when given a file path', async () => {
    const files = await findRequirementFiles(path.join(tmpDir, 'valid.req.yaml'))
    expect(files).toEqual([path.join(tmpDir, 'valid.req.yaml')])
  })
})

describe('validateRequirements', () => {
  it('passes valid documents and fails invalid ones', async () => {
    const results = await validateRequirements(tmpDir)
    expect(results.length).toBe(3)

    const valid = results.find((r) => path.basename(r.filePath) === 'valid.req.yaml')
    const invalid = results.find((r) => path.basename(r.filePath) === 'invalid.req.yaml')

    expect(valid?.valid).toBe(true)
    expect(valid?.errors.length).toBe(0)

    expect(invalid?.valid).toBe(false)
    expect(invalid?.errors.length).toBeGreaterThan(0)
  })

  it('flags orphaned trace links (target id missing on filesystem)', async () => {
    const orphanDir = await fs.mkdtemp(path.join(os.tmpdir(), 'req-orphan-'))
    try {
      await fs.writeFile(path.join(orphanDir, 'orphan.req.yaml'), ORPHAN_DOC)
      const results = await validateRequirements(orphanDir)
      const orphan = results.find((r) => path.basename(r.filePath) === 'orphan.req.yaml')
      expect(orphan?.valid).toBe(false)
      expect(orphan?.errors.some((e) => /orphaned/i.test(e))).toBe(true)
    } finally {
      await fs.rm(orphanDir, { recursive: true, force: true })
    }
  })

  it('returns empty results for an empty directory', async () => {
    const empty = await fs.mkdtemp(path.join(os.tmpdir(), 'req-empty-'))
    try {
      const results = await validateRequirements(empty)
      expect(results.length).toBe(0)
    } finally {
      await fs.rm(empty, { recursive: true, force: true })
    }
  })
})

describe('integration: shipped sample requirements', () => {
  it('validates the sample .req.yaml files clean', async () => {
    const results = await validateRequirements(
      path.join(process.cwd(), 'packages/shared/requirements'),
    )
    const failed = results.filter((r) => !r.valid)
    expect(failed).toEqual([])
  })
})
