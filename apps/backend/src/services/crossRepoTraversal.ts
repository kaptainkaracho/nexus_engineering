import type { GraphNodeRow, GraphEdgeRow } from '../graphBuilder/graphDatabase'
import { traverseGraph, type GraphTraversalOptions, type TraversedGraph } from './traceabilityService'

/**
 * Namespace separator used to encode the owning repository into a node id when
 * artifacts are scanned across multiple repositories.
 *
 * Example: `nexus_engineering::auth-R1` → repo `nexus_engineering`, local id `auth-R1`.
 *
 * Single-repo node ids (without the separator) resolve to {@link DEFAULT_REPO},
 * which keeps existing single-repo traversal behaviour byte-for-byte identical.
 */
export const REPO_NAMESPACE_SEPARATOR = '::'
export const DEFAULT_REPO = 'default'

export interface CrossRepoNode extends GraphNodeRow {
  repo: string
}

export interface CrossRepoEdge extends GraphEdgeRow {
  sourceRepo: string
  targetRepo: string
  /** True when the edge connects nodes that live in different repositories. */
  crossRepo: boolean
}

export interface CrossRepoTraversalOptions extends GraphTraversalOptions {
  /**
   * Optional set of repository identifiers (from the `repoUrl` query parameter)
   * that scopes the unified graph. When omitted, every discovered repo is
   * included.
   */
  repos?: string[]
}

export interface CrossRepoGraph {
  nodes: CrossRepoNode[]
  edges: CrossRepoEdge[]
  repos: string[]
  totalNodes: number
  totalEdges: number
  crossRepoEdgeCount: number
  depth: number
  filters: TraversedGraph['filters']
}

/**
 * Detect the owning repository for a node id.
 *
 * Uses the {@link REPO_NAMESPACE_SEPARATOR} prefix when present; otherwise the
 * node is treated as belonging to {@link DEFAULT_REPO}.
 */
export function resolveNodeRepo(id: string, fallback: string = DEFAULT_REPO): string {
  const idx = id.indexOf(REPO_NAMESPACE_SEPARATOR)
  return idx > 0 ? id.slice(0, idx) : fallback
}

/**
 * Traverse the traceability graph while following references across repository
 * boundaries and returning a unified, repo-annotated dependency tree.
 *
 * The heavy lifting (BFS traversal, depth/relationship/seed filtering) is reused
 * from {@link traverseGraph}; this layer only performs O(nodes + edges) repo
 * resolution and scoping, so single-repo traversal performance is preserved.
 */
export function traverseCrossRepo(options: CrossRepoTraversalOptions = {}): CrossRepoGraph {
  const { repos, ...traversalOptions } = options
  const base = traverseGraph(traversalOptions)

  const repoScope = repos && repos.length ? new Set(repos) : null

  let nodes: CrossRepoNode[] = base.nodes.map(n => ({ ...n, repo: resolveNodeRepo(n.id) }))
  if (repoScope) {
    nodes = nodes.filter(n => repoScope.has(n.repo))
  }

  const nodeIdSet = new Set(nodes.map(n => n.id))

  const edges: CrossRepoEdge[] = base.edges
    .filter(e => nodeIdSet.has(e.source_id) && nodeIdSet.has(e.target_id))
    .map(e => {
      const sourceRepo = resolveNodeRepo(e.source_id)
      const targetRepo = resolveNodeRepo(e.target_id)
      return { ...e, sourceRepo, targetRepo, crossRepo: sourceRepo !== targetRepo }
    })

  const discoveredRepos = Array.from(new Set(nodes.map(n => n.repo))).sort()

  return {
    nodes,
    edges,
    repos: discoveredRepos,
    totalNodes: nodes.length,
    totalEdges: edges.length,
    crossRepoEdgeCount: edges.filter(e => e.crossRepo).length,
    depth: base.depth,
    filters: base.filters,
  }
}
