import type { CoverageGap, CoverageGapReport } from '@nexus-engineering/shared'
import { traceLinkRepository } from '../traceabilityLinks/repository'
import { getLLMClient } from './llmClient'
import { buildCoverageGapPrompt } from './promptTemplates'

interface RequirementSummary {
  id: string
  title: string
  type: string
}

const VALID_RELATIONSHIP_TYPES = ['satisfies', 'verifies', 'tracesTo', 'dependsOn', 'refines', 'conflictsWith']

export class CoverageGapDetector {
  async detectGaps(): Promise<CoverageGapReport> {
    try {
      const traceLinks = await traceLinkRepository.listTraceLinks()
      const requirements = this.extractRequirements(traceLinks)
      const gaps = this.computeGaps(requirements, traceLinks)

      const totalRequirements = requirements.length
      const totalGaps = gaps.length
      const percentCovered = totalRequirements > 0
        ? Math.round(((totalRequirements - totalGaps) / totalRequirements) * 100)
        : 100

      const highRiskCount = gaps.filter(g => g.risk === 'high').length
      const mediumRiskCount = gaps.filter(g => g.risk === 'medium').length
      const lowRiskCount = gaps.filter(g => g.risk === 'low').length

      return {
        totalRequirements,
        totalGaps,
        gaps,
        summary: {
          percentCovered,
          highRiskCount,
          mediumRiskCount,
          lowRiskCount,
        },
      }
    } catch (error) {
      throw error
    }
  }

  async detectGapsWithLLM(): Promise<CoverageGapReport> {
    const baseReport = await this.detectGaps()
    const llmClient = getLLMClient()

    if (!llmClient.isConfigured()) {
      return baseReport
    }

    try {
      const requirements = baseReport.gaps.map(g => ({
        id: g.requirementId,
        title: g.requirementTitle,
        type: g.requirementType,
      }))

      const traceLinks = await traceLinkRepository.listTraceLinks()
      const linkSummary = traceLinks.map(l => ({
        sourceId: l.sourceId,
        targetId: l.targetId,
        relationshipType: l.relationshipType,
      }))

      const messages = buildCoverageGapPrompt({
        requirements,
        traceLinks: linkSummary,
        validRelationshipTypes: VALID_RELATIONSHIP_TYPES,
      })

      const response = await llmClient.complete({ messages })

      return {
        ...baseReport,
        _llmAnalysis: response.content,
      } as CoverageGapReport & { _llmAnalysis: string }
    } catch {
      return baseReport
    }
  }

  private extractRequirements(traceLinks: Array<{ sourceId: string; sourceType: string; description?: string }>): RequirementSummary[] {
    const reqMap = new Map<string, RequirementSummary>()

    for (const link of traceLinks) {
      if (link.sourceType === 'requirement' && !reqMap.has(link.sourceId)) {
        reqMap.set(link.sourceId, {
          id: link.sourceId,
          title: link.description || link.sourceId,
          type: link.sourceType,
        })
      }
    }

    return Array.from(reqMap.values())
  }

  private computeGaps(
    requirements: RequirementSummary[],
    traceLinks: Array<{ sourceId: string; relationshipType: string; confidence: string }>
  ): CoverageGap[] {
    const linkCounts = new Map<string, { count: number; relationships: Set<string> }>()

    for (const link of traceLinks) {
      if (!linkCounts.has(link.sourceId)) {
        linkCounts.set(link.sourceId, { count: 0, relationships: new Set() })
      }
      const entry = linkCounts.get(link.sourceId)!
      entry.count++
      entry.relationships.add(link.relationshipType)
    }

    const gaps: CoverageGap[] = []

    for (const req of requirements) {
      const linkData = linkCounts.get(req.id)

      if (!linkData || linkData.count === 0) {
        gaps.push({
          requirementId: req.id,
          requirementTitle: req.title,
          requirementType: req.type,
          traceLinkCount: 0,
          missingRelationshipTypes: [...VALID_RELATIONSHIP_TYPES],
          risk: 'high',
        })
        continue
      }

      const missingTypes = VALID_RELATIONSHIP_TYPES.filter(
        t => !linkData.relationships.has(t)
      )

      if (missingTypes.length > 0) {
        const hasVerifiesOrTracesTo = linkData.relationships.has('verifies') ||
          linkData.relationships.has('tracesTo')
        const risk = !hasVerifiesOrTracesTo ? 'high' as const
          : missingTypes.length > 2 ? 'medium' as const
          : 'low' as const

        gaps.push({
          requirementId: req.id,
          requirementTitle: req.title,
          requirementType: req.type,
          traceLinkCount: linkData.count,
          missingRelationshipTypes: missingTypes,
          risk,
        })
      }
    }

    return gaps
  }
}

export const coverageGapDetector = new CoverageGapDetector()
