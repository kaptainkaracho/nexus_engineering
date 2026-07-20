import type { GraphNodeRow, GraphEdgeRow } from '../graphBuilder/graphDatabase'
import { getGraphDatabase } from '../graphBuilder/graphDatabase'

export interface GraphTraversalOptions {
  depth?: number
  filter?: string[]
  relationshipTypes?: string[]
  seedIds?: string[]
}

export interface TraversedGraph {
  nodes: GraphNodeRow[]
  edges: GraphEdgeRow[]
  depth: number
  filters: {
    nodeTypes?: string[]
    relationshipTypes?: string[]
  }
  totalNodes: number
  totalEdges: number
}

/**
 * Bidirectional BFS traversal of the traceability graph.
 *
 * - `filter` restricts which node types are used as traversal seeds AND which
 *   node types appear in the returned subgraph (e.g. `requirements,tests`).
 * - `depth` bounds the number of hops from each seed in both directions.
 * - `relationshipTypes` optionally restricts which edges are traversed.
 */
export function traverseGraph(options: GraphTraversalOptions = {}): TraversedGraph {
  const db = getGraphDatabase()
  const allNodes = db.getGraphNodes()
  const allEdges = db.getGraphEdges()

  const depth = Math.max(1, options.depth ?? 3)
  const allowedTypes = options.filter && options.filter.length ? new Set(options.filter) : null
  const allowedRels = options.relationshipTypes && options.relationshipTypes.length ? new Set(options.relationshipTypes) : null

  const nodeMap = new Map(allNodes.map(n => [n.id, n]))

  const adjacency = new Map<string, GraphEdgeRow[]>()
  const reverseAdjacency = new Map<string, GraphEdgeRow[]>()

  for (const edge of allEdges) {
    if (allowedRels && !allowedRels.has(edge.relationship_type)) continue
    if (!adjacency.has(edge.source_id)) adjacency.set(edge.source_id, [])
    adjacency.get(edge.source_id)!.push(edge)
    if (!reverseAdjacency.has(edge.target_id)) reverseAdjacency.set(edge.target_id, [])
    reverseAdjacency.get(edge.target_id)!.push(edge)
  }

  let seeds: GraphNodeRow[]
  if (options.seedIds?.length) {
    seeds = allNodes.filter(n => options.seedIds!.includes(n.id))
  } else if (allowedTypes) {
    seeds = allNodes.filter(n => allowedTypes.has(n.type))
  } else {
    seeds = allNodes
  }

  const visitedNodes = new Set<string>()
  const visitedEdges = new Set<GraphEdgeRow>()

  const isAllowed = (id: string) => !allowedTypes || allowedTypes.has(nodeMap.get(id)?.type ?? 'unknown')

  for (const seed of seeds) {
    if (!isAllowed(seed.id)) continue
    let frontier: string[] = [seed.id]
    visitedNodes.add(seed.id)

    for (let hop = 0; hop < depth; hop++) {
      const next: string[] = []
      for (const id of frontier) {
        const out = adjacency.get(id) || []
        const inc = reverseAdjacency.get(id) || []

        for (const e of [...out, ...inc]) {
          visitedEdges.add(e)
          const other = e.source_id === id ? e.target_id : e.source_id
          if (!visitedNodes.has(other)) {
            visitedNodes.add(other)
            if (isAllowed(other)) next.push(other)
          }
        }
      }
      frontier = next
      if (frontier.length === 0) break
    }
  }

  const nodes = allNodes.filter(n => visitedNodes.has(n.id) && (!allowedTypes || allowedTypes.has(n.type)))

  // Keep only edges whose endpoints are both in the final node set.
  const nodeIdSet = new Set(nodes.map(n => n.id))
  const finalEdges = allEdges.filter(e => visitedEdges.has(e) && nodeIdSet.has(e.source_id) && nodeIdSet.has(e.target_id))

  return {
    nodes,
    edges: finalEdges,
    depth,
    filters: {
      nodeTypes: options.filter,
      relationshipTypes: options.relationshipTypes,
    },
    totalNodes: nodes.length,
    totalEdges: finalEdges.length,
  }
}
