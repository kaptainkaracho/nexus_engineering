import type { Requirement, RequirementReference, RequirementTraceLink } from "../types"

export type TraceLink = RequirementTraceLink

export interface RequirementDocument {
  nexus: {
    metadata: {
      schema: string
      documentId?: string
      domain?: string
      version?: string
      source?: string
    }
  }
  requirements: Requirement[]
}

export type TraceLinkType = 
  | "verifies"
  | "satisfies"
  | "dependsOn"
  | "tracesTo"
  | "refines"
  | "conflictsWith"

export type TraceLinkConfidence = "high" | "medium" | "low"

const VALID_LINK_TYPES: string[] = ["verifies", "satisfies", "dependsOn", "tracesTo", "refines", "conflictsWith"]
const VALID_CONFIDENCES: string[] = ["high", "medium", "low"]

/**
 * Validates that a trace link is properly formatted.
 */
export function validateTraceLink(link: unknown): boolean {
  if (!link || typeof link !== "object") return false
  const obj = link as Record<string, unknown>
  
  if (!obj.type || !obj.target) return false
  
  if (!VALID_LINK_TYPES.includes(obj.type as string)) return false
  
  const target = obj.target as Record<string, unknown>
  if (typeof target.id !== "string" || target.id.trim() === "") return false
  if (typeof target.documentId !== "string" || target.documentId.trim() === "") return false
  
  if (obj.confidence !== undefined && !VALID_CONFIDENCES.includes(obj.confidence as string)) {
    return false
  }
  
  return true
}