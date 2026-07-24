import { existsSync } from 'fs'
import * as path from 'path'
import { execFileSync } from 'child_process'
import type {
  ImpactReport,
  ImpactReportArtifact,
  ImpactReportInput,
  ImpactReportRecommendation,
  RiskLevel,
  FileMetadata,
} from '@nexus-engineering/shared'
import { impactAnalyzer } from '../ai/impactAnalyzer'
import { getGraphDatabase } from '../graphBuilder/graphDatabase'
import { RepositoryParser } from '../parsers/repositoryParser'

/**
 * Raised when a file referenced by the report request does not exist on disk.
 * The API layer maps this to HTTP 404.
 */
export class FileNotFoundError extends Error {
  constructor(public readonly filePath: string) {
    super(`File not found: ${filePath}`)
    this.name = 'FileNotFoundError'
  }
}

/**
 * Produces a structured, human-readable impact report for a set of changed
 * files. It integrates with the existing confidence-scored Impact Analysis
 * (THE-274) by resolving changed files to their traceable artifact ids and
 * aggregating the affected artifacts into requirement/feature/test/ADR buckets.
 */
export class ImpactReportGenerator {
  private readonly parser = new RepositoryParser()
  private readonly rootPath = process.cwd()

  async generate(input: ImpactReportInput): Promise<ImpactReport> {
    const resolvedArtifactIds = await this.resolveArtifactIds(input.fileChanges)

    if (input.artifactIds?.length) {
      for (const id of input.artifactIds) {
        if (!resolvedArtifactIds.includes(id)) resolvedArtifactIds.push(id)
      }
    }

    const artifacts: ImpactReportArtifact[] = []
    if (resolvedArtifactIds.length) {
      const analysis = await impactAnalyzer.analyzeV2({ artifactIds: resolvedArtifactIds })
      for (const a of analysis.artifacts) {
        artifacts.push({
          id: a.id,
          type: a.type,
          title: a.title,
          impactLevel: a.impactLevel,
          relationshipType: a.relationshipType,
          confidence: a.confidence,
          confidenceScore: a.confidenceScore,
          path: a.path,
        })
      }

      // The changed artifacts themselves are part of the impact surface: fold
      // in any resolved scope node that the analyzer excluded (it only reports
      // reachable neighbours, not the change origin).
      const presentIds = new Set(artifacts.map((a) => a.id))
      const db = getGraphDatabase()
      const nodeMap = new Map(db.getGraphNodes().map((n) => [n.id, n]))
      for (const id of resolvedArtifactIds) {
        if (presentIds.has(id)) continue
        const node = nodeMap.get(id)
        if (!node) continue
        artifacts.push({
          id,
          type: node.type,
          title: node.title ?? node.name ?? id,
          impactLevel: 'direct',
          relationshipType: 'changed',
          confidence: 'high',
          confidenceScore: 100,
          path: [id],
        })
      }
    }

    const affectedRequirements = artifacts.filter((a) => a.type === 'requirement')
    const affectedFeatures = artifacts.filter((a) => a.type === 'feature')
    const affectedTests = artifacts.filter((a) => a.type === 'testCase')
    const affectedAdrs = artifacts.filter((a) => a.type === 'architectureModel')

    const scores = artifacts.map((a) => a.confidenceScore)
    const minConfidence = scores.length ? Math.min(...scores) : 0
    const maxConfidence = scores.length ? Math.max(...scores) : 0

    const riskLevel = this.computeRiskLevel(artifacts)
    const recommendations = this.buildRecommendations(
      {
        affectedRequirements,
        affectedTests,
        affectedAdrs,
        directCount: artifacts.filter((a) => a.impactLevel === 'direct').length,
      },
      riskLevel,
    )

    return {
      summary: {
        totalAffected: artifacts.length,
        directCount: artifacts.filter((a) => a.impactLevel === 'direct').length,
        indirectCount: artifacts.filter((a) => a.impactLevel === 'indirect').length,
        transitiveCount: artifacts.filter((a) => a.impactLevel === 'transitive').length,
        requirementCount: affectedRequirements.length,
        featureCount: affectedFeatures.length,
        testCount: affectedTests.length,
        adrCount: affectedAdrs.length,
        minConfidence,
        maxConfidence,
      },
      affectedRequirements,
      affectedFeatures,
      affectedTests,
      affectedAdrs,
      riskLevel,
      recommendations,
      metadata: {
        changedFiles: input.fileChanges,
        resolvedArtifactIds,
        changeDescription: input.changeDescription,
        generatedAt: new Date().toISOString(),
      },
    }
  }

  /**
   * Resolve changed file paths to artifact ids that exist in the traceability
   * graph. Each file is parsed to extract declared trace-link endpoints (real
   * artifact ids); only ids present in the graph are kept. A missing file
   * raises {@link FileNotFoundError}.
   */
  private async resolveArtifactIds(fileChanges: string[]): Promise<string[]> {
    const db = getGraphDatabase()
    const existingIds = new Set(db.getGraphNodes().map((n) => n.id))
    const resolved = new Set<string>()

    for (const file of fileChanges) {
      if (!existsSync(file)) {
        throw new FileNotFoundError(file)
      }

      try {
        const meta: FileMetadata = {
          filePath: file,
          relativePath: path.relative(this.rootPath, file) || file,
          size: 0,
          contentHash: '',
          contentType: 'text',
        }
        const result = await this.parser.parse([meta], this.rootPath)
        for (const doc of result.documents) {
          for (const link of doc.traceLinks ?? []) {
            if (existingIds.has(link.sourceId)) resolved.add(link.sourceId)
            if (existingIds.has(link.targetId)) resolved.add(link.targetId)
          }
        }
      } catch (error) {
        // A single unparseable file must not abort the whole report.
        if (error instanceof FileNotFoundError) throw error
      }
    }

    return [...resolved]
  }

  private computeRiskLevel(artifacts: ImpactReportArtifact[]): RiskLevel {
    const direct = artifacts.filter((a) => a.impactLevel === 'direct').length
    const indirect = artifacts.filter((a) => a.impactLevel === 'indirect').length
    const transitive = artifacts.filter((a) => a.impactLevel === 'transitive').length

    if (artifacts.length === 0) return 'low'

    const score = direct * 3 + indirect * 2 + transitive
    if (score >= 12) return 'critical'
    if (score >= 6) return 'high'
    if (score >= 2) return 'medium'
    return 'low'
  }

  private buildRecommendations(
    ctx: {
      affectedRequirements: ImpactReportArtifact[]
      affectedTests: ImpactReportArtifact[]
      affectedAdrs: ImpactReportArtifact[]
      directCount: number
    },
    riskLevel: RiskLevel,
  ): ImpactReportRecommendation[] {
    const recommendations: ImpactReportRecommendation[] = []
    let n = 0
    const id = () => `R${++n}`

    if (ctx.affectedRequirements.length > 0 && ctx.affectedTests.length === 0) {
      recommendations.push({
        id: id(),
        severity: riskLevel,
        category: 'test',
        message: `No tests are directly impacted by changes touching ${ctx.affectedRequirements.length} requirement(s); add or run regression tests to cover the change.`,
      })
    }

    if (ctx.directCount > 0) {
      recommendations.push({
        id: id(),
        severity: riskLevel,
        category: 'review',
        message: `Review ${ctx.directCount} directly impacted artifact(s) before merging.`,
      })
    }

    if (ctx.affectedAdrs.length > 0) {
      recommendations.push({
        id: id(),
        severity: 'medium',
        category: 'architecture',
        message: `Architecture decision record(s) are impacted — confirm the change does not violate the documented design.`,
      })
    }

    if (recommendations.length === 0) {
      recommendations.push({
        id: id(),
        severity: 'low',
        category: 'coverage',
        message: 'No high-risk artifacts detected; standard verification is sufficient.',
      })
    }

    return recommendations
  }
}

export const impactReportGenerator = new ImpactReportGenerator()

/**
 * Count commits between `base` and `branch` using git. Best-effort: returns 0
 * when git is unavailable or the range is invalid so the report can still be
 * produced.
 */
export function countCommits(base: string, branch: string): number {
  try {
    const out = execFileSync('git', ['rev-list', '--count', `${base}..${branch}`], {
      cwd: process.cwd(),
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 5000,
    })
    const parsed = parseInt(out.trim(), 10)
    return Number.isFinite(parsed) ? parsed : 0
  } catch {
    return 0
  }
}
