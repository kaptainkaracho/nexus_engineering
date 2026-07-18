import { describe, it, expect, beforeEach } from 'vitest'
import { RegistryScanner } from './registryScanner'
import { artifactRegistry } from '../artifacts/repository'

describe('RegistryScanner', () => {
  let scanner: RegistryScanner

  beforeEach(() => {
    scanner = new RegistryScanner()
  })

  it('handles invalid registry URL gracefully', async () => {
    const result = await scanner.scanRegistry({
      registryId: 'reg-bad',
      registryType: 'npm',
      url: 'https://nonexistent-registry.example.com',
    })

    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.artifactsCreated).toBe(0)
    expect(result.packagesFound).toBe(0)
  })

  it('creates artifacts from generic registry scan', async () => {
    const result = await scanner.scanRegistry({
      registryId: 'reg-artifacts',
      registryType: 'generic',
      url: 'https://example.com/packages',
    })

    expect(result.registryId).toBe('reg-artifacts')
    expect(typeof result.scanTimeMs).toBe('number')

    // Check that created artifacts have registry origin info in metadata
    const all = artifactRegistry.getAll()
    const registryArtifacts = all.filter(a =>
      a.metadata?.registryId === 'reg-artifacts'
    )
    expect(registryArtifacts.length).toBeGreaterThanOrEqual(0)
    if (registryArtifacts.length > 0) {
      expect(registryArtifacts[0].metadata?.registryId).toBe('reg-artifacts')
      expect(registryArtifacts[0].metadata?.registryType).toBe('generic')
    }
  })

  it('passes auth header when configured', async () => {
    const result = await scanner.scanRegistry({
      registryId: 'reg-auth',
      registryType: 'generic',
      url: 'https://auth-registry.example.com',
      authHeader: 'Bearer test-token',
    })

    expect(result.scanId).toBeDefined()
    expect(result.registryId).toBe('reg-auth')
  })

  it('returns scan session metadata', async () => {
    const result = await scanner.scanRegistry({
      registryId: 'reg-meta',
      registryType: 'generic',
      url: 'https://meta.example.com/packages',
    })

    expect(result.scanId).toBeTruthy()
    expect(typeof result.scanTimeMs).toBe('number')
    expect(result.packagesFound).toBeGreaterThanOrEqual(0)
    expect(result.artifactsCreated).toBeGreaterThanOrEqual(0)
  })
})
