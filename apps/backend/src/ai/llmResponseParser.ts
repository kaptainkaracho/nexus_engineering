import type { LLMCompletionResponse, StructuredLLMResponse } from '@nexus-engineering/shared'

export interface ParseResult<T = StructuredLLMResponse> {
  ok: boolean
  data?: T
  error?: string
}

/**
 * Extract the first JSON object from an LLM text response. LLMs frequently wrap
 * JSON in markdown code fences or trailing prose; this tolerates that.
 */
export function extractJson(text: string): string | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fenced ? fenced[1] : text

  const start = candidate.indexOf('{')
  const end = candidate.lastIndexOf('}')
  if (start === -1 || end === -1 || end < start) return null
  return candidate.slice(start, end + 1)
}

/**
 * Parse + minimally validate an LLM completion into a structured object.
 * Validation is intentionally permissive: any object with the expected
 * `analysisType` (when provided) and parseable JSON is accepted; failures fall
 * back to a wrapped raw payload so callers never crash on malformed output.
 */
export function parseStructuredLLM<T extends StructuredLLMResponse = StructuredLLMResponse>(
  response: LLMCompletionResponse,
  expectedAnalysisType?: string
): ParseResult<T> {
  const raw = response?.content ?? ''
  const jsonText = extractJson(raw)

  if (!jsonText) {
    return {
      ok: false,
      error: 'No JSON object found in LLM response',
    }
  }

  let parsed: T
  try {
    parsed = JSON.parse(jsonText) as T
  } catch (err) {
    return {
      ok: false,
      error: `Failed to parse LLM JSON: ${(err as Error).message}`,
    }
  }

  if (expectedAnalysisType && parsed.analysisType !== expectedAnalysisType) {
    return {
      ok: false,
      error: `Unexpected analysisType: expected "${expectedAnalysisType}", got "${(parsed as StructuredLLMResponse).analysisType}"`,
    }
  }

  return { ok: true, data: parsed }
}

/**
 * Build a safe structured payload even when parsing fails, preserving the raw
 * text so downstream reporting can still surface the LLM's prose.
 */
export function safeStructured<T extends StructuredLLMResponse = StructuredLLMResponse>(
  response: LLMCompletionResponse,
  expectedAnalysisType?: string
): T {
  const result = parseStructuredLLM<T>(response, expectedAnalysisType)
  if (result.ok && result.data) {
    return result.data
  }
  return {
    analysisType: expectedAnalysisType ?? 'unknown',
    raw: response?.content ?? '',
    parseError: result.error,
  } as unknown as T
}
