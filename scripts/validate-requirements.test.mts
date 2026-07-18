import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { promises as fs } from 'fs'
import os from 'os'
import path from 'path'
import { validateRequirements, findRequirementFiles } from './validate-requirements.mts'

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
