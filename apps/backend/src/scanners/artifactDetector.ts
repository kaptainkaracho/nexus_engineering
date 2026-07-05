// Artifact Detector
// Pattern-based detection for engineering artifact files

import { DetectedArtifact, FileMetadata } from '@nexus-engineering/shared'

/**
 * Artifact detection patterns — ordered most-specific first so an
 * ADR file is never ambiguously classified as a generic requirement.
 */
const ARTIFACT_PATTERNS: Array<{
  artifactType: DetectedArtifact['artifactType']
  test: (fileName: string) => boolean
}> = [
  {
    artifactType: 'adr',
    // ADR-*.md  (e.g. ADR-001-use-postgres.md)
    test: (name) => /^ADR-.+\.md$/i.test(name),
  },
  {
    artifactType: 'requirement',
    // *.req.yaml
    test: (name) => name.endsWith('.req.yaml'),
  },
  {
    artifactType: 'architecture',
    // *.arch.yaml
    test: (name) => name.endsWith('.arch.yaml'),
  },
  {
    artifactType: 'spec',
    // *.spec.yaml
    test: (name) => name.endsWith('.spec.yaml'),
  },
]

export class ArtifactDetector {
  /**
   * Detect engineering artifacts from a list of scanned file metadata.
   * Returns a `DetectedArtifact` for every file that matches a known pattern.
   */
  detect(files: FileMetadata[]): DetectedArtifact[] {
    const detectedAt = new Date().toISOString()
    const artifacts: DetectedArtifact[] = []

    for (const file of files) {
      const fileName = this.basename(file.filePath)
      const pattern = ARTIFACT_PATTERNS.find((p) => p.test(fileName))

      if (pattern) {
        artifacts.push({
          artifactType: pattern.artifactType,
          filePath: file.filePath,
          relativePath: file.relativePath,
          fileName,
          detectedAt,
        })
      }
    }

    return artifacts
  }

  /**
   * Detect artifacts from a single file path (used in unit tests / ad-hoc checks).
   */
  detectSingle(filePath: string, relativePath: string): DetectedArtifact | null {
    const fileName = this.basename(filePath)
    const pattern = ARTIFACT_PATTERNS.find((p) => p.test(fileName))
    if (!pattern) return null

    return {
      artifactType: pattern.artifactType,
      filePath,
      relativePath,
      fileName,
      detectedAt: new Date().toISOString(),
    }
  }

  private basename(filePath: string): string {
    return filePath.split('/').pop() ?? filePath
  }
}

export const artifactDetector = new ArtifactDetector()
