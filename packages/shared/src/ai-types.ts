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
