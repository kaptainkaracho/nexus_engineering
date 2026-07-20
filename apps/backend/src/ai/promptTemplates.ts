import { LLMMessage } from '@nexus-engineering/shared'

export interface TraceabilityAnalysisContext {
  graphNodes: Array<{ id: string; type: string; title?: string }>
  graphEdges: Array<{ sourceId: string; targetId: string; relationshipType: string; confidence: string }>
}

export interface GapAnalysisContext {
  requirements: Array<{ id: string; title: string; type: string }>
  traceLinks: Array<{ sourceId: string; targetId: string; relationshipType: string }>
  validRelationshipTypes: string[]
}

export interface ImpactAnalysisContext {
  changedArtifacts: Array<{ id: string; type: string; title: string }>
  graph: {
    nodes: Array<{ id: string; type: string; title?: string }>
    edges: Array<{ sourceId: string; targetId: string; relationshipType: string; confidence: string }>
  }
}

export interface CoverageReportContext {
  axes: Array<{ axis: string; total: number; linked: number; coveragePercent: number }>
  crossArtifactGaps: Array<{ axis: string; artifactId: string; gapType: string; detail: string; severity: string }>
  domainCoverage: Array<{ domain: string; coveragePercent: number }>
  overallCoveragePercent: number
}

export interface GapSummaryContext {
  gaps: Array<{
    axis: string
    artifactId: string
    artifactTitle?: string
    gapType: string
    detail: string
    severity: string
  }>
  totalGaps: number
  highRiskCount: number
}

export interface ImpactBriefingContext {
  changedArtifactId: string
  changedArtifactType: string
  affectedArtifacts: Array<{ id: string; type: string; impactLevel: string; confidenceScore: number; path: string[] }>
  totalAffected: number
}

export function buildTraceabilityPrompt(context: TraceabilityAnalysisContext): LLMMessage[] {
  const systemPrompt = `You are a traceability analysis AI for an engineering system. Analyze the provided traceability graph and identify patterns, gaps, and improvement opportunities. Respond in JSON format.`

  const userPrompt = `Analyze the following traceability graph:

Nodes (${context.graphNodes.length}):
${context.graphNodes.map(n => `- ${n.id} (${n.type})${n.title ? `: ${n.title}` : ''}`).join('\n')}

Edges (${context.graphEdges.length}):
${context.graphEdges.map(e => `- ${e.sourceId} → ${e.targetId} [${e.relationshipType}, confidence: ${e.confidence}]`).join('\n')}

Provide a JSON response with:
1. "summary": Overall assessment of traceability health
2. "patterns": Notable relationship patterns detected
3. "gaps": Missing or weak trace links
4. "recommendations": Specific improvement suggestions`

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]
}

export function buildCoverageGapPrompt(context: GapAnalysisContext): LLMMessage[] {
  const systemPrompt = `You are a coverage analysis AI for an engineering traceability system. Identify requirements that lack sufficient trace links, especially verification or test coverage. Respond in JSON format.`

  const userPrompt = `Analyze trace coverage for ${context.requirements.length} requirements:

Requirements:
${context.requirements.map(r => `- ${r.id} (${r.type}): ${r.title}`).join('\n')}

Existing Trace Links:
${context.traceLinks.map(l => `- ${l.sourceId} → ${l.targetId} [${l.relationshipType}]`).join('\n')}

Valid relationship types: ${context.validRelationshipTypes.join(', ')}

For each requirement, determine if it has adequate coverage. A requirement is a "gap" if it lacks at least one "verifies" or "tracesTo" link. Provide a JSON response with:
1. "gaps": Array of { requirementId, missingTypes: string[], riskLevel: "high"|"medium"|"low" }
2. "coverageScore": Overall coverage percentage
3. "recommendations": How to improve coverage`

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]
}

export function buildImpactAnalysisPrompt(context: ImpactAnalysisContext): LLMMessage[] {
  const systemPrompt = `You are an impact analysis AI for an engineering system. Given a set of changed artifacts and the full traceability graph, identify all affected artifacts and their impact level. Respond in JSON format.`

  const userPrompt = `Analyze the impact of changes to the following artifacts:

Changed Artifacts:
${context.changedArtifacts.map(a => `- ${a.id} (${a.type}): ${a.title}`).join('\n')}

Full Traceability Graph:
Nodes:
${context.graph.nodes.map(n => `- ${n.id} (${n.type})${n.title ? `: ${n.title}` : ''}`).join('\n')}

Edges:
${context.graph.edges.map(e => `- ${e.sourceId} → ${e.targetId} [${e.relationshipType}, confidence: ${e.confidence}]`).join('\n')}

For each changed artifact, trace through the graph to find:
1. "directlyAffected": Artifacts directly linked to changed ones (1 hop)
2. "indirectlyAffected": Artifacts linked via intermediate nodes (2 hops)
3. "transitivelyAffected": Artifacts reachable through longer paths

Provide a JSON response with:
1. "affectedArtifacts": Array of { artifactId, artifactType, impactLevel: "direct"|"indirect"|"transitive", path: string[] }
2. "riskAssessment": Overall risk level and rationale
3. "recommendations": Suggested review order or actions`

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]
}

/**
 * Phase 2 — Executive traceability report prompt (markdown narrative output).
 */
export function buildTraceabilityReportPrompt(context: CoverageReportContext): LLMMessage[] {
  const systemPrompt = `You are a senior engineering traceability analyst. Produce a concise, professional traceability status report in MARKDOWN. Use headings, bullet lists, and a short executive summary. Do not return JSON for this prompt — return human-readable markdown only.`

  const userPrompt = `Coverage by V-Model axis:
${context.axes.map(a => `- ${a.axis}: ${a.linked}/${a.total} covered (${a.coveragePercent}%)`).join('\n')}

Overall coverage: ${context.overallCoveragePercent}%

Coverage by domain:
${context.domainCoverage.map(d => `- ${d.domain}: ${d.coveragePercent}%`).join('\n')}

Known cross-artifact gaps (${context.crossArtifactGaps.length}):
${context.crossArtifactGaps.slice(0, 25).map(g => `- [${g.severity}] ${g.axis}/${g.artifactId}: ${g.detail}`).join('\n')}

Write a markdown report with: 1) Executive Summary 2) Coverage by Axis 3) Domain Breakdown 4) Key Gaps & Risks 5) Recommended Actions.`

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]
}

/**
 * Phase 2 — Gap summary prompt (structured JSON output for downstream parsing).
 */
export function buildGapSummaryPrompt(context: GapSummaryContext): LLMMessage[] {
  const systemPrompt = `You are a coverage gap analyst. Summarize the provided traceability gaps and return STRICT JSON with this schema: { "summary": string, "topRisks": string[], "recommendedLinks": Array<{ from: string, to: string, relationship: string }>, "coverageScore": number }.`

  const userPrompt = `There are ${context.totalGaps} gaps (${context.highRiskCount} high-risk).

Gaps:
${context.gaps.slice(0, 40).map(g => `- [${g.severity}] ${g.axis}/${g.artifactId} (${g.gapType}): ${g.detail}`).join('\n')}

Return JSON only.`

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]
}

/**
 * Phase 2 — Impact briefing prompt (structured JSON output for downstream parsing).
 */
export function buildImpactBriefingPrompt(context: ImpactBriefingContext): LLMMessage[] {
  const systemPrompt = `You are a change-impact analyst. Given a changed artifact and its affected downstream artifacts, produce a briefing as STRICT JSON with this schema: { "briefing": string, "riskLevel": "low"|"medium"|"high", "reviewOrder": string[], "mitigations": string[] }.`

  const userPrompt = `Changed artifact: ${context.changedArtifactId} (${context.changedArtifactType})
Total affected downstream artifacts: ${context.totalAffected}

Affected:
${context.affectedArtifacts.slice(0, 40).map(a => `- ${a.id} (${a.type}) [${a.impactLevel}, confidence ${a.confidenceScore}] path: ${a.path.join(' -> ')}`).join('\n')}

Return JSON only.`

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]
}
