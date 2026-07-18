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
