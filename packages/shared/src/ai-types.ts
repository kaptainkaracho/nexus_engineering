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

// LLM structured outputs + reports
export interface TraceabilityReport {
  generatedAt: string
  format: 'markdown' | 'json'
  content: string
  coverage?: CoverageAnalysisReport
  gaps?: CrossArtifactGap[]
  llmAnalysis?: string
}

export interface StructuredLLMResponse {
  analysisType: string
  [key: string]: unknown
}
