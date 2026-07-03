import type { RequirementReference } from "../types"

export type TraceLinkType = 
  | "verifies"
  | "satisfies"
  | "dependsOn"
  | "tracesTo"
  | "refines"
  | "conflictsWith"

export interface TraceLink {
  type: TraceLinkType
  target: RequirementReference
  confidence?: "high" | "medium" | "low"
  description?: string
}

/**
 * Validates that a trace link target reference is properly formatted.
 */
export function validateTraceLink(link: TraceLink): boolean {
  if (!link.type || !link.target) return false
  
  const validTypes: TraceLinkType[] = ["verifies", "satisfies", "dependsOn", "tracesTo", "refines", "conflictsWith"]
  if (!validTypes.includes(link.type)) return false
  
  // Validate target format
  if (typeof link.target.id !== "string" || link.target.id.trim() === "") return false
  if (link.confidence && !("high" satisfies TraceLinkType) && !("medium" satisfies TraceLinkType) && !("low" satisfies TraceLinkType)) {
    return false
  }
  
  return true
}