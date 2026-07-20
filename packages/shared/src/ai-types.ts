export interface CoverageGap {
  requirementId: string
  requirementTitle: string
  requirementType: string
  traceLinkCount: number
  missingRelationshipTypes: string[]
  risk: 'high' | 'medium' | 'low'
}

export interface CoverageGapReport {
  totalRequirements: number
  totalGaps: number
  gaps: CoverageGap[]
  summary: {
    percentCovered: number
    highRiskCount: number
    mediumRiskCount: number
    lowRiskCount: number
  }
}

export interface ImpactScope {
  artifactIds: string[]
  artifactTypes?: string[]
  changeDescription?: string
}

export interface AffectedArtifact {
  id: string
  type: string
  title: string
  impactLevel: 'direct' | 'indirect' | 'transitive'
  relationshipType: string
  confidence: string
  path: string[]
}

export interface ImpactAnalysis {
  scope: ImpactScope
  artifacts: AffectedArtifact[]
  summary: {
    totalAffected: number
    directCount: number
    indirectCount: number
    transitiveCount: number
  }
}

export interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'custom'
  apiKey: string
  model: string
  baseUrl?: string
  maxTokens?: number
  temperature?: number
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface LLMCompletionRequest {
  messages: LLMMessage[]
  temperature?: number
  maxTokens?: number
}

export interface LLMCompletionResponse {
  content: string
  model: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

export interface TraceabilityQuery {
  nodeId?: string
  nodeType?: string
  relationshipType?: string
  confidence?: string
  includeMetadata?: boolean
  maxDepth?: number
}

// ---------------------------------------------------------------------------
// AI Traceability Phase 2 (Epic C) — enhanced analysis contracts
// ---------------------------------------------------------------------------

export const V_MODEL_AXES = ['requirement', 'feature', 'testCase', 'result'] as const
export type TraceabilityAxis = (typeof V_MODEL_AXES)[number]

export const CONFIDENCE_SCORE: Record<'high' | 'medium' | 'low', number> = {
  high: 1.0,
  medium: 0.7,
  low: 0.4,
}

export interface AxisCoverage {
  axis: TraceabilityAxis
  total: number
  linked: number
  coveragePercent: number
}

export type CrossArtifactGapType =
  | 'missingDownstream'
  | 'missingUpstream'
  | 'orphan'

export interface CrossArtifactGap {
  axis: TraceabilityAxis
  artifactId: string
  artifactTitle?: string
  gapType: CrossArtifactGapType
  detail: string
  severity: 'high' | 'medium' | 'low'
}

export interface DomainCoverage {
  domain: string
  totalArtifacts: number
  coveredArtifacts: number
  coveragePercent: number
  axes: AxisCoverage[]
  gaps: CrossArtifactGap[]
}

export interface CoverageAnalysisReport {
  overallCoveragePercent: number
  axes: AxisCoverage[]
  crossArtifactGaps: CrossArtifactGap[]
  domainCoverage: DomainCoverage[]
  summary: {
    totalArtifacts: number
    totalGaps: number
    highRiskCount: number
    mediumRiskCount: number
    lowRiskCount: number
  }
}

// Impact v2: confidence-scored chains + graph-ready structures
export interface AffectedArtifactV2 extends AffectedArtifact {
  confidenceScore: number
}

export interface ImpactGraphNode {
  id: string
  type: string
  title?: string
  confidenceScore?: number
}

export interface ImpactGraphEdge {
  sourceId: string
  targetId: string
  relationshipType: string
  confidence: string
  confidenceScore: number
}

export interface ImpactGraph {
  nodes: ImpactGraphNode[]
  edges: ImpactGraphEdge[]
}

export interface ImpactChain {
  artifactId: string
  confidenceScore: number
  level: 'direct' | 'indirect' | 'transitive'
  path: string[]
}

export interface ImpactAnalysisV2 {
  scope: ImpactScope
  artifacts: AffectedArtifactV2[]
  impactGraph: ImpactGraph
  chains: ImpactChain[]
  summary: {
    totalAffected: number
    directCount: number
    indirectCount: number
    transitiveCount: number
    minConfidence: number
    maxConfidence: number
  }
}

// ---------------------------------------------------------------------------
// Impact Report Generator (THE-278) — structured, human-readable impact report
// ---------------------------------------------------------------------------

export type RiskLevel = 'critical' | 'high' | 'medium' | 'low'

export interface ImpactReportArtifact {
  id: string
  type: string
  title: string
  impactLevel: 'direct' | 'indirect' | 'transitive'
  relationshipType: string
  confidence: string
  confidenceScore: number
  path: string[]
}

export interface ImpactReportRecommendation {
  id: string
  severity: RiskLevel
  category: 'test' | 'review' | 'architecture' | 'requirements' | 'coverage'
  message: string
}

export interface ImpactReportSummary {
  totalAffected: number
  directCount: number
  indirectCount: number
  transitiveCount: number
  requirementCount: number
  featureCount: number
  testCount: number
  adrCount: number
  minConfidence: number
  maxConfidence: number
}

export interface ImpactReportMetadata {
  changedFiles: string[]
  resolvedArtifactIds: string[]
  changeDescription?: string
  generatedAt: string
}

export interface ImpactReport {
  summary: ImpactReportSummary
  affectedRequirements: ImpactReportArtifact[]
  affectedFeatures: ImpactReportArtifact[]
  affectedTests: ImpactReportArtifact[]
  affectedAdrs: ImpactReportArtifact[]
  riskLevel: RiskLevel
  recommendations: ImpactReportRecommendation[]
  metadata: ImpactReportMetadata
}

export interface ImpactReportInput {
  fileChanges: string[]
  artifactIds?: string[]
  changeDescription?: string
}

// LLM structured outputs + reports
export interface TraceabilityReport {
  generatedAt: string
  format: 'markdown' | 'json'
  content: string
  coverage?: CoverageAnalysisReport
  gaps?: CrossArtifactGap[]
  llmAnalysis?: string
}

import type { TraceLink } from './types'

export interface StructuredLLMResponse {
  analysisType: string
  [key: string]: unknown
}

// ---------------------------------------------------------------------------
// NL Query Parser + API (THE-293) — natural-language trace queries
// ---------------------------------------------------------------------------

export type NLQueryIntent =
  | 'requirement_query'
  | 'feature_query'
  | 'test_query'
  | 'impact_query'
  | 'adr_query'

export interface NLQueryEntityFilters {
  /** Extracted module/domain name (e.g. "auth", "RBAC"). */
  module?: string
  /** Extracted artifact type hint. */
  artifactType?: string
  /** Extracted status keyword: 'untested' | 'linked' | 'orphan' | 'stale'. */
  status?: string
  /** Extracted source file path for impact queries (e.g. "login.ts"). */
  file?: string
}

export interface ParsedNLQuery {
  intent: NLQueryIntent
  entityFilters: NLQueryEntityFilters
  rawQuery: string
}

export interface NLQueryTraceLink {
  targetId: string
  targetType: string
  relationshipType: string
  confidence: string
}

export interface NLQueryResultItem {
  id: string
  type: string
  title?: string
  name?: string
  traceLinks?: NLQueryTraceLink[]
}

export interface NLQueryResult {
  query: ParsedNLQuery
  results: NLQueryResultItem[]
  totalResults: number
  metadata: {
    parsedIntent: NLQueryIntent
    executionTimeMs: number
  }
}

export interface NLQueryRequest {
  query: string
}

export interface NLQueryResponse {
  success: boolean
  data?: NLQueryResult
  error?: string
}

// ---------------------------------------------------------------------------
// Coverage Gap Analyzer + Recommendation Engine (THE-288)
// ---------------------------------------------------------------------------

export type RecommendationType =
  | 'addTestCoverage'
  | 'linkRequirementToFeature'
  | 'linkAdrToImplementation'
  | 'verifyStaleTraceLink'
  | 'removeOrphan'

export type RecommendationSeverity = 'high' | 'medium' | 'low'

/**
 * A confidence-scored auto-fix suggestion for a single gap. `confidence` is the
 * engine's certainty (0..1) that applying `suggestedLink` (or `action`) will
 * resolve the underlying gap.
 */
export interface AutoFixSuggestion {
  action: string
  suggestedLink?: {
    sourceId: string
    targetId: string
    relationshipType: TraceLink['relationshipType']
    confidence: TraceLink['confidence']
  }
  confidence: number
}

export interface TraceRecommendation {
  id: string
  type: RecommendationType
  severity: RecommendationSeverity
  title: string
  description: string
  targetIds: string[]
  /** Engine certainty (0..1) that this recommendation is valid. */
  confidence: number
  autoFix: AutoFixSuggestion
  rationale: string
}

export interface RecommendationQuery {
  severity?: RecommendationSeverity[]
  type?: RecommendationType[]
  limit?: number
  minConfidence?: number
}

export interface RecommendationResponse {
  total: number
  filtered: number
  recommendations: TraceRecommendation[]
  summary: {
    high: number
    medium: number
    low: number
  }
  generatedAt: string
}
