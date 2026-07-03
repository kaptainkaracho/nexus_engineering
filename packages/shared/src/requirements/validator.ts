import type { TraceLink, RequirementDocument } from "./traceLinks"
import { validateTraceLink } from "./traceLinks"

/**
 * Validates that all trace link targets resolve to existing artifacts
 */
export function validateTraceLinks(reqDoc: RequirementDocument): Map<string, string[]> {
  const errors = new Map<string, string[]>()
  
  if (!reqDoc.requirements || reqDoc.requirements.length === 0) return errors
  
  // First pass: collect all valid requirement IDs in this document
  const requirementIds = new Set<string>()
  for (const req of reqDoc.requirements) {
    if (req.id) {
      requirementIds.add(req.id)
    }
  }
  
  // Second pass: validate trace links
  for (const req of reqDoc.requirements) {
    const reqErrors: string[] = []
    
    if (req.traceLinks && Array.isArray(req.traceLinks)) {
      for (let i = 0; i < req.traceLinks.length; i++) {
        const link = req.traceLinks[i]
        
        // Validate basic structure
        if (!validateTraceLink(link)) {
          reqErrors.push(`traceLinks[${i}]: Invalid trace link format`)
          continue
        }
        
        // Check if target exists in this document or is external
        const targetId = link.target.id
        const targetDocId = link.target.documentId || reqDoc.nexus?.metadata?.documentId
        
        if (!targetDocId) {
          reqErrors.push(`traceLinks[${i}]: Missing documentId in target reference`)
          continue
        }
        
        // For same-document links, validate the ID exists
        if (targetDocId === reqDoc.nexus?.metadata?.documentId && !requirementIds.has(targetId)) {
          reqErrors.push(`traceLinks[${i}]: Target requirement '${targetId}' not found in this document`)
        }
      }
    }
    
    if (reqErrors.length > 0) {
      errors.set(req.id, reqErrors)
    }
  }
  
  return errors
}

/**
 * Validates bidirectional consistency of trace links across multiple documents
 */
export async function validateTraceLinksBidirectional(
  allRequirements: RequirementDocument[],
  externalArtifacts?: Record<string, string[]>
): Promise<Map<string, string[]>> {
  const errors = new Map<string, string[]>()
  
  // Create a lookup map for quick artifact resolution
  const artifactLookup = new Map<string, Set<string>>()
  
  // Index all artifacts by document ID and artifact type
  if (externalArtifacts) {
    for (const [docId, artifactIds] of Object.entries(externalArtifacts)) {
      artifactLookup.set(docId, new Set(artifactIds))
    }
  }
  
  // Index all requirements by document ID and requirement ID
  const reqByDoc = new Map<string, Map<string, any>>()
  for (const doc of allRequirements) {
    const docId = doc.nexus?.metadata?.documentId || "unknown"
    const reqMap = new Map<string, any>()
    
    if (doc.requirements) {
      for (const req of doc.requirements) {
        reqMap.set(req.id, req)
      }
    }
    
    reqByDoc.set(docId, reqMap)
  }
  
  // Check all links for bidirectional consistency
  for (const [docId, doc] of reqByDoc.entries()) {
    for (const req of doc.keys()) {
      const thisReq = doc.get(req)
      if (!thisReq || !thisReq.traceLinks) continue
      
      const docErrors: string[] = []
      
      // Check trace links from this requirement
      if (Array.isArray(thisReq.traceLinks)) {
        for (const link of thisReq.traceLinks) {
          const targetId = link.target.id
          const targetDocId = link.target.documentId || docId
          
          // For same-document links, check reverse direction
          if (targetDocId === docId) {
            const targetReq = doc.get(targetId)
            if (!targetReq) continue
            
            // Find reverse link type based on forward link type
            let expectedReverseType: string | null = null
            switch (link.type) {
              case "verifies":
                expectedReverseType = "tracesTo"
                break
              case "satisfies":
                expectedReverseType = "tracesTo"
                break
              case "dependsOn":
                expectedReverseType = "dependsOn"
                break
              case "tracesTo":
                expectedReverseType = "tracesTo"
                break
              case "refines":
                expectedReverseType = "refines"
                break
              case "conflictsWith":
                // Conflicts are typically not bidirectional in requirement tracing
                continue
            }
            
            if (expectedReverseType) {
              const hasReverseLink = targetReq.traceLinks?.some(
                (tl: any) => tl.target.id === req && tl.type === expectedReverseType
              )
              
              if (!hasReverseLink) {
                docErrors.push(`traceLinks[${thisReq.traceLinks.findIndex((tl: any) => tl === link)}]: ${link.type} to '${targetId}' lacks reverse direction (expected ${expectedReverseType})`)
              }
            }
          } else if (!artifactLookup.get(targetDocId)?.has(targetId)) {
            docErrors.push(`traceLinks[${thisReq.traceLinks.findIndex((tl: any) => tl === link)}]: Target artifact '${targetId}' in document '${targetDocId}' not found`)
          }
        }
      }
      
      if (docErrors.length > 0) {
        errors.set(req, docErrors)
      }
    }
  }
  
  return errors
}

export type { TraceLink } from "./traceLinks"

export interface RequirementDocumentValidationResult {
  valid: boolean
  errors?: Map<string, string[]>
}

/**
 * Complete validation pipeline for a requirement document with trace links
 */
export async function validateRequirementDocument(
  reqDoc: RequirementDocument,
  allRequirements?: RequirementDocument[],
  externalArtifacts?: Record<string, string[]>
): Promise<RequirementDocumentValidationResult> {
  const errors = new Map<string, string[]>()
  
  try {
    // Validate base document structure (would normally use Zod or Joi here)
    if (!reqDoc.nexus || !reqDoc.requirements) {
      throw new Error("Invalid requirement document structure")
    }
    
    // First pass: basic trace link validation
    const traceLinkErrors = validateTraceLinks(reqDoc)
    for (const [key, errorList] of traceLinkErrors.entries()) {
      errors.set(key, errorList)
    }
    
    // Second pass: bidirectional validation if other documents provided
    if (allRequirements && allRequirements.length > 0) {
      const bidirErrors = await validateTraceLinksBidirectional(
        [reqDoc, ...allRequirements],
        externalArtifacts
      )
      for (const [key, errorList] of bidirErrors.entries()) {
        if (!errors.has(key)) {
          errors.set(key, [])
        }
        errors.get(key)?.push(...errorList)
      }
    }
    
    return {
      valid: errors.size === 0,
      ...(errors.size > 0 && { errors })
    }
  } catch (error) {
    console.error("Validation error:", error)
    return {
      valid: false,
      errors: new Map([
        ["document", ["Failed to validate requirement document: " + (error as Error).message]]
      ])
    }
  }
}