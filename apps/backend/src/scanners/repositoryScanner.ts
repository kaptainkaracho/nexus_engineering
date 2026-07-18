// Repository Scanner Implementation
// Implements file system scanning for engineering artifacts

import { FileMetadata, ScanOptions, ScanReport, ScanResult, RepositoryReader, FileEntry } from '@nexus-engineering/shared'
import { artifactDetector } from './artifactDetector'
import { scanMetadataStore } from './scanMetadata'
import { ArtifactRegistry } from '../artifacts/repository'

export class RepositoryScanner implements RepositoryReader {
  async scan(rootPath: string, options: ScanOptions = {}): Promise<ScanResult> {
    const startTime = Date.now()
    const scanReport: ScanReport = {
      filesFound: 0,
      bytesScanned: 0,
      scanTimeMs: 0,
      errors: [],
    }

    const fileMetadata: FileMetadata[] = []
    const ignorePatterns = options.ignorePatterns || this.getDefaultIgnorePatterns()
    const maxFileSize = options.maxFileSize || 10 * 1024 * 1024
    const minFileSize = options.minFileSize || 0
    const depthLimit = options.depthLimit || null

    const scanId = scanMetadataStore.createSession(rootPath)

    try {
      await this.scanDirectory(
        rootPath,
        ignorePatterns,
        fileMetadata,
        scanReport,
        maxFileSize,
        minFileSize,
        depthLimit,
        0,
      )
    } catch (error) {
      scanReport.errors.push({ path: rootPath, error: error as Error })
      scanMetadataStore.failSession(scanId, (error as Error).message)
      scanReport.scanTimeMs = Date.now() - startTime
      return { scanId, fileMetadata, scanReport, artifacts: [] }
    }

    scanReport.scanTimeMs = Date.now() - startTime
    scanReport.filesFound = fileMetadata.length

    const artifacts = artifactDetector.detect(fileMetadata)

    scanMetadataStore.completeSession(
      scanId,
      fileMetadata.length,
      0,
      artifacts,
      scanReport.errors.map((e) => ({ path: e.path, message: e.error.message })),
    )

    // Write artifacts to persistent registry so they flow through lifecycle tracking
    // Use try-catch to prevent scan failures from breaking detection
    try {
      const artifactRegistry = new ArtifactRegistry()
      for (const art of artifacts) {
        artifactRegistry.createFromDetected(art, rootPath)
      }
    } catch (err) {
      console.error(`[Scanner] Failed to persist artifacts to registry: ${err}`)
    }

    return { scanId, fileMetadata, scanReport, artifacts }
  }

  async getFileMetadata(filePath: string): Promise<FileMetadata | null> {
    try {
      const fs = await import('node:fs/promises')
      const path = await import('node:path')
      const stats = await fs.stat(filePath)
      const relativePath = path.relative(process.cwd(), filePath)
      const contentHash = await this.calculateFileHash(filePath)
      const contentType = stats.isFile() ? 'text' : 'binary'

      return {
        filePath,
        relativePath,
        size: stats.size,
        contentHash,
        contentType,
      }
    } catch (error) {
      console.error(`Error getting metadata for file ${filePath}:`, error)
      return null
    }
  }

  async *streamFiles(
    patterns: string[],
    rootPath: string = process.cwd(),
  ): AsyncIterable<FileEntry> {
    const { glob } = await import('glob')
    const path = await import('node:path')
    const fs = await import('node:fs/promises')

    for (const pattern of patterns) {
      const files = await glob.promise(pattern, {
        cwd: rootPath,
        nodir: true,
        ignore: ['.git/**', 'node_modules/**', '.next/**', 'dist/**', 'coverage/**'],
      })

      for (const file of files) {
        const filePath = path.join(rootPath, file)
        const stats = await fs.stat(filePath)
        const relativePath = path.relative(rootPath, filePath)

        yield {
          filePath,
          relativePath,
          contentType: stats.isFile() ? 'text' : 'binary',
        }
      }
    }
  }

  private async scanDirectory(
    directory: string,
    ignorePatterns: string[],
    fileMetadata: FileMetadata[],
    scanReport: ScanReport,
    maxFileSize: number,
    minFileSize: number,
    depthLimit: number | null,
    currentDepth: number,
  ): Promise<void> {
    if (depthLimit !== null && currentDepth >= depthLimit) {
      return
    }

    try {
      const fs = await import('node:fs/promises')
      const path = await import('node:path')
      const entries = await fs.readdir(directory, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = path.join(directory, entry.name)

        if (ignorePatterns.includes(entry.name)) {
          continue
        }

        if (entry.isDirectory()) {
          await this.scanDirectory(
            fullPath,
            ignorePatterns,
            fileMetadata,
            scanReport,
            maxFileSize,
            minFileSize,
            depthLimit,
            currentDepth + 1,
          )
        } else if (entry.isFile() && !entry.name.startsWith('.')) {
          const metadata = await this.getFileMetadata(fullPath)
          if (metadata) {
            if (metadata.size >= minFileSize && metadata.size <= maxFileSize) {
              fileMetadata.push(metadata)
              scanReport.bytesScanned += metadata.size
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${directory}:`, error)
      throw error
    }
  }

  private async calculateFileHash(filePath: string): Promise<string> {
    const crypto = await import('node:crypto')
    const fs = await import('node:fs')

    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256')
      const stream = fs.createReadStream(filePath)

      stream
        .on('data', (chunk) => hash.update(chunk))
        .on('end', () => resolve(hash.digest('hex')))
        .on('error', reject)
    })
  }

  private getDefaultIgnorePatterns(): string[] {
    return ['.git', 'node_modules', '.next', 'dist', 'coverage', 'build', 'target']
  }
}

export const repositoryScanner = new RepositoryScanner()