import { LLMConfig, LLMMessage, LLMCompletionRequest, LLMCompletionResponse } from '@nexus-engineering/shared'
import { getLLMCache, LLMCache } from './llmCache'

const DEFAULT_MAX_TOKENS = 2048
const DEFAULT_TEMPERATURE = 0.3

export class LLMClient {
  private config: LLMConfig

  constructor(config?: Partial<LLMConfig>) {
    this.config = {
      provider: (config?.provider as LLMConfig['provider']) || 'openai',
      apiKey: config?.apiKey || process.env.LLM_API_KEY || '',
      model: config?.model || process.env.LLM_MODEL || 'gpt-4o-mini',
      baseUrl: config?.baseUrl || process.env.LLM_BASE_URL || 'https://api.openai.com/v1',
      maxTokens: config?.maxTokens || DEFAULT_MAX_TOKENS,
      temperature: config?.temperature ?? DEFAULT_TEMPERATURE,
    }
  }

  getConfig(): LLMConfig {
    return { ...this.config }
  }

  isConfigured(): boolean {
    return !!this.config.apiKey
  }

  async complete(request: LLMCompletionRequest): Promise<LLMCompletionResponse> {
    if (!this.isConfigured()) {
      return this.mockCompletion(request)
    }

    return this.callLLM(request)
  }

  /**
   * Cached completion. Returns a memoized response if an identical request was
   * seen within the TTL window, otherwise performs the call and stores it.
   */
  async completeCached(
    request: LLMCompletionRequest,
    cache?: LLMCache,
    ttlMs?: number
  ): Promise<LLMCompletionResponse> {
    const cacheLayer = cache ?? getLLMCache()

    if (!this.isConfigured()) {
      return this.mockCompletion(request)
    }

    const cached = cacheLayer.get(request)
    if (cached) {
      return { ...cached, model: `${cached.model} (cached)` }
    }

    const response = await this.callLLM(request)
    cacheLayer.set(request, response, ttlMs)
    return response
  }

  private async callLLM(request: LLMCompletionRequest): Promise<LLMCompletionResponse> {
    const apiKey = this.config.apiKey
    const baseUrl = this.config.baseUrl

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: request.messages,
        max_tokens: request.maxTokens ?? this.config.maxTokens ?? DEFAULT_MAX_TOKENS,
        temperature: request.temperature ?? this.config.temperature ?? DEFAULT_TEMPERATURE,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`LLM API error (${response.status}): ${errorText}`)
    }

    const data = await response.json() as {
      choices: Array<{ message: { content: string } }>
      model: string
      usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number }
    }

    return {
      content: data.choices[0]?.message?.content || '',
      model: data.model,
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      },
    }
  }

  private async mockCompletion(request: LLMCompletionRequest): Promise<LLMCompletionResponse> {
    const lastMessage = request.messages[request.messages.length - 1]?.content || ''

    const tracePattern = /analyze traceability/i.test(lastMessage)
    const gapPattern = /coverage gap|missing trace|untested requirement/i.test(lastMessage)
    const impactPattern = /impact analysis|change impact|affected artifact/i.test(lastMessage)

    let content = ''

    if (tracePattern) {
      content = this.mockTraceabilityAnalysis(lastMessage)
    } else if (gapPattern) {
      content = this.mockGapAnalysis(lastMessage)
    } else if (impactPattern) {
      content = this.mockImpactAnalysis(lastMessage)
    } else {
      content = JSON.stringify({
        summary: 'Mock LLM response - no analysis type detected',
        confidence: 'low',
        suggestion: 'Provide a more specific traceability analysis request',
      })
    }

    return {
      content,
      model: `${this.config.model} (mock)`,
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
    }
  }

  private mockTraceabilityAnalysis(input: string): string {
    return JSON.stringify({
      analysisType: 'traceability_analysis',
      detectedRelationships: [
        { source: 'REQ-001', target: 'ARCH-001', type: 'satisfies', confidence: 'high' },
        { source: 'REQ-002', target: 'TEST-001', type: 'verifies', confidence: 'medium' },
      ],
      summary: 'Mock traceability analysis - LLM API key not configured',
    })
  }

  private mockGapAnalysis(input: string): string {
    return JSON.stringify({
      analysisType: 'gap_analysis',
      gaps: [
        { requirementId: 'REQ-003', missingLink: 'verifies', risk: 'high' },
        { requirementId: 'REQ-005', missingLink: 'tracesTo', risk: 'medium' },
      ],
      summary: 'Mock gap analysis - LLM API key not configured',
    })
  }

  private mockImpactAnalysis(input: string): string {
    return JSON.stringify({
      analysisType: 'impact_analysis',
      impactedArtifacts: [
        { artifactId: 'REQ-001', impactLevel: 'direct', affectedNodes: ['ARCH-001', 'TEST-001'] },
        { artifactId: 'COMP-003', impactLevel: 'indirect', affectedNodes: ['REQ-002'] },
      ],
      summary: 'Mock impact analysis - LLM API key not configured',
    })
  }
}

let clientInstance: LLMClient | null = null

export function getLLMClient(config?: Partial<LLMConfig>): LLMClient {
  if (!clientInstance) {
    clientInstance = new LLMClient(config)
  }
  return clientInstance
}
