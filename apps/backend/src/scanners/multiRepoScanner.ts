import { RepositoryScanner } from './repositoryScanner'
import { repositoryScanner } from './repositoryScanner'
import { multiScanMetadataStore } from './multiScanMetadata'
import { scanMetadataStore } from './scanMetadata'
import { ArtifactRegistry } from '../artifacts/repository'
import { ScanOptions, MultiRepoScanResult } from '@nexus-engineering/shared'

export class MultiRepoScanner {
  async scanMultiple(
    repositoryPaths: string[],
    options: { scanMode?: 'parallel' | 'sequential'; scanOptions?: ScanOptions } = {},
  ): Promise<{ sessionId: string; result: MultiRepoScanResult }> {
    const scanMode = options.scanMode ?? 'parallel'
    const scanOptions = options.scanOptions ?? {}
    const startTime = Date.now()

    const sessionId = multiScanMetadataStore.createSession(repositoryPaths, scanMode)

    const scans: MultiRepoScanResult['scans'] = []
    const errors: MultiRepoScanResult['errors'] = []
    let totalFilesFound = 0
    let totalArtifactsDetected = 0

    if (scanMode === 'parallel') {
      const results = await Promise.allSettled(
        repositoryPaths.map((path, index) =>
          this.scanSingleRepo(sessionId, path, index, scanOptions),
        ),
      )

      for (let i = 0; i < results.length; i++) {
        const r = results[i]
        const path = repositoryPaths[i]
        if (r.status === 'fulfilled') {
          scans.push(r.value)
          totalFilesFound += r.value.filesFound
          totalArtifactsDetected += r.value.artifactsDetected
        } else {
          const errorMsg = (r.reason as Error)?.message ?? 'Unknown error'
          multiScanMetadataStore.markRepoFailed(sessionId, i, errorMsg)
          scans.push({
            repositoryPath: path,
            scanId: '',
            status: 'failed',
            filesFound: 0,
            artifactsDetected: 0,
            scanReport: { filesFound: 0, bytesScanned: 0, scanTimeMs: 0, errors: [] },
            error: errorMsg,
          })
          errors.push({ path, message: errorMsg })
        }
      }
    } else {
      for (let i = 0; i < repositoryPaths.length; i++) {
        try {
          const scanResult = await this.scanSingleRepo(sessionId, repositoryPaths[i], i, scanOptions)
          scans.push(scanResult)
          totalFilesFound += scanResult.filesFound
          totalArtifactsDetected += scanResult.artifactsDetected
        } catch (err) {
          const errorMsg = (err as Error)?.message ?? 'Unknown error'
          multiScanMetadataStore.markRepoFailed(sessionId, i, errorMsg)
          scans.push({
            repositoryPath: repositoryPaths[i],
            scanId: '',
            status: 'failed',
            filesFound: 0,
            artifactsDetected: 0,
            scanReport: { filesFound: 0, bytesScanned: 0, scanTimeMs: 0, errors: [] },
            error: errorMsg,
          })
          errors.push({ path: repositoryPaths[i], message: errorMsg })
        }
      }
    }

    const hasFailures = scans.some((s) => s.status === 'failed')
    if (hasFailures) {
      multiScanMetadataStore.completeSession(sessionId)
    } else {
      multiScanMetadataStore.completeSession(sessionId)
    }

    const scanTimeMs = Date.now() - startTime

    return {
      sessionId,
      result: {
        sessionId,
        scans,
        totalFilesFound,
        totalArtifactsDetected,
        scanTimeMs,
        errors,
      },
    }
  }

  private async scanSingleRepo(
    sessionId: string,
    repoPath: string,
    repoIndex: number,
    scanOptions: ScanOptions,
  ): Promise<MultiRepoScanResult['scans'][0]> {
    const scanner = new RepositoryScanner()
    const result = await scanner.scan(repoPath, scanOptions)

    multiScanMetadataStore.registerScanId(sessionId, repoIndex, result.scanId)
    multiScanMetadataStore.markRepoCompleted(
      sessionId,
      repoIndex,
      result.fileMetadata.length,
      result.artifacts.length,
    )

    return {
      repositoryPath: repoPath,
      scanId: result.scanId,
      status: 'completed',
      filesFound: result.fileMetadata.length,
      artifactsDetected: result.artifacts.length,
      scanReport: result.scanReport,
    }
  }
}

export const multiRepoScanner = new MultiRepoScanner()
