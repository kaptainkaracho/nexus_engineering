import type { TraceLink } from '@nexus-engineering/shared'
import { GraphBuilder, TraceabilityGraph } from './graphBuilder'

export class GraphRepository {
  
  async getTraceabilityGraph(): Promise<TraceabilityGraph> {
    try {
      // In a real implementation, this would fetch from database
      const traceLinks: TraceLink[] = [] // Would be populated from repository
      
      // Build graph using the GraphBuilder
      const graph = new GraphBuilder(traceLinks)
      return graph.buildGraph()
    } catch (error) {
      throw error
    }
  }
  
  async getFilteredTraceabilityGraph(
    sourceTypes?: string[],
    targetTypes?: string[],
    relationships?: string[]
  ): Promise<TraceabilityGraph> {
    try {
      // In a real implementation, this would fetch from database
      const traceLinks: TraceLink[] = [] // Would be populated from repository
      
      let builder = new GraphBuilder(traceLinks)
      
      if (sourceTypes && sourceTypes.length > 0) {
        builder = builder.filterBySourceType(sourceTypes)
      }
      
      if (targetTypes && targetTypes.length > 0) {
        builder = builder.filterByTargetType(targetTypes)
      }
      
      if (relationships && relationships.length > 0) {
        builder = builder.filterByRelationship(relationships)
      }
      
      return builder.buildGraph()
    } catch (error) {
      throw error
    }
  }
  
  async getConfidenceSortedTraceabilityGraph(
    descending: boolean = true
  ): Promise<TraceabilityGraph> {
    try {
      // In a real implementation, this would fetch from database
      const traceLinks: TraceLink[] = [] // Would be populated from repository
      
      return new GraphBuilder(traceLinks).sortByConfidence(descending)
    } catch (error) {
      throw error
    }
  }
}

export const graphRepository = new GraphRepository()