import type { GraphNodeRow, GraphEdgeRow } from '../graphBuilder/graphDatabase'
import { getGraphDatabase } from '../graphBuilder/graphDatabase'

export interface PairwiseGap {
  sourceType: string
  targetType: string
  totalPairs: number
  coveredPairs: number
  gapPercent: number
  sampleGaps: Array<{ sourceId: string; targetId: string }>
}

const MAX_SAMPLE_GAPS = 25
const MAX_SCAN_PER_PAIR = 2000

/**
 * Computes pairwise cross-artifact coverage gaps.
 *
 * For every ordered pair of distinct artifact types (S, T) present in the
 * graph, the total possible links is |S| * |T| (the cartesian product). A pair
 * is "covered" when a trace link exists from that specific source artifact to
 * that specific target artifact. `gapPercent` is the share of possible links
 * that are missing, and `sampleGaps` lists a bounded number of concrete
 * uncovered (source, target) pairs so the UI can suggest links.
 *
 * Pure: pass nodes/edges directly so it is trivially testable without a live
 * database. `analyzeFromGraph()` pulls from the singleton store.
 */
export function computeCrossArtifactGaps(
  nodes: GraphNodeRow[],
  edges: GraphEdgeRow[]
): PairwiseGap[] {
  const nodesByType = new Map<string, GraphNodeRow[]>()
  for (const node of nodes) {
    const bucket = nodesByType.get(node.type) ?? []
    bucket.push(node)
    nodesByType.set(node.type, bucket)
  }

  const typeOf = new Map<string, string>()
  for (const node of nodes) typeOf.set(node.id, node.type)

  // Covered (sourceId, targetId) pairs keyed by `${sourceType}->${targetType}`.
  const coveredByPair = new Map<string, Set<string>>()
  const coveredCount = new Map<string, number>()

  for (const edge of edges) {
    const sourceType = typeOf.get(edge.source_id)
    const targetType = typeOf.get(edge.target_id)
    if (!sourceType || !targetType || sourceType === targetType) continue

    const pairKey = `${sourceType}->${targetType}`
    if (!coveredByPair.has(pairKey)) coveredByPair.set(pairKey, new Set())
    coveredByPair.get(pairKey)!.add(`${edge.source_id}::${edge.target_id}`)

    coveredCount.set(pairKey, (coveredCount.get(pairKey) ?? 0) + 1)
  }

  const gaps: PairwiseGap[] = []

  for (const [sourceType, sources] of nodesByType) {
    for (const [targetType, targets] of nodesByType) {
      if (sourceType === targetType) continue

      const totalPairs = sources.length * targets.length
      const pairKey = `${sourceType}->${targetType}`
      const coveredPairs = coveredCount.get(pairKey) ?? 0
      const covered = coveredByPair.get(pairKey)

      const gapPercent = totalPairs > 0
        ? Math.round(((totalPairs - coveredPairs) / totalPairs) * 100)
        : 0

      const sampleGaps: PairwiseGap['sampleGaps'] = []
      let scanned = 0
      outer:
      for (const s of sources) {
        for (const t of targets) {
          scanned++
          const pk = `${s.id}::${t.id}`
          if (!covered || !covered.has(pk)) {
            sampleGaps.push({ sourceId: s.id, targetId: t.id })
          }
          if (sampleGaps.length >= MAX_SAMPLE_GAPS) break outer
          if (scanned >= MAX_SCAN_PER_PAIR) break outer
        }
      }

      gaps.push({
        sourceType,
        targetType,
        totalPairs,
        coveredPairs,
        gapPercent,
        sampleGaps,
      })
    }
  }

  return gaps
}

export class CrossArtifactGapAnalyzer {
  analyzeFromGraph(): PairwiseGap[] {
    const db = getGraphDatabase()
    return computeCrossArtifactGaps(db.getGraphNodes(), db.getGraphEdges())
  }
}

export const crossArtifactGapAnalyzer = new CrossArtifactGapAnalyzer()
