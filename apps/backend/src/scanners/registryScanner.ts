import type { RegistryProviderType } from '@nexus-engineering/shared'
import { artifactRegistry } from '../artifacts/repository'
import { scanMetadataStore } from './scanMetadata'

export interface RegistryScanResult {
  scanId: string
  registryId: string
  registryType: RegistryProviderType
  packagesFound: number
  artifactsCreated: number
  errors: string[]
  scanTimeMs: number
}

export interface RegistryScannerConfig {
  registryId: string
  registryType: RegistryProviderType
  url: string
  authHeader?: string
}

export class RegistryScanner {
  async scanRegistry(config: RegistryScannerConfig): Promise<RegistryScanResult> {
    const startTime = Date.now()
    const scanId = scanMetadataStore.createSession(config.url || config.registryId)
    const errors: string[] = []

    let packages: string[] = []

    try {
      switch (config.registryType) {
        case 'npm':
          packages = await this.scanNpmRegistry(config)
          break
        case 'pypi':
          packages = await this.scanPyPIRegistry(config)
          break
        case 'maven':
          packages = await this.scanMavenRegistry(config)
          break
        default:
          packages = await this.scanGenericRegistry(config)
      }
    } catch (error) {
      const msg = (error as Error).message
      errors.push(msg)
      scanMetadataStore.failSession(scanId, msg)
      return {
        scanId,
        registryId: config.registryId,
        registryType: config.registryType,
        packagesFound: 0,
        artifactsCreated: 0,
        errors,
        scanTimeMs: Date.now() - startTime,
      }
    }

    let artifactsCreated = 0
    for (const pkg of packages) {
      try {
        artifactRegistry.create({
          type: 'unknown',
          filePath: `${config.registryType}://${pkg}`,
          repositoryPath: config.url,
          lifecycle: 'discovered',
          metadata: {
            source: 'registry-scan',
            registryId: config.registryId,
            registryType: config.registryType,
            packageName: pkg,
          },
          errors: [],
          reparseCount: 0,
          registryType: config.registryType,
          registryId: config.registryId,
        })
        artifactsCreated++
      } catch {
        errors.push(`Failed to create artifact for package: ${pkg}`)
      }
    }

    const totalFiles = packages.length
    scanMetadataStore.completeSession(scanId, totalFiles, 0, [], errors.map(e => ({ path: '', message: e })))

    return {
      scanId,
      registryId: config.registryId,
      registryType: config.registryType,
      packagesFound: packages.length,
      artifactsCreated,
      errors,
      scanTimeMs: Date.now() - startTime,
    }
  }

  private async fetchRegistry(url: string, authHeader?: string): Promise<Response> {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    }
    if (authHeader) {
      headers['Authorization'] = authHeader
    }
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    try {
      return await fetch(url, { headers, signal: controller.signal })
    } finally {
      clearTimeout(timeout)
    }
  }

  private async scanNpmRegistry(config: RegistryScannerConfig): Promise<string[]> {
    const baseUrl = config.url.replace(/\/+$/, '')
    const response = await this.fetchRegistry(`${baseUrl}/-/all`, config.authHeader)

    if (!response.ok) {
      throw new Error(`npm registry returned ${response.status}: ${response.statusText}`)
    }

    const data = await response.json() as Record<string, unknown>
    // The npm all endpoint returns an object with package names as keys
    return Object.keys(data).filter(k => k !== '_updated' && !k.startsWith('_'))
  }

  private async scanPyPIRegistry(config: RegistryScannerConfig): Promise<string[]> {
    const baseUrl = config.url.replace(/\/+$/, '')
    const response = await this.fetchRegistry(`${baseUrl}/simple/`, config.authHeader)

    if (!response.ok) {
      throw new Error(`PyPI registry returned ${response.status}: ${response.statusText}`)
    }

    const html = await response.text()
    // Parse package names from HTML anchors
    const pkgRegex = /<a\s[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/gi
    const packages: string[] = []
    let match: RegExpExecArray | null
    while ((match = pkgRegex.exec(html)) !== null) {
      const name = (match[2] || match[1]).trim()
      if (name && !name.startsWith('/') && !name.startsWith('..')) {
        packages.push(name.replace(/\/$/, ''))
      }
    }
    return [...new Set(packages)]
  }

  private async scanMavenRegistry(config: RegistryScannerConfig): Promise<string[]> {
    const baseUrl = config.url.replace(/\/+$/, '')
    const response = await this.fetchRegistry(`${baseUrl}/maven-metadata.xml`, config.authHeader)

    if (!response.ok) {
      throw new Error(`Maven registry returned ${response.status}: ${response.statusText}`)
    }

    const xml = await response.text()
    // Parse groupId/artifactId from Maven metadata
    const idRegex = /<groupId>([^<]+)<\/groupId>[\s\S]*?<artifactId>([^<]+)<\/artifactId>/g
    const packages: string[] = []
    let match: RegExpExecArray | null
    while ((match = idRegex.exec(xml)) !== null) {
      packages.push(`${match[1]}:${match[2]}`)
    }

    if (packages.length === 0) {
      // If no metadata.xml, try listing the top-level directory
      packages.push(`${baseUrl} (maven repository)`)
    }

    return packages
  }

  private async scanGenericRegistry(config: RegistryScannerConfig): Promise<string[]> {
    const baseUrl = config.url.replace(/\/+$/, '')
    const response = await this.fetchRegistry(baseUrl, config.authHeader)

    if (response.ok) {
      const text = await response.text()
      const lines = text.split('\n').filter(l => l.trim().length > 0 && !l.trim().startsWith('#'))
      if (lines.length > 0) return lines.slice(0, 1000)
    }

    return [`${baseUrl} (generic registry)`]
  }
}

export const registryScanner = new RegistryScanner()
