import { describe, it, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { ValidatedFeatureLoader } from './loader'
import { featureDocSchema } from './schema'
import Ajv from 'ajv'

const __dirname = dirname(fileURLToPath(import.meta.url))
const examplesDir = join(__dirname, 'examples')

describe('FeatureLoader', () => {
  it('finds .feature.yaml files recursively', async () => {
    const loader = new ValidatedFeatureLoader()
    const files = await loader.findFeatureFiles(examplesDir)
    expect(files.some((f) => f.endsWith('checkout.feature.yaml'))).toBe(true)
  })

  it('loads and validates the sample document', async () => {
    const loader = new ValidatedFeatureLoader()
    const result = await loader.loadWithValidation(join(examplesDir, 'checkout.feature.yaml'))
    expect(result.document).not.toBeNull()
    expect(result.document?.nexus.schema).toBe('feature-doc/v1')
    expect(result.document?.features.length).toBeGreaterThan(0)
    expect(result.errors.size).toBe(0)
  })

  it('collects violation entries from validation', async () => {
    const loader = new ValidatedFeatureLoader()
    const result = await loader.loadWithValidation(join(examplesDir, 'checkout.feature.yaml'))
    expect(Array.isArray(result.violations)).toBe(true)
  })

  it('loadAllWithValidation returns one result per file', async () => {
    const loader = new ValidatedFeatureLoader()
    const results = await loader.loadAllWithValidation(examplesDir)
    expect(results.length).toBeGreaterThanOrEqual(1)
  })

  it('throws when no files found in empty dir', async () => {
    const loader = new ValidatedFeatureLoader()
    await expect(loader.loadAllWithValidation(join(__dirname, 'nonexistent'))).rejects.toThrow()
  })

  it('schema rejects an empty document', () => {
    const validate = new Ajv().compile(featureDocSchema)
    expect(validate({})).toBe(false)
  })
})
